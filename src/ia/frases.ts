import { enTemporada } from '../data/festividades';
import type { Sabor } from '../data/tipos';
import type { Catalogo } from './catalogo';
import type { Momento } from './recetas';
import type { Bloque, GrupoIdeas, Memoria } from './vista';

/** Lo que cada parte del asistente recibe y devuelve. */
export interface Ctx {
  cat: Catalogo;
  mem: Memoria;
  ahora: Date;
  nombre?: string;
}

export interface Parcial {
  bloques: Bloque[];
  chips: string[];
  mem?: Partial<Memoria>;
  /** La búsqueda encontró lo que se pedía. */
  ok?: boolean;
}

/** Elige una frase según el turno, para que el asistente no repita siempre lo mismo. */
export const pick = <A>(lista: A[], turno: number): A => lista[Math.abs(turno) % lista.length];

export const plural = (n: number, uno: string, varios: string) => (n === 1 ? uno : varios);

/** "A, B y C" */
export function lista(nombres: string[]): string {
  const l = nombres.filter(Boolean);
  if (l.length <= 1) return l[0] ?? '';
  return `${l.slice(0, -1).join(', ')} y ${l[l.length - 1]}`;
}

export const saludoHora = (hora: number) => (hora < 12 ? 'Buenos días' : hora < 19 ? 'Buenas tardes' : 'Buenas noches');

export const TEXTO_SABOR: Record<Sabor, string> = {
  dulce: 'algo dulce',
  salado: 'algo salado',
  picante: 'algo picante',
  acido: 'algo ácido',
  amargo: 'algo amargo',
};

export const TEXTO_MOMENTO: Record<Momento, string> = {
  desayuno: 'el desayuno',
  comida: 'la comida',
  cena: 'la cena',
  botana: 'una botana',
  postre: 'el postre',
  bebida: 'algo para tomar',
};

export const PARA_MOMENTO: Record<Momento, string> = {
  desayuno: 'Para el desayuno',
  comida: 'Para la comida',
  cena: 'Para la cena',
  botana: 'Para botanear',
  postre: 'De postre',
  bebida: 'Si quieres algo para tomar',
};

/** Primera letra en mayúscula, el resto igual. */
export const mayus = (s: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

export function resumenCatalogo(cat: Catalogo): string {
  const n = cat.items.length;
  if (!n) return 'Todavía no hay productos publicados por las tiendas de la comunidad.';
  return `Hoy hay ${n} ${plural(n, 'producto disponible', 'productos disponibles')} en ${cat.conProductos} ${plural(cat.conProductos, 'tienda', 'tiendas')}.`;
}

export const MENSAJE_SIN_PRODUCTOS =
  'Todavía no hay productos publicados por las tiendas de San Francisco Javier, así que no puedo decirte qué hay hoy ni dónde conseguirlo. ' +
  'En cuanto los comerciantes suban sus productos, aquí te diré qué cocinar con lo que realmente haya y en qué tienda encontrarlo. ' +
  'Mientras tanto puedo explicarte cómo se prepara una receta, por ejemplo: «¿cómo se hacen unas tlayudas?».';

/** Respuestas rápidas por defecto (las primeras cinco son las que más se usan). */
export const CHIPS_INICIO = ['Algo barato', 'Algo con carne', 'Algo de solo verduras', 'Se me antoja algo dulce', 'Tiendas mejor calificadas'];

/**
 * Ideas para empezar, pensadas como las pensaría un cliente: lo que cuesta poco, con qué llenarse, qué sirve a esta hora,
 * qué tienda conviene y qué se festeja pronto.
 */
export function gruposInicio(ahora: Date): GrupoIdeas[] {
  const h = ahora.getHours();
  // Siempre están las tres comidas, pero primero la que toca a esta hora
  const deLaHora =
    h >= 5 && h < 11
      ? ['Una idea de desayuno', 'Un plato fuerte', 'Una cena ligera', 'Algo rápido']
      : h >= 11 && h < 18
        ? ['Un plato fuerte', 'Algo rápido', 'Una cena ligera', 'Una idea de desayuno']
        : ['Una cena ligera', 'Un plato fuerte', 'Algo rápido', 'Una idea de desayuno'];
  const fiesta = enTemporada(ahora)[0];
  const antojos = ['Se me antoja algo dulce', 'Algo típico de Oaxaca', 'Algo ya preparado'];
  if (fiesta) antojos.unshift(`Ideas para ${fiesta.f.corto}`);
  return [
    { titulo: 'Para comer', chips: deLaHora },
    { titulo: 'Lo que lleva', chips: ['Algo con carne', 'Algo con proteína', 'Algo de solo verduras', 'Algo ligero'] },
    { titulo: 'Cuidar el bolsillo', chips: ['Algo barato', '¿Dónde sale más barato?'] },
    { titulo: 'Más ideas', chips: antojos },
    { titulo: 'Tiendas', chips: ['Tiendas mejor calificadas', 'Tiendas cerca de mí', 'Tiendas con servicio a domicilio'] },
  ];
}

/** Las mismas ideas en una sola lista, de las más usadas a las menos. */
export function chipsInicio(ahora: Date): string[] {
  const g = gruposInicio(ahora);
  const orden = ['Cuidar el bolsillo', 'Lo que lleva', 'Para comer', 'Más ideas', 'Tiendas'];
  return orden.flatMap((t) => g.find((x) => x.titulo === t)?.chips ?? []);
}
