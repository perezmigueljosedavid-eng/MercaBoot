import { norm } from './texto';

/**
 * Códigos de barras: revisar que una lectura de la cámara sea un código de verdad, escribirlo siempre igual, y armar el
 * nombre de un producto con lo que contesta Open Food Facts (openfoodfacts.org). No importa nada de react-native: se puede probar con node.
 * Autor: José David Pérez Miguel
 */

export interface ProductoDeCodigo {
  nombre: string;
  marca?: string;
  cantidad?: string;
  /** De dónde salió: 'off' = Open Food Facts · 'tienda' = lo escribió un comerciante de Mercaboot. */
  fuente: 'off' | 'tienda';
}

const SOLO_DIGITOS = /^[0-9]{8,14}$/;

/** Solo los dígitos de lo que se escribió o se leyó. */
export const soloDigitos = (texto: string) => texto.replace(/\D+/g, '');

/** El mismo código se escribe siempre igual: un UPC-A de 12 dígitos lleva un 0 al frente (como EAN-13), igual que en Open Food Facts. */
export function normalizarCodigo(texto: string): string {
  const d = soloDigitos(texto);
  return d.length === 12 ? `0${d}` : d;
}

/**
 * ¿El dígito final cuadra con los demás? (EAN-8, UPC-A, EAN-13 y GTIN-14 llevan un dígito de control.)
 * Sirve para ignorar lecturas mal hechas de la cámara en vez de buscar un producto que no existe.
 */
export function digitoDeControlOk(codigo: string): boolean {
  if (!SOLO_DIGITOS.test(codigo)) return false;
  if (![8, 12, 13, 14].includes(codigo.length)) return false;
  let suma = 0;
  // De derecha a izquierda, sin contar el dígito de control: se multiplica por 3, por 1, por 3…
  for (let i = codigo.length - 2, peso = 3; i >= 0; i--, peso = peso === 3 ? 1 : 3) suma += Number(codigo[i]) * peso;
  return (10 - (suma % 10)) % 10 === Number(codigo[codigo.length - 1]);
}

/** Un código listo para buscar: ya normalizado y con el dígito de control correcto. `null` si no sirve. */
export function codigoParaBuscar(texto: string): string | null {
  const c = normalizarCodigo(texto);
  return digitoDeControlOk(c) ? c : null;
}

const TIENE_DIRECCION = /(https?:\/\/|www\.)/i;

const limpio = (valor: unknown, max: number): string | undefined => {
  if (typeof valor !== 'string') return undefined;
  const t = valor.replace(/\s+/g, ' ').trim().slice(0, max).trim();
  return t.length > 0 ? t : undefined;
};

/** Todo en mayúsculas («COCA COLA 600 ML») se pasa a minúsculas con la primera en mayúscula; lo demás se deja como viene. */
export function capitalizar(texto: string): string {
  const t = texto.trim();
  if (!t) return t;
  const letras = t.replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/g, '');
  const gritando = letras.length > 3 && letras === letras.toUpperCase();
  const base = gritando ? t.toLowerCase() : t;
  return base.charAt(0).toUpperCase() + base.slice(1);
}

/** Lo que contesta Open Food Facts (`/api/v2/product/<código>`) → nombre, marca y cantidad. `null` si no conoce el producto. */
export function leerRespuestaOff(json: unknown): ProductoDeCodigo | null {
  if (!json || typeof json !== 'object') return null;
  const r = json as { status?: unknown; product?: unknown };
  if (r.status === 0 || !r.product || typeof r.product !== 'object') return null;
  const p = r.product as Record<string, unknown>;
  const nombre = limpio(p.product_name_es, 120) ?? limpio(p.product_name, 120) ?? limpio(p.generic_name_es, 120) ?? limpio(p.generic_name, 120);
  if (!nombre || nombre.length < 2) return null;
  const marcaCruda = limpio(p.brands, 120)?.split(',')[0];
  const marca = marcaCruda ? limpio(marcaCruda, 60) : undefined;
  const cantidad = limpio(p.quantity, 30);
  if (TIENE_DIRECCION.test(nombre) || (marca && TIENE_DIRECCION.test(marca)) || (cantidad && TIENE_DIRECCION.test(cantidad))) return null;
  return { nombre, ...(marca ? { marca } : {}), ...(cantidad ? { cantidad } : {}), fuente: 'off' };
}

/** El nombre como se escribiría en una tienda: «Leche entera Lala 1 L» (sin repetir la marca ni la cantidad si ya vienen en el nombre). */
export function nombreCompleto(p: Pick<ProductoDeCodigo, 'nombre' | 'marca' | 'cantidad'>): string {
  let n = capitalizar(p.nombre);
  const base = norm(n);
  if (p.marca && !base.includes(norm(p.marca))) n += ` ${capitalizar(p.marca)}`;
  if (p.cantidad && !base.includes(norm(p.cantidad))) n += ` ${p.cantidad.toLowerCase().replace(/\bl\b/, 'L')}`;
  return n.slice(0, 120).trim();
}
