import { terminoDeAlerta } from '../ia/alertas';
import { textoError } from './nube';
import { supabase } from './supabase';

/**
 * «Avísame cuando haya aguacate»: los productos que la persona espera. Se guardan en la base de datos (tabla alertas_producto);
 * cuando una tienda marca el producto como disponible, la base de datos manda el aviso al teléfono y borra la espera. Si la app
 * está abierta, `AlertasDeProductos` también lo nota y se lo dice con Boti.
 * Si la base de datos todavía no tiene la tabla (versión anterior), todo falla en silencio y la app sigue igual.
 * Autor: José David Pérez Miguel
 */

let guardadas: string[] = [];
let cargadas = false;
const oyentes = new Set<() => void>();
const avisar = () => oyentes.forEach((f) => f());

/** Lo que se espera ahora mismo (copia en memoria). */
export const alertasEnMemoria = (): string[] => guardadas;

/** Se llama cada vez que cambia la lista de lo que se espera. Devuelve la función que deja de escuchar. */
export function suscribirAlertas(f: () => void): () => void {
  oyentes.add(f);
  return () => {
    oyentes.delete(f);
  };
}

/** Lee de la base de datos lo que la persona espera. */
export async function cargarAlertas(forzar = false): Promise<string[]> {
  if (cargadas && !forzar) return guardadas;
  try {
    const { data, error } = await supabase.from('alertas_producto').select('termino').order('creado', { ascending: true }).limit(20);
    if (error) return guardadas;
    cargadas = true;
    guardadas = ((data ?? []) as { termino: string }[]).map((f) => f.termino).filter((t) => typeof t === 'string');
    avisar();
  } catch {
    // sin red: se queda con lo que había
  }
  return guardadas;
}

/** Al cerrar sesión: la lista de una persona no se le muestra a la siguiente. */
export function olvidarAlertas() {
  guardadas = [];
  cargadas = false;
  avisar();
}

/** Guarda lo que se espera. `null` = listo; si no, el motivo en español. */
export async function crearAlerta(texto: string): Promise<string | null> {
  const termino = terminoDeAlerta(texto);
  if (!termino) return 'Escribe el producto solo con letras (por ejemplo: aguacate).';
  try {
    const { data, error } = await supabase.rpc('crear_alerta_producto', { p_termino: termino });
    if (error) return textoError(error);
    if (typeof data === 'string' && data) return data;
    if (!guardadas.includes(termino)) guardadas = [...guardadas, termino];
    cargadas = true;
    avisar();
    return null;
  } catch (e) {
    return textoError(e);
  }
}

/** Deja de esperar un producto. */
export async function quitarAlerta(texto: string): Promise<void> {
  const termino = terminoDeAlerta(texto);
  if (!termino) return;
  guardadas = guardadas.filter((t) => t !== termino);
  avisar();
  try {
    await supabase.rpc('quitar_alerta_producto', { p_termino: termino });
  } catch {
    // si no hay red, se volverá a ver la próxima vez que se cargue la lista
  }
}
