import { productosACsv } from './csvProductos';

/**
 * «Desde una foto»: la parte pura (sin red ni cámara) de leer la lista de precios de un negocio a partir de una foto.
 * La función del servidor (supabase/functions/foto-a-productos) lee la foto con inteligencia artificial y devuelve los productos;
 * aquí se revisa lo que llegó, se explica en español sencillo cualquier problema y se convierte la lista al mismo formato que usa
 * «Importar desde Excel», para que el comerciante vea un resumen y revise ANTES de agregar nada.
 * Autor: José David Pérez Miguel
 */

export interface ProductoDeFoto {
  nombre: string;
  /** En pesos; `null` si no se alcanzó a leer. */
  precio: number | null;
  /** Como se vende («kg», «pieza»…). Vacío si no dice. */
  unidad: string;
}

export type MotivoFoto =
  | 'no_activada'
  | 'sin_sesion'
  | 'solo_comerciantes'
  | 'limite'
  | 'limite_diario'
  | 'ocupada'
  | 'no_disponible'
  | 'no_es_lista'
  | 'foto_invalida'
  | 'respuesta_confusa';

export type ResultadoFoto = { ok: true; productos: ProductoDeFoto[]; nota: string } | { ok: false; motivo: MotivoFoto; mensaje: string };

/** Lo mismo que el servidor deja pasar: más de esto no es una lista de un negocio. */
export const MAX_PRODUCTOS_FOTO = 120;

const MENSAJES: Record<MotivoFoto, string> = {
  no_activada: 'Esta función todavía no está activada en Mercaboot. Mientras tanto puedes subir tu lista con Excel, elegir de «Catálogo Mercaboot» o escanear los códigos de barras.',
  sin_sesion: 'Tu sesión se cerró. Entra otra vez e inténtalo de nuevo.',
  solo_comerciantes: 'Esta función es solo para cuentas con negocio.',
  limite: 'Estás mandando fotos muy seguido. Espera un minuto e inténtalo de nuevo.',
  limite_diario: 'Ya usaste todas las fotos de hoy. Mañana puedes mandar más; mientras tanto puedes subir tu lista con Excel.',
  ocupada: 'El lector de fotos está muy ocupado ahora. Inténtalo otra vez en unos minutos.',
  no_disponible: 'No pudimos leer la foto en este momento. Revisa tu internet e inténtalo otra vez.',
  no_es_lista: 'No pude ver una lista de productos con precios en esa foto. Tómala de frente, con buena luz y de cerca, para que se lea bien.',
  foto_invalida: 'Esa foto no se pudo usar. Prueba con otra.',
  respuesta_confusa: 'La lectura salió confusa. Inténtalo otra vez con una foto más clara.',
};

export const mensajeDeFoto = (motivo: MotivoFoto): string => MENSAJES[motivo];

const fallo = (motivo: MotivoFoto): ResultadoFoto => ({ ok: false, motivo, mensaje: MENSAJES[motivo] });

/** Del código que manda la función al motivo que se le explica a la persona. */
export function motivoDeCodigo(codigo: unknown): MotivoFoto {
  switch (codigo) {
    case 'ia_no_activada':
      return 'no_activada';
    case 'sin_sesion':
      return 'sin_sesion';
    case 'solo_comerciantes':
      return 'solo_comerciantes';
    case 'limite':
      return 'limite';
    case 'limite_diario':
      return 'limite_diario';
    case 'ia_ocupada':
      return 'ocupada';
    case 'no_es_lista':
    case 'sin_productos':
      return 'no_es_lista';
    case 'imagen_invalida':
    case 'imagen_grande':
    case 'sin_imagen':
      return 'foto_invalida';
    case 'respuesta_invalida':
      return 'respuesta_confusa';
    default:
      return 'no_disponible';
  }
}

function esProducto(x: unknown): x is ProductoDeFoto {
  if (!x || typeof x !== 'object') return false;
  const p = x as Record<string, unknown>;
  return (
    typeof p.nombre === 'string' &&
    p.nombre.trim().length >= 2 &&
    (p.precio === null || (typeof p.precio === 'number' && Number.isFinite(p.precio) && p.precio > 0)) &&
    typeof p.unidad === 'string'
  );
}

/** Lo que contestó la función (`{ ok, codigo, productos, nota }`) → lista de productos para revisar, o el motivo por el que no se pudo. */
export function interpretarRespuesta(cuerpo: unknown): ResultadoFoto {
  const c = cuerpo && typeof cuerpo === 'object' ? (cuerpo as { ok?: unknown; codigo?: unknown; productos?: unknown; nota?: unknown }) : null;
  if (!c) return fallo('no_disponible');
  if (c.ok !== true) return fallo(motivoDeCodigo(c.codigo));
  if (!Array.isArray(c.productos)) return fallo('respuesta_confusa');
  const productos = c.productos
    .filter(esProducto)
    .slice(0, MAX_PRODUCTOS_FOTO)
    .map((p) => ({ nombre: p.nombre.trim(), precio: p.precio === null ? null : Math.round(p.precio * 100) / 100, unidad: p.unidad.trim() }));
  if (productos.length === 0) return fallo('no_es_lista');
  return { ok: true, productos, nota: typeof c.nota === 'string' ? c.nota.trim().slice(0, 200) : '' };
}

/** Los productos leídos de la foto, en el CSV de «Importar desde Excel» (todos como «hay»; la categoría la deduce la app del nombre). */
export function productosDeFotoACsv(productos: ProductoDeFoto[]): string {
  return productosACsv(
    productos.map((p) => ({ nombre: p.nombre, ...(p.precio !== null ? { precio: p.precio } : {}), unidad: p.unidad, categoria: '', disponible: true })),
  );
}
