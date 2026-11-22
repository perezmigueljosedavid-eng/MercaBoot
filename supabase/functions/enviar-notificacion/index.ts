/**
 * Función «enviar-notificacion» (Supabase Edge Function) · Mercaboot versión 2
 * Autor: José David Pérez Miguel
 *
 * Manda avisos al teléfono (mensaje nuevo, pedido nuevo o cambiado, aviso de una tienda favorita, «ya hay aguacate»)
 * usando Firebase Cloud Messaging. La app la llama justo después de hacer algo (mandar un mensaje, apartar un pedido,
 * publicar un aviso, marcar que ya hay un producto).
 *
 * Cómo se cuida:
 *  - Solo entran cuentas con sesión iniciada (se comprueba el token de la persona, no basta la llave pública).
 *  - La app solo manda «qué fue» (mensaje, pedido, aviso o producto) y su id. Quién recibe y qué texto lleva lo decide la base de
 *    datos (función notif_preparar), que revisa que quien pide avisar sí sea parte del chat o dueño del negocio, que el
 *    hecho sea reciente, que no se haya avisado ya y que la otra persona quiera ese aviso (y no esté en «no molestar»).
 *  - La llave de Firebase vive solo como secreto de Supabase (FCM_SERVICE_ACCOUNT). Nunca va en la app ni en el repositorio.
 *  - Límites por persona (por hora) y por negocio (avisos de tienda por día).
 *  - Sin la llave de Firebase la función no hace nada y responde «sin_firebase» (la app sigue funcionando normal).
 *
 * Secreto (Edge Functions → Secrets):
 *  FCM_SERVICE_ACCOUNT   el contenido completo del archivo JSON de la cuenta de servicio de Firebase
 */
/// <reference lib="deno.ns" />
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  construirMensaje,
  crearJwt,
  esTelefonoInvalido,
  leerCuentaDeServicio,
  leerPeticion,
  repartir,
  URL_TOKEN_GOOGLE,
  type AvisoParaEnviar,
  type CuentaDeServicio,
} from './logica.ts';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

const responder = (status: number, cuerpo: Record<string, unknown>) =>
  new Response(JSON.stringify(cuerpo), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' },
  });

const MAX_CUERPO = 500;
const SIMULTANEOS = 10;

/** La llave de administrador que Supabase pone sola dentro de la función (nunca sale de aquí). */
function llaveAdmin(): string | undefined {
  try {
    const nuevas = JSON.parse(Deno.env.get('SUPABASE_SECRET_KEYS') ?? 'null') as Record<string, string> | null;
    const k = nuevas?.default ?? (nuevas ? Object.values(nuevas)[0] : undefined);
    if (k) return k;
  } catch {
    // si no se puede leer, se usa la llave anterior
  }
  return Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? undefined;
}

// El token de acceso de Google dura una hora: se guarda mientras esta copia de la función siga encendida.
let acceso: { token: string; vence: number } | null = null;

async function tokenDeAcceso(cuenta: CuentaDeServicio): Promise<string | null> {
  const ahora = Math.floor(Date.now() / 1000);
  if (acceso && acceso.vence > ahora + 60) return acceso.token;
  try {
    const jwt = await crearJwt(cuenta, ahora);
    const res = await fetch(URL_TOKEN_GOOGLE, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }),
      signal: AbortSignal.timeout(15_000),
    });
    const j = (await res.json().catch(() => null)) as { access_token?: string; expires_in?: number } | null;
    if (!res.ok || !j?.access_token) {
      console.error(JSON.stringify({ evento: 'notif', paso: 'token_google', estado: res.status }));
      return null;
    }
    acceso = { token: j.access_token, vence: ahora + Math.max(60, Math.min(3500, j.expires_in ?? 3500)) };
    return acceso.token;
  } catch {
    console.error(JSON.stringify({ evento: 'notif', paso: 'token_google', estado: 'sin_respuesta' }));
    return null;
  }
}

async function mandar(cuenta: CuentaDeServicio, bearer: string, telefono: string, a: AvisoParaEnviar): Promise<'ok' | 'invalido' | 'fallo'> {
  try {
    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${cuenta.project_id}/messages:send`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', authorization: `Bearer ${bearer}` },
      body: JSON.stringify(construirMensaje(telefono, a)),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok) return 'ok';
    const cuerpo = await res.json().catch(() => null);
    if (esTelefonoInvalido(res.status, cuerpo)) return 'invalido';
    if (res.status === 401) acceso = null; // el pase caducó: se pide otro la próxima vez
    console.error(JSON.stringify({ evento: 'notif', paso: 'fcm', estado: res.status }));
    return 'fallo';
  } catch {
    return 'fallo';
  }
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return responder(405, { ok: false, codigo: 'metodo' });

  const url = Deno.env.get('SUPABASE_URL');
  const llave = llaveAdmin();
  if (!url || !llave) return responder(500, { ok: false, codigo: 'configuracion' });
  const admin = createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });

  // 1) ¿Quién es?
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return responder(401, { ok: false, codigo: 'sin_sesion' });
  const { data: sesion, error: errSesion } = await admin.auth.getUser(token);
  const usuario = sesion?.user?.id;
  if (errSesion || !usuario) return responder(401, { ok: false, codigo: 'sin_sesion' });

  // 2) ¿Qué pidió?
  let pedido: ReturnType<typeof leerPeticion>;
  try {
    const bruto = await req.text();
    if (bruto.length > MAX_CUERPO) return responder(413, { ok: false, codigo: 'pedido_largo' });
    pedido = leerPeticion(JSON.parse(bruto));
  } catch {
    return responder(400, { ok: false, codigo: 'pedido_invalido' });
  }
  if (!pedido) return responder(400, { ok: false, codigo: 'pedido_invalido' });

  // 3) ¿Está activado Firebase? Si no, no se hace nada (y no se gasta el «ya se avisó» de la base de datos).
  const cuenta = leerCuentaDeServicio(Deno.env.get('FCM_SERVICE_ACCOUNT'));
  if (!cuenta) return responder(200, { ok: true, enviado: 0, motivo: 'sin_firebase' });

  // 4) Límites: por persona por hora, y los avisos de una tienda, por día
  const tope = await admin.rpc('ia_limite', { p_usuario: usuario, p_clave: 'notif_hora', p_tope: 300, p_segundos: 3600 });
  if (tope.error || tope.data !== true) return responder(429, { ok: false, codigo: 'limite' });
  if (pedido.tipo === 'aviso') {
    const dia = await admin.rpc('ia_limite', { p_usuario: usuario, p_clave: 'notif_aviso_dia', p_tope: 6, p_segundos: 86_400 });
    if (dia.error || dia.data !== true) return responder(429, { ok: false, codigo: 'limite_diario' });
  }

  // 5) La base de datos revisa si se puede y a quién
  const { data: plan, error: errPlan } = await admin.rpc('notif_preparar', { p_quien: usuario, p_tipo: pedido.tipo, p_id: pedido.id });
  if (errPlan) {
    console.error(JSON.stringify({ evento: 'notif', paso: 'preparar', fallo: errPlan.code ?? 'desconocido' }));
    return responder(500, { ok: false, codigo: 'configuracion' });
  }
  const p = plan as { ok?: boolean; motivo?: string; tokens?: string[]; titulo?: string; cuerpo?: string; ruta?: string; canal?: string; tipo?: string } | null;
  if (!p?.ok || !Array.isArray(p.tokens) || p.tokens.length === 0) return responder(200, { ok: true, enviado: 0, motivo: p?.motivo ?? 'no_aplica' });

  // 6) Mandar a cada teléfono
  const bearer = await tokenDeAcceso(cuenta);
  if (!bearer) return responder(503, { ok: false, codigo: 'firebase_no_disponible' });
  const aviso: AvisoParaEnviar = { titulo: p.titulo ?? '', cuerpo: p.cuerpo ?? '', ruta: p.ruta ?? '/', canal: p.canal ?? 'avisos', tipo: p.tipo ?? pedido.tipo };

  let enviados = 0;
  let fallidos = 0;
  const invalidos: string[] = [];
  for (const grupo of repartir(p.tokens, SIMULTANEOS)) {
    const resultados = await Promise.all(grupo.map((t) => mandar(cuenta, bearer, t, aviso)));
    resultados.forEach((r, i) => {
      if (r === 'ok') enviados++;
      else if (r === 'invalido') invalidos.push(grupo[i]);
      else fallidos++;
    });
  }

  // 7) Los teléfonos que ya no existen se quitan de la lista
  if (invalidos.length > 0) await admin.from('dispositivos').delete().in('token', invalidos);

  console.log(JSON.stringify({ evento: 'notif', tipo: pedido.tipo, enviados, fallidos, quitados: invalidos.length }));
  return responder(200, { ok: true, enviado: enviados, fallidos, quitados: invalidos.length });
});
