import { URL_WEB } from '../config';
import { crearQR, qrComoSvg } from './qr';

/**
 * Enlaces para compartir un negocio y el cartel con QR que se pega en el escaparate.
 *
 * El enlace que se comparte es de la versión web (GitHub Pages) y no de la app: así se puede tocar desde WhatsApp, un mensaje
 * o la cámara del celular aunque quien lo recibe todavía no tenga Mercaboot instalado. Quien ya tiene la app puede leer el mismo
 * QR desde «Escanear QR de un negocio» (la app entiende tanto este enlace como el de la app: mercaboot://negocio/…).
 * Autor: José David Pérez Miguel
 */

const ESQUEMA_APP = 'mercaboot://negocio/';

/** Un id de negocio válido: letras, números y unos pocos signos (los ids reales son números largos o con guiones). */
const ID_VALIDO = /^(?!\.+$)[A-Za-z0-9._~:@-]{1,80}$/;

const quitarDiagonales = (t: string) => t.replace(/\/+$/, '');

/** El enlace que se comparte de un negocio. */
export function enlaceDeNegocio(id: string): string {
  return `${quitarDiagonales(URL_WEB)}/negocio/${encodeURIComponent(id)}`;
}

/** Quita lo que va después del id: diagonal final, ?consulta y #ancla. */
function soloElId(resto: string): string | null {
  const m = resto.match(/^([^/?#]+)\/?(?:[?#].*)?$/);
  if (!m) return null;
  let id: string;
  try {
    id = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  return ID_VALIDO.test(id) ? id : null;
}

/**
 * Saca el id del negocio de lo que leyó la cámara. Sirve el enlace web de Mercaboot y el de la app. Cualquier otro texto o
 * enlace (de otro sitio, aunque diga «negocio») da `null`: así un QR ajeno no abre nada.
 */
export function idDeNegocioEnTexto(texto: string, base: string = URL_WEB): string | null {
  const t = (texto ?? '').trim();
  if (!t || t.length > 400) return null;

  if (t.toLowerCase().startsWith(ESQUEMA_APP)) return soloElId(t.slice(ESQUEMA_APP.length));

  const prefijo = `${quitarDiagonales(base)}/negocio/`;
  if (t.toLowerCase().startsWith(prefijo.toLowerCase())) return soloElId(t.slice(prefijo.length));
  return null;
}

/** La ruta de la app (/negocio/ID) si la dirección abierta es la de un negocio; si no, `null`. Se usa para «recordar» a dónde iba. */
export function rutaDeNegocio(ruta: string): string | null {
  const m = (ruta ?? '').match(/^\/negocio\/([^/?#]+)\/?$/);
  if (!m) return null;
  let id: string;
  try {
    id = decodeURIComponent(m[1]);
  } catch {
    return null;
  }
  return ID_VALIDO.test(id) ? `/negocio/${encodeURIComponent(id)}` : null;
}

/* ───────── destino pendiente: quien abre un enlace de un negocio sin tener sesión lo ve al entrar ───────── */

/** Cuánto tiempo se recuerda a dónde iba la persona (el tiempo de crear su cuenta o iniciar sesión). */
const VIGENCIA_DESTINO_MS = 10 * 60 * 1000;

let destinoPendiente: { ruta: string; en: number } | null = null;

/** Guarda a dónde iba la persona (solo páginas de negocios) para llevarla ahí después de iniciar sesión o crear su cuenta. */
export function recordarDestino(ruta: string | null, ahora: number = Date.now()): void {
  const r = ruta ? rutaDeNegocio(ruta) : null;
  destinoPendiente = r ? { ruta: r, en: ahora } : null;
}

/** El destino guardado, si sigue vigente (10 minutos). No lo borra: varias pantallas pueden consultarlo al entrar. */
export function verDestino(ahora: number = Date.now()): string | null {
  if (!destinoPendiente) return null;
  return ahora - destinoPendiente.en <= VIGENCIA_DESTINO_MS ? destinoPendiente.ruta : null;
}

export function olvidarDestino(): void {
  destinoPendiente = null;
}

/* ───────── mensajes ───────── */

/** El texto que se manda por WhatsApp, mensaje o correo. */
export function mensajeParaCompartir(nombre: string, id: string): string {
  return `Mira «${nombre.trim()}» en Mercaboot: lo que hay hoy, los precios y cómo llegar.\n${enlaceDeNegocio(id)}`;
}

/** Enlace que abre WhatsApp (o su página web) con el mensaje ya escrito para elegir a quién enviarlo. */
export function enlaceDeWhatsApp(mensaje: string): string {
  return `https://wa.me/?text=${encodeURIComponent(mensaje)}`;
}

/** Nombre de archivo seguro para el cartel (sin acentos, espacios ni signos raros). */
export function nombreDeArchivoCartel(nombre: string): string {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40);
  return `Cartel-Mercaboot-${limpio || 'mi-negocio'}.pdf`;
}

export function escaparHtml(t: string): string {
  return t.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

/**
 * El cartel para imprimir (hoja tamaño carta): nombre del negocio, el QR grande y cómo usarlo. Es HTML: se imprime o se guarda
 * como PDF con expo-print. Todo lo que escribió el comerciante (nombre y giro) se escapa para que no pueda meter código.
 */
export function cartelHtml(n: { id: string; nombre: string; giro?: string }): string {
  const enlace = enlaceDeNegocio(n.id);
  const svg = qrComoSvg(crearQR(enlace, 'M'), { ancho: '100%' });
  const nombre = escaparHtml(n.nombre.trim() || 'Mi negocio');
  const giro = n.giro?.trim() ? `<div class="giro">${escaparHtml(n.giro.trim())}</div>` : '';
  // Todas las medidas van en «vw» (porcentaje del ancho de la hoja): así el cartel se ve igual de proporcionado sin importar con
  // qué ancho en píxeles lo arme el teléfono (carta, A4, vista previa…).
  const largo = n.nombre.trim().length;
  const tamanoNombre = largo > 28 ? 4.9 : largo > 18 ? 5.9 : 7.1;
  return `<!doctype html>
<html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Cartel de ${nombre}</title>
<style>
  @page { size: letter; margin: 0; }
  * { box-sizing: border-box; }
  html, body { margin: 0; padding: 0; background: #fff; }
  body { font-family: Helvetica, Arial, sans-serif; color: #1A1F1C; }
  .hoja { width: 100%; min-height: 100vh; padding: 6.5vw 7vw 4vw; text-align: center; border: 1.8vw solid #1F7A4D; }
  .marca { color: #1F7A4D; font-weight: 800; font-size: 3.2vw; letter-spacing: 0.4vw; text-transform: uppercase; }
  h1 { font-size: ${tamanoNombre}vw; line-height: 1.1; margin: 3.2vw 0 1vw; font-weight: 800; }
  .giro { font-size: 2.9vw; color: #5B635E; margin-bottom: 1vw; }
  .lema { font-size: 3.7vw; font-weight: 800; color: #1F7A4D; margin: 2.6vw 0 1.8vw; }
  .qr { width: 64%; margin: 0 auto; border: 0.4vw solid #1F7A4D; border-radius: 2.6vw; padding: 1.2vw; }
  .qr svg { display: block; width: 100%; height: auto; }
  .paso { font-size: 2.8vw; margin-top: 2.6vw; line-height: 1.35; }
  .enlace { font-size: 1.85vw; color: #5B635E; margin-top: 2.2vw; word-break: break-all; }
  .pie { font-size: 1.85vw; color: #5B635E; margin-top: 3vw; }
</style></head>
<body><div class="hoja">
  <div class="marca">Mercaboot</div>
  <h1>${nombre}</h1>
  ${giro}
  <div class="lema">Mira lo que hay hoy en mi tienda</div>
  <div class="qr">${svg}</div>
  <div class="paso">Apunta la cámara de tu celular al código.<br>Verás los productos, los precios, el horario y cómo llegar.</div>
  <div class="enlace">${escaparHtml(enlace)}</div>
  <div class="pie">¿Ya tienes la app? Ábrela y toca «Escanear QR de un negocio» en tu perfil.</div>
</div></body></html>`;
}
