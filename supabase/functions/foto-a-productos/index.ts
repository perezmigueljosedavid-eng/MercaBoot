/**
 * Función «foto-a-productos» (Supabase Edge Function) · Mercaboot versión 2
 * Autor: José David Pérez Miguel
 *
 * Recibe la foto de la lista de precios (o del pizarrón) de un negocio, le pide a la IA que lea los productos y devuelve la lista
 * a la app. La app la muestra como un resumen para que el comerciante la revise ANTES de agregar nada.
 *
 * Cómo se cuida:
 *  - Solo entran cuentas con sesión iniciada y que tengan un negocio (se comprueba el token de la persona, no basta la llave pública).
 *  - La llave de la IA vive solo como secreto de Supabase (ANTHROPIC_API_KEY). Nunca va en la app ni en el repositorio.
 *  - La foto se revisa (que de verdad sea una imagen y no pase de cierto tamaño) y se manda a la IA tal cual; NO se guarda en ningún lado.
 *  - Límites por persona (por minuto, por hora y por día) y un tope diario para todos juntos.
 *  - Lo que contesta la IA se revisa con desconfianza antes de devolverlo: nombres limpios, precios válidos, sin enlaces ni teléfonos.
 *  - En los registros solo quedan números (tokens, costo, cuántos productos), nunca la foto ni lo que decía.
 *
 * Secretos opcionales (Edge Functions → Secrets):
 *  ANTHROPIC_API_KEY            la llave de la IA (sin ella la función responde «ia_no_activada»)
 *  FOTO_IA_MODELO               por omisión claude-haiku-5-5 (si la letra a mano no se lee bien, prueba con claude-sonnet-5-5)
 *  FOTO_IA_TOPE_USUARIO_DIA     por omisión 12 fotos por persona al día
 *  FOTO_IA_TOPE_GLOBAL_DIA      por omisión 150 fotos al día entre todos
 */
/// <reference lib="deno.ns" />
import { createClient } from 'npm:@supabase/supabase-js@2';
import { clasificarFallo, construirPeticion, costoUsd, extraerHerramienta, leerPedido, MODELO_POR_OMISION, usoDe, validarProductos, type Imagen } from './logica.ts';

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
/** Un poco más que la foto más grande permitida (3,000,000 letras de base64) para el sobre JSON. */
const MAX_CUERPO = 3_100_000;
const ESPERA_IA_MS = 60_000;

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

/** ¿Todavía puede esta persona? Cuenta el intento. Si algo falla al contar, devuelve null (y donde se gasta dinero no se pide nada). */
async function permitir(admin: Admin, usuario: string, clave: string, tope: number, segundos: number): Promise<boolean | null> {
  const { data, error } = await admin.rpc('ia_limite', { p_usuario: usuario, p_clave: clave, p_tope: tope, p_segundos: segundos });
  if (error) {
    console.error(JSON.stringify({ evento: 'foto_ia', paso: 'limite', fallo: error.code ?? 'desconocido' }));
    return null;
  }
  return data === true;
}

async function pedirALaIA(llave: string, imagen: Imagen, modelo: string, forzar: boolean): Promise<{ status: number; cuerpo: unknown }> {
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': llave, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify(construirPeticion(imagen, modelo, forzar)),
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

  // 2) ¿Qué mandó? Una foto de verdad y de tamaño razonable.
  let pedido: unknown;
  try {
    const bruto = await req.text();
    if (bruto.length > MAX_CUERPO) return responder(413, { ok: false, codigo: 'imagen_grande' });
    pedido = JSON.parse(bruto);
  } catch {
    return responder(400, { ok: false, codigo: 'pedido_invalido' });
  }
  const lectura = leerPedido(pedido);
  if (!lectura.ok) return responder(lectura.codigo === 'imagen_grande' ? 413 : 400, { ok: false, codigo: lectura.codigo });

  // 3) Solo quien tiene un negocio puede usar esto (así nadie gasta la IA sin ser comerciante)
  const { data: negocios, error: errNegocio } = await admin.from('negocios').select('id').eq('dueno_id', usuario).limit(1);
  if (errNegocio) {
    console.error(JSON.stringify({ evento: 'foto_ia', paso: 'negocio', fallo: errNegocio.code ?? 'desconocido' }));
    return responder(503, { ok: false, codigo: 'ia_ocupada' });
  }
  if (!negocios || negocios.length === 0) return responder(403, { ok: false, codigo: 'solo_comerciantes' });

  // 4) Tope general por persona (cuenta aunque después la IA no esté activada, para cuidar las invocaciones)
  if ((await permitir(admin, usuario, 'foto_ia_hora', 20, 3600)) === false) return responder(429, { ok: false, codigo: 'limite' });

  // 5) ¿Está activada la IA?
  const llaveIA = Deno.env.get('ANTHROPIC_API_KEY');
  if (!llaveIA) return responder(503, { ok: false, codigo: 'ia_no_activada' });

  // 6) Límites para fotos nuevas: por persona (minuto y día) y para todos juntos (día)
  // Aquí se gasta dinero: si no se puede llevar la cuenta (null), no se pide nada
  const topeDia = entero('FOTO_IA_TOPE_USUARIO_DIA', 12, 1, 500);
  const topeGlobal = entero('FOTO_IA_TOPE_GLOBAL_DIA', 150, 1, 100_000);
  const minuto = await permitir(admin, usuario, 'foto_ia_minuto', 3, 60);
  if (minuto !== true) return responder(minuto === false ? 429 : 503, { ok: false, codigo: minuto === false ? 'limite' : 'ia_ocupada' });
  const dia = await permitir(admin, usuario, 'foto_ia_dia', topeDia, 86_400);
  if (dia !== true) return responder(dia === false ? 429 : 503, { ok: false, codigo: dia === false ? 'limite_diario' : 'ia_ocupada' });
  const global = await permitir(admin, SIN_USUARIO, 'foto_ia_global_dia', topeGlobal, 86_400);
  if (global !== true) return responder(503, { ok: false, codigo: 'ia_ocupada' });

  // 7) Pedirle a la IA que lea la foto (si no deja forzar la herramienta, se reintenta sin forzar; un fallo pasajero se reintenta una vez)
  const modelo = Deno.env.get('FOTO_IA_MODELO') || MODELO_POR_OMISION;
  let forzar = true;
  let respuesta: { status: number; cuerpo: unknown } | undefined;
  for (let intento = 0; intento < 3; intento++) {
    try {
      respuesta = await pedirALaIA(llaveIA, lectura.imagen, modelo, forzar);
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
    // Sin la foto ni lo que decía: solo el tipo de fallo
    console.error(JSON.stringify({ evento: 'foto_ia', paso: 'ia', estado: respuesta?.status ?? 599, tipo: (respuesta?.cuerpo as { error?: { type?: string } } | null)?.error?.type ?? null }));
    return responder(503, { ok: false, codigo: fallo === 'ia_ocupada' ? 'ia_ocupada' : 'ia_no_disponible' });
  }

  // 8) Revisar lo que contestó
  const uso = usoDe(respuesta.cuerpo);
  const costo = costoUsd(uso.entrada, uso.salida);
  const revision = validarProductos(extraerHerramienta(respuesta.cuerpo));
  if (!revision.ok) {
    console.log(JSON.stringify({ evento: 'foto_ia', estado: revision.motivo, ms: Date.now() - inicio, entrada: uso.entrada, salida: uso.salida, costo_usd: costo }));
    if (revision.motivo === 'respuesta_invalida') return responder(502, { ok: false, codigo: 'respuesta_invalida' });
    return responder(200, { ok: false, codigo: revision.motivo });
  }

  console.log(
    JSON.stringify({ evento: 'foto_ia', estado: 'ok', ms: Date.now() - inicio, productos: revision.productos.length, descartados: revision.descartados, entrada: uso.entrada, salida: uso.salida, costo_usd: costo }),
  );
  return responder(200, { ok: true, productos: revision.productos, nota: revision.nota, descartados: revision.descartados });
});
