import { C } from '../ui/theme';
import type { CategoriaProducto, Etiqueta, Sabor, TipoAviso } from './tipos';

export { grupoDeGiro, unidadesPara, unidadInicial, UNIDAD_OTRA, UNIDADES } from './giros';

/** Comunidad para la que está pensada la app. */
export const COMUNIDAD = 'San Francisco Javier, Santa Cruz Xoxocotlán, Oaxaca';
export const COMUNIDAD_CORTA = 'San Francisco Javier, Xoxocotlán';

/* ───────── giros de negocio ───────── */

/** `chip` es como aparece el giro en las categorías del inicio. */
export const GIROS: { nombre: string; chip: string }[] = [
  { nombre: 'Abarrotes y miscelánea', chip: 'Abarrotes' },
  { nombre: 'Carnicería', chip: 'Carnicerías' },
  { nombre: 'Pollería', chip: 'Pollerías' },
  { nombre: 'Pescadería y mariscos', chip: 'Mariscos' },
  { nombre: 'Cremería y lácteos', chip: 'Cremerías' },
  { nombre: 'Tortillería', chip: 'Tortillerías' },
  { nombre: 'Panadería y pastelería', chip: 'Panaderías' },
  { nombre: 'Verdulería y frutería', chip: 'Verduras y frutas' },
  { nombre: 'Comida preparada o fonda', chip: 'Comida preparada' },
  { nombre: 'Taquería', chip: 'Taquerías' },
  { nombre: 'Tlayudería y antojitos', chip: 'Antojitos' },
  { nombre: 'Cocina económica', chip: 'Cocinas económicas' },
  { nombre: 'Rosticería', chip: 'Rosticerías' },
  { nombre: 'Dulcería y botanas', chip: 'Dulcerías' },
  { nombre: 'Bebidas y refrescos', chip: 'Bebidas' },
  { nombre: 'Agua purificada', chip: 'Agua purificada' },
  { nombre: 'Cafetería', chip: 'Cafeterías' },
  { nombre: 'Heladería y paletería', chip: 'Helados' },
  { nombre: 'Fresas con crema y postres', chip: 'Fresas y postres' },
  { nombre: 'Comedor o cenaduría', chip: 'Comedores' },
  { nombre: 'Jugos y licuados', chip: 'Jugos y licuados' },
  { nombre: 'Puesto de mercado', chip: 'Mercado' },
  { nombre: 'Papelería', chip: 'Papelerías' },
  { nombre: 'Farmacia', chip: 'Farmacias' },
  { nombre: 'Ferretería', chip: 'Ferreterías' },
  { nombre: 'Mercería', chip: 'Mercerías' },
  { nombre: 'Forrajería y alimento para animales', chip: 'Forrajerías' },
  { nombre: 'Regalos y artículos para fiestas', chip: 'Regalos y fiestas' },
];

/** Opción que permite escribir un giro propio. */
export const GIRO_OTRO = 'Otro (escribir)';

function pluralizar(g: string) {
  const t = g.trim();
  if (!t || /\s/.test(t)) return t;
  if (/[aeiouáéíóú]$/i.test(t)) return `${t}s`;
  if (/s$/i.test(t)) return t;
  return `${t}es`;
}

export function chipDeGiro(giro: string) {
  return GIROS.find((g) => g.nombre === giro)?.chip ?? pluralizar(giro);
}

/* ───────── productos ───────── */

export const CATEGORIAS_PRODUCTO: { id: CategoriaProducto; nombre: string }[] = [
  { id: 'carne', nombre: 'Carne y embutidos' },
  { id: 'ave', nombre: 'Pollo y aves' },
  { id: 'pescado', nombre: 'Pescados y mariscos' },
  { id: 'lacteo', nombre: 'Lácteos y huevo' },
  { id: 'masa', nombre: 'Tortillas y masa' },
  { id: 'pan', nombre: 'Pan' },
  { id: 'verdura', nombre: 'Verduras' },
  { id: 'fruta', nombre: 'Frutas' },
  { id: 'despensa', nombre: 'Abarrotes y despensa' },
  { id: 'dulce', nombre: 'Dulces y postres' },
  { id: 'bebida', nombre: 'Bebidas' },
  { id: 'preparado', nombre: 'Comida preparada' },
  { id: 'otro', nombre: 'Otro' },
];

export const nombreCategoria = (id: CategoriaProducto) => CATEGORIAS_PRODUCTO.find((c) => c.id === id)?.nombre ?? 'Otro';

export const SABORES: { id: Sabor; nombre: string }[] = [
  { id: 'dulce', nombre: 'Dulce' },
  { id: 'salado', nombre: 'Salado' },
  { id: 'picante', nombre: 'Picante' },
  { id: 'acido', nombre: 'Ácido' },
  { id: 'amargo', nombre: 'Amargo' },
];

export const nombreSabor = (id: Sabor) => SABORES.find((s) => s.id === id)?.nombre ?? id;

/**
 * Características que lee el asistente. El comerciante no las tiene que llenar:
 * la app las deduce del nombre del producto y él solo corrige lo que haga falta.
 * `soloPreparado`: solo tienen sentido en platillos, postres y bebidas ya hechos.
 */
export const GRUPOS_ETIQUETAS: { titulo: string; soloPreparado: boolean; items: { id: Etiqueta; nombre: string }[] }[] = [
  {
    titulo: '¿Para cuándo sirve?',
    soloPreparado: true,
    items: [
      { id: 'desayuno', nombre: 'Desayuno' },
      { id: 'comida', nombre: 'Comida o plato fuerte' },
      { id: 'cena', nombre: 'Cena' },
      { id: 'botana', nombre: 'Botana o antojito' },
      { id: 'postre', nombre: 'Postre' },
      { id: 'bebida', nombre: 'Bebida' },
    ],
  },
  { titulo: 'Sabor', soloPreparado: false, items: SABORES },
  {
    titulo: '¿Qué lleva?',
    soloPreparado: true,
    items: [
      { id: 'carne', nombre: 'Con carne' },
      { id: 'proteina', nombre: 'Con proteína' },
      { id: 'sinCarne', nombre: 'Sin carne' },
    ],
  },
  { titulo: 'Cómo se sirve', soloPreparado: true, items: [{ id: 'caliente', nombre: 'Caliente' }] },
];

export const nombreEtiqueta = (id: Etiqueta) =>
  GRUPOS_ETIQUETAS.flatMap((g) => g.items).find((e) => e.id === id)?.nombre ?? id;

const MOMENTOS_ETIQUETA: [Etiqueta, string][] = [
  ['desayuno', 'desayuno'],
  ['comida', 'comida'],
  ['cena', 'cena'],
  ['botana', 'antojito'],
  ['postre', 'postre'],
  ['bebida', 'bebida'],
];
const SABORES_ETIQUETA: [Etiqueta, string][] = [
  ['dulce', 'dulce'],
  ['picante', 'picante'],
  ['acido', 'ácido'],
  ['amargo', 'amargo'],
  ['salado', 'salado'],
];

/** "postre · sin carne · dulce": resumen corto para listas (un momento, qué lleva, si va caliente y el sabor). */
export function textoEtiquetas(etiquetas: Etiqueta[], max = 3): string {
  const tiene = (id: Etiqueta) => etiquetas.includes(id);
  const res: string[] = [];
  const momento = MOMENTOS_ETIQUETA.find(([id]) => tiene(id));
  if (momento) res.push(momento[1]);
  if (tiene('carne')) res.push('con carne');
  else if (tiene('sinCarne')) res.push('sin carne');
  if (tiene('proteina') && !tiene('carne')) res.push('con proteína');
  if (tiene('caliente')) res.push('caliente');
  const sabor = SABORES_ETIQUETA.find(([id]) => tiene(id));
  if (sabor) res.push(sabor[1]);
  return res.slice(0, max).join(' · ');
}

/** Categoría con la que empieza un producto nuevo según el giro del negocio (el comerciante la puede cambiar). */
const CATEGORIA_POR_GIRO: Record<string, CategoriaProducto> = {
  'Abarrotes y miscelánea': 'despensa',
  'Carnicería': 'carne',
  'Pollería': 'ave',
  'Pescadería y mariscos': 'pescado',
  'Cremería y lácteos': 'lacteo',
  'Tortillería': 'masa',
  'Panadería y pastelería': 'pan',
  'Verdulería y frutería': 'verdura',
  'Comida preparada o fonda': 'preparado',
  'Taquería': 'preparado',
  'Tlayudería y antojitos': 'preparado',
  'Cocina económica': 'preparado',
  'Rosticería': 'preparado',
  'Dulcería y botanas': 'dulce',
  'Bebidas y refrescos': 'bebida',
  'Agua purificada': 'bebida',
  'Cafetería': 'bebida',
  'Heladería y paletería': 'dulce',
  'Fresas con crema y postres': 'dulce',
  'Comedor o cenaduría': 'preparado',
  'Jugos y licuados': 'bebida',
};

export const categoriaInicial = (giro?: string): CategoriaProducto => (giro && CATEGORIA_POR_GIRO[giro]) || 'otro';

/* ───────── avisos ───────── */

export interface InfoAviso {
  badge: string;
  boton: string;
  /** Fondo y texto de la insignia. */
  bg: string;
  fg: string;
  /** Fondo suave y texto para notas y vista previa. */
  tint: string;
  deep: string;
  line: string;
}

export const TIPOS_AVISO: Record<TipoAviso, InfoAviso> = {
  agotado: { badge: 'Agotado', boton: 'Ya no hay', bg: C.redTint, fg: C.red, tint: C.redTint, deep: C.redDeep, line: C.red },
  hay: { badge: 'Ya hay', boton: 'Ya hay', bg: C.greenTint, fg: C.greenDark, tint: C.greenTint, deep: C.greenDark, line: C.green },
  promo: { badge: 'Promo', boton: 'Promoción', bg: C.amberTint, fg: C.amberText, tint: C.amberTint, deep: C.amberDeep, line: C.amber },
  regalo: { badge: 'Regalo', boton: 'Regalo', bg: C.amber, fg: C.ink, tint: C.amberTint, deep: C.amberDeep, line: C.amber },
  cerrado: { badge: 'Cerrado', boton: 'Cerrado hoy', bg: C.grey, fg: C.greyText, tint: C.grey, deep: C.greyText, line: C.dash },
  general: { badge: 'Aviso', boton: 'Otro aviso', bg: C.seg, fg: C.greyText, tint: C.seg, deep: C.greyText, line: C.dash },
};

export const ORDEN_AVISOS: TipoAviso[] = ['agotado', 'hay', 'promo', 'regalo', 'cerrado', 'general'];

/** Regalos que se acostumbra dar en diciembre en la comunidad. */
export const REGALOS_SUGERIDOS = ['Trastes', 'Cubetas', 'Bolsas de mandado', 'Calendario'];

/* ───────── reseñas ───────── */

export const ETIQUETAS_RESENA = ['Producto fresco', 'Buen trato', 'Entrega rápida', 'Buen precio', 'Info actualizada'];
export const ETIQUETAS_RESENA_INICIALES = ['Producto fresco', 'Buen trato'];
export const TEXTO_ESTRELLAS = ['', 'Muy mal', 'Mal', 'Regular', 'Muy bien', 'Excelente'];

/* ───────── chat ───────── */

export const RESPUESTAS_RAPIDAS_CLIENTE = ['¿Qué hay hoy?', '¿A qué hora cierran?', '¿Hacen entregas a domicilio?'];
export const RESPUESTAS_RAPIDAS_COMERCIANTE = ['Sí hay', 'Ya se acabó', 'Llega mañana'];
