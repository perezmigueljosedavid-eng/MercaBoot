import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Producto } from '../data/tipos';
import { fechaDeHoy } from './precios';

/**
 * Copia (en este teléfono) de cómo estaban los precios y los «hay / se acabó» antes del primer cambio del día hecho desde
 * «Precios de hoy». Sirve para «Volver a los precios de ayer» si el comerciante se equivoca con un porcentaje.
 * No se sube a la nube: es solo una ayuda para deshacer.
 * Autor: José David Pérez Miguel
 */

export interface CopiaDePrecios {
  /** Día (hora de Oaxaca) en que se hizo la copia. */
  fecha: string;
  /** Por producto: precio (null = sin precio) y si había. */
  productos: Record<string, { p: number | null; d: boolean }>;
}

const clave = (negocioId: string) => `mercaboot:v3:precios-ayer:${negocioId}`;

/** La copia de hoy, si ya se hizo. */
export async function leerCopiaDeHoy(negocioId: string): Promise<CopiaDePrecios | null> {
  try {
    const bruto = await AsyncStorage.getItem(clave(negocioId));
    if (!bruto) return null;
    const c = JSON.parse(bruto) as Partial<CopiaDePrecios>;
    if (!c || c.fecha !== fechaDeHoy() || !c.productos || typeof c.productos !== 'object') return null;
    return c as CopiaDePrecios;
  } catch {
    return null;
  }
}

/** Guarda cómo están ahora los productos, solo si todavía no hay copia de hoy (así queda la del primer cambio del día). */
export async function guardarCopiaSiFalta(negocioId: string, productos: Producto[]): Promise<void> {
  try {
    if (await leerCopiaDeHoy(negocioId)) return;
    const c: CopiaDePrecios = {
      fecha: fechaDeHoy(),
      productos: Object.fromEntries(productos.map((p) => [p.id, { p: p.precio ?? null, d: p.disponible }])),
    };
    await AsyncStorage.setItem(clave(negocioId), JSON.stringify(c));
  } catch {
    // sin copia, solo se pierde la ayuda para deshacer
  }
}
