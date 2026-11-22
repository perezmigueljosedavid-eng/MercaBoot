import { terminoDeAlerta } from '../ia/alertas';
import { supabase } from './supabase';

/**
 * «Lo que buscan y no encuentran»: cuando una búsqueda no da ningún producto, se cuenta el texto (sin acentos, solo letras,
 * sin datos de quién buscó) para que los comerciantes sepan qué se está pidiendo. Nunca interrumpe ni espera nada.
 * Autor: José David Pérez Miguel
 */

const yaContadas = new Set<string>();
const MAX_POR_SESION = 25;

/** Cuenta una búsqueda sin resultado. Cada texto se cuenta una sola vez por sesión de la app. */
export function registrarSinResultado(textos: string[]): void {
  for (const bruto of textos.slice(0, 4)) {
    const t = terminoDeAlerta(bruto);
    if (!t || yaContadas.has(t) || yaContadas.size >= MAX_POR_SESION) continue;
    yaContadas.add(t);
    void (async () => {
      try {
        await supabase.rpc('registrar_busqueda_sin_resultado', { p_termino: t });
      } catch {
        // sin red o sin esta función en la base de datos: no pasa nada
      }
    })();
  }
}

export interface BusquedaFrecuente {
  termino: string;
  veces: number;
}

/** Lo último que se leyó (se guarda 5 minutos para no preguntarle a la base de datos cada vez que se abre una pantalla). */
let ultimaLectura: { en: number; datos: BusquedaFrecuente[] } | null = null;
const VIGENCIA_MS = 5 * 60_000;

/** Las búsquedas sin resultado más repetidas de la semana (solo las ve quien tiene un negocio). */
export async function busquedasDeLaSemana(forzar = false): Promise<BusquedaFrecuente[]> {
  if (!forzar && ultimaLectura && Date.now() - ultimaLectura.en < VIGENCIA_MS) return ultimaLectura.datos;
  try {
    const { data, error } = await supabase.rpc('busquedas_sin_resultado_semana');
    if (error || !Array.isArray(data)) return ultimaLectura?.datos ?? [];
    const datos = (data as { termino?: unknown; veces?: unknown }[])
      .filter((f) => typeof f.termino === 'string' && typeof f.veces === 'number')
      .map((f) => ({ termino: f.termino as string, veces: f.veces as number }));
    ultimaLectura = { en: Date.now(), datos };
    return datos;
  } catch {
    return ultimaLectura?.datos ?? [];
  }
}

/** Al cerrar sesión: lo de un negocio no se le muestra a la persona que entre después. */
export function olvidarBusquedas() {
  ultimaLectura = null;
}
