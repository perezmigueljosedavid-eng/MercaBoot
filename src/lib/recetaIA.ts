import AsyncStorage from '@react-native-async-storage/async-storage';
import { FunctionsFetchError, FunctionsHttpError } from '@supabase/supabase-js';
import type { MotivoSinIA } from '../ia/motor';
import { esRecetaIAJson, recetaDesdeIA } from '../ia/recetaIA';
import type { RecetaIAJson } from '../ia/recetaIA';
import { recetaIAPorClave, recetasIAGuardadas, registrarRecetaIA } from '../ia/recetas';
import type { Receta } from '../ia/recetas';
import type { PeticionIA } from '../ia/vista';
import { supabase } from './supabase';

/**
 * Pide a la función «receta-ia» (supabase/functions/receta-ia) que escriba la receta de un platillo que no está en el recetario,
 * y guarda en el teléfono las que ya escribió para no pedirlas dos veces.
 *
 * La llave de la IA nunca está en la app: vive solo en la función, en el servidor.
 * Autor: José David Pérez Miguel
 */

export type ResultadoRecetaIA = { ok: true; receta: Receta; cache: boolean } | { ok: false; motivo: MotivoSinIA };

/** La función espera hasta 45 s a la IA; la app espera un poco más. */
const ESPERA_MS = 50_000;
/** Mismos topes que la función: más largo que esto no es el nombre de un platillo. */
const MAX_LETRAS = 80;
const MAX_PALABRAS = 12;

const CLAVE_ALMACEN = 'mercaboot.recetas-ia.v1';
/** Cuántas recetas escritas por la IA se conservan en el teléfono. */
const MAX_GUARDADAS = 40;

/* ───────── lo guardado en el teléfono ───────── */

interface Guardada {
  clave: string;
  json: RecetaIAJson;
}

/** Lo que la IA escribió, tal cual llegó (la receta del asistente se vuelve a armar de aquí). */
const originales = new Map<string, RecetaIAJson>();
let cargada: Promise<void> | null = null;

/** Lee las recetas guardadas y las deja a la mano del asistente. Se hace una sola vez; si falla, el asistente sigue sin ellas. */
export function cargarRecetasIA(): Promise<void> {
  cargada ??= (async () => {
    try {
      const bruto = await AsyncStorage.getItem(CLAVE_ALMACEN);
      const lista: unknown = bruto ? JSON.parse(bruto) : [];
      if (!Array.isArray(lista)) return;
      for (const x of lista.slice(-MAX_GUARDADAS)) {
        const g = x as Partial<Guardada> | null;
        if (!g || typeof g.clave !== 'string' || !g.clave || !esRecetaIAJson(g.json)) continue;
        // Lo que llegó por la red en esta sesión manda sobre lo viejo
        if (recetaIAPorClave(g.clave)) continue;
        originales.set(g.clave, g.json);
        registrarRecetaIA(g.clave, recetaDesdeIA(g.json, g.clave));
      }
    } catch {
      // sin lo guardado, solo se vuelven a pedir las recetas
    }
  })();
  return cargada;
}

async function guardarEnTelefono(): Promise<void> {
  try {
    // El orden de la memoria del asistente decide cuáles se conservan: las más recientes
    const claves = new Set(recetasIAGuardadas().map(([c]) => c));
    const lista: Guardada[] = [];
    for (const [clave, json] of originales) if (claves.has(clave)) lista.push({ clave, json });
    await AsyncStorage.setItem(CLAVE_ALMACEN, JSON.stringify(lista.slice(-MAX_GUARDADAS)));
  } catch {
    // no pasa nada si no se pudo guardar
  }
}

/** Borra las recetas de la IA guardadas en el teléfono (por ejemplo, desde Privacidad). */
export async function olvidarRecetasIA(): Promise<void> {
  originales.clear();
  try {
    await AsyncStorage.removeItem(CLAVE_ALMACEN);
  } catch {
    // nada que hacer
  }
}

/* ───────── pedir la receta ───────── */

/** Lo que contesta la función, tal como lo manda (ver supabase/functions/receta-ia/index.ts). */
interface Cuerpo {
  ok?: boolean;
  codigo?: string;
  cache?: boolean;
  receta?: unknown;
}

function motivoDe(codigo: string | undefined): MotivoSinIA {
  switch (codigo) {
    case 'no_es_comida':
    case 'consulta_vacia':
    case 'consulta_larga':
      return 'no_es_comida';
    case 'sin_sesion':
      return 'sin_sesion';
    case 'limite':
      return 'limite';
    case 'limite_diario':
      return 'limite_diario';
    case 'ia_no_activada':
      return 'no_activada';
    default:
      return 'no_disponible';
  }
}

/** Mientras la IA no esté activada no tiene caso preguntarle a cada rato: se vuelve a probar a los 10 minutos. */
let noActivadaHasta = 0;
/** Si la misma petición ya va en camino, se comparte la respuesta. */
const enCamino = new Map<string, Promise<ResultadoRecetaIA>>();

async function pedir(pedido: PeticionIA): Promise<ResultadoRecetaIA> {
  const consulta = pedido.consulta.trim();
  if (consulta.length > MAX_LETRAS || consulta.split(/\s+/).length > MAX_PALABRAS) return { ok: false, motivo: 'no_es_comida' };
  if (Date.now() < noActivadaHasta) return { ok: false, motivo: 'no_activada' };

  // Sin cuenta iniciada la función no contesta: se ahorra el viaje
  const { data: sesion } = await supabase.auth.getSession();
  if (!sesion.session) return { ok: false, motivo: 'sin_sesion' };

  let cuerpo: Cuerpo | null = null;
  try {
    const { data, error } = await supabase.functions.invoke('receta-ia', { body: { consulta }, timeout: ESPERA_MS });
    if (error) {
      if (error instanceof FunctionsHttpError) {
        // La función contestó con un error (límite, sin sesión, IA no activada…): trae el motivo en el cuerpo
        try {
          cuerpo = (await error.context.json()) as Cuerpo;
        } catch {
          return { ok: false, motivo: 'no_disponible' };
        }
      } else if (error instanceof FunctionsFetchError) {
        return { ok: false, motivo: 'no_disponible' };
      } else {
        return { ok: false, motivo: 'no_disponible' };
      }
    } else {
      cuerpo = data as Cuerpo | null;
    }
  } catch {
    return { ok: false, motivo: 'no_disponible' };
  }

  if (!cuerpo?.ok) {
    const motivo = motivoDe(cuerpo?.codigo);
    if (motivo === 'no_activada') noActivadaHasta = Date.now() + 10 * 60_000;
    return { ok: false, motivo };
  }
  if (!esRecetaIAJson(cuerpo.receta)) return { ok: false, motivo: 'no_disponible' };

  const json = cuerpo.receta;
  originales.set(pedido.clave, json);
  const receta = recetaDesdeIA(json, pedido.clave);
  registrarRecetaIA(pedido.clave, receta);
  void guardarEnTelefono();
  return { ok: true, receta, cache: !!cuerpo.cache };
}

/** Pide la receta de un platillo que no está en el recetario. Nunca lanza un error: devuelve el motivo si no se pudo. */
export function pedirRecetaIA(pedido: PeticionIA): Promise<ResultadoRecetaIA> {
  const previa = enCamino.get(pedido.clave);
  if (previa) return previa;
  const p = pedir(pedido).finally(() => enCamino.delete(pedido.clave));
  enCamino.set(pedido.clave, p);
  return p;
}
