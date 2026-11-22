import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { router } from 'expo-router';
import { supabase } from './supabase';

/**
 * Avisos al teléfono (notificaciones): mensaje nuevo, pedido nuevo o cambiado, aviso de una tienda favorita.
 *
 * Cómo funciona: la app le pide permiso a la persona, obtiene el «código de este teléfono» de Firebase y lo guarda en la
 * base de datos (registrar_dispositivo). Cuando alguien escribe un mensaje, aparta un pedido o publica un aviso, su app
 * le dice a la función «enviar-notificacion» qué pasó; la función revisa que sea cierto y le manda el aviso al teléfono
 * de la otra persona por Firebase.
 *
 * Todo esto queda DORMIDO si el APK se armó sin el archivo «google-services.json» (Firebase): `avisosDisponibles()` es
 * falso, no se pide ningún permiso y la app funciona igual que sin avisos.
 *
 * Nada de aquí puede tumbar la app: el módulo de avisos se carga solo cuando hace falta y cada paso va en try/catch.
 * Autor: José David Pérez Miguel
 */

type Modulo = typeof import('expo-notifications');

const CLAVE_LOCAL = 'mercaboot:v3:avisos-telefono';

/** ¿Este APK trae los avisos al teléfono? (Solo Android, y solo si se armó con google-services.json.) */
export function avisosDisponibles(): boolean {
  if (Platform.OS !== 'android') return false;
  const extra = Constants.expoConfig?.extra as { avisosTelefono?: unknown } | undefined;
  return extra?.avisosTelefono === true;
}

let modulo: Modulo | null | undefined;
function notificaciones(): Modulo | null {
  if (!avisosDisponibles()) return null;
  if (modulo !== undefined) return modulo;
  try {
    // Se carga aquí y no arriba para que, si algo falla con el módulo, la app siga abriendo.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    modulo = require('expo-notifications') as Modulo;
  } catch {
    modulo = null;
  }
  return modulo;
}

/* ───────── lo que se guarda en este teléfono ───────── */

export interface EstadoLocal {
  /** La persona quiere recibir avisos en este teléfono. */
  activo: boolean;
  /** Ya se le preguntó (para no insistir). */
  preguntado: boolean;
  /** El último código de este teléfono que se mandó a la base de datos. */
  token?: string;
}

const POR_OMISION: EstadoLocal = { activo: false, preguntado: false };

export async function leerLocal(): Promise<EstadoLocal> {
  try {
    const bruto = await AsyncStorage.getItem(CLAVE_LOCAL);
    if (!bruto) return { ...POR_OMISION };
    const j = JSON.parse(bruto) as Partial<EstadoLocal>;
    return { activo: j.activo === true, preguntado: j.preguntado === true, token: typeof j.token === 'string' ? j.token : undefined };
  } catch {
    return { ...POR_OMISION };
  }
}

async function guardarLocal(cambio: Partial<EstadoLocal>): Promise<EstadoLocal> {
  const nuevo = { ...(await leerLocal()), ...cambio };
  try {
    await AsyncStorage.setItem(CLAVE_LOCAL, JSON.stringify(nuevo));
  } catch {
    // sin guardarse, solo se vuelve a preguntar la próxima vez
  }
  return nuevo;
}

export const marcarPreguntado = () => guardarLocal({ preguntado: true });

/* ───────── pantalla en la que está la persona (para no avisar de lo que ya está viendo) ───────── */

let rutaActual = '';
export const fijarRutaActual = (ruta: string) => {
  rutaActual = ruta;
};

/** Solo se abren pantallas conocidas de la app (nunca direcciones de afuera). */
export function rutaDeAviso(ruta: unknown): string | null {
  if (typeof ruta !== 'string') return null;
  return /^\/(chat-cliente|chat-negocio|pedido|negocio)\/[A-Za-z0-9_-]{1,80}$/.test(ruta) ? ruta : null;
}

/* ───────── preparar el módulo (una sola vez) ───────── */

let configurado = false;

/** Canales de Android y qué hacer cuando llega un aviso con la app abierta. */
async function configurar(N: Modulo): Promise<void> {
  if (configurado) return;
  configurado = true;
  try {
    N.setNotificationHandler({
      handleNotification: async (n) => {
        const ruta = (n.request.content.data as { ruta?: unknown } | null)?.ruta;
        // Con la app abierta: sin sonido, y no se muestra si la persona ya está en esa misma pantalla
        const yaLoVe = typeof ruta === 'string' && ruta.length > 1 && rutaActual.startsWith(ruta);
        return { shouldShowBanner: !yaLoVe, shouldShowList: !yaLoVe, shouldPlaySound: false, shouldSetBadge: false };
      },
    });
    // Los canales tienen que existir antes de pedir el permiso (Android 13 o más nuevo)
    await N.setNotificationChannelAsync('mensajes', { name: 'Mensajes', importance: N.AndroidImportance.HIGH, vibrationPattern: [0, 200, 150, 200] });
    await N.setNotificationChannelAsync('pedidos', { name: 'Pedidos', importance: N.AndroidImportance.HIGH, vibrationPattern: [0, 250, 150, 250] });
    await N.setNotificationChannelAsync('avisos', { name: 'Avisos de tus tiendas', importance: N.AndroidImportance.DEFAULT });
  } catch {
    // si Android no deja crear los canales, los avisos llegan por el canal general
  }
}

/* ───────── permiso y registro ───────── */

export type ResultadoActivar = 'ok' | 'no-disponible' | 'sin-permiso' | 'error';

/** El código de este teléfono (null si Firebase no está bien configurado en este APK). */
async function tokenDeEsteTelefono(N: Modulo): Promise<string | null> {
  try {
    const t = await N.getDevicePushTokenAsync();
    return typeof t.data === 'string' && t.data.length >= 20 ? t.data : null;
  } catch {
    return null;
  }
}

async function registrar(token: string): Promise<boolean> {
  try {
    const { error } = await supabase.rpc('registrar_dispositivo', { p_token: token, p_plataforma: 'android' });
    if (error) return false;
    await guardarLocal({ token });
    return true;
  } catch {
    return false;
  }
}

/** ¿Android ya dio el permiso de mostrar avisos? */
export async function permisoConcedido(): Promise<boolean | null> {
  const N = notificaciones();
  if (!N) return null;
  try {
    return (await N.getPermissionsAsync()).granted;
  } catch {
    return null;
  }
}

/** Pide el permiso (si hace falta), obtiene el código del teléfono y lo guarda en la base de datos. */
export async function activarAvisos(): Promise<ResultadoActivar> {
  const N = notificaciones();
  if (!N) return 'no-disponible';
  try {
    await configurar(N);
    let permiso = await N.getPermissionsAsync();
    if (!permiso.granted) {
      if (!permiso.canAskAgain) return 'sin-permiso';
      permiso = await N.requestPermissionsAsync();
    }
    if (!permiso.granted) {
      await guardarLocal({ preguntado: true });
      return 'sin-permiso';
    }
    const token = await tokenDeEsteTelefono(N);
    if (!token) return 'error';
    if (!(await registrar(token))) return 'error';
    await guardarLocal({ activo: true, preguntado: true });
    return 'ok';
  } catch {
    return 'error';
  }
}

/** Apaga los avisos en este teléfono: la base de datos deja de mandarle avisos. */
export async function desactivarAvisos(): Promise<void> {
  const local = await leerLocal();
  await guardarLocal({ activo: false, preguntado: true });
  if (local.token) {
    try {
      await supabase.rpc('quitar_dispositivo', { p_token: local.token });
    } catch {
      // si no hay internet, el teléfono seguirá en la lista hasta que Firebase diga que ya no existe
    }
  }
}

/** Al cerrar sesión: este teléfono deja de recibir los avisos de esa cuenta (sigue «activo» para quien entre después). */
export async function quitarDispositivoDeEstaCuenta(): Promise<void> {
  if (!avisosDisponibles()) return;
  const local = await leerLocal();
  if (!local.token) return;
  try {
    await Promise.race([supabase.rpc('quitar_dispositivo', { p_token: local.token }), new Promise((r) => setTimeout(r, 2500))]);
  } catch {
    // sin red: se queda registrado hasta que otra cuenta lo mueva
  }
}

/** Al iniciar sesión (o abrir la app): si la persona ya había activado los avisos, se vuelve a guardar el código. */
export async function registrarSiEstaActivo(): Promise<void> {
  const N = notificaciones();
  if (!N) return;
  const local = await leerLocal();
  if (!local.activo) return;
  try {
    await configurar(N);
    if (!(await N.getPermissionsAsync()).granted) return;
    const token = await tokenDeEsteTelefono(N);
    if (token) await registrar(token);
  } catch {
    // se intentará de nuevo la próxima vez
  }
}

/* ───────── al tocar un aviso ───────── */

let tocadoAntes = '';

function abrirDesde(respuesta: { notification: { request: { identifier: string; content: { data?: unknown } } } } | null | undefined) {
  if (!respuesta) return;
  const id = respuesta.notification.request.identifier;
  if (id === tocadoAntes) return;
  tocadoAntes = id;
  const ruta = rutaDeAviso((respuesta.notification.request.content.data as { ruta?: unknown } | null)?.ruta);
  if (!ruta || ruta === rutaActual) return;
  try {
    router.push(ruta as never);
  } catch {
    // la pantalla todavía no estaba lista: no pasa nada, la persona abre la app normalmente
  }
}

/**
 * Deja escuchando los avisos mientras la sesión está abierta: al tocar un aviso se abre el chat o el pedido, y si Android
 * cambia el código del teléfono, se guarda el nuevo. Devuelve la función que deja de escuchar.
 */
export function escucharAvisos(): () => void {
  const N = notificaciones();
  if (!N) return () => {};
  const subs: { remove: () => void }[] = [];
  try {
    void configurar(N);
    subs.push(N.addNotificationResponseReceivedListener((r) => abrirDesde(r)));
    subs.push(
      N.addPushTokenListener((t) => {
        if (typeof t.data === 'string' && t.data.length >= 20) void leerLocal().then((l) => (l.activo ? registrar(t.data as string) : undefined));
      }),
    );
    // Si la app se abrió tocando un aviso (estaba cerrada), se abre esa pantalla
    const ultimo = N.getLastNotificationResponse();
    if (ultimo) {
      setTimeout(() => abrirDesde(ultimo), 400);
      N.clearLastNotificationResponse();
    }
  } catch {
    // sin avisos, pero la app sigue
  }
  return () => subs.forEach((s) => s.remove());
}

/* ───────── avisar a la otra persona ───────── */

let noAntesDe = 0;

/**
 * Le dice a la función «enviar-notificacion» que pasó algo (mensaje, pedido, aviso o producto que ya hay) para que avise a
 * quien corresponda. Nunca falla ni se espera: si no hay internet o Firebase no está activado, simplemente no pasa nada.
 */
export function avisarAlOtro(tipo: 'mensaje' | 'pedido' | 'aviso' | 'producto', id: string): void {
  if (!avisosDisponibles() || Date.now() < noAntesDe) return;
  void (async () => {
    try {
      const { data, error } = await supabase.functions.invoke('enviar-notificacion', { body: { tipo, id } });
      if (error) return;
      const motivo = (data as { motivo?: string } | null)?.motivo;
      // Si el servidor todavía no tiene Firebase, no se insiste durante un rato
      if (motivo === 'sin_firebase') noAntesDe = Date.now() + 6 * 3600_000;
    } catch {
      // sin avisos esta vez
    }
  })();
}
