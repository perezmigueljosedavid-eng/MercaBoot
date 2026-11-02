import { useMemo } from 'react';
import type { Negocio, Producto } from '../data/tipos';
import { useStore } from '../store';
import { coincideBusqueda } from './texto';

export interface NegocioConDatos {
  n: Negocio;
  /** Productos que hay ahora. */
  disponibles: number;
  /** Productos publicados (hay o no hay). */
  total: number;
}

/** Negocios con sus existencias: primero los que ya usan Mercaboot, luego por nombre. */
export function useNegociosOrdenados(): NegocioConDatos[] {
  const { s } = useStore();
  return useMemo(() => {
    const lista: NegocioConDatos[] = s.negocios.map((n) => {
      const propios = s.productos.filter((p) => p.negocioId === n.id);
      return { n, disponibles: propios.filter((p) => p.disponible).length, total: propios.length };
    });
    return lista.sort((a, b) => {
      if (!!a.n.duenoId !== !!b.n.duenoId) return a.n.duenoId ? -1 : 1;
      return a.n.nombre.localeCompare(b.n.nombre, 'es');
    });
  }, [s.negocios, s.productos]);
}

export interface ProductoEncontrado {
  p: Producto;
  n: Negocio;
}

/** Busca productos por nombre ("poll" encuentra "Pechuga de pollo"); los que hay ahora van primero. */
export function buscarProductos(q: string, productos: Producto[], negocios: Negocio[]): ProductoEncontrado[] {
  const porId = new Map(negocios.map((n) => [n.id, n]));
  const res: ProductoEncontrado[] = [];
  for (const p of productos) {
    const n = porId.get(p.negocioId);
    if (n && coincideBusqueda(p.nombre, q)) res.push({ p, n });
  }
  return res.sort((a, b) => {
    if (a.p.disponible !== b.p.disponible) return a.p.disponible ? -1 : 1;
    return a.p.nombre.localeCompare(b.p.nombre, 'es');
  });
}

/** Negocios cuyo nombre, giro, descripción o dirección contienen lo que se buscó. */
export function buscarNegocios(q: string, lista: NegocioConDatos[]): NegocioConDatos[] {
  return lista.filter(({ n }) => coincideBusqueda([n.nombre, n.giro, n.descripcion ?? '', n.direccion ?? ''].join(' '), q));
}

/* ───────── cómo ve el cliente las tiendas ───────── */

export type VistaTiendas = 'todas' | 'domicilio' | 'abiertas';

export const VISTAS_TIENDAS: { id: VistaTiendas; label: string; nota: string }[] = [
  { id: 'todas', label: 'Todas', nota: 'Todos los negocios de la comunidad.' },
  { id: 'domicilio', label: 'A domicilio', nota: 'Las tiendas que llevan tu pedido a casa.' },
  { id: 'abiertas', label: 'Abiertas ahora', nota: 'Las que están atendiendo en este momento.' },
];

/** Filtra las tiendas según lo que el cliente quiere ver (la lista ya viene ordenada). */
export function tiendasSegun(lista: NegocioConDatos[], vista: VistaTiendas): NegocioConDatos[] {
  switch (vista) {
    case 'domicilio':
      return lista.filter((d) => d.n.aDomicilio);
    case 'abiertas':
      return lista.filter((d) => !!d.n.duenoId && d.n.abierto);
    default:
      return lista;
  }
}
