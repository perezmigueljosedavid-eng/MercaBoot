import { CATEGORIAS_PRODUCTO } from '../data/contenido';
import type { CategoriaProducto } from '../data/tipos';
import { PRECIO_MAXIMO, type CambioDeProducto } from './precios';
import { norm } from './texto';

/**
 * Importar y exportar productos con archivos CSV (lo que guardan Excel y Google Sheets).
 * Lee el archivo aunque venga con comas, punto y coma o tabuladores, con o sin encabezado, con acentos mal guardados
 * y con precios como «$1,250.50» o «12,5»; avisa de las filas que no sirven; y reparte lo leído entre productos nuevos
 * y productos que el comerciante ya tiene (para solo actualizar su precio o si hay).
 * No importa nada de react-native: se puede probar con node.
 * Autor: José David Pérez Miguel
 */

/** Cuántas filas se leen de un archivo como máximo (igual que el tope de productos de un negocio). */
export const MAX_FILAS = 1500;
/** Tamaño máximo de un archivo, en bytes: 1,500 productos caben de sobra en menos de 300 KB. */
export const MAX_BYTES = 2_000_000;
/** Marca que pone Excel al inicio de un archivo UTF-8 para saber que los acentos están bien. */
export const BOM = '﻿';

export type Campo = 'nombre' | 'precio' | 'unidad' | 'categoria' | 'hay';
const CAMPOS: Campo[] = ['nombre', 'precio', 'unidad', 'categoria', 'hay'];

/* ───────────────────────── 1. Del archivo al texto ───────────────────────── */

export type LecturaDeArchivo =
  | { ok: true; texto: string; codificacion: 'utf8' | 'utf16' | 'ansi' }
  | { ok: false; motivo: 'excel' | 'vacio' | 'binario' };

/** Windows-1252 (la «ANSI» de Excel en Windows) difiere de Latin-1 solo en estos lugares. */
const CP1252: Record<number, string> = {
  0x80: '€', 0x82: '‚', 0x83: 'ƒ', 0x84: '„', 0x85: '…', 0x86: '†', 0x87: '‡', 0x88: 'ˆ', 0x89: '‰', 0x8a: 'Š', 0x8b: '‹', 0x8c: 'Œ',
  0x8e: 'Ž', 0x91: '‘', 0x92: '’', 0x93: '“', 0x94: '”', 0x95: '•', 0x96: '–', 0x97: '—', 0x98: '˜', 0x99: '™', 0x9a: 'š', 0x9b: '›',
  0x9c: 'œ', 0x9e: 'ž', 0x9f: 'Ÿ',
};

/** Junta trozos de caracteres sin crear un texto gigante de golpe. */
function unir(partes: number[]): string {
  const trozos: string[] = [];
  for (let i = 0; i < partes.length; i += 4096) trozos.push(String.fromCharCode(...partes.slice(i, i + 4096)));
  return trozos.join('');
}

/** UTF-8 estricto: devuelve `null` si los bytes no son UTF-8 válido (señal de que el archivo viene en «ANSI»). */
function utf8Estricto(b: Uint8Array, desde: number): string | null {
  const salida: number[] = [];
  let i = desde;
  while (i < b.length) {
    const a = b[i];
    if (a < 0x80) {
      salida.push(a);
      i += 1;
      continue;
    }
    let faltan: number;
    let cp: number;
    let minimo: number;
    if (a >= 0xc2 && a <= 0xdf) {
      faltan = 1;
      cp = a & 0x1f;
      minimo = 0x80;
    } else if (a >= 0xe0 && a <= 0xef) {
      faltan = 2;
      cp = a & 0x0f;
      minimo = 0x800;
    } else if (a >= 0xf0 && a <= 0xf4) {
      faltan = 3;
      cp = a & 0x07;
      minimo = 0x10000;
    } else return null;
    for (let k = 1; k <= faltan; k++) {
      const c = b[i + k];
      if (c === undefined || (c & 0xc0) !== 0x80) return null;
      cp = (cp << 6) | (c & 0x3f);
    }
    if (cp < minimo || cp > 0x10ffff || (cp >= 0xd800 && cp <= 0xdfff)) return null;
    if (cp >= 0x10000) {
      const v = cp - 0x10000;
      salida.push(0xd800 + (v >> 10), 0xdc00 + (v & 0x3ff));
    } else salida.push(cp);
    i += faltan + 1;
  }
  return unir(salida);
}

function utf16(b: Uint8Array, desde: number, littleEndian: boolean): string {
  const salida: number[] = [];
  for (let i = desde; i + 1 < b.length; i += 2) salida.push(littleEndian ? b[i] | (b[i + 1] << 8) : (b[i] << 8) | b[i + 1]);
  return unir(salida);
}

function ansi(b: Uint8Array): string {
  const salida: number[] = [];
  for (let i = 0; i < b.length; i++) {
    const x = b[i];
    const especial = x >= 0x80 && x <= 0x9f ? CP1252[x] : undefined;
    salida.push(especial ? especial.charCodeAt(0) : x);
  }
  return unir(salida);
}

/**
 * Los bytes de un archivo → texto. Entiende UTF-8 (con o sin marca), UTF-16 (el «Texto Unicode» de Excel) y «ANSI» de Windows.
 * Avisa si el archivo es un libro de Excel (.xlsx/.xls) en vez de un CSV, o si no es un texto.
 */
export function decodificarArchivo(b: Uint8Array): LecturaDeArchivo {
  if (b.length === 0) return { ok: false, motivo: 'vacio' };
  // .xlsx (zip: «PK») y .xls antiguo (OLE2)
  if ((b[0] === 0x50 && b[1] === 0x4b && b[2] === 0x03 && b[3] === 0x04) || (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0)) {
    return { ok: false, motivo: 'excel' };
  }
  if (b[0] === 0xef && b[1] === 0xbb && b[2] === 0xbf) {
    const t = utf8Estricto(b, 3);
    return t === null ? { ok: true, texto: ansi(b.subarray(3)), codificacion: 'ansi' } : { ok: true, texto: t, codificacion: 'utf8' };
  }
  if (b[0] === 0xff && b[1] === 0xfe) return { ok: true, texto: utf16(b, 2, true), codificacion: 'utf16' };
  if (b[0] === 0xfe && b[1] === 0xff) return { ok: true, texto: utf16(b, 2, false), codificacion: 'utf16' };
  // Un texto normal casi no trae bytes en cero; muchos = imagen, PDF, etc.
  let ceros = 0;
  const revisados = Math.min(b.length, 4000);
  for (let i = 0; i < revisados; i++) if (b[i] === 0) ceros += 1;
  if (ceros > revisados * 0.05) return { ok: false, motivo: 'binario' };
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return { ok: false, motivo: 'binario' }; // %PDF
  const t = utf8Estricto(b, 0);
  return t === null ? { ok: true, texto: ansi(b), codificacion: 'ansi' } : { ok: true, texto: t, codificacion: 'utf8' };
}

/* ───────────────────────── 2. Del texto a las celdas ───────────────────────── */

interface Registro {
  /** Número de línea del archivo en la que empieza (la primera es la 1). */
  linea: number;
  celdas: string[];
}

/**
 * Parte el texto en filas y celdas (reglas de CSV: comillas, «""» para una comilla, saltos de línea dentro de comillas).
 * Con `sep` nulo cada línea es una sola celda. Se detiene cuando ya leyó `maximo` filas con datos.
 */
function tokenizar(texto: string, sep: string | null, maximo = Infinity): Registro[] {
  const res: Registro[] = [];
  let conDatos = 0;
  let celdas: string[] = [];
  let celda = '';
  let enComillas = false;
  let linea = 1;
  let lineaDeInicio = 1;
  const cerrarCelda = () => {
    celdas.push(celda);
    celda = '';
  };
  const cerrarRegistro = () => {
    cerrarCelda();
    res.push({ linea: lineaDeInicio, celdas });
    if (celdas.some((c) => c.trim() !== '')) conDatos += 1;
    celdas = [];
  };
  for (let i = 0; i < texto.length; i++) {
    const ch = texto[i];
    if (enComillas) {
      if (ch === '"') {
        if (texto[i + 1] === '"') {
          celda += '"';
          i += 1;
        } else enComillas = false;
      } else {
        if (ch === '\n') linea += 1;
        celda += ch;
      }
      continue;
    }
    if (ch === '"' && celda.trim() === '') {
      enComillas = true;
      celda = '';
      continue;
    }
    if (sep !== null && ch === sep) {
      cerrarCelda();
      continue;
    }
    if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && texto[i + 1] === '\n') i += 1;
      linea += 1;
      cerrarRegistro();
      lineaDeInicio = linea;
      if (conDatos >= maximo) return res;
      continue;
    }
    celda += ch;
  }
  if (celda !== '' || celdas.length > 0) cerrarRegistro();
  return res;
}

const vacio = (r: Registro) => r.celdas.every((c) => c.trim() === '');

/**
 * ¿Con qué se separan las columnas? Se prueba tabulador, punto y coma y coma sobre las primeras líneas y gana el que
 * parte casi todas las líneas en 2 columnas o más (y en más columnas si hay empate). Si ninguno, es una sola columna.
 */
function detectarSeparador(texto: string): string | null {
  const muestra = texto.length > 12000 ? texto.slice(0, 12000) : texto;
  const cortada = muestra.length < texto.length;
  let mejor: { sep: string; puntos: number } | null = null;
  for (const sep of ['\t', ';', ',']) {
    let regs = tokenizar(muestra, sep, 40);
    if (cortada && regs.length > 1) regs = regs.slice(0, -1); // la última pudo quedar a medias
    regs = regs.filter((r) => !vacio(r));
    if (regs.length === 0) continue;
    // Las filas que sí se parten en 2 columnas o más (algunas filas pueden venir más cortas: «Quesillo,180»)
    const partidas = regs.filter((r) => r.celdas.length >= 2);
    const fraccion = partidas.length / regs.length;
    if (fraccion < 0.6) continue;
    const cuenta = new Map<number, number>();
    for (const r of partidas) cuenta.set(r.celdas.length, (cuenta.get(r.celdas.length) ?? 0) + 1);
    let moda = 0;
    let veces = 0;
    for (const [k, v] of cuenta) {
      if (v > veces || (v === veces && k > moda)) {
        moda = k;
        veces = v;
      }
    }
    const puntos = fraccion * 100 + moda;
    if (!mejor || puntos > mejor.puntos + 0.0001) mejor = { sep, puntos };
  }
  return mejor ? mejor.sep : null;
}

/* ───────────────────────── 3. Encabezados ───────────────────────── */

const palabrasDe = (celda: string) =>
  norm(celda)
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(' ')
    .filter(Boolean);

/** ¿A qué campo se parece el encabezado de una columna? `fuerza` 2 = muy seguro, 1 = más o menos. */
function campoDeEncabezado(celda: string): { campo: Campo; fuerza: number } | null {
  const p = palabrasDe(celda);
  if (p.length === 0 || p.length > 6) return null;
  const tiene = (...ws: string[]) => ws.some((w) => p.includes(w));
  // Lo que el comerciante paga o gana no es el precio al que vende
  if (tiene('precio', 'precios', 'pvp', 'price', 'importe')) {
    if (tiene('compra', 'costo', 'coste', 'proveedor', 'mayoreo', 'iva', 'utilidad', 'ganancia', 'margen')) return null;
    return { campo: 'precio', fuerza: tiene('venta', 'publico', 'pvp') ? 2 : 1 };
  }
  if (tiene('hay', 'disponible', 'disponibles', 'disponibilidad', 'existencia', 'existencias', 'stock', 'available', 'inventario')) return { campo: 'hay', fuerza: 2 };
  if (tiene('categoria', 'categorias', 'rubro', 'departamento', 'depto', 'linea', 'familia', 'seccion', 'clasificacion', 'category', 'grupo')) return { campo: 'categoria', fuerza: 2 };
  if (tiene('unidad', 'unidades', 'um', 'medida', 'unit', 'vende')) return { campo: 'unidad', fuerza: 2 };
  if (tiene('nombre', 'producto', 'productos', 'articulo', 'articulos', 'descripcion', 'concepto', 'item', 'name', 'mercancia')) {
    if (tiene('codigo', 'clave', 'sku', 'barras', 'id', 'folio', 'cantidad')) return null;
    return { campo: 'nombre', fuerza: tiene('nombre') ? 2 : 1 };
  }
  if (tiene('presentacion')) return { campo: 'unidad', fuerza: 1 };
  return null;
}

const NOMBRES_SUELTOS = new Set(['nombre', 'producto', 'productos', 'articulo', 'articulos', 'descripcion', 'nombre del producto', 'name']);

function mapearColumnas(celdas: string[]): Record<Campo, number> {
  const res: Record<Campo, number> = { nombre: -1, precio: -1, unidad: -1, categoria: -1, hay: -1 };
  const fuerzas: Record<Campo, number> = { nombre: 0, precio: 0, unidad: 0, categoria: 0, hay: 0 };
  celdas.forEach((c, i) => {
    const r = campoDeEncabezado(c);
    if (!r) return;
    if (res[r.campo] === -1 || r.fuerza > fuerzas[r.campo]) {
      res[r.campo] = i;
      fuerzas[r.campo] = r.fuerza;
    }
  });
  return res;
}

/* ───────────────────────── 4. Cada dato ───────────────────────── */

/** El precio como lo escribe la gente: «$1,250.50», «1.250,50», «12,5», «28 pesos», «28/kg». Vacío o 0 = sin precio; algo raro = `mal`. */
export function leerPrecioCsv(texto: string): { valor?: number; mal?: boolean } {
  const s = texto.trim().replace(/^(?:mxn|mn|\$|\s)+/i, '');
  if (s === '') return {};
  const m = /^-?\d[\d.,]*/.exec(s);
  if (!m) return { mal: true };
  // Después del número solo se aceptan palabras de dinero («28 pesos», «28 c/u», «28/kg», «28 por kilo»); «1 litro» no es un precio
  const resto = s.slice(m[0].length).trim();
  if (resto !== '' && !/^(?:pesos?|mxn|mn|m\.n\.|c\/u|cu|pzas?\.?|piezas?|\/\s*[a-z]+\.?|por\s+[a-z]+\.?)$/i.test(resto)) return { mal: true };
  let t = m[0].replace(/[.,]+$/, '');
  if (t.startsWith('-')) return { mal: true };
  const puntos = (t.match(/\./g) ?? []).length;
  const comas = (t.match(/,/g) ?? []).length;
  if (puntos > 0 && comas > 0) {
    // Los dos signos: el último es el decimal y el otro separa los miles
    const decimal = t.lastIndexOf('.') > t.lastIndexOf(',') ? '.' : ',';
    const miles = decimal === '.' ? ',' : '.';
    t = t.split(miles).join('');
    t = decimal === ',' ? t.replace(',', '.') : t;
  } else if (comas > 0) {
    const [antes, despues] = t.split(',');
    if (comas > 1) t = t.split(',').join('');
    else if (despues.length === 3 && antes !== '0' && antes.length <= 3) t = antes + despues; // «1,250» = mil doscientos cincuenta
    else t = `${antes}.${despues}`; // «12,5» = doce con cincuenta
  } else if (puntos > 1) {
    t = t.split('.').join(''); // «1.250.000»
  }
  if (!/^\d+(\.\d+)?$/.test(t)) return { mal: true };
  const n = Math.round(Number(t) * 100) / 100;
  if (!Number.isFinite(n) || n > PRECIO_MAXIMO || n > 1_000_000) return { mal: true };
  return n > 0 ? { valor: n } : {};
}

const SI = new Set(['si', 's', '1', 'true', 'verdadero', 'v', 'hay', 'disponible', 'x', 'yes', 'y', 'ok', '✓', '✔', 'existe', 'con existencia', 'en existencia', 'en stock', 'abierto']);
const NO = new Set(['no', 'n', '0', 'false', 'falso', 'f', 'agotado', 'agotada', 'nada', 'no hay', 'sin existencia', 'acabado', 'acabada', 'ya no', 'ninguno', 'sin stock', 'no disponible', 'agotados', '-']);

/** «sí», «no», «hay», «agotado», «1», «0»… y también existencias en número (más de 0 = hay). Vacío = no dice; otra cosa = `mal`. */
export function leerHay(texto: string): { valor?: boolean; mal?: boolean } {
  const t = norm(texto).trim().replace(/[.!¡?¿]/g, '').replace(/\s+/g, ' ');
  if (t === '') return {};
  if (SI.has(t)) return { valor: true };
  if (NO.has(t)) return { valor: false };
  if (/^\d+([.,]\d+)?$/.test(t)) return { valor: Number(t.replace(',', '.')) > 0 };
  return { mal: true };
}

/** Palabras con las que la gente nombra cada categoría → la categoría de Mercaboot. */
const ALIAS_CATEGORIA: [CategoriaProducto, string[]][] = [
  ['carne', ['carne', 'carnes', 'embutidos', 'carnes frias', 'salchichoneria', 'res', 'cerdo', 'carnes y embutidos']],
  ['ave', ['ave', 'aves', 'pollo', 'pollos', 'pollo y aves']],
  ['pescado', ['pescado', 'pescados', 'marisco', 'mariscos', 'pescados y mariscos']],
  ['lacteo', ['lacteo', 'lacteos', 'huevo', 'huevos', 'queso', 'quesos', 'cremeria', 'lacteos y huevo', 'lacteos y huevos']],
  ['masa', ['masa', 'tortilla', 'tortillas', 'tortilleria', 'tortillas y masa']],
  ['pan', ['pan', 'panes', 'panaderia', 'pan dulce']],
  ['verdura', ['verdura', 'verduras', 'vegetales', 'hortalizas', 'legumbres', 'hierbas', 'chiles']],
  ['fruta', ['fruta', 'frutas']],
  ['despensa', ['despensa', 'abarrotes', 'abarrotes y despensa', 'granos', 'semillas', 'enlatados', 'cereales', 'aceites', 'botanas', 'limpieza', 'higiene']],
  ['dulce', ['dulce', 'dulces', 'postre', 'postres', 'golosinas', 'chocolates', 'dulces y postres']],
  ['bebida', ['bebida', 'bebidas', 'refresco', 'refrescos', 'jugos', 'aguas', 'licores', 'cervezas', 'vinos']],
  ['preparado', ['preparado', 'preparados', 'comida', 'comida preparada', 'platillos', 'antojitos', 'guisados']],
  ['otro', ['otro', 'otros', 'varios', 'general', 'diversos']],
];

const PORCATEGORIA = new Map<string, CategoriaProducto>();
for (const [id, alias] of ALIAS_CATEGORIA) for (const a of alias) PORCATEGORIA.set(a, id);
for (const c of CATEGORIAS_PRODUCTO) {
  PORCATEGORIA.set(norm(c.nombre).replace(/\s+/g, ' '), c.id);
  PORCATEGORIA.set(c.id, c.id);
}

/** La categoría que dice la celda; si no se reconoce, `mal` (y el asistente la deduce del nombre del producto). */
export function leerCategoria(texto: string): { id?: CategoriaProducto; mal?: boolean } {
  const t = norm(texto).replace(/[^a-z0-9]+/g, ' ').trim();
  if (t === '') return {};
  const id = PORCATEGORIA.get(t);
  return id ? { id } : { mal: true };
}

/** Cómo se escriben las unidades más comunes; lo demás se deja como lo escribió la persona. */
const ALIAS_UNIDAD: Record<string, string> = {
  kg: 'kg', kgs: 'kg', kilo: 'kg', kilos: 'kg', kilogramo: 'kg', kilogramos: 'kg',
  'medio kilo': 'medio kilo', '1/2 kg': 'medio kilo', '1/2 kilo': 'medio kilo', '½ kg': 'medio kilo', '½ kilo': 'medio kilo', 'medio kg': 'medio kilo', '500 g': 'medio kilo', '500 gr': 'medio kilo', '500 gramos': 'medio kilo',
  'cuarto de kilo': 'cuarto de kilo', 'cuarto kilo': 'cuarto de kilo', '1/4 kg': 'cuarto de kilo', '1/4 kilo': 'cuarto de kilo', '¼ kg': 'cuarto de kilo', '¼ kilo': 'cuarto de kilo', '250 g': 'cuarto de kilo', '250 gr': 'cuarto de kilo', '250 gramos': 'cuarto de kilo',
  litro: 'litro', litros: 'litro', lt: 'litro', lts: 'litro', l: 'litro',
  'medio litro': 'medio litro', '1/2 litro': 'medio litro', '½ litro': 'medio litro', '500 ml': 'medio litro',
  pieza: 'pieza', piezas: 'pieza', pza: 'pieza', pzas: 'pieza', pz: 'pieza', pzs: 'pieza', unidad: 'pieza', unidades: 'pieza', u: 'pieza', 'c/u': 'pieza', cu: 'pieza', 'cada uno': 'pieza',
  docena: 'docena', docenas: 'docena', doc: 'docena', 'media docena': 'media docena',
  paquete: 'paquete', paquetes: 'paquete', paq: 'paquete', pqt: 'paquete',
  bolsa: 'bolsa', bolsas: 'bolsa', caja: 'caja', cajas: 'caja', lata: 'lata', latas: 'lata', botella: 'botella', botellas: 'botella',
  manojo: 'manojo', manojos: 'manojo', atado: 'manojo', par: 'par', pares: 'par',
  porcion: 'porción', porciones: 'porción', orden: 'orden', ordenes: 'orden', rebanada: 'rebanada', rebanadas: 'rebanada',
};

/** «por kilo» → «kg», «Pza» → «pieza», «Bulto de 25 kg» → «bulto de 25 kg». Vacío = no dice. */
export function leerUnidad(texto: string): string | undefined {
  let t = texto.replace(/\s+/g, ' ').trim();
  if (t === '') return undefined;
  t = t.replace(/^(?:por|x|\/)\s*/i, '');
  if (t === '') return undefined;
  const clave = norm(t).replace(/\./g, '');
  return (ALIAS_UNIDAD[clave] ?? t.toLowerCase()).slice(0, 60);
}

/** El nombre limpio: sin espacios de más, sin la comilla que pone la exportación, hasta 120 letras. */
export function limpiarNombre(texto: string): string {
  return texto
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^'(?=[=+\-@])/, '')
    .slice(0, 120)
    .trim();
}

/** La misma clave que usa el catálogo para saber si un producto ya está: sin acentos, mayúsculas ni espacios de más. */
export const claveDeNombre = (nombre: string) => norm(nombre).trim().replace(/\s+/g, ' ');

/* ───────────────────────── 5. Leer el archivo ───────────────────────── */

export interface FilaCsv {
  /** Línea del archivo (la primera es la 1), para decirle a la persona dónde está el problema. */
  linea: number;
  nombre: string;
  precio?: number;
  unidad?: string;
  categoria?: CategoriaProducto;
  /** Solo viene si la columna «hay» decía algo. */
  disponible?: boolean;
}

export interface AvisoCsv {
  linea: number;
  nombre: string;
  motivo: string;
}

export interface LecturaCsv {
  /** Filas que sirven, sin repetir (lo repetido dentro del archivo se cuenta aparte). */
  filas: FilaCsv[];
  /** Filas que se dejaron fuera, con el motivo. */
  problemas: AvisoCsv[];
  /** Filas que sí se toman, pero con un dato que no se entendió y se dejó en blanco. */
  avisos: AvisoCsv[];
  repetidasEnArchivo: number;
  /** El archivo traía más de 1,500 filas: las demás no se leyeron. */
  cortado: boolean;
  conEncabezado: boolean;
  columnas: Record<Campo, number>;
  /** El archivo no sirve (vacío, sin columna de nombres…): se explica en palabras. */
  error?: string;
}

const POSICIONAL: Record<Campo, number> = { nombre: 0, precio: 1, unidad: 2, categoria: 3, hay: 4 };

interface Intento extends LecturaCsv {
  /** Sin encabezado, la segunda columna casi nunca era un precio: probablemente era una sola columna con comas en los nombres. */
  columnaDosNoEsPrecio: boolean;
}

function leerConSeparador(texto: string, sep: string | null): Intento {
  const base: Intento = {
    filas: [],
    problemas: [],
    avisos: [],
    repetidasEnArchivo: 0,
    cortado: false,
    conEncabezado: false,
    columnas: { ...POSICIONAL },
    columnaDosNoEsPrecio: false,
  };
  // Se lee un poco más del tope: algunas filas de título antes del encabezado y una más para saber si el archivo traía de sobra
  const regs = tokenizar(texto, sep, MAX_FILAS + 8).filter((r) => !vacio(r));
  if (regs.length === 0) return { ...base, error: 'El archivo no tiene ninguna fila con datos.' };

  // ¿Alguna de las primeras filas es el encabezado? (puede haber un título antes)
  let columnas: Record<Campo, number> | null = null;
  let filaDeEncabezado = -1;
  let reconocioSinNombre = false;
  for (let k = 0; k < Math.min(6, regs.length); k++) {
    const m = mapearColumnas(regs[k].celdas);
    const reconocidos = CAMPOS.filter((c) => m[c] !== -1).length;
    const celdasConTexto = regs[k].celdas.filter((c) => c.trim() !== '');
    const soloNombre = k === 0 && reconocidos === 1 && m.nombre !== -1 && celdasConTexto.length === 1 && NOMBRES_SUELTOS.has(palabrasDe(celdasConTexto[0]).join(' '));
    if (m.nombre !== -1 && (reconocidos >= 2 || soloNombre)) {
      columnas = m;
      filaDeEncabezado = k;
      break;
    }
    if (k === 0 && m.nombre === -1 && reconocidos >= 2) reconocioSinNombre = true;
  }
  if (!columnas && reconocioSinNombre) {
    return { ...base, error: 'No encontré la columna con los nombres de los productos. Agrega una columna que se llame «nombre» (la primera fila lleva los títulos).' };
  }

  const conEncabezado = columnas !== null;
  const col = columnas ?? { ...POSICIONAL };
  const datos = regs.slice(filaDeEncabezado + 1);
  const res: Intento = { ...base, conEncabezado, columnas: col };
  if (datos.length === 0) return { ...res, error: 'El archivo solo tiene los títulos de las columnas; faltan los productos.' };

  const celda = (r: Registro, i: number) => (i >= 0 && i < r.celdas.length ? r.celdas[i].trim() : '');
  const vistos = new Set<string>();
  let precios = 0;
  let preciosBuenos = 0;

  for (let n = 0; n < datos.length; n++) {
    if (n >= MAX_FILAS) {
      res.cortado = true;
      break;
    }
    const r = datos[n];
    const nombre = limpiarNombre(celda(r, col.nombre));
    if (nombre === '') {
      res.problemas.push({ linea: r.linea, nombre: r.celdas.map((c) => c.trim()).filter(Boolean).join(' · ').slice(0, 60), motivo: 'Falta el nombre del producto.' });
      continue;
    }
    if (!/[a-z]/.test(norm(nombre))) {
      res.problemas.push({ linea: r.linea, nombre, motivo: 'El nombre no parece el de un producto (no tiene letras).' });
      continue;
    }
    const clave = claveDeNombre(nombre);
    if (vistos.has(clave)) {
      res.repetidasEnArchivo += 1;
      continue;
    }
    vistos.add(clave);

    const fila: FilaCsv = { linea: r.linea, nombre };
    const avisos: string[] = [];

    const textoPrecio = celda(r, col.precio);
    if (textoPrecio !== '') precios += 1;
    const p = leerPrecioCsv(textoPrecio);
    if (p.valor !== undefined) {
      fila.precio = p.valor;
      preciosBuenos += 1;
    } else if (p.mal) avisos.push(`El precio «${textoPrecio.slice(0, 20)}» no se entiende; se agrega sin precio.`);

    const unidad = leerUnidad(celda(r, col.unidad));
    if (unidad) fila.unidad = unidad;

    const textoCategoria = celda(r, col.categoria);
    const c = leerCategoria(textoCategoria);
    if (c.id) fila.categoria = c.id;
    // Una categoría que no conozco no es problema: el asistente la deduce del nombre. No se avisa fila por fila.

    const h = leerHay(celda(r, col.hay));
    if (h.valor !== undefined) fila.disponible = h.valor;
    else if (h.mal) avisos.push(`«${celda(r, col.hay).slice(0, 20)}» no dice si hay o no; se deja como disponible.`);

    for (const motivo of avisos) res.avisos.push({ linea: r.linea, nombre, motivo });
    res.filas.push(fila);
  }

  if (!conEncabezado && col.precio !== -1 && precios >= 2 && preciosBuenos < precios * 0.5) res.columnaDosNoEsPrecio = true;
  if (res.filas.length === 0 && !res.error) {
    return { ...res, error: res.problemas.length > 0 ? 'Ninguna fila tiene un nombre de producto que se pueda usar.' : 'No encontré productos en el archivo.' };
  }
  return res;
}

/** Lee un CSV (o texto pegado desde Excel o Google Sheets) y lo convierte en productos. */
export function leerCsv(texto: string): LecturaCsv {
  let t = texto.replace(/^﻿/, '');
  let sep: string | null;
  // Excel a veces pone «sep=;» en la primera línea (esa línea no cuenta como dato, pero sí para decir en qué línea está cada cosa)
  const marca = /^sep=(.)\r?\n/i.exec(t);
  let desfase = 0;
  if (marca) {
    sep = marca[1];
    t = t.slice(marca[0].length);
    desfase = 1;
  } else sep = detectarSeparador(t);
  const r = leerConSeparador(t, sep);
  // Sin encabezado y con la «columna de precios» llena de texto: era una lista de nombres con comas (p. ej. «Aceite, 1 litro»)
  const final: Intento = !r.conEncabezado && sep !== null && r.columnaDosNoEsPrecio ? leerConSeparador(t, null) : r;
  const { columnaDosNoEsPrecio, ...lectura } = final;
  void columnaDosNoEsPrecio;
  if (desfase === 0) return lectura;
  const mover = <T extends { linea: number }>(l: T[]): T[] => l.map((x) => ({ ...x, linea: x.linea + desfase }));
  return { ...lectura, filas: mover(lectura.filas), problemas: mover(lectura.problemas), avisos: mover(lectura.avisos) };
}

/* ───────────────────────── 6. Nuevos o ya los tengo ───────────────────────── */

export interface Existente {
  id: string;
  nombre: string;
  precio?: number;
  disponible: boolean;
}

export interface CambioPlaneado {
  id: string;
  nombre: string;
  precioAntes?: number;
  /** Solo si el archivo trae otro precio. */
  precioDespues?: number;
  /** Solo si el archivo dice otra cosa que lo que hay ahora. */
  disponibleDespues?: boolean;
}

export interface Reparto {
  /** Productos que todavía no tiene. */
  nuevas: FilaCsv[];
  /** Productos que ya tiene y en los que el archivo trae otro precio o dice que hay o no. */
  cambios: CambioPlaneado[];
  /** Productos que ya tiene y no cambian en nada. */
  iguales: number;
}

/** Separa lo leído entre productos nuevos y productos que el comerciante ya tiene (por el nombre, sin fijarse en acentos). */
export function repartirFilas(filas: FilaCsv[], existentes: Existente[]): Reparto {
  const porClave = new Map<string, Existente>();
  for (const e of existentes) porClave.set(claveDeNombre(e.nombre), e);
  const nuevas: FilaCsv[] = [];
  const cambios: CambioPlaneado[] = [];
  let iguales = 0;
  for (const f of filas) {
    const e = porClave.get(claveDeNombre(f.nombre));
    if (!e) {
      nuevas.push(f);
      continue;
    }
    const c: CambioPlaneado = { id: e.id, nombre: e.nombre, ...(e.precio !== undefined ? { precioAntes: e.precio } : {}) };
    let cambia = false;
    if (f.precio !== undefined && f.precio !== e.precio) {
      c.precioDespues = f.precio;
      cambia = true;
    }
    if (f.disponible !== undefined && f.disponible !== e.disponible) {
      c.disponibleDespues = f.disponible;
      cambia = true;
    }
    if (cambia) cambios.push(c);
    else iguales += 1;
  }
  return { nuevas, cambios, iguales };
}

/** Los cambios en el formato que recibe `actualizarProductosLote`. */
export const comoCambios = (cambios: CambioPlaneado[]): CambioDeProducto[] =>
  cambios.map((c) => ({
    id: c.id,
    ...(c.precioDespues !== undefined ? { precio: c.precioDespues } : {}),
    ...(c.disponibleDespues !== undefined ? { disponible: c.disponibleDespues } : {}),
  }));

/* ───────────────────────── 7. Escribir el archivo ───────────────────────── */

/** Una celda lista para un CSV: entre comillas si lleva coma, comillas o saltos de línea; y sin que Excel la tome por fórmula. */
function celdaCsv(valor: string, texto = true): string {
  let v = valor.replace(/\r?\n|\r/g, ' ');
  if (texto && /^[=+\-@\t]/.test(v)) v = `'${v}`;
  return /[",;\t\n\r]/.test(v) ? `"${v.replace(/"/g, '""')}"` : v;
}

const ENCABEZADO = 'nombre,precio,unidad,categoria,hay';

export interface ProductoParaCsv {
  nombre: string;
  precio?: number;
  unidad: string;
  /** El nombre de la categoría tal como se lee («Frutas», «Pan»…). */
  categoria: string;
  disponible: boolean;
}

/** Los productos en CSV (con comas y saltos de línea de Windows, que es lo que abre Excel sin sorpresas). */
export function productosACsv(productos: ProductoParaCsv[]): string {
  const filas = productos.map((p) =>
    [celdaCsv(p.nombre), p.precio === undefined ? '' : String(Number(p.precio.toFixed(2))), celdaCsv(p.unidad), celdaCsv(p.categoria), p.disponible ? 'sí' : 'no'].join(','),
  );
  return [ENCABEZADO, ...filas].join('\r\n') + '\r\n';
}

/** Un archivo de ejemplo para llenar en Excel o Google Sheets. */
export function plantillaCsv(): string {
  return productosACsv([
    { nombre: 'Jitomate saladet', precio: 28, unidad: 'kg', categoria: 'Verduras', disponible: true },
    { nombre: 'Aguacate hass', precio: 65, unidad: 'kg', categoria: 'Frutas', disponible: true },
    { nombre: 'Leche entera 1 litro', precio: 27.5, unidad: 'pieza', categoria: 'Lácteos y huevo', disponible: true },
    { nombre: 'Tortillas de maíz', precio: 24, unidad: 'kg', categoria: 'Tortillas y masa', disponible: true },
    { nombre: 'Refresco de cola 600 ml', precio: 18, unidad: 'pieza', categoria: 'Bebidas', disponible: false },
  ]);
}
