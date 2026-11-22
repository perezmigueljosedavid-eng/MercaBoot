import type { GrupoGiro } from './giros';
import type { CategoriaProducto, TipoProducto } from './tipos';

/**
 * Catálogo Mercaboot: lo más común que vende cada tipo de negocio. El comerciante marca lo que vende y se agrega de golpe,
 * sin escribir ni fotografiar cada producto; después solo pone los precios («Precios de hoy»).
 *
 * Cada renglón es [nombre, cómo se vende] y, si hace falta, [nombre, cómo se vende, categoría distinta a la de la sección].
 * Autor: José David Pérez Miguel
 */

type Renglon = [nombre: string, unidad: string] | [nombre: string, unidad: string, categoria: CategoriaProducto];

export interface SeccionCatalogo {
  id: string;
  titulo: string;
  emoji: string;
  /** Tipos de negocio a los que les sirve primero. */
  grupos: GrupoGiro[];
  tipo: TipoProducto;
  categoria: CategoriaProducto;
  items: Renglon[];
}

export interface ProductoCatalogo {
  nombre: string;
  unidad: string;
  categoria: CategoriaProducto;
  tipo: TipoProducto;
}

export const CATALOGO: SeccionCatalogo[] = [
  {
    id: 'frutas', titulo: 'Frutas', emoji: '🍎', grupos: ['frescos'], tipo: 'ingrediente', categoria: 'fruta',
    items: [
      ['Plátano', 'kg'], ['Plátano macho', 'kg'], ['Manzana roja', 'kg'], ['Manzana verde', 'kg'], ['Naranja', 'kg'], ['Mandarina', 'kg'],
      ['Limón', 'kg'], ['Toronja', 'kg'], ['Papaya', 'kg'], ['Piña', 'pieza'], ['Sandía', 'pieza'], ['Melón', 'pieza'], ['Mango', 'kg'],
      ['Uva roja', 'kg'], ['Uva verde', 'kg'], ['Fresa', 'kg'], ['Pera', 'kg'], ['Durazno', 'kg'], ['Guayaba', 'kg'], ['Mamey', 'pieza'],
      ['Zapote', 'kg'], ['Coco', 'pieza'], ['Tuna', 'kg'], ['Granada', 'pieza'], ['Kiwi', 'kg'], ['Ciruela', 'kg'], ['Tejocote', 'kg'],
      ['Jícama', 'kg'], ['Caña de azúcar', 'pieza'],
    ],
  },
  {
    id: 'verduras', titulo: 'Verduras y hierbas', emoji: '🥬', grupos: ['frescos'], tipo: 'ingrediente', categoria: 'verdura',
    items: [
      ['Jitomate', 'kg'], ['Tomate verde', 'kg'], ['Cebolla blanca', 'kg'], ['Cebolla morada', 'kg'], ['Cebollitas de rabo', 'manojo'],
      ['Ajo', 'kg'], ['Papa', 'kg'], ['Zanahoria', 'kg'], ['Chayote', 'kg'], ['Calabacita', 'kg'], ['Calabaza de Castilla', 'kg'],
      ['Pepino', 'kg'], ['Lechuga', 'pieza'], ['Col', 'pieza'], ['Brócoli', 'pieza'], ['Coliflor', 'pieza'], ['Apio', 'pieza'],
      ['Betabel', 'kg'], ['Rábano', 'manojo'], ['Espinaca', 'manojo'], ['Acelga', 'manojo'], ['Cilantro', 'manojo'], ['Perejil', 'manojo'],
      ['Epazote', 'manojo'], ['Hierbabuena', 'manojo'], ['Hoja santa', 'manojo'], ['Pápalo', 'manojo'], ['Nopales', 'kg'], ['Elote', 'pieza'],
      ['Ejotes', 'kg'], ['Chícharo', 'kg'], ['Chile serrano', 'kg'], ['Chile jalapeño', 'kg'], ['Chile poblano', 'kg'], ['Chile de agua', 'kg'],
      ['Chile habanero', 'kg'], ['Camote', 'kg'], ['Champiñones', 'charola'], ['Flor de calabaza', 'manojo'], ['Verdolagas', 'manojo'],
      ['Quelites', 'manojo'], ['Aguacate', 'kg'], ['Hojas de plátano', 'paquete'], ['Hojas de maíz para tamal', 'paquete'],
    ],
  },
  {
    id: 'abarrotes', titulo: 'Abarrotes', emoji: '🥫', grupos: ['frescos'], tipo: 'ingrediente', categoria: 'despensa',
    items: [
      ['Arroz', 'kg'], ['Frijol negro', 'kg'], ['Frijol pinto', 'kg'], ['Lentejas', 'kg'], ['Garbanzo', 'kg'], ['Maíz pozolero', 'kg'],
      ['Pasta para sopa', 'paquete'], ['Spaghetti', 'paquete'], ['Avena', 'bolsa'], ['Harina de trigo', 'kg'], ['Harina de maíz', 'kg'],
      ['Azúcar', 'kg'], ['Piloncillo', 'pieza'], ['Sal', 'kg'], ['Aceite vegetal', 'litro'], ['Manteca', 'kg'], ['Café soluble', 'frasco'],
      ['Café molido', 'bolsa'], ['Chocolate de mesa', 'tablilla'], ['Canela', 'bolsa'], ['Pimienta', 'bolsa'], ['Comino', 'bolsa'],
      ['Orégano', 'bolsa'], ['Consomé de pollo en polvo', 'sobre'], ['Mayonesa', 'frasco'], ['Catsup', 'botella'], ['Mostaza', 'frasco'],
      ['Salsa picante', 'botella'], ['Chiles en vinagre', 'lata'], ['Chiles chipotles', 'lata'], ['Puré de tomate', 'sobre'],
      ['Atún en lata', 'lata'], ['Sardina en lata', 'lata'], ['Leche condensada', 'lata'], ['Leche evaporada', 'lata'],
      ['Mermelada', 'frasco'], ['Miel', 'frasco'], ['Cacahuates', 'bolsa'], ['Pasas', 'bolsa'], ['Ajonjolí', 'bolsa'], ['Mole', 'kg'],
      ['Vinagre', 'botella'], ['Gelatina en polvo', 'caja'], ['Cereal', 'caja'], ['Mezcla para hot cakes', 'caja'], ['Polvo para hornear', 'bote'],
      ['Levadura', 'sobre'], ['Frijoles refritos', 'lata'], ['Sopa instantánea', 'pieza'], ['Chile guajillo', 'bolsa'], ['Chile ancho', 'bolsa'],
      ['Chile pasilla', 'bolsa'], ['Chile de árbol', 'bolsa'], ['Jamaica', 'bolsa'], ['Tamarindo', 'bolsa'], ['Vainilla', 'botella'],
    ],
  },
  {
    id: 'lacteos', titulo: 'Lácteos y huevo', emoji: '🥛', grupos: ['frescos'], tipo: 'ingrediente', categoria: 'lacteo',
    items: [
      ['Huevo', 'kg'], ['Cartera de huevo (30 piezas)', 'cartera'], ['Leche entera', 'litro'], ['Leche deslactosada', 'litro'], ['Crema', 'litro'],
      ['Quesillo', 'kg'], ['Queso fresco', 'kg'], ['Queso panela', 'kg'], ['Queso cotija', 'kg'], ['Queso manchego', 'kg'], ['Queso amarillo', 'kg'],
      ['Queso rallado', 'bolsa'], ['Mantequilla', 'barra'], ['Margarina', 'barra'], ['Yogurt natural', 'litro'], ['Yogurt individual', 'pieza'],
      ['Requesón', 'kg'], ['Queso crema', 'pieza'],
    ],
  },
  {
    id: 'carnes', titulo: 'Carnes y pescado', emoji: '🥩', grupos: ['frescos'], tipo: 'ingrediente', categoria: 'carne',
    items: [
      ['Pollo entero', 'kg', 'ave'], ['Pechuga de pollo', 'kg', 'ave'], ['Pierna y muslo de pollo', 'kg', 'ave'], ['Alitas de pollo', 'kg', 'ave'],
      ['Menudencia de pollo', 'kg', 'ave'], ['Carne molida de res', 'kg'], ['Bistec de res', 'kg'], ['Arrachera', 'kg'], ['Costilla de res', 'kg'],
      ['Hígado de res', 'kg'], ['Chuleta de cerdo', 'kg'], ['Costilla de cerdo', 'kg'], ['Carne de puerco (maciza)', 'kg'], ['Tasajo', 'kg'],
      ['Cecina enchilada', 'kg'], ['Chorizo', 'kg'], ['Longaniza', 'kg'], ['Jamón', 'kg'], ['Salchicha', 'paquete'], ['Tocino', 'paquete'],
      ['Chicharrón', 'kg'], ['Mojarra', 'kg', 'pescado'], ['Filete de pescado', 'kg', 'pescado'], ['Camarón', 'kg', 'pescado'],
    ],
  },
  {
    id: 'tortillas-pan', titulo: 'Tortillas y pan', emoji: '🫓', grupos: ['frescos', 'postres'], tipo: 'ingrediente', categoria: 'masa',
    items: [
      ['Tortillas de maíz', 'kg'], ['Tortillas de harina', 'paquete'], ['Tostadas', 'paquete'], ['Tlayudas', 'pieza'], ['Masa de maíz', 'kg'],
      ['Totopos', 'bolsa'], ['Memelas', 'pieza'], ['Bolillo', 'pieza', 'pan'], ['Telera', 'pieza', 'pan'], ['Pan de caja', 'bolsa', 'pan'],
      ['Pan molido', 'bolsa', 'pan'],
    ],
  },
  {
    id: 'bebidas-envasadas', titulo: 'Refrescos y bebidas envasadas', emoji: '🥤', grupos: ['frescos'], tipo: 'preparado', categoria: 'bebida',
    items: [
      ['Refresco de 600 ml', 'botella'], ['Refresco de 2 litros', 'botella'], ['Refresco de lata', 'lata'], ['Agua embotellada de 1 litro', 'botella'],
      ['Agua de garrafón (20 litros)', 'garrafón'], ['Agua mineral', 'botella'], ['Jugo en caja', 'caja'], ['Cerveza', 'botella'],
      ['Suero rehidratante', 'botella'], ['Té en cajita', 'caja'], ['Atole instantáneo', 'sobre'], ['Hielo', 'bolsa'],
    ],
  },
  {
    id: 'botanas', titulo: 'Botanas y dulces', emoji: '🍬', grupos: ['frescos', 'postres'], tipo: 'preparado', categoria: 'dulce',
    items: [
      ['Papas fritas', 'bolsa'], ['Chicharrones de harina', 'bolsa'], ['Cacahuates japoneses', 'bolsa'], ['Palomitas', 'bolsa'], ['Galletas dulces', 'paquete'],
      ['Galletas saladas', 'paquete'], ['Chocolate', 'pieza'], ['Paleta de dulce', 'pieza'], ['Chicles', 'paquete'], ['Dulces de tamarindo', 'pieza'],
      ['Gomitas', 'bolsa'], ['Pastelito empacado', 'pieza', 'pan'],
    ],
  },
  {
    id: 'limpieza', titulo: 'Limpieza, higiene y hogar', emoji: '🧼', grupos: ['frescos', 'otros'], tipo: 'ingrediente', categoria: 'otro',
    items: [
      ['Jabón de barra', 'pieza'], ['Jabón para trastes', 'pieza'], ['Detergente en polvo', 'kg'], ['Cloro', 'litro'], ['Suavizante de telas', 'litro'],
      ['Limpiador multiusos', 'botella'], ['Limpiador de pisos', 'litro'], ['Papel higiénico', 'paquete'], ['Servilletas', 'paquete'], ['Papel aluminio', 'rollo'],
      ['Bolsas para basura', 'paquete'], ['Escoba', 'pieza'], ['Trapeador', 'pieza'], ['Shampoo', 'botella'], ['Pasta dental', 'pieza'], ['Jabón de baño', 'pieza'],
      ['Rastrillo', 'pieza'], ['Toallas sanitarias', 'paquete'], ['Pañales', 'paquete'], ['Pilas', 'paquete'], ['Focos', 'pieza'], ['Cerillos', 'caja'],
      ['Veladoras', 'pieza'], ['Encendedor', 'pieza'],
    ],
  },
  {
    id: 'platillos', titulo: 'Antojitos y comida', emoji: '🌮', grupos: ['preparados'], tipo: 'preparado', categoria: 'preparado',
    items: [
      ['Tacos de pastor', 'orden'], ['Tacos de bistec', 'orden'], ['Tacos de suadero', 'orden'], ['Tacos de canasta', 'orden'], ['Tacos dorados', 'orden'],
      ['Quesadilla', 'pieza'], ['Tlayuda sencilla', 'pieza'], ['Tlayuda con tasajo', 'pieza'], ['Tlayuda con cecina', 'pieza'], ['Tlayuda con chorizo', 'pieza'],
      ['Memela con asiento', 'pieza'], ['Tamal de mole', 'pieza'], ['Tamal de rajas', 'pieza'], ['Tamal de frijol', 'pieza'], ['Enchiladas rojas', 'orden'],
      ['Enchiladas verdes', 'orden'], ['Enmoladas', 'orden'], ['Entomatadas', 'orden'], ['Chilaquiles verdes', 'orden'], ['Chilaquiles rojos', 'orden'],
      ['Huevos al gusto', 'orden'], ['Huevos a la mexicana', 'orden'], ['Molletes', 'orden'], ['Hamburguesa', 'pieza'], ['Hot dog', 'pieza'],
      ['Torta de jamón', 'torta'], ['Torta de milanesa', 'torta'], ['Torta de pierna', 'torta'], ['Pozole', 'plato'], ['Caldo de pollo', 'plato'],
      ['Caldo de res', 'plato'], ['Sopa de pasta', 'plato'], ['Arroz rojo', 'porción'], ['Frijoles de la olla', 'porción'], ['Mole negro con pollo', 'plato'],
      ['Mole rojo con pollo', 'plato'], ['Pollo asado (medio)', 'porción'], ['Pollo en salsa verde', 'plato'], ['Pollo en salsa roja', 'plato'],
      ['Milanesa con papas', 'plato'], ['Bistec en salsa', 'plato'], ['Comida corrida', 'comida corrida'], ['Ensalada', 'porción'], ['Sopes', 'orden'],
      ['Empanadas', 'pieza'], ['Garnachas', 'orden'], ['Tostadas de tinga', 'pieza'], ['Elote preparado', 'pieza'], ['Esquites', 'vaso grande'],
      ['Papas a la francesa', 'porción'], ['Nuggets', 'orden'],
    ],
  },
  {
    id: 'bebidas-preparadas', titulo: 'Bebidas y aguas frescas', emoji: '☕', grupos: ['preparados', 'bebidas', 'postres'], tipo: 'preparado', categoria: 'bebida',
    items: [
      ['Agua de jamaica', 'vaso grande'], ['Agua de horchata', 'vaso grande'], ['Agua de limón', 'vaso grande'], ['Agua de tamarindo', 'vaso grande'],
      ['Tejate', 'vaso grande'], ['Atole', 'vaso grande'], ['Champurrado', 'vaso grande'], ['Café americano', 'taza'], ['Café de olla', 'taza'],
      ['Capuchino', 'taza'], ['Té caliente', 'taza'], ['Licuado de plátano', 'vaso grande'], ['Jugo de naranja', 'vaso grande'], ['Limonada', 'vaso grande'],
      ['Chocolate caliente', 'taza'], ['Raspado', 'vaso grande'],
    ],
  },
  {
    id: 'postres', titulo: 'Postres y pan dulce', emoji: '🍰', grupos: ['postres', 'preparados'], tipo: 'preparado', categoria: 'dulce',
    items: [
      ['Pastel de chocolate', 'rebanada'], ['Pastel de tres leches', 'rebanada'], ['Pastel de zanahoria', 'rebanada'], ['Pay de limón', 'rebanada'],
      ['Flan', 'pieza'], ['Gelatina', 'vaso chico'], ['Arroz con leche', 'vaso chico'], ['Fresas con crema', 'vaso grande'], ['Helado', 'bola'],
      ['Nieve de limón', 'bola'], ['Paleta de hielo', 'pieza'], ['Dona', 'pieza', 'pan'], ['Churros', 'orden'], ['Crepa dulce', 'pieza'],
      ['Waffle', 'pieza'], ['Galletas caseras', 'bolsa'], ['Brownie', 'pieza'], ['Pan de elote', 'rebanada'], ['Buñuelos', 'orden'],
      ['Pan de yema', 'pieza', 'pan'], ['Pan dulce', 'pieza', 'pan'], ['Concha', 'pieza', 'pan'], ['Pan de muerto', 'pieza', 'pan'], ['Marquesote', 'pieza', 'pan'],
    ],
  },
];

/** Los renglones de una sección, completos (con la categoría y el tipo de la sección si no traen otra). */
export function productosDeSeccion(s: SeccionCatalogo): ProductoCatalogo[] {
  return s.items.map((r) => ({ nombre: r[0], unidad: r[1], categoria: r[2] ?? s.categoria, tipo: s.tipo }));
}

/** Cuántos productos tiene todo el catálogo. */
export const TOTAL_CATALOGO = CATALOGO.reduce((a, s) => a + s.items.length, 0);

/** Las secciones en el orden que le conviene a un tipo de negocio: primero las suyas. */
export function seccionesPara(grupo: GrupoGiro): { suyas: SeccionCatalogo[]; otras: SeccionCatalogo[] } {
  return { suyas: CATALOGO.filter((s) => s.grupos.includes(grupo)), otras: CATALOGO.filter((s) => !s.grupos.includes(grupo)) };
}
