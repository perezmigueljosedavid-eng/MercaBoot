import type { CategoriaProducto } from './tipos';

export { unidadesPara, unidadInicial, UNIDAD_OTRA } from './giros';

/** Comunidad para la que está pensada la app. */
export const COMUNIDAD = 'San Francisco Javier, Santa Cruz Xoxocotlán, Oaxaca';

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
