import { useSyncExternalStore } from 'react';
import { textoError } from './nube';
import { supabase } from './supabase';

/**
 * Reportar y bloquear. Cualquier app donde la gente escribe o publica cosas necesita dos herramientas: poder avisar «esto está
 * mal» (reportar) y poder dejar de recibir cosas de alguien (bloquear). Tiendas como Google Play lo piden.
 *
 *  · Reportar: manda a la base de datos el aviso con un motivo; la base guarda una copia del texto reportado. Quien administra
 *    Mercaboot los revisa en Supabase (ver docs/MODERACION.md).
 *  · Bloquear: la persona bloqueada ya no puede escribirte, abrirte un chat ni hacerte pedidos (y tú tampoco a ella, hasta que la
 *    desbloquees). A la persona bloqueada no se le avisa. Los pedidos que ya estaban en marcha se pueden terminar con normalidad.
 *
 * Si la base de datos todavía no tiene estas funciones (versión anterior), la app sigue igual y avisa con un texto amable.
 * Autor: José David Pérez Miguel
 */

export type TipoDeReporte = 'mensaje' | 'resena' | 'negocio' | 'producto' | 'aviso' | 'usuario';
export type MotivoDeReporte = 'ofensivo' | 'spam' | 'fraude' | 'inapropiado' | 'otro';

/** Los motivos que se ofrecen al reportar, con una frase sencilla que explica cada uno. */
export const MOTIVOS: { clave: MotivoDeReporte; etiqueta: string; ayuda: string }[] = [
  { clave: 'ofensivo', etiqueta: 'Insultos o malos tratos', ayuda: 'Groserías, amenazas o acoso' },
  { clave: 'spam', etiqueta: 'Propaganda o spam', ayuda: 'Mensajes repetidos o que no tienen que ver' },
  { clave: 'fraude', etiqueta: 'Fraude o engaño', ayuda: 'Piden dinero de forma rara, precios falsos o se hacen pasar por otra persona' },
  { clave: 'inapropiado', etiqueta: 'Contenido inapropiado', ayuda: 'Cosas sexuales, violentas o que no deben estar aquí' },
  { clave: 'otro', etiqueta: 'Otro motivo', ayuda: 'Cuéntanos qué pasó' },
];

export const MAX_DETALLE = 300;

/** Una persona que bloqueaste. */
export interface Bloqueado {
  usuarioId: string;
  nombre: string;
  /** Su negocio, si tiene uno. */
  negocio?: string;
  desde: number;
}

const NO_DISPONIBLE = 'Esta opción todavía no está disponible. Actualiza la app e inténtalo más tarde.';

/** ¿El error es que la base de datos todavía no tiene la función? (una versión anterior del servidor) */
function noEstaEnLaBase(e: unknown): boolean {
  const x = (e ?? {}) as { code?: unknown; message?: unknown };
  return x.code === 'PGRST202' || x.code === '42883' || (typeof x.message === 'string' && /could not find the function|schema cache/i.test(x.message));
}

const motivoDeError = (e: unknown) => (noEstaEnLaBase(e) ? NO_DISPONIBLE : textoError(e));

/* ───────── a quién bloqueaste (copia en memoria que la pantalla puede escuchar) ───────── */

let lista: Bloqueado[] = [];
let cargada = false;
let enCurso: Promise<Bloqueado[]> | null = null;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

/** Se llama cada vez que cambia la lista de bloqueados. Devuelve la función que deja de escuchar. */
export function suscribirBloqueos(f: () => void): () => void {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

/** A quién bloqueaste (copia en memoria; la misma lista mientras no cambie). */
export const bloqueadosEnMemoria = (): Bloqueado[] => lista;

/** Para pantallas: la lista de bloqueados, siempre al día. */
export function useBloqueados(): Bloqueado[] {
  return useSyncExternalStore(suscribirBloqueos, bloqueadosEnMemoria, bloqueadosEnMemoria);
}

interface FilaBloqueo {
  usuario_id?: unknown;
  nombre?: unknown;
  negocio?: unknown;
  desde?: unknown;
}

function leerFila(f: FilaBloqueo): Bloqueado[] {
  if (typeof f.usuario_id !== 'string' || !f.usuario_id) return [];
  const desde = typeof f.desde === 'string' ? Date.parse(f.desde) : NaN;
  return [
    {
      usuarioId: f.usuario_id,
      nombre: typeof f.nombre === 'string' && f.nombre.trim() ? f.nombre.trim() : 'Persona sin nombre',
      ...(typeof f.negocio === 'string' && f.negocio.trim() ? { negocio: f.negocio.trim() } : {}),
      desde: Number.isFinite(desde) ? desde : Date.now(),
    },
  ];
}

/** Lee de la base de datos a quién bloqueaste. Sin red o sin la función, se queda con lo que había. */
export function cargarBloqueos(forzar = false): Promise<Bloqueado[]> {
  if (cargada && !forzar) return Promise.resolve(lista);
  if (enCurso) return enCurso;
  const espera = (async () => {
    try {
      const { data, error } = await supabase.rpc('mis_bloqueos');
      if (error || !Array.isArray(data)) return lista;
      lista = (data as FilaBloqueo[]).flatMap(leerFila);
      cargada = true;
      avisar();
    } catch {
      // sin red: se queda con lo que había
    }
    return lista;
  })();
  enCurso = espera.finally(() => {
    enCurso = null;
  });
  return enCurso;
}

/** Al cerrar sesión: la lista de una persona no se le muestra a la siguiente. */
export function olvidarBloqueos() {
  lista = [];
  cargada = false;
  enCurso = null;
  avisar();
}

/** Bloquea a una persona. `null` = listo; si no, el motivo en español. */
export async function bloquear(usuarioId: string, nombre: string, negocio?: string): Promise<string | null> {
  try {
    const { data, error } = await supabase.rpc('bloquear_usuario', { p_usuario: usuarioId });
    if (error) return motivoDeError(error);
    if (typeof data === 'string' && data) return data;
    if (!lista.some((b) => b.usuarioId === usuarioId)) {
      lista = [{ usuarioId, nombre: nombre.trim() || 'Persona sin nombre', ...(negocio ? { negocio } : {}), desde: Date.now() }, ...lista];
      avisar();
    }
    void cargarBloqueos(true); // se iguala con lo que quedó en la base de datos
    return null;
  } catch (e) {
    return textoError(e);
  }
}

/** Desbloquea a una persona. `null` = listo; si no, el motivo en español. */
export async function desbloquear(usuarioId: string): Promise<string | null> {
  try {
    const { error } = await supabase.rpc('desbloquear_usuario', { p_usuario: usuarioId });
    if (error) return motivoDeError(error);
    lista = lista.filter((b) => b.usuarioId !== usuarioId);
    avisar();
    return null;
  } catch (e) {
    return textoError(e);
  }
}

/** Reporta algo (un mensaje, una reseña, un negocio, un producto, un aviso o una persona). `null` = listo; si no, el motivo en español. */
export async function reportar(tipo: TipoDeReporte, id: string, motivo: MotivoDeReporte, detalle?: string): Promise<string | null> {
  const nota = detalle?.trim().slice(0, MAX_DETALLE);
  try {
    const { data, error } = await supabase.rpc('reportar', { p_tipo: tipo, p_id: id, p_motivo: motivo, p_detalle: nota ? nota : null });
    if (error) return motivoDeError(error);
    return typeof data === 'string' && data ? data : null;
  } catch (e) {
    return textoError(e);
  }
}
