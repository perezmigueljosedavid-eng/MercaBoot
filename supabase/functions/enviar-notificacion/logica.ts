/**
 * Lógica pura de «enviar-notificacion» (sin Deno ni Supabase, para poder probarla con Node).
 * Autor: José David Pérez Miguel
 *
 * Aquí está lo que NO depende del servidor: leer la cuenta de servicio de Firebase, firmar el pase (JWT RS256) para pedir
 * permiso a Google, armar el mensaje de Firebase Cloud Messaging (FCM v1) y decidir si un teléfono ya no sirve.
 */

export interface CuentaDeServicio {
  project_id: string;
  client_email: string;
  private_key: string;
}

/** Lee el secreto FCM_SERVICE_ACCOUNT (el archivo JSON que baja Firebase). `null` si falta o no sirve. */
export function leerCuentaDeServicio(texto: string | undefined | null): CuentaDeServicio | null {
  if (!texto) return null;
  try {
    const j = JSON.parse(texto) as Partial<CuentaDeServicio> | null;
    if (!j || typeof j !== 'object') return null;
    if (typeof j.project_id !== 'string' || !/^[a-z][a-z0-9-]{4,60}$/.test(j.project_id)) return null;
    if (typeof j.client_email !== 'string' || !/^[^@\s]+@[^@\s]+$/.test(j.client_email)) return null;
    if (typeof j.private_key !== 'string' || !j.private_key.includes('BEGIN PRIVATE KEY')) return null;
    return { project_id: j.project_id, client_email: j.client_email, private_key: j.private_key };
  } catch {
    return null;
  }
}

const aBase64Url = (bytes: Uint8Array): string => {
  let bin = '';
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const textoABase64Url = (t: string): string => aBase64Url(new TextEncoder().encode(t));

/** «-----BEGIN PRIVATE KEY-----…» → los bytes de la llave (formato PKCS#8). */
export function pemABytes(pem: string): Uint8Array {
  const cuerpo = pem.replace(/-----BEGIN PRIVATE KEY-----/, '').replace(/-----END PRIVATE KEY-----/, '').replace(/\s+/g, '');
  const bin = atob(cuerpo);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

export const ALCANCE_FCM = 'https://www.googleapis.com/auth/firebase.messaging';
export const URL_TOKEN_GOOGLE = 'https://oauth2.googleapis.com/token';

/** El pase firmado que se cambia por un token de acceso de Google (dura 1 hora como máximo). */
export async function crearJwt(cuenta: CuentaDeServicio, ahoraSeg: number): Promise<string> {
  const cabecera = textoABase64Url(JSON.stringify({ alg: 'RS256', typ: 'JWT' }));
  const carga = textoABase64Url(
    JSON.stringify({ iss: cuenta.client_email, scope: ALCANCE_FCM, aud: URL_TOKEN_GOOGLE, iat: ahoraSeg, exp: ahoraSeg + 3300 }),
  );
  const llave = await crypto.subtle.importKey(
    'pkcs8',
    pemABytes(cuenta.private_key),
    { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' },
    false,
    ['sign'],
  );
  const firma = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', llave, new TextEncoder().encode(`${cabecera}.${carga}`));
  return `${cabecera}.${carga}.${aBase64Url(new Uint8Array(firma))}`;
}

export interface AvisoParaEnviar {
  titulo: string;
  cuerpo: string;
  ruta: string;
  canal: string;
  tipo: string;
}

const CANALES = new Set(['mensajes', 'pedidos', 'avisos']);

/** Solo rutas internas de la app (nada de direcciones externas). */
export function rutaSegura(ruta: unknown): string {
  return typeof ruta === 'string' && /^\/[A-Za-z0-9_\-/]{1,120}$/.test(ruta) && !ruta.includes('//') ? ruta : '/';
}

/** El texto sin saltos raros y con un largo máximo. */
export function limpiarTexto(t: unknown, max: number): string {
  const s = typeof t === 'string' ? t.replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/\s+/g, ' ').trim() : '';
  return s.length > max ? `${s.slice(0, max - 1).trimEnd()}…` : s;
}

/** El mensaje de FCM v1 para un teléfono. */
export function construirMensaje(token: string, a: AvisoParaEnviar): { message: Record<string, unknown> } {
  const canal = CANALES.has(a.canal) ? a.canal : 'avisos';
  return {
    message: {
      token,
      notification: { title: limpiarTexto(a.titulo, 65) || 'Mercaboot', body: limpiarTexto(a.cuerpo, 160) },
      data: { ruta: rutaSegura(a.ruta), tipo: limpiarTexto(a.tipo, 20), canal },
      android: {
        priority: 'HIGH',
        notification: { channel_id: canal },
      },
    },
  };
}

/** ¿FCM dice que este teléfono ya no existe (se desinstaló la app o cambió su código)? Entonces se borra de la lista. */
export function esTelefonoInvalido(status: number, cuerpo: unknown): boolean {
  if (status === 404) return true;
  const e = (cuerpo as { error?: { status?: string; message?: string; details?: { errorCode?: string }[] } } | null)?.error;
  if (!e) return false;
  if (e.status === 'NOT_FOUND') return true;
  if (e.details?.some((d) => d.errorCode === 'UNREGISTERED')) return true;
  // «The registration token is not a valid FCM registration token»
  return status === 400 && e.status === 'INVALID_ARGUMENT' && /registration token|token/i.test(e.message ?? '');
}

/** Parte una lista en grupos del mismo tamaño (para no mandar todo al mismo tiempo). */
export function repartir<T>(lista: T[], n: number): T[][] {
  const r: T[][] = [];
  for (let i = 0; i < lista.length; i += Math.max(1, n)) r.push(lista.slice(i, i + Math.max(1, n)));
  return r;
}

export const TIPOS_VALIDOS = new Set(['mensaje', 'pedido', 'aviso', 'producto']);
export const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Revisa lo que manda la app: {tipo, id}. */
export function leerPeticion(bruto: unknown): { tipo: string; id: string } | null {
  const o = bruto as { tipo?: unknown; id?: unknown } | null;
  if (!o || typeof o.tipo !== 'string' || typeof o.id !== 'string') return null;
  if (!TIPOS_VALIDOS.has(o.tipo) || !UUID.test(o.id)) return null;
  return { tipo: o.tipo, id: o.id.toLowerCase() };
}
