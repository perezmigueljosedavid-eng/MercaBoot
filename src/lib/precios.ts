import type { Producto } from '../data/tipos';

/**
 * Cuentas de «Precios de hoy»: leer lo que escribe el comerciante, subir o bajar precios por porcentaje y armar los
 * cambios que se mandan a la base de datos por tandas. No importa nada de react-native: se puede probar con node.
 * Autor: José David Pérez Miguel
 */

export const PRECIO_MAXIMO = 99999999.99;

/**
 * Lo que la persona escribió → número. Acepta «22», «22.5», «22,50» y «$ 22».
 * Vacío = sin precio (`null`); algo que no es un precio válido = `undefined`.
 */
export function leerPrecio(texto: string): number | null | undefined {
  const t = texto.replace(/[$\s]/g, '').replace(',', '.');
  if (t === '') return null;
  if (!/^\d{1,8}(\.\d{0,2})?$/.test(t)) return undefined;
  const n = Number(t);
  return Number.isFinite(n) && n <= PRECIO_MAXIMO ? n : undefined;
}

/** El precio como se escribe en el campo: 22 → «22», 22.5 → «22.5». */
export function precioParaCampo(n?: number | null): string {
  if (n == null) return '';
  return Number.isInteger(n) ? String(n) : String(Number(n.toFixed(2)));
}

/**
 * Sube o baja un precio un porcentaje y lo deja en una cantidad «redonda» de pesos:
 * hasta $3 de diez en diez centavos, hasta $20 de 50 en 50 centavos y arriba de eso en pesos enteros.
 */
export function ajustarPorcentaje(precio: number, pct: number): number {
  const nuevo = precio * (1 + pct / 100);
  if (!Number.isFinite(nuevo)) return precio;
  const paso = nuevo < 3 ? 0.1 : nuevo < 20 ? 0.5 : 1;
  const redondo = Math.round(nuevo / paso) * paso;
  return Math.min(PRECIO_MAXIMO, Math.max(0, Number(redondo.toFixed(2))));
}

/** Un cambio para `productos_actualizar_lote`: solo viene lo que cambia. */
export interface CambioDeProducto {
  id: string;
  precio?: number | null;
  disponible?: boolean;
}

/** Lo que la persona dejó escrito en la pantalla: precio (texto) y si hay, por producto. Lo que no cambió no está. */
export interface EdicionDeProducto {
  precio?: string;
  disponible?: boolean;
}

/**
 * Los cambios de verdad: compara lo escrito con lo que ya tiene cada producto y se queda solo con lo distinto.
 * Devuelve también los precios mal escritos (para avisar antes de guardar).
 */
export function cambiosDeEdiciones(
  productos: Producto[],
  ediciones: Record<string, EdicionDeProducto>,
): { cambios: CambioDeProducto[]; malEscritos: Producto[] } {
  const cambios: CambioDeProducto[] = [];
  const malEscritos: Producto[] = [];
  for (const p of productos) {
    const e = ediciones[p.id];
    if (!e) continue;
    const c: CambioDeProducto = { id: p.id };
    if (e.precio !== undefined) {
      const n = leerPrecio(e.precio);
      if (n === undefined) {
        malEscritos.push(p);
        continue;
      }
      if ((n ?? null) !== (p.precio ?? null)) c.precio = n;
    }
    if (e.disponible !== undefined && e.disponible !== p.disponible) c.disponible = e.disponible;
    if (c.precio !== undefined || c.disponible !== undefined) cambios.push(c);
  }
  return { cambios, malEscritos };
}

/** Parte una lista en tandas de `n` (la base acepta hasta 600 cambios por vez; se mandan de a 300). */
export function trocear<A>(lista: A[], n: number): A[][] {
  const res: A[][] = [];
  for (let i = 0; i < lista.length; i += n) res.push(lista.slice(i, i + n));
  return res;
}

/** Fecha de hoy en Oaxaca («2026-11-21»): sirve para saber si una copia guardada en el teléfono es de hoy. */
export function fechaDeHoy(ms: number = Date.now()): string {
  return new Date(ms - 6 * 3600 * 1000).toISOString().slice(0, 10);
}
