import type { Sabor, TipoAviso } from '../data/tipos';
import type { Criterio, Insignia } from './comparar';

/** Lo que el asistente devuelve a la pantalla de chat. Son datos simples, listos para dibujar. */

export interface DondeVista {
  negocioId: string;
  negocio: string;
  /** "a 300 m · 4 min a pie", o null si no se conoce. */
  dist: string | null;
  direccion?: string;
  abierto: boolean;
  producto?: string;
  productoId?: string;
  precio?: number;
  unidad?: string;
  /** Calificación de la tienda (promedio) y cuántas reseñas tiene. */
  estrellas?: number | null;
  resenas?: number;
  aDomicilio?: boolean;
  porEncargo?: boolean;
  /** Detalle corto: "postre · dulce · sin carne", "Ahorras $5 por kg"… */
  nota?: string;
  /** En qué destaca frente a las otras tiendas que tienen lo mismo. */
  insignias?: Insignia[];
}

/** hay = lo vende algún negocio · casa = básico que ya se tiene · tienes = la persona dijo que lo tiene · falta = nadie lo publica */
export type EstadoIng = 'hay' | 'casa' | 'tienes' | 'falta';

export interface IngVista {
  txt: string;
  estado: EstadoIng;
  opcional: boolean;
  donde: DondeVista[];
  /** Cuántas tiendas más lo tienen además de las que se muestran. */
  masTiendas?: number;
}

/** Una tienda y qué parte de la receta puede surtir. */
export interface TiendaReceta {
  negocioId: string;
  nombre: string;
  dist: string | null;
  cubre: number;
  de: number;
  abierto: boolean;
  estrellas: number | null;
  resenas: number;
  aDomicilio: boolean;
}

export interface RecetaVista {
  id: string;
  nombre: string;
  min: number;
  por: number;
  sabores: Sabor[];
  etiquetas: string[];
  /** "Con carne", "Con proteína", "Sin carne", "Desayuno"… para que la persona sepa de qué va. */
  carac: string[];
  ing: IngVista[];
  pasos: string[];
  tip?: string;
  /** Todos los ingredientes principales se consiguen o ya se tienen. */
  completa: boolean;
  faltan: string[];
  /** La tienda que más conviene (reúne más ingredientes y, a igualdad, tiene mejores estrellas o está más cerca). */
  mejorTienda?: TiendaReceta & { motivos: string[] };
  /** Las demás tiendas que también surten ingredientes, para que nadie quede fuera. */
  otrasTiendas?: TiendaReceta[];
}

export interface NegocioVista {
  negocioId: string;
  nombre: string;
  giro: string;
  dist: string | null;
  abierto: boolean;
  direccion?: string;
  productos: number;
  reclamado: boolean;
  estrellas?: number | null;
  resenas?: number;
  aDomicilio?: boolean;
  insignias?: Insignia[];
}

export interface AvisoVista {
  id: string;
  negocioId: string;
  negocio: string;
  tipo: TipoAviso;
  texto: string;
  hasta?: number;
  /** Nombre corto de la fiesta a la que se refiere ("Día de Muertos"). */
  festividad?: string;
}

/** Ideas para empezar, agrupadas por lo que la persona quiere resolver (qué lleva, cuánto cuesta, qué tienda…). */
export interface GrupoIdeas {
  titulo: string;
  chips: string[];
}

export type Bloque =
  | { t: 'texto'; texto: string }
  | { t: 'ideas'; grupos: GrupoIdeas[] }
  | { t: 'receta'; receta: RecetaVista; verPasos: boolean }
  | { t: 'productos'; titulo?: string; items: DondeVista[] }
  | { t: 'negocios'; titulo?: string; items: NegocioVista[] }
  | { t: 'avisos'; titulo?: string; items: AvisoVista[] };

/** Lo que el asistente recuerda de la charla para entender "otra opción" o "¿dónde lo compro?". */
export interface Memoria {
  turno: number;
  ultimaReceta?: string;
  recetasMostradas: string[];
  sabor?: Sabor;
  momento?: string;
  rapido?: boolean;
  economico?: boolean;
  vegetariano?: boolean;
  caliente?: boolean;
  personas?: number;
  ingredientes: string[];
  excluir: string[];
  tengo: string[];
  dieta?: 'carne' | 'proteina';
  soloVerduras?: boolean;
  ligero?: boolean;
  platoFuerte?: boolean;
  oaxaca?: boolean;
  listo?: boolean;
  festividad?: string;
  /** Qué estaba viendo la persona: recetas, una búsqueda de productos o un ranking de tiendas. */
  modo?: 'recetas' | 'productos' | 'tiendas';
  /** Última búsqueda de productos, para poder ordenarla de otra forma ("por precio", "por estrellas"). */
  busqueda?: { grupos: string[][]; palabras: string[]; dicho: string; negocios: string[] };
  ordenar?: Criterio;
}

export const MEMORIA_INICIAL: Memoria = { turno: 0, recetasMostradas: [], ingredientes: [], excluir: [], tengo: [] };

export interface Respuesta {
  bloques: Bloque[];
  /** Respuestas rápidas que se ofrecen debajo. */
  sugerencias: string[];
  memoria: Memoria;
}
