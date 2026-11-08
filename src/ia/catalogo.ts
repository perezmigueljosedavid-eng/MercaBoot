import type { Aviso, CategoriaProducto, Coord, Etiqueta, Negocio, Producto, Resena, Sabor, TipoProducto } from '../data/tipos';
import { distanciaA, etiquetaDistancia } from '../lib/distancia';
import { clasificar, Clasificacion, INGREDIENTES, perfilDeProducto } from './ingredientes';
import { esSabor } from './perfil';
import { Reputacion, reputaciones, SIN_RESENAS } from './reputacion';
import { tokens } from './texto';

/**
 * El catálogo es todo lo que el asistente sabe del mundo real: lo que los comerciantes tienen
 * publicado y marcado como "hay". Nada más. Si un producto no está aquí, el asistente no lo ofrece.
 */
export interface Item {
  p: Producto;
  n: Negocio;
  /** Metros desde la persona hasta el negocio, o null si no se conoce. */
  dist: number | null;
  /** Ingrediente de recetas que es este producto (solo si es para cocinar). */
  ing?: string;
  cat: CategoriaProducto;
  /** Para cocinar en casa o ya preparado (platillo, postre, bebida…). */
  tipo: TipoProducto;
  /** Todo lo que se sabe del producto: sabor, momento, si lleva carne o proteína, si va caliente. */
  etiquetas: Etiqueta[];
  sabores: Sabor[];
  listo: boolean;
  evitar: boolean;
  palabras: string[];
  /** Reputación de la tienda que lo vende. */
  rep: Reputacion;
}

export interface Catalogo {
  /** Solo productos marcados como disponibles. */
  items: Item[];
  negocios: Negocio[];
  /** Cuántos negocios tienen al menos un producto disponible. */
  conProductos: number;
  /** Productos disponibles por ingrediente, del más cercano al más lejano. */
  porIng: Map<string, Item[]>;
  origen: Coord | null;
  avisos: Aviso[];
  /** Hay al menos un negocio con ubicación conocida. */
  hayUbicaciones: boolean;
  /** Reputación de cada negocio con reseñas. */
  rep: Map<string, Reputacion>;
}

const cache = new Map<string, Clasificacion>();
function clasificarCache(nombre: string, giro: string, tipo?: TipoProducto): Clasificacion {
  const clave = `${nombre}|${giro}|${tipo ?? ''}`;
  let c = cache.get(clave);
  if (!c) {
    c = clasificar(nombre, giro, tipo);
    if (cache.size > 2000) cache.clear();
    cache.set(clave, c);
  }
  return c;
}

/** Abiertos primero, luego cercanos (los de ubicación desconocida al final), luego los más recientes. */
export function mejorPrimero(a: Item, b: Item): number {
  if (a.n.abierto !== b.n.abierto) return a.n.abierto ? -1 : 1;
  if (a.dist != null && b.dist != null) return a.dist - b.dist;
  if (a.dist != null) return -1;
  if (b.dist != null) return 1;
  return b.p.actualizado - a.p.actualizado;
}

export function construirCatalogo(
  productos: Producto[],
  negocios: Negocio[],
  origen: Coord | null,
  avisos: Aviso[] = [],
  resenas: Pick<Resena, 'negocioId' | 'estrellas'>[] = [],
): Catalogo {
  const porId = new Map(negocios.map((n) => [n.id, n]));
  const rep = reputaciones(resenas);
  const items: Item[] = [];
  for (const p of productos) {
    if (!p.disponible) continue;
    const n = porId.get(p.negocioId);
    if (!n) continue;
    const c = clasificarCache(p.nombre, n.giro, p.tipo);
    const { tipo, etiquetas } = perfilDeProducto(p, n.giro, c);
    // Lo que ya está preparado no cuenta como ingrediente de recetas (un pollo rostizado no es "pollo" para cocinar).
    const ing = tipo === 'ingrediente' ? (c.ingrediente ?? (p.ingrediente && INGREDIENTES[p.ingrediente] ? p.ingrediente : undefined)) : undefined;
    items.push({
      p,
      n,
      dist: distanciaA(n, origen),
      ing,
      cat: p.categoria && p.categoria !== 'otro' ? p.categoria : c.categoria,
      tipo,
      etiquetas,
      sabores: etiquetas.filter(esSabor),
      listo: c.listo || tipo === 'preparado',
      evitar: c.evitar,
      palabras: tokens(p.nombre),
      rep: rep.get(n.id) ?? SIN_RESENAS,
    });
  }
  items.sort(mejorPrimero);
  const porIng = new Map<string, Item[]>();
  for (const it of items) {
    if (!it.ing) continue;
    const l = porIng.get(it.ing);
    if (l) l.push(it);
    else porIng.set(it.ing, [it]);
  }
  return {
    items,
    negocios,
    conProductos: new Set(items.map((i) => i.n.id)).size,
    porIng,
    origen,
    avisos,
    hayUbicaciones: negocios.some((n) => typeof n.lat === 'number' && typeof n.lng === 'number'),
    rep,
  };
}

/** Un producto por negocio (el mejor), para que "dónde hay tortillas" no repita la misma tienda. */
export function unoPorNegocio(lista: Item[], max = 3): Item[] {
  const vistos = new Set<string>();
  const res: Item[] = [];
  for (const it of lista) {
    if (vistos.has(it.n.id)) continue;
    vistos.add(it.n.id);
    res.push(it);
    if (res.length >= max) break;
  }
  return res;
}

/** Productos que sirven para cualquiera de estos ingredientes. */
export function conIngredientes(cat: Catalogo, ids: string[]): Item[] {
  const res: Item[] = [];
  for (const id of ids) res.push(...(cat.porIng.get(id) ?? []));
  return res.sort(mejorPrimero);
}

/** ¿Algún negocio tiene este ingrediente hoy? */
export const hayIngrediente = (cat: Catalogo, id: string) => (cat.porIng.get(id)?.length ?? 0) > 0;

/** "Tienda · a 300 m" o, si no se conoce la distancia, su dirección. */
export function dondeTexto(it: Item): string {
  const d = etiquetaDistancia(it.dist);
  const extra = d ?? it.n.direccion ?? '';
  return extra ? `${it.n.nombre} · ${extra}` : it.n.nombre;
}

export function tieneAlgo(cat: Catalogo): boolean {
  return cat.items.length > 0;
}
