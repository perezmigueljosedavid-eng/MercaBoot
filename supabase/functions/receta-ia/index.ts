/**
 * Función «receta-ia» (Supabase Edge Function) · Mercaboot versión 2
 * Autor: José David Pérez Miguel
 *
 * Recibe el nombre de un platillo, le pide la receta a la IA y la devuelve a la app.
 *
 * Cómo se cuida:
 *  - Solo entran cuentas con sesión iniciada (se comprueba el token de la persona, no basta la llave pública).
 *  - La llave de la IA vive solo como secreto de Supabase (ANTHROPIC_API_KEY). Nunca va en la app ni en el repositorio.
 *  - Primero se busca en el caché: si ya se escribió esa receta, no se paga a la IA otra vez.
 *  - Límites por persona (por hora, por minuto y por día) y un tope diario para todos juntos.
 *  - Lo que escribe la persona se limpia y se manda como un simple nombre; lo que contesta la IA se revisa antes de guardarlo.
 *  - No se guarda quién pidió la receta; el caché solo tiene el platillo y la receta.
 *
 * Secretos opcionales (Edge Functions → Secrets):
 *  ANTHROPIC_API_KEY            la llave de la IA (sin ella la función responde «ia_no_activada»)
 *  RECETA_IA_MODELO             por omisión claude-haiku-5-5
 *  RECETA_IA_TOPE_USUARIO_DIA   por omisión 15 recetas nuevas por persona al día
 *  RECETA_IA_TOPE_GLOBAL_DIA    por omisión 300 recetas nuevas al día entre todos
 */
/// <reference lib="deno.ns" />
import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  clasificarFallo,
  construirPeticion,
  costoUsd,
  extraerHerramienta,
  limpiarConsulta,
  MODELO_POR_OMISION,
  usoDe,
  validarReceta,
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

const SIN_USUARIO = '00000000-0000-0000-0000-000000000000';
const MAX_CUERPO = 2000;
const ESPERA_IA_MS = 45_000;

function entero(nombre: string, defecto: number, min: number, max: number): number {
  const n = Number(Deno.env.get(nombre));
  return Number.isFinite(n) && n >= min && n <= max ? Math.round(n) : defecto;
}

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

function crearAdmin(url: string, llave: string) {
  return createClient(url, llave, { auth: { persistSession: false, autoRefreshToken: false } });
}
type Admin = ReturnType<typeof crearAdmin>;

/** ¿Todavía puede esta persona? Cuenta el intento. Si algo falla al contar, se deja pasar solo lo gratis. */
async function permitir(admin: Admin, usuario: string, clave: string, tope: number, segundos: number): Promise<boolean | null> {
  const { data, error } = await admin.rpc('ia_limite', { p_usuario: usuario, p_clave: clave, p_tope: tope, p_segundos: segundos });
  if (error) {
    console.error(JSON.stringify({ evento: 'receta_ia', paso: 'limite', fallo: error.code ?? 'desconocido' }));
    return null;
  }
  return data === true;
}

async function pedirALaIA(llave: string, consulta: string, modelo: string, forzar: boolean): Promise<{ status: number; cuerpo: unknown }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': llave, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(construirPeticion(consulta, modelo, forzar)),
    signal: AbortSignal.timeout(ESPERA_IA_MS),
  });
  let cuerpo: unknown = null;
  try {
    cuerpo = await res.json();
  } catch {
    // la respuesta no era JSON
  }
  return { status: res.status, cuerpo };
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: CORS });
  if (req.method !== 'POST') return responder(405, { ok: false, codigo: 'metodo' });
  const inicio = Date.now();

  const url = Deno.env.get('SUPABASE_URL');
  const llave = llaveAdmin();
  if (!url || !llave) return responder(500, { ok: false, codigo: 'configuracion' });
  const admin = crearAdmin(url, llave);

  // 1) ¿Quién es? Tiene que ser una cuenta de verdad (la llave pública sola no sirve).
  const token = (req.headers.get('Authorization') ?? '').replace(/^Bearer\s+/i, '').trim();
  if (!token) return responder(401, { ok: false, codigo: 'sin_sesion' });
  const { data: sesion, error: errSesion } = await admin.auth.getUser(token);
  const usuario = sesion?.user?.id;
  if (errSesion || !usuario) return responder(401, { ok: false, codigo: 'sin_sesion' });

  // 2) ¿Qué pidió?
  let pedido: unknown;
  try {
    const bruto = await req.text();
    if (bruto.length > MAX_CUERPO) return responder(413, { ok: false, codigo: 'consulta_larga' });
    pedido = JSON.parse(bruto);
  } catch {
    return responder(400, { ok: false, codigo: 'pedido_invalido' });
  }
  const lim = limpiarConsulta((pedido as { consulta?: unknown } | null)?.consulta);
  if (!lim.ok) return responder(400, { ok: false, codigo: lim.codigo });

  // 3) Tope general por persona (también cuenta lo que sale del caché, para cuidar las invocaciones)
  if ((await permitir(admin, usuario, 'receta_ia_hora', 60, 3600)) === false) return responder(429, { ok: false, codigo: 'limite' });

  // 4) ¿Ya se escribió antes? Entonces es gratis.
  const { data: guardada, error: errCache } = await admin.rpc('receta_ia_tocar', { p_clave: lim.clave });
  if (errCache) console.error(JSON.stringify({ evento: 'receta_ia', paso: 'cache', fallo: errCache.code ?? 'desconocido' }));
  const fila = Array.isArray(guardada) ? guardada[0] : undefined;
  if (fila) {
    if (fila.rechazada) return responder(200, { ok: false, codigo: 'no_es_comida' });
    // Lo guardado se revisa otra vez con las reglas de hoy; si ya no pasa, se vuelve a pedir
    const otra = validarReceta({ ...(fila.receta as Record<string, unknown>), es_platillo: true });
    if (otra.ok) return responder(200, { ok: true, cache: true, receta: otra.receta });
  }

  // 5) ¿Está activada la IA?
  const llaveIA = Deno.env.get('ANTHROPIC_API_KEY');
  if (!llaveIA) return responder(503, { ok: false, codigo: 'ia_no_activada' });

  // 6) Límites para recetas nuevas: por persona (minuto y día) y para todos juntos (día)
  // Aquí se gasta dinero: si no se puede llevar la cuenta (null), no se pide nada
  const topeDia = entero('RECETA_IA_TOPE_USUARIO_DIA', 15, 1, 500);
  const topeGlobal = entero('RECETA_IA_TOPE_GLOBAL_DIA', 300, 1, 100_000);
  const minuto = await permitir(admin, usuario, 'receta_ia_minuto', 4, 60);
  if (minuto !== true) return responder(minuto === false ? 429 : 503, { ok: false, codigo: minuto === false ? 'limite' : 'ia_ocupada' });
  const dia = await permitir(admin, usuario, 'receta_ia_dia', topeDia, 86_400);
  if (dia !== true) return responder(dia === false ? 429 : 503, { ok: false, codigo: dia === false ? 'limite_diario' : 'ia_ocupada' });
  const global = await permitir(admin, SIN_USUARIO, 'receta_ia_global_dia', topeGlobal, 86_400);
  if (global !== true) return responder(503, { ok: false, codigo: 'ia_ocupada' });

  // 7) Pedirle la receta a la IA (si no deja forzar la herramienta, se reintenta sin forzar; un fallo pasajero se reintenta una vez)
  const modelo = Deno.env.get('RECETA_IA_MODELO') || MODELO_POR_OMISION;
  let forzar = true;
  let respuesta: { status: number; cuerpo: unknown } | undefined;
  for (let intento = 0; intento < 3; intento++) {
    try {
      respuesta = await pedirALaIA(llaveIA, lim.consulta, modelo, forzar);
    } catch {
      respuesta = { status: 599, cuerpo: null };
    }
    if (respuesta.status === 200) break;
    const fallo = clasificarFallo(respuesta.status, respuesta.cuerpo);
    if (fallo === 'reintentar_sin_forzar' && forzar) {
      forzar = false;
      continue;
    }
    if (fallo === 'ia_ocupada' && intento < 2) {
      await new Promise((r) => setTimeout(r, 900));
      continue;
    }
    break;
  }
  if (!respuesta || respuesta.status !== 200) {
    const fallo = clasificarFallo(respuesta?.status ?? 599, respuesta?.cuerpo);
    // Sin datos de la persona ni de su texto: solo el tipo de fallo
    console.error(JSON.stringify({ evento: 'receta_ia', paso: 'ia', estado: respuesta?.status ?? 599, tipo: (respuesta?.cuerpo as { error?: { type?: string } } | null)?.error?.type ?? null }));
    return responder(503, { ok: false, codigo: fallo === 'ia_ocupada' ? 'ia_ocupada' : 'ia_no_disponible' });
  }

  // 8) Revisar lo que contestó
  const uso = usoDe(respuesta.cuerpo);
  const costo = costoUsd(uso.entrada, uso.salida);
  const revision = validarReceta(extraerHerramienta(respuesta.cuerpo));

  if (!revision.ok && revision.motivo === 'no_es_comida') {
    await admin.from('recetas_ia').upsert(
      { clave: lim.clave, consulta: lim.consulta, rechazada: true, modelo, tokens_entrada: uso.entrada, tokens_salida: uso.salida, costo_usd: costo },
      { onConflict: 'clave', ignoreDuplicates: true },
    );
    console.log(JSON.stringify({ evento: 'receta_ia', estado: 'no_es_comida', ms: Date.now() - inicio, entrada: uso.entrada, salida: uso.salida }));
    return responder(200, { ok: false, codigo: 'no_es_comida' });
  }
  if (!revision.ok) {
    console.error(JSON.stringify({ evento: 'receta_ia', paso: 'revision', motivo: revision.motivo, entrada: uso.entrada, salida: uso.salida }));
    return responder(502, { ok: false, codigo: 'receta_invalida' });
  }

  // 9) Guardar para la próxima vez (si falla el guardado, la persona igual recibe su receta)
  const { error: errGuardar } = await admin.from('recetas_ia').upsert(
    {
      clave: lim.clave,
      consulta: lim.consulta,
      receta: revision.receta,
      rechazada: false,
      modelo,
      tokens_entrada: uso.entrada,
      tokens_salida: uso.salida,
      costo_usd: costo,
    },
    { onConflict: 'clave', ignoreDuplicates: true },
  );
  if (errGuardar) console.error(JSON.stringify({ evento: 'receta_ia', paso: 'guardar', fallo: errGuardar.code ?? 'desconocido' }));
  console.log(JSON.stringify({ evento: 'receta_ia', estado: 'nueva', ms: Date.now() - inicio, entrada: uso.entrada, salida: uso.salida, costo_usd: costo }));
  return responder(200, { ok: true, cache: false, receta: revision.receta });
});
