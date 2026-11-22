import { CATEGORIAS_PRODUCTO, nombreCategoria } from '../data/contenido';
import type { CategoriaProducto, Producto } from '../data/tipos';
import { coincideBusqueda, norm } from './texto';

/**
 * Buscar y filtrar la lista de productos de una tienda (la de un cliente mirando el negocio o la del comerciante).
 * Con 300 o 1,500 productos nadie los recorre uno por uno: se busca por nombre, se elige una categoría y se pide «ver más».
 * Sin react-native: se puede probar con node.
 * Autor: José David Pérez Miguel
 */

/** Cuántos productos se dibujan de una vez; el resto sale con «Ver más». */
export const POR_PAGINA = 40;
/** Desde cuántos productos se muestran el buscador y las categorías (con pocos productos estorban). */
export const DESDE_CUANTOS = 12;

/** ¿El producto coincide con lo que se escribió? Busca en el nombre (aunque sea a la mitad) y en su categoría. */
export function coincideProducto(p: Pick<Producto, 'nombre' | 'categoria'>, busqueda: string): boolean {
  const q = busqueda.trim();
  if (!q) return true;
  return norm(p.nombre).includes(norm(q)) || coincideBusqueda(p.nombre, q) || coincideBusqueda(nombreCategoria(p.categoria), q);
}

/** Orden alfabético en español (sin fijarse en acentos ni mayúsculas). */
export const porNombre = (a: Pick<Producto, 'nombre'>, b: Pick<Producto, 'nombre'>) => a.nombre.localeCompare(b.nombre, 'es', { sensitivity: 'base' });

export function filtrarProductos(lista: Producto[], busqueda: string, categoria: CategoriaProducto | null): Producto[] {
  return lista.filter((p) => (!categoria || p.categoria === categoria) && coincideProducto(p, busqueda)).sort(porNombre);
}

/** Las categorías que hay en la lista, de la que tiene más productos a la que tiene menos. */
export function categoriasDe(lista: Pick<Producto, 'categoria'>[]): { id: CategoriaProducto; nombre: string; n: number }[] {
  const cuenta = new Map<CategoriaProducto, number>();
  for (const p of lista) cuenta.set(p.categoria, (cuenta.get(p.categoria) ?? 0) + 1);
  return CATEGORIAS_PRODUCTO.filter((c) => cuenta.has(c.id))
    .map((c) => ({ id: c.id, nombre: c.nombre, n: cuenta.get(c.id) ?? 0 }))
    .sort((a, b) => b.n - a.n || a.nombre.localeCompare(b.nombre, 'es'));
}
