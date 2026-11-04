import type { CategoriaProducto, Conversacion, Mensaje, Negocio, Producto } from '../data/tipos';

/**
 * Traducción entre las tablas de la nube (supabase/esquema.sql, con_guiones_bajos) y los tipos de la app,
 * y mensajes de error en español para lo que pueda salir mal.
 */

/* ───────── filas de la base de datos ───────── */

export interface FilaPerfil {
  id: string;
  nombre: string;
  correo: string;
  telefono: string;
  foto_uri: string | null;
}

export interface FilaNegocio {
  id: string;
  nombre: string;
  giro: string;
  descripcion: string | null;
  direccion: string | null;
  telefono: string | null;
  correo: string | null;
  horario: string | null;
  logo_uri: string | null;
  a_domicilio: boolean;
  zona_entrega: string | null;
  abierto: boolean;
  dueno_id: string | null;
  lat: number | string | null;
  lng: number | string | null;
  maps_url: string | null;
  del_directorio: boolean;
  creado: string;
}

export interface FilaProducto {
  id: string;
  negocio_id: string;
  nombre: string;
  precio: number | string | null;
  unidad: string;
  disponible: boolean;
  categoria: string;
  por_encargo: boolean;
  actualizado: string;
}

export interface FilaFavorito {
  id: string;
  usuario_id: string;
  negocio_id: string;
}

export interface FilaConversacion {
  id: string;
  negocio_id: string;
  cliente_id: string;
  cliente_nombre: string;
  creado: string;
  ultimo_texto: string | null;
  ultimo_autor: string | null;
  ultimo_en: string | null;
  leido_cliente: string;
  leido_negocio: string;
}

export interface FilaMensaje {
  id: string;
  conversacion_id: string;
  autor_id: string;
  texto: string;
  creado: string;
}

export interface Favorito {
  id: string;
  usuarioId: string;
  negocioId: string;
}

/* ───────── de la base a la app ───────── */

const ms = (t: string | null | undefined) => {
  if (!t) return 0;
  const v = Date.parse(t);
  return Number.isFinite(v) ? v : 0;
};
const num = (v: number | string | null | undefined): number | undefined => {
  if (v === null || v === undefined || v === '') return undefined;
  const n = typeof v === 'number' ? v : Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const txt = (v: string | null | undefined): string | undefined => (v === null || v === undefined || v === '' ? undefined : v);

export const negocioDeFila = (f: FilaNegocio): Negocio => ({
  id: f.id,
  nombre: f.nombre,
  giro: f.giro,
  descripcion: txt(f.descripcion),
  direccion: txt(f.direccion),
  telefono: txt(f.telefono),
  correo: txt(f.correo),
  horario: txt(f.horario),
  logoUri: txt(f.logo_uri),
  aDomicilio: !!f.a_domicilio,
  zonaEntrega: txt(f.zona_entrega),
  abierto: !!f.abierto,
  duenoId: f.dueno_id ?? undefined,
  lat: num(f.lat),
  lng: num(f.lng),
  mapsUrl: txt(f.maps_url),
  delDirectorio: !!f.del_directorio,
  creado: ms(f.creado),
});

export const productoDeFila = (f: FilaProducto): Producto => ({
  id: f.id,
  negocioId: f.negocio_id,
  nombre: f.nombre,
  precio: num(f.precio),
  unidad: f.unidad,
  disponible: !!f.disponible,
  categoria: f.categoria as CategoriaProducto,
  porEncargo: !!f.por_encargo,
  actualizado: ms(f.actualizado),
});

export const favoritoDeFila = (f: FilaFavorito): Favorito => ({ id: f.id, usuarioId: f.usuario_id, negocioId: f.negocio_id });

export const conversacionDeFila = (f: FilaConversacion): Conversacion => ({
  id: f.id,
  negocioId: f.negocio_id,
  clienteId: f.cliente_id,
  clienteNombre: f.cliente_nombre,
  creado: ms(f.creado),
  ultimoTexto: txt(f.ultimo_texto),
  ultimoAutor: f.ultimo_autor ?? undefined,
  ultimoEn: f.ultimo_en ? ms(f.ultimo_en) : undefined,
  leidoCliente: ms(f.leido_cliente),
  leidoNegocio: ms(f.leido_negocio),
});

export const mensajeDeFila = (f: FilaMensaje): Mensaje => ({
  id: f.id,
  conversacionId: f.conversacion_id,
  autorId: f.autor_id,
  texto: f.texto,
  creado: ms(f.creado),
});

/* ───────── de la app a la base ───────── */

/** Texto vacío = borrar el dato (NULL). */
const nulo = (v: string | undefined | null) => {
  const t = (v ?? '').trim();
  return t ? t : null;
};

/** Solo incluye lo que viene en el cambio; los campos que llegan vacíos se borran. */
export function filaDeCambioNegocio(p: Partial<Negocio>): Record<string, unknown> {
  const f: Record<string, unknown> = {};
  if ('nombre' in p) f.nombre = (p.nombre ?? '').trim();
  if ('giro' in p) f.giro = (p.giro ?? '').trim();
  if ('descripcion' in p) f.descripcion = nulo(p.descripcion);
  if ('direccion' in p) f.direccion = nulo(p.direccion);
  if ('telefono' in p) f.telefono = nulo(p.telefono);
  if ('correo' in p) f.correo = nulo(p.correo);
  if ('horario' in p) f.horario = nulo(p.horario);
  if ('logoUri' in p) f.logo_uri = p.logoUri || null;
  if ('aDomicilio' in p) f.a_domicilio = !!p.aDomicilio;
  if ('zonaEntrega' in p) f.zona_entrega = nulo(p.zonaEntrega);
  if ('abierto' in p) f.abierto = !!p.abierto;
  if ('lat' in p || 'lng' in p) {
    const ok = typeof p.lat === 'number' && typeof p.lng === 'number';
    f.lat = ok ? p.lat : null;
    f.lng = ok ? p.lng : null;
  }
  if ('mapsUrl' in p) f.maps_url = nulo(p.mapsUrl);
  return f;
}

/* ───────── errores ───────── */

export const SIN_CONEXION = 'No hay conexión con el servidor. Revisa tu internet e inténtalo de nuevo.';

interface ErrorLike {
  message?: string;
  code?: string;
  status?: number;
  name?: string;
  error_code?: string;
}

/** ¿El problema es de red (sin internet o servidor inalcanzable) y no de los datos? */
export function esErrorDeRed(e: unknown): boolean {
  const x = (e ?? {}) as ErrorLike;
  const m = `${x.message ?? ''} ${x.name ?? ''}`.toLowerCase();
  return (
    x.name === 'AuthRetryableFetchError' ||
    x.status === 0 ||
    /failed to fetch|network request failed|network error|networkerror|load failed|fetch failed|timeout|timed out|aborted/.test(m)
  );
}

/** Mensaje en español para cualquier error de Supabase (cuentas o tablas). */
export function textoError(e: unknown): string {
  const x = (e ?? {}) as ErrorLike;
  if (esErrorDeRed(e)) return SIN_CONEXION;
  const codigo = x.error_code ?? x.code ?? '';
  const m = (x.message ?? '').toLowerCase();
  switch (codigo) {
    case 'invalid_credentials':
      return 'Correo o contraseña incorrectos.';
    case 'email_not_confirmed':
      return 'Falta confirmar tu correo. Abre el mensaje que te enviamos y vuelve a intentarlo.';
    case 'over_request_rate_limit':
    case 'over_email_send_rate_limit':
    case 'over_sms_send_rate_limit':
      return 'Se hicieron demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
    case 'weak_password':
      return 'Esa contraseña es muy fácil de adivinar. Usa otra más larga.';
    case 'email_address_invalid':
    case 'validation_failed':
      return 'Ese correo no parece válido. Revísalo.';
    case 'signup_disabled':
      return 'En este momento no se pueden crear cuentas nuevas.';
    case 'user_already_exists':
    case 'email_exists':
      return 'Ese correo ya tiene una cuenta.';
    case 'same_password':
      return 'La contraseña nueva debe ser distinta a la actual.';
    case '23505':
      return 'Eso ya existe.';
    case '42501':
      return 'No tienes permiso para hacer eso.';
    case 'PGRST301':
    case 'PGRST303':
      return 'Tu sesión venció. Inicia sesión otra vez.';
    default:
  }
  if (/jwt|token is expired|session/.test(m) && /expired|invalid|missing/.test(m)) return 'Tu sesión venció. Inicia sesión otra vez.';
  if (/rate limit/.test(m)) return 'Se hicieron demasiados intentos. Espera unos minutos e inténtalo de nuevo.';
  // Los avisos que escribe nuestra propia base de datos (disparadores y funciones) ya vienen en español.
  if (codigo === 'P0001' && x.message) return x.message;
  return 'Algo salió mal. Inténtalo de nuevo en un momento.';
}
