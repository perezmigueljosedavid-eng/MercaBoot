import { useMemo } from 'react';
import type { Coord, Negocio, Producto } from '../data/tipos';
import { useStore } from '../store';
import { distanciaA } from './distancia';
import { coincideBusqueda } from './texto';
import { useUbicacion } from './ubicacion';

export interface NegocioConDatos {
  n: Negocio;
  /** Metros desde la persona, o null si no se conoce (falta su ubicación o la del negocio). */
  dist: number | null;
  /** Productos que hay ahora. */
  disponibles: number;
  /** Productos publicados (hay o no hay). */
  total: number;
}

const porNombre = (a: NegocioConDatos, b: NegocioConDatos) => a.n.nombre.localeCompare(b.n.nombre, 'es');

/** De la más cercana a la más lejana; las que no tienen distancia van al final, por nombre. */
const porCercania = (a: NegocioConDatos, b: NegocioConDatos) => {
  if (a.dist != null && b.dist != null) return a.dist - b.dist;
  if (a.dist != null) return -1;
  if (b.dist != null) return 1;
  return porNombre(a, b);
};

/** Negocios con su distancia y sus existencias: los más cercanos primero; sin ubicación, primero los que ya usan Mercaboot. */
export function useNegociosOrdenados(): NegocioConDatos[] {
  const { s } = useStore();
  const { coords } = useUbicacion();
  return useMemo(() => {
    const lista: NegocioConDatos[] = s.negocios.map((n) => {
      const propios = s.productos.filter((p) => p.negocioId === n.id);
      return { n, dist: distanciaA(n, coords), disponibles: propios.filter((p) => p.disponible).length, total: propios.length };
    });
    return lista.sort((a, b) => {
      if (a.dist != null || b.dist != null) return porCercania(a, b);
      if (!!a.n.duenoId !== !!b.n.duenoId) return a.n.duenoId ? -1 : 1;
      return porNombre(a, b);
    });
  }, [s.negocios, s.productos, coords]);
}

export interface ProductoEncontrado {
  p: Producto;
  n: Negocio;
  /** Metros desde la persona hasta la tienda que lo vende (si se conocen). */
  dist: number | null;
}

/** Busca productos por nombre ("poll" encuentra "Pechuga de pollo"); los que hay ahora van primero y, entre ellos, los más cercanos. */
export function buscarProductos(q: string, productos: Producto[], negocios: Negocio[], origen: Coord | null = null): ProductoEncontrado[] {
  const porId = new Map(negocios.map((n) => [n.id, n]));
  const res: ProductoEncontrado[] = [];
  for (const p of productos) {
    const n = porId.get(p.negocioId);
    if (n && coincideBusqueda(p.nombre, q)) res.push({ p, n, dist: distanciaA(n, origen) });
  }
  return res.sort((a, b) => {
    if (a.p.disponible !== b.p.disponible) return a.p.disponible ? -1 : 1;
    if (a.dist != null && b.dist != null && a.dist !== b.dist) return a.dist - b.dist;
    if ((a.dist != null) !== (b.dist != null)) return a.dist != null ? -1 : 1;
    return a.p.nombre.localeCompare(b.p.nombre, 'es');
  });
}

/** Negocios cuyo nombre, giro, descripción o dirección contienen lo que se buscó. */
export function buscarNegocios(q: string, lista: NegocioConDatos[]): NegocioConDatos[] {
  return lista.filter(({ n }) => coincideBusqueda([n.nombre, n.giro, n.descripcion ?? '', n.direccion ?? ''].join(' '), q));
}

/* ───────── cómo ve el cliente las tiendas ───────── */

export type VistaTiendas = 'cerca' | 'todas' | 'domicilio' | 'abiertas';

export const VISTAS_TIENDAS: { id: VistaTiendas; label: string; nota: string }[] = [
  { id: 'cerca', label: 'Cerca de ti', nota: 'De la más cercana a la más lejana. Activa tu ubicación para ver la distancia.' },
  { id: 'todas', label: 'Todas', nota: 'Todos los negocios de la comunidad.' },
  { id: 'domicilio', label: 'A domicilio', nota: 'Las tiendas que llevan tu pedido a casa.' },
  { id: 'abiertas', label: 'Abiertas ahora', nota: 'Las que están atendiendo en este momento.' },
];

/** Filtra las tiendas según lo que el cliente quiere ver (la lista ya viene ordenada). */
export function tiendasSegun(lista: NegocioConDatos[], vista: VistaTiendas): NegocioConDatos[] {
  switch (vista) {
    case 'domicilio':
      return lista.filter((d) => d.n.aDomicilio).sort(porCercania);
    case 'abiertas':
      return lista.filter((d) => !!d.n.duenoId && d.n.abierto).sort(porCercania);
    case 'todas':
      return [...lista].sort(porNombre);
    default:
      return [...lista].sort(porCercania);
  }
}
