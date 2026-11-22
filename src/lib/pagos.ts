/**
 * Pagos por adelantado: transferencia y «link de pago» con tarjeta. Aquí no se cobra nada: Mercaboot nunca ve ni guarda tarjetas ni dinero.
 * El negocio pega el link de cobro de su propio proveedor (Mercado Pago, Clip, Stripe, PayPal…); el cliente lo abre, paga allá y
 * vuelve a tocar «Ya pagué»; el negocio confirma. Este archivo solo revisa que un link sea seguro de abrir, dice de qué proveedor es
 * y encuentra la CLABE o el número de tarjeta dentro de los datos de pago para poder copiarlos. No importa nada de react-native.
 * Autor: José David Pérez Miguel
 */

export const MAX_LINK = 300;

/** Lo que se escribe en los datos de pago cuando el negocio solo cobra con tarjeta (la base de datos pide que haya algo escrito). */
export const TEXTO_SOLO_TARJETA = 'Este negocio cobra con tarjeta mediante un link de pago.';

export type LinkDePago = { ok: true; url: string | null } | { ok: false; motivo: string };

const ESQUEMA = /^[a-z][a-z0-9+.-]*:/i;
const ETIQUETA = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?';
const ANFITRION = new RegExp(`^(?:${ETIQUETA}\\.)+[a-z]{2,24}$`, 'i');

/**
 * Revisa y deja listo el link de pago que escribió el comerciante. Vacío = quitar el link (`url: null`).
 * Solo se aceptan links https de una página con nombre de verdad (no direcciones numéricas, no usuario@sitio, no esquemas raros
 * como javascript:), para que el botón «Pagar con tarjeta» nunca abra algo peligroso.
 */
export function normalizarLinkDePago(texto: string): LinkDePago {
  // Al copiar de un mensaje a veces se pegan signos de más: <link>, (link) o un punto al final
  let t = texto.trim().replace(/^[<([]+/, '').replace(/[>)\].,;]+$/, '').trim();
  if (!t) return { ok: true, url: null };
  if (/\s/.test(t)) return { ok: false, motivo: 'El link no puede llevar espacios. Copia solo el link, sin otro texto.' };
  if (/[^\x21-\x7E]/.test(t) || t.includes('\\')) return { ok: false, motivo: 'El link tiene caracteres raros. Cópialo de nuevo desde tu proveedor de pagos.' };
  if (ESQUEMA.test(t) && !/^https?:\/\//i.test(t)) return { ok: false, motivo: 'El link debe empezar con https://' };
  t = t.replace(/^https?:\/\//i, '').replace(/^\/\//, '');
  const m = /^([^/?#]*)([/?#].*)?$/.exec(t);
  const autoridad = m?.[1] ?? '';
  const resto = m?.[2] ?? '';
  if (!autoridad || autoridad.includes('@')) return { ok: false, motivo: 'Ese link no parece válido. Cópialo de nuevo desde tu proveedor de pagos.' };
  const p = /^(.*?)(?::(\d{1,5}))?$/.exec(autoridad);
  const anfitrion = (p?.[1] ?? '').toLowerCase();
  const puerto = p?.[2] ? `:${p[2]}` : '';
  if (!ANFITRION.test(anfitrion) || /^[\d.]+$/.test(anfitrion)) return { ok: false, motivo: 'Ese link no parece válido. Cópialo de nuevo desde tu proveedor de pagos.' };
  const url = `https://${anfitrion}${puerto}${resto}`;
  if (url.length > MAX_LINK) return { ok: false, motivo: `El link es muy largo (máximo ${MAX_LINK} letras).` };
  return { ok: true, url };
}

/** El sitio al que lleva un link, sin «www.» (por ejemplo «mpago.la»). */
export function sitioDeLink(url: string): string {
  const m = /^https?:\/\/([^/?#:]+)/i.exec(url.trim());
  return (m?.[1] ?? '').toLowerCase().replace(/^www\./, '');
}

const PROVEEDORES: [RegExp, string][] = [
  [/(^|\.)(mpago\.(la|li)|mercadopago\.com(\.[a-z]{2})?)$/, 'Mercado Pago'],
  [/(^|\.)stripe\.com$/, 'Stripe'],
  [/(^|\.)(paypal\.com|paypal\.me)$/, 'PayPal'],
  [/(^|\.)clip\.mx$/, 'Clip'],
  [/(^|\.)(sumup\.com|sumup\.link)$/, 'SumUp'],
  [/(^|\.)(square\.link|squareup\.com|square\.site)$/, 'Square'],
  [/(^|\.)(conekta\.com|conekta\.io)$/, 'Conekta'],
  [/(^|\.)openpay\.mx$/, 'OpenPay'],
  [/(^|\.)getnet\.com\.mx$/, 'Getnet'],
];

/** El proveedor de pagos que se reconoce por el link («Mercado Pago», «Clip»…), o `null` si es otro sitio. */
export function proveedorDeLink(url: string): string | null {
  const sitio = sitioDeLink(url);
  for (const [patron, nombre] of PROVEEDORES) if (patron.test(sitio)) return nombre;
  return null;
}

/* ───────── CLABE y número de tarjeta dentro de los datos de pago ───────── */

/** ¿El último dígito de una CLABE (18 números) cuadra con los demás? */
export function clabeValida(clabe: string): boolean {
  if (!/^\d{18}$/.test(clabe)) return false;
  const pesos = [3, 7, 1];
  let suma = 0;
  for (let i = 0; i < 17; i++) suma += (Number(clabe[i]) * pesos[i % 3]) % 10;
  return (10 - (suma % 10)) % 10 === Number(clabe[17]);
}

/** ¿El número de tarjeta (16 dígitos) pasa la revisión de Luhn? */
export function tarjetaValida(numero: string): boolean {
  if (!/^\d{16}$/.test(numero)) return false;
  let suma = 0;
  for (let i = 0; i < 16; i++) {
    let d = Number(numero[15 - i]);
    if (i % 2 === 1) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    suma += d;
  }
  return suma % 10 === 0;
}

export interface NumeroParaCopiar {
  tipo: 'clabe' | 'tarjeta';
  /** Solo los dígitos, sin espacios ni guiones. */
  valor: string;
  /** El dígito de control cuadra (si no, quizá se escribió mal). */
  bueno: boolean;
}

/** Las CLABE (18 dígitos) y números de tarjeta (16) que aparecen en el texto, aunque estén escritos con espacios o guiones. */
export function numerosParaCopiar(texto: string): NumeroParaCopiar[] {
  const vistos = new Set<string>();
  const salida: NumeroParaCopiar[] = [];
  const agregar = (digitos: string): boolean => {
    if (digitos.length !== 18 && digitos.length !== 16) return false;
    if (!vistos.has(digitos)) {
      vistos.add(digitos);
      salida.push(digitos.length === 18 ? { tipo: 'clabe', valor: digitos, bueno: clabeValida(digitos) } : { tipo: 'tarjeta', valor: digitos, bueno: tarjetaValida(digitos) });
    }
    return true;
  };
  for (const grupo of texto.match(/\d(?:[ -]?\d)*/g) ?? []) {
    if (agregar(grupo.replace(/\D/g, ''))) continue;
    // Varios números pegados (un teléfono y luego la CLABE): se revisa cada pedazo por separado
    for (const trozo of grupo.split(/[ -]/)) agregar(trozo);
  }
  return salida;
}

/** Un aviso para el comerciante si una CLABE que escribió no cuadra (casi siempre es un error de dedo). `null` si todo bien. */
export function avisoDeDatosDePago(texto: string): string | null {
  const mala = numerosParaCopiar(texto).find((n) => n.tipo === 'clabe' && !n.bueno);
  return mala ? 'Revisa tu CLABE: el último número no cuadra con los demás. Puede que se escribió mal algún dígito.' : null;
}

/** El total para copiarlo y pegarlo en un link de pago donde el cliente escribe el monto («125.50»). */
export const montoParaCopiar = (total: number): string => (Math.round(total * 100) / 100).toFixed(2);

/* ───────── cómo se avisa un pago hecho con tarjeta ───────── */

const PREFIJO_TARJETA = 'Tarjeta';
const MAX_REFERENCIA = 100; // lo que guarda la base de datos de la referencia de un pago

/**
 * La referencia que se manda al negocio cuando el cliente avisa que pagó con tarjeta: «Tarjeta · 884455» (o solo «Tarjeta» si no
 * escribió folio). Así el negocio sabe en qué cuenta buscar el pago (en la base de datos todos estos pagos son «por adelantado»).
 */
export function referenciaDeTarjeta(folio: string): string {
  const f = folio.trim().replace(/\s+/g, ' ');
  return (f ? `${PREFIJO_TARJETA} · ${f}` : PREFIJO_TARJETA).slice(0, MAX_REFERENCIA);
}

/** ¿La referencia que guardó el cliente dice que pagó con tarjeta? */
export const esReferenciaDeTarjeta = (referencia?: string | null): boolean => /^tarjeta(?![\p{L}\d])/iu.test((referencia ?? '').trim());
