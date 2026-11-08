import { etiquetaDistancia } from '../lib/distancia';
import { Item, mejorPrimero, unoPorNegocio } from './catalogo';
import type { Reputacion } from './reputacion';
import { norm } from './texto';

/**
 * Comparar tiendas con reglas claras y parejas:
 * - Nunca se esconde una tienda: todas las que tienen el producto se muestran.
 * - Las insignias solo se dan cuando hay con qué comparar (al menos dos tiendas) y dicen exactamente el motivo.
 * - El precio solo se compara entre unidades equivalentes (kilo con medio kilo, docena con pieza…).
 * - Las estrellas usan un promedio prudente: una sola reseña no basta para presumir.
 */

export type Criterio = 'cerca' | 'precio' | 'estrellas';
export type Insignia = 'cerca' | 'calificada' | 'barata';

export interface PrecioBase {
  /** Unidad común con la que se puede comparar: kg, litro, pieza o la propia unidad. */
  base: string;
  /** Precio por unidad base. */
  valor: number;
}

const CONVERSION: Record<string, [base: string, factor: number]> = {
  kg: ['kg', 1],
  kilo: ['kg', 1],
  'medio kilo': ['kg', 0.5],
  'cuarto de kilo': ['kg', 0.25],
  litro: ['litro', 1],
  'medio litro': ['litro', 0.5],
  pieza: ['pieza', 1],
  docena: ['pieza', 12],
  'media docena': ['pieza', 6],
  par: ['pieza', 2],
};

export function precioBase(precio?: number, unidad?: string): PrecioBase | null {
  if (precio == null || !(precio > 0) || !unidad) return null;
  const u = norm(unidad).trim();
  const c = CONVERSION[u];
  if (c) return { base: c[0], valor: precio / c[1] };
  return { base: u, valor: precio };
}

/** "$95" o "$12.50" */
export const dinero = (n: number) => `$${Number.isInteger(n) ? n : n.toFixed(2)}`;

/** "$95 por kg" */
export const precioTexto = (precio: number, unidad: string) => `${dinero(precio)} por ${unidad}`;

/** La unidad base que más ofertas tienen en común (para comparar precios). */
function baseComun(items: Item[]): string | null {
  const cuenta = new Map<string, number>();
  for (const it of items) {
    const pb = precioBase(it.p.precio, it.p.unidad);
    if (pb) cuenta.set(pb.base, (cuenta.get(pb.base) ?? 0) + 1);
  }
  let mejor: string | null = null;
  let n = 0;
  for (const [b, c] of cuenta) if (c > n) [mejor, n] = [b, c];
  return n >= 2 ? mejor : null;
}

/** Ordena las ofertas según lo que la persona pidió. Los empates se resuelven por cercanía. */
export function ordenarItems(items: Item[], criterio: Criterio): Item[] {
  const l = [...items];
  if (criterio === 'estrellas') return l.sort((a, b) => b.rep.bayes - a.rep.bayes || mejorPrimero(a, b));
  if (criterio === 'precio') {
    const base = baseComun(l);
    return l.sort((a, b) => {
      const pa = precioBase(a.p.precio, a.p.unidad);
      const pb = precioBase(b.p.precio, b.p.unidad);
      const ca = !!pa && pa.base === base;
      const cb = !!pb && pb.base === base;
      if (ca && cb) return (pa as PrecioBase).valor - (pb as PrecioBase).valor || mejorPrimero(a, b);
      if (ca !== cb) return ca ? -1 : 1;
      return mejorPrimero(a, b);
    });
  }
  return l.sort(mejorPrimero);
}

/** La mejor oferta de cada tienda según el criterio, sin repetir tienda y sin dejar a ninguna fuera. */
export function ofertasPorTienda(items: Item[], criterio: Criterio, max = 8): Item[] {
  return unoPorNegocio(ordenarItems(items, criterio), max);
}

export interface Comparacion {
  /** Insignias por id de producto. */
  insignias: Map<string, Insignia[]>;
  cerca?: Item;
  calificada?: Item;
  barata?: Item;
  /** Cuánto más caro es lo más caro (en la misma unidad) que lo más barato. */
  ahorro?: number;
  /** Unidad en la que se comparó el precio, lista para mostrar ("kg"). */
  unidadPrecio?: string;
}

const CERCA_EMPATE = 50; // metros
const MIN_RESENAS = 2;

/**
 * Qué tienda destaca en cada cosa, entre las ofertas dadas (una por tienda).
 * `precio: false` cuando las ofertas son productos distintos y comparar precios no tendría sentido.
 */
export function comparar(items: Item[], opciones: { precio?: boolean } = {}): Comparacion {
  const res: Comparacion = { insignias: new Map() };
  if (items.length < 2) return res;
  const dar = (it: Item, i: Insignia) => {
    const l = res.insignias.get(it.p.id) ?? [];
    if (!l.includes(i)) res.insignias.set(it.p.id, [...l, i]);
  };

  // la más cercana
  const conDist = items.filter((i) => i.dist != null);
  if (conDist.length >= 2) {
    const min = Math.min(...conDist.map((i) => i.dist as number));
    const max = Math.max(...conDist.map((i) => i.dist as number));
    if (max - min > CERCA_EMPATE) {
      const ganadoras = conDist.filter((i) => (i.dist as number) - min <= CERCA_EMPATE);
      ganadoras.forEach((i) => dar(i, 'cerca'));
      res.cerca = ganadoras[0];
    }
  }

  // la mejor calificada: necesita al menos dos tiendas con reseñas suficientes para poder comparar
  const conResenas = items.filter((i) => i.rep.total >= MIN_RESENAS);
  if (conResenas.length >= 2) {
    const mejor = Math.max(...conResenas.map((i) => i.rep.bayes));
    const peor = Math.min(...conResenas.map((i) => i.rep.bayes));
    const ganadoras = conResenas.filter((i) => mejor - i.rep.bayes < 0.05 && (i.rep.promedio ?? 0) >= 4);
    if (mejor - peor >= 0.05 && ganadoras.length) {
      ganadoras.forEach((i) => dar(i, 'calificada'));
      res.calificada = ganadoras[0];
    }
  }

  // la más barata: solo entre unidades equivalentes
  if (opciones.precio) {
    const base = baseComun(items);
    if (base) {
      const comp = items
        .map((it) => ({ it, pb: precioBase(it.p.precio, it.p.unidad) }))
        .filter((x): x is { it: Item; pb: PrecioBase } => !!x.pb && x.pb.base === base);
      const min = Math.min(...comp.map((x) => x.pb.valor));
      const max = Math.max(...comp.map((x) => x.pb.valor));
      if (max - min > 0.005) {
        const ganadoras = comp.filter((x) => x.pb.valor - min < 0.005);
        ganadoras.forEach((x) => dar(x.it, 'barata'));
        res.barata = ganadoras[0].it;
        res.ahorro = Math.round((max - min) * 100) / 100;
        res.unidadPrecio = base;
      }
    }
  }
  return res;
}

const NOMBRE_INSIGNIA: Record<Insignia, string> = {
  cerca: 'la más cercana',
  calificada: 'la mejor calificada',
  barata: 'la más económica',
};

function detalle(it: Item, i: Insignia, comp: Comparacion): string {
  if (i === 'cerca') return etiquetaDistancia(it.dist) ?? '';
  if (i === 'calificada') return `★ ${it.rep.promedio?.toFixed(1)}, ${it.rep.total} reseñas`;
  const pb = precioBase(it.p.precio, it.p.unidad);
  return pb ? `${dinero(Math.round(pb.valor * 100) / 100)} el ${comp.unidadPrecio ?? it.p.unidad}` : '';
}

/**
 * Resumen en lenguaje natural de quién destaca en qué, sin dejar de decir que las demás también lo tienen.
 * Devuelve '' cuando no hay nada que comparar.
 */
export function resumenComparacion(items: Item[], comp: Comparacion): string {
  const vistos = new Set<string>();
  const partes: string[] = [];
  for (const it of items) {
    const ins = comp.insignias.get(it.p.id);
    if (!ins?.length || vistos.has(it.n.id)) continue;
    vistos.add(it.n.id);
    const nombres = ins.map((i) => NOMBRE_INSIGNIA[i]);
    const dets = ins.map((i) => detalle(it, i, comp)).filter(Boolean);
    const quien = nombres.length > 1 ? `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}` : nombres[0];
    partes.push(`**${it.n.nombre}** es ${quien}${dets.length ? ` (${dets.join(' · ')})` : ''}`);
  }
  return partes.length ? `${partes.join('. ')}.` : '';
}

export const NOMBRE_CRITERIO: Record<Criterio, string> = {
  cerca: 'cercanía',
  precio: 'precio, de la más económica a la más cara',
  estrellas: 'estrellas, de la mejor calificada a la menos',
};

/* ───────── comparar tiendas (sin un producto en particular) ───────── */

export interface TiendaComparable {
  id: string;
  dist: number | null;
  rep: Reputacion;
}

/** Mismas reglas que `comparar`, pero entre tiendas completas: la más cercana y la mejor calificada. */
export function insigniasTiendas(tiendas: TiendaComparable[]): Map<string, Insignia[]> {
  const res = new Map<string, Insignia[]>();
  if (tiendas.length < 2) return res;
  const dar = (id: string, i: Insignia) => res.set(id, [...(res.get(id) ?? []), i]);

  const conDist = tiendas.filter((t) => t.dist != null);
  if (conDist.length >= 2) {
    const min = Math.min(...conDist.map((t) => t.dist as number));
    const max = Math.max(...conDist.map((t) => t.dist as number));
    if (max - min > CERCA_EMPATE) conDist.filter((t) => (t.dist as number) - min <= CERCA_EMPATE).forEach((t) => dar(t.id, 'cerca'));
  }

  const conResenas = tiendas.filter((t) => t.rep.total >= MIN_RESENAS);
  if (conResenas.length >= 2) {
    const mejor = Math.max(...conResenas.map((t) => t.rep.bayes));
    const peor = Math.min(...conResenas.map((t) => t.rep.bayes));
    if (mejor - peor >= 0.05) {
      conResenas.filter((t) => mejor - t.rep.bayes < 0.05 && (t.rep.promedio ?? 0) >= 4).forEach((t) => dar(t.id, 'calificada'));
    }
  }
  return res;
}

export interface OfertaBarata {
  /** La oferta más económica de ese producto. */
  mejor: Item;
  /** Cuántas tiendas lo tienen. */
  tiendas: number;
  /** Las ofertas de las demás tiendas (una por tienda, de la más barata a la más cara), para que ninguna quede fuera. */
  otras: Item[];
  /** Cuánto más cara es la tienda más cara frente a esta, en la misma unidad. */
  ahorro: number;
  /** Unidad en la que se comparó ("kg", "pieza"…). */
  unidad: string;
  /** Ahorro como porcentaje del precio más alto. */
  porcentaje: number;
}

/**
 * Productos que están en dos o más tiendas y cuestan distinto, con la tienda que lo tiene más barato.
 * Solo compara el mismo producto en la misma unidad; lo que no se puede comparar no aparece.
 */
export function baratasHoy(items: Item[], max = 6): OfertaBarata[] {
  const porIng = new Map<string, Item[]>();
  for (const it of items) {
    if (!it.ing || it.tipo !== 'ingrediente') continue;
    const l = porIng.get(it.ing);
    if (l) l.push(it);
    else porIng.set(it.ing, [it]);
  }
  const res: OfertaBarata[] = [];
  for (const lista of porIng.values()) {
    const una = ofertasPorTienda(lista, 'precio', 50);
    if (una.length < 2) continue;
    const comp = comparar(una, { precio: true });
    if (!comp.barata || comp.ahorro == null || !comp.unidadPrecio) continue;
    const base = comp.unidadPrecio;
    const valores = una.map((i) => precioBase(i.p.precio, i.p.unidad)).filter((p): p is PrecioBase => !!p && p.base === base);
    const caro = Math.max(...valores.map((v) => v.valor));
    res.push({
      mejor: comp.barata,
      tiendas: una.length,
      otras: una.filter((i) => i.n.id !== comp.barata?.n.id),
      ahorro: comp.ahorro,
      unidad: base,
      porcentaje: caro > 0 ? Math.round((comp.ahorro / caro) * 100) : 0,
    });
  }
  return res.sort((a, b) => b.porcentaje - a.porcentaje || b.ahorro - a.ahorro).slice(0, max);
}
