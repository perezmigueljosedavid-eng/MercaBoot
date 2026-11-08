/**
 * Qué clase de negocio es según su giro, y qué unidades de venta tienen sentido para él.
 * Es código puro (sin pantallas) porque también lo usa el asistente.
 */

export type GrupoGiro = 'frescos' | 'preparados' | 'postres' | 'bebidas' | 'otros';

const sinAcentos = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * frescos = productos para llevar y cocinar en casa (carnicería, verdulería, abarrotes…)
 * preparados = comida ya hecha (fonda, taquería, tlayudería…)
 * postres = pasteles, pan, helados, dulces · bebidas = café, jugos, licuados, agua
 * otros = negocios que no venden comida (papelería, ferretería…)
 */
export function grupoDeGiro(giro?: string): GrupoGiro {
  const g = sinAcentos(giro ?? '');
  if (/papeler|farmaci|ferreter|merceri|regalo|fiesta|ropa|zapat|celular|electr|plomer|libreri|boutique/.test(g)) return 'otros';
  if (/pastel|panader|reposter|dulcer|postre|gelatin|fresas|crepa|churro|waffle|helad|paleter|nieve|chocolater|bunuel/.test(g)) return 'postres';
  if (/cafe|jugo|licuado|bebida|refresco|agua|tejate|raspado|batido|smoothie/.test(g)) return 'bebidas';
  if (/fonda|comida|taquer|tlayud|antojit|cocina|rostic|comedor|restaurant|\btorter|pizz|hamburg|birria|barbacoa|pozole|marisquer|cocteler|ceviche|tamal|empanad|garnach|pollo asado|asador/.test(g)) return 'preparados';
  return 'frescos';
}

/** ¿Lo que vende este negocio normalmente ya se come o se bebe tal cual? */
export const vendePreparado = (giro?: string) => {
  const g = grupoDeGiro(giro);
  return g === 'preparados' || g === 'postres' || g === 'bebidas';
};

export const UNIDAD_OTRA = 'Otra (escribir)';

const POR_GRUPO: Record<GrupoGiro, string[]> = {
  frescos: ['kg', 'medio kilo', 'cuarto de kilo', 'pieza', 'docena', 'litro', 'paquete', 'bolsa', 'manojo', 'caja', 'botella', 'lata', 'par'],
  preparados: ['porción', 'orden', 'media orden', 'platillo', 'taco', 'torta', 'pieza', 'combo', 'comida corrida', 'plato', 'litro', 'vaso chico', 'vaso grande'],
  postres: ['pieza', 'rebanada', 'porción', 'vaso chico', 'vaso mediano', 'vaso grande', 'pastel chico', 'pastel mediano', 'pastel grande', 'docena', 'media docena', 'bolsa', 'charola', 'caja', 'kg', 'paquete'],
  bebidas: ['vaso chico', 'vaso mediano', 'vaso grande', 'taza', 'jarra', 'litro', 'medio litro', 'botella', 'bola', 'cono', 'copa', 'porción', 'pieza'],
  otros: ['pieza', 'paquete', 'caja', 'par', 'servicio', 'kg', 'litro', 'bolsa'],
};

/** Todas las unidades que conoce la app, sin repetir. */
export const UNIDADES: string[] = [...new Set(Object.values(POR_GRUPO).flat())];

/** Grupo de unidades que corresponde a un producto: lo ya preparado se vende por porción, lo de cocinar por peso o pieza. */
function grupoDeUnidades(giro?: string, tipo?: 'ingrediente' | 'preparado'): GrupoGiro {
  const g = grupoDeGiro(giro);
  if (tipo === 'preparado' && (g === 'frescos' || g === 'otros')) return 'preparados';
  if (tipo === 'ingrediente' && (g === 'preparados' || g === 'bebidas')) return 'frescos';
  return g;
}

/**
 * Unidades para el selector "Se vende por": primero las que tienen sentido para el negocio y el producto
 * (una fonda: porción, orden, comida corrida; una verdulería: kilo, manojo…) y después las demás.
 * Siempre termina con la opción de escribir una propia.
 */
export function unidadesPara(giro?: string, tipo?: 'ingrediente' | 'preparado'): string[] {
  const propias = POR_GRUPO[grupoDeUnidades(giro, tipo)];
  return [...new Set([...propias, ...UNIDADES]), UNIDAD_OTRA];
}

/** Unidad con la que empieza el formulario de un producto nuevo. */
export const unidadInicial = (giro?: string, tipo?: 'ingrediente' | 'preparado') => POR_GRUPO[grupoDeUnidades(giro, tipo)][0];
