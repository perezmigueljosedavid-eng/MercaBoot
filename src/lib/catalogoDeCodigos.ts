import { leerRespuestaOff, normalizarCodigo, type ProductoDeCodigo } from './codigoBarras';
import { supabase } from './supabase';

/**
 * Buscar qué producto es un código de barras. Primero se pregunta a la memoria compartida de Mercaboot (lo que ya escanearon otros
 * comerciantes); si no está, a Open Food Facts (openfoodfacts.org), una base de datos abierta de productos de todo el mundo, y lo
 * que se encuentra se recuerda para el siguiente comerciante. Open Food Facts no sabe de frutas ni verduras a granel: esos
 * productos no llevan código y se escriben a mano.
 * La consulta sale del teléfono del comerciante (no de nuestros servidores) y no lleva ningún dato personal, solo el código.
 * Los datos de Open Food Facts son de su comunidad y se usan con su licencia ODbL (se da el crédito en «Acerca de»).
 * Autor: José David Pérez Miguel
 */

export type ResultadoDeCodigo =
  | { tipo: 'encontrado'; codigo: string; producto: ProductoDeCodigo }
  | { tipo: 'desconocido'; codigo: string }
  | { tipo: 'error'; codigo: string; texto: string };

/** Open Food Facts pide que cada app se identifique con un nombre, una versión y cómo contactarla. */
const USER_AGENT = 'Mercaboot/5.0 (app de comercio local, Oaxaca; https://github.com/perezmigueljosedavid-eng/MercaBoot)';
const CAMPOS = 'product_name,product_name_es,generic_name,generic_name_es,brands,quantity';
const ESPERA_MS = 8000;

/** Lo último que se consultó en esta sesión (para no repetir la misma consulta si se escanea dos veces lo mismo). */
const recientes = new Map<string, ResultadoDeCodigo>();

async function enMemoriaCompartida(codigo: string): Promise<ProductoDeCodigo | null> {
  try {
    const { data, error } = await supabase.rpc('codigo_barras_buscar', { p_codigo: codigo });
    if (error || !Array.isArray(data) || data.length === 0) return null;
    const f = data[0] as { nombre?: unknown; marca?: unknown; cantidad?: unknown; fuente?: unknown };
    if (typeof f.nombre !== 'string' || !f.nombre) return null;
    return {
      nombre: f.nombre,
      ...(typeof f.marca === 'string' && f.marca ? { marca: f.marca } : {}),
      ...(typeof f.cantidad === 'string' && f.cantidad ? { cantidad: f.cantidad } : {}),
      fuente: f.fuente === 'off' ? 'off' : 'tienda',
    };
  } catch {
    // Sin red o sin esta función en la base de datos todavía: se sigue con Open Food Facts
    return null;
  }
}

/** `null` = Open Food Facts no conoce el producto; un texto = no se pudo preguntar (sin internet, muy lento…). */
async function enOpenFoodFacts(codigo: string): Promise<ProductoDeCodigo | null | string> {
  const control = new AbortController();
  const reloj = setTimeout(() => control.abort(), ESPERA_MS);
  try {
    const r = await fetch(`https://world.openfoodfacts.org/api/v2/product/${codigo}.json?fields=${CAMPOS}`, {
      headers: { 'User-Agent': USER_AGENT, Accept: 'application/json' },
      signal: control.signal,
    });
    // Open Food Facts contesta 404 cuando no conoce el producto
    if (r.status === 404) return null;
    if (!r.ok) return 'No pude consultar el producto en este momento. Inténtalo de nuevo o escribe el nombre tú.';
    return leerRespuestaOff(await r.json());
  } catch {
    return 'No pude consultar el producto. Revisa tu internet o escribe el nombre tú.';
  } finally {
    clearTimeout(reloj);
  }
}

/** Qué producto es este código. Nunca lanza un error: siempre contesta encontrado, desconocido o error. */
export async function buscarPorCodigo(codigoCrudo: string): Promise<ResultadoDeCodigo> {
  const codigo = normalizarCodigo(codigoCrudo);
  const antes = recientes.get(codigo);
  if (antes && antes.tipo !== 'error') return antes;

  const guardado = await enMemoriaCompartida(codigo);
  if (guardado) {
    const r: ResultadoDeCodigo = { tipo: 'encontrado', codigo, producto: guardado };
    recientes.set(codigo, r);
    return r;
  }

  const afuera = await enOpenFoodFacts(codigo);
  if (typeof afuera === 'string') return { tipo: 'error', codigo, texto: afuera };
  if (!afuera) {
    const r: ResultadoDeCodigo = { tipo: 'desconocido', codigo };
    recientes.set(codigo, r);
    return r;
  }
  // Lo que encontró Open Food Facts se recuerda para el siguiente comerciante
  void recordarCodigo(codigo, afuera);
  const r: ResultadoDeCodigo = { tipo: 'encontrado', codigo, producto: afuera };
  recientes.set(codigo, r);
  return r;
}

/** Recuerda un código en la memoria compartida (no cambia uno que ya estaba). Nunca interrumpe: si algo falla, no pasa nada. */
export async function recordarCodigo(codigoCrudo: string, p: Pick<ProductoDeCodigo, 'nombre' | 'marca' | 'cantidad'> & { fuente?: 'off' | 'tienda' }): Promise<void> {
  try {
    await supabase.rpc('codigo_barras_guardar', {
      p_codigo: normalizarCodigo(codigoCrudo),
      p_nombre: p.nombre,
      p_marca: p.marca ?? null,
      p_cantidad: p.cantidad ?? null,
      p_fuente: p.fuente ?? 'tienda',
    });
  } catch {
    // sin red o sin esta función en la base de datos: no pasa nada
  }
}

/** Al cerrar sesión se olvida lo consultado. */
export function olvidarCodigos() {
  recientes.clear();
}
