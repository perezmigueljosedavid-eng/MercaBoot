import { useEffect, useSyncExternalStore } from 'react';
import type { Producto } from '../data/tipos';
import { esColumnaFaltante, huellaLocal } from './nube';
import { supabase } from './supabase';

/**
 * Las fotos de los productos NO viajan con la lista de productos: cada una pesa unos 22 KB y una tienda con cientos de
 * productos haría lenta la app. La lista solo trae si el producto tiene foto y una «huella» (cambia si la foto cambia);
 * la foto se baja aquí, de a pocas por vez, solo cuando el producto se va a ver, y se queda en memoria mientras la app
 * está abierta.
 *
 * Mientras llega (o si el producto no tiene foto) se muestra un dibujito, así que nada se ve vacío.
 * Autor: José David Pérez Miguel
 */

interface Entrada {
  /** Huella de la foto que se guardó. */
  huella: string | undefined;
  /** La foto (data URI). Vacía = ya se preguntó y no hay foto. */
  uri: string;
}

/** Fotos en memoria. El orden de la lista es el de uso: las menos usadas se sueltan primero. */
const memoria = new Map<string, Entrada>();
const MAX_EN_MEMORIA = 120;
/** Productos que esperan turno para bajar su foto (id → huella que se espera). */
const cola = new Map<string, string | undefined>();
const intentos = new Map<string, number>();
const oyentes = new Map<string, Set<() => void>>();
const MAX_POR_PEDIDO = 10;
const MAX_SIMULTANEOS = 2;
const MAX_INTENTOS = 3;
let enCurso = 0;
let temporizador: ReturnType<typeof setTimeout> | null = null;
let sinColumnaHuella = false;

function avisar(id: string) {
  const o = oyentes.get(id);
  if (o) for (const f of [...o]) f();
}

function recortar() {
  while (memoria.size > MAX_EN_MEMORIA) {
    const mas_vieja = memoria.keys().next().value;
    if (mas_vieja === undefined) break;
    memoria.delete(mas_vieja);
    avisar(mas_vieja);
  }
}

/** La foto de un producto si ya está en memoria (`undefined` si falta o si no tiene). */
export function fotoEnMemoria(id: string): string | undefined {
  return memoria.get(id)?.uri || undefined;
}

/** Guarda una foto que ya se tiene (por ejemplo, la que la persona acaba de elegir) para no volver a bajarla. */
export function guardarFoto(id: string, huella: string | undefined, uri: string): void {
  memoria.delete(id);
  memoria.set(id, { huella: huella ?? huellaLocal(uri), uri });
  cola.delete(id);
  recortar();
  avisar(id);
}

/** El producto ya no tiene foto (o ya no existe). */
export function quitarFoto(id: string): void {
  memoria.delete(id);
  cola.delete(id);
  avisar(id);
}

/** Suelta todas las fotos de la memoria (al cerrar sesión). */
export function vaciarFotos(): void {
  const ids = [...memoria.keys()];
  memoria.clear();
  cola.clear();
  intentos.clear();
  for (const id of ids) avisar(id);
}

/** Si la foto guardada ya es la que corresponde a esa huella. */
const vigente = (id: string, huella: string | undefined) => {
  const e = memoria.get(id);
  return !!e && (huella === undefined || e.huella === huella);
};

function programar(espera = 40) {
  if (temporizador) return;
  temporizador = setTimeout(() => {
    temporizador = null;
    vaciarCola();
  }, espera);
}

/** Pide la foto de un producto (si no la tiene ya). Varios pedidos juntos viajan en una sola consulta. */
export function pedirFoto(id: string, huella?: string): void {
  if (vigente(id, huella) || cola.has(id)) return;
  if ((intentos.get(id) ?? 0) >= MAX_INTENTOS) return;
  cola.set(id, huella);
  programar();
}

/** Deja de esperar la foto de un producto que ya no se va a ver (si todavía no se pidió). */
export function cancelarFoto(id: string): void {
  cola.delete(id);
}

function vaciarCola() {
  while (enCurso < MAX_SIMULTANEOS && cola.size > 0) {
    const lote = [...cola.entries()].slice(0, MAX_POR_PEDIDO);
    for (const [id] of lote) cola.delete(id);
    enCurso += 1;
    void traer(lote).finally(() => {
      enCurso -= 1;
      if (cola.size > 0) programar(10);
    });
  }
}

interface FilaFoto {
  id: string;
  foto_uri: string | null;
  foto_huella?: string | null;
}

async function leerFotos(ids: string[]): Promise<{ filas: FilaFoto[] | null }> {
  if (!sinColumnaHuella) {
    const r = await supabase.from('productos').select('id,foto_uri,foto_huella').in('id', ids);
    if (!r.error) return { filas: (r.data ?? []) as FilaFoto[] };
    if (!esColumnaFaltante(r.error)) return { filas: null };
    sinColumnaHuella = true;
  }
  const r = await supabase.from('productos').select('id,foto_uri').in('id', ids);
  return { filas: r.error ? null : ((r.data ?? []) as FilaFoto[]) };
}

async function traer(lote: [string, string | undefined][]) {
  const ids = lote.map(([id]) => id);
  let filas: FilaFoto[] | null = null;
  try {
    filas = (await leerFotos(ids)).filas;
  } catch {
    filas = null;
  }
  if (!filas) {
    // Sin internet o error de la base: se vuelve a intentar un poco después (unas cuantas veces)
    for (const [id, huella] of lote) {
      const n = (intentos.get(id) ?? 0) + 1;
      intentos.set(id, n);
      if (n < MAX_INTENTOS) {
        setTimeout(() => {
          if (!vigente(id, huella)) pedirFoto(id, huella);
        }, 4000 * n);
      }
    }
    return;
  }
  const llegaron = new Set<string>();
  for (const f of filas) {
    llegaron.add(f.id);
    intentos.delete(f.id);
    const uri = f.foto_uri ?? '';
    memoria.delete(f.id);
    memoria.set(f.id, { huella: f.foto_huella ?? (uri ? huellaLocal(uri) : undefined), uri });
    avisar(f.id);
  }
  // Los productos que ya no existen: no hay nada que mostrar
  for (const [id, huella] of lote) {
    if (llegaron.has(id)) continue;
    memoria.delete(id);
    memoria.set(id, { huella, uri: '' });
    avisar(id);
  }
  recortar();
}

function suscribir(id: string, f: () => void): () => void {
  let o = oyentes.get(id);
  if (!o) {
    o = new Set();
    oyentes.set(id, o);
  }
  o.add(f);
  return () => {
    o.delete(f);
    if (o.size === 0) oyentes.delete(id);
  };
}

/**
 * La foto de un producto, lista para ponerla en un `<Image>`. Devuelve `undefined` mientras llega o si no tiene
 * (en ese caso se muestra el dibujito). Si la foto cambió, sigue mostrando la anterior hasta que llegue la nueva.
 * `activo` en false no pide nada (por ejemplo, para filas que todavía no se ven).
 */
export function useFotoProducto(p: Pick<Producto, 'id' | 'tieneFoto' | 'fotoHuella'> | null | undefined, activo = true): string | undefined {
  const id = p?.id ?? '';
  const uri = useSyncExternalStore(
    (f) => (id ? suscribir(id, f) : () => {}),
    () => (id ? memoria.get(id)?.uri || undefined : undefined),
    () => undefined,
  );
  const tiene = !!p?.tieneFoto;
  const huella = p?.fotoHuella;
  useEffect(() => {
    if (!id || !activo) return;
    if (!tiene) return;
    pedirFoto(id, huella);
    return () => cancelarFoto(id);
  }, [id, tiene, huella, activo]);
  // Un producto que ya no tiene foto no debe mostrar la que quedó en memoria
  return tiene ? uri : undefined;
}
