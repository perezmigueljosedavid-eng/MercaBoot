import { useMemo } from 'react';
import type { Negocio, Producto, Resena } from '../data/tipos';
import { construirCatalogo, Catalogo } from '../ia/catalogo';
import { Insignia, insigniasTiendas, precioBase } from '../ia/comparar';
import { clasificar, ingredientesEnTexto } from '../ia/ingredientes';
import { Reputacion, reputaciones, SIN_RESENAS } from '../ia/reputacion';
import { palabraCoincide, tokens } from '../ia/texto';
import { avisosVigentes, useStore } from '../store';
import { distanciaA } from './distancia';
import { coincideBusqueda } from './texto';
import { useUbicacion } from './ubicacion';

/** Todo lo que el asistente sabe: negocios, productos disponibles y avisos, con distancias desde la persona. */
export function useCatalogo(): Catalogo {
  const { s } = useStore();
  const { coords } = useUbicacion();
  return useMemo(
    () => construirCatalogo(s.productos, s.negocios, coords, avisosVigentes(s.avisos), s.resenas),
    [s.productos, s.negocios, s.avisos, s.resenas, coords],
  );
}

export interface NegocioConDatos {
  n: Negocio;
  /** Metros desde la persona, o null si no se conoce. */
  dist: number | null;
  disponibles: number;
  total: number;
  rating: number | null;
  resenas: number;
  /** Reputación prudente: sirve para ordenar por estrellas sin que una sola reseña decida. */
  rep: Reputacion;
}

/** Negocios con su distancia, existencias y calificación; los más cercanos primero. */
export function useNegociosOrdenados(): NegocioConDatos[] {
  const { s } = useStore();
  const { coords } = useUbicacion();
  return useMemo(() => {
    const reps = reputaciones(s.resenas);
    const lista: NegocioConDatos[] = s.negocios.map((n) => {
      const propios = s.productos.filter((p) => p.negocioId === n.id);
      const rep = reps.get(n.id) ?? SIN_RESENAS;
      return {
        n,
        dist: distanciaA(n, coords),
        disponibles: propios.filter((p) => p.disponible).length,
        total: propios.length,
        rating: rep.promedio,
        resenas: rep.total,
        rep,
      };
    });
    return lista.sort((a, b) => {
      if (a.dist != null && b.dist != null) return a.dist - b.dist;
      if (a.dist != null) return -1;
      if (b.dist != null) return 1;
      if (!!a.n.duenoId !== !!b.n.duenoId) return a.n.duenoId ? -1 : 1;
      return porNombre(a, b);
    });
  }, [s.negocios, s.productos, s.resenas, coords]);
}

export interface ProductoEncontrado {
  p: Producto;
  n: Negocio;
  dist: number | null;
  /** Reputación de la tienda que lo vende. */
  rep: Reputacion;
}

/** Busca productos por nombre o por ingrediente ("pollo" encuentra "Pechuga de pollo"). */
export function buscarProductos(
  q: string,
  productos: Producto[],
  negocios: Negocio[],
  origen: { lat: number; lng: number } | null,
  resenas: Pick<Resena, 'negocioId' | 'estrellas'>[] = [],
): ProductoEncontrado[] {
  const consulta = tokens(q).filter((w) => w.length >= 3);
  if (!tokens(q).length) return [];
  const ids = ingredientesEnTexto(q);
  const porId = new Map(negocios.map((n) => [n.id, n]));
  const reps = reputaciones(resenas);
  const res: { r: ProductoEncontrado; pts: number }[] = [];
  for (const p of productos) {
    const n = porId.get(p.negocioId);
    if (!n) continue;
    const palabras = tokens(p.nombre);
    let pts = 0;
    // «poll ent» encuentra «Pollo entero» (lo que se escribe a medias)…
    if (coincideBusqueda(p.nombre, q)) pts += 3;
    // …y «pollo» también encuentra «Pechuga de pollo» aunque haya un error de dedo o venga en plural.
    for (const w of consulta) if (palabras.some((x) => palabraCoincide(w, x, x.length >= 6) > 0)) pts += 2;
    const ing = clasificar(p.nombre).ingrediente ?? p.ingrediente;
    if (ing && ids.includes(ing)) pts += 2;
    if (pts) res.push({ r: { p, n, dist: distanciaA(n, origen), rep: reps.get(n.id) ?? SIN_RESENAS }, pts });
  }
  return res
    .sort((a, b) => {
      if (a.r.p.disponible !== b.r.p.disponible) return a.r.p.disponible ? -1 : 1;
      if (a.pts !== b.pts) return b.pts - a.pts;
      if (a.r.dist != null && b.r.dist != null) return a.r.dist - b.r.dist;
      return a.r.dist != null ? -1 : b.r.dist != null ? 1 : 0;
    })
    .map((x) => x.r);
}

/** Negocios cuyo nombre, giro, descripción o dirección contienen lo que se buscó. */
export function buscarNegocios(q: string, lista: NegocioConDatos[]): NegocioConDatos[] {
  const consulta = tokens(q).filter((w) => w.length >= 3);
  if (!tokens(q).length) return [];
  return lista.filter(({ n }) => {
    const texto = [n.nombre, n.giro, n.descripcion ?? '', n.direccion ?? ''].join(' ');
    if (coincideBusqueda(texto, q)) return true;
    if (!consulta.length) return false;
    const palabras = tokens(texto);
    return consulta.every((w) => palabras.some((x) => palabraCoincide(w, x, x.length >= 6) > 0));
  });
}

/* ───────── cómo ve el cliente las tiendas y los productos ───────── */

export type VistaTiendas = 'cerca' | 'estrellas' | 'todas' | 'domicilio' | 'abiertas';

export const VISTAS_TIENDAS: { id: VistaTiendas; label: string; nota: string }[] = [
  { id: 'cerca', label: 'Cerca de ti', nota: 'De la más cercana a la más lejana. Activa tu ubicación para ver la distancia.' },
  { id: 'estrellas', label: 'Mejor calificadas', nota: 'Por estrellas de los clientes. Las tiendas nuevas, sin reseñas, también aparecen para que las conozcas.' },
  { id: 'todas', label: 'Todas', nota: 'Todos los negocios de la comunidad, en orden alfabético.' },
  { id: 'domicilio', label: 'A domicilio', nota: 'Las tiendas que llevan tu pedido a casa.' },
  { id: 'abiertas', label: 'Abiertas ahora', nota: 'Las que están atendiendo en este momento.' },
];

const porNombre = (a: NegocioConDatos, b: NegocioConDatos) => a.n.nombre.localeCompare(b.n.nombre, 'es');

/** De la más cercana a la más lejana; las que no tienen distancia van al final, por nombre. */
const porCercania = (a: NegocioConDatos, b: NegocioConDatos) => {
  if (a.dist != null && b.dist != null) return a.dist - b.dist;
  if (a.dist != null) return -1;
  if (b.dist != null) return 1;
  return porNombre(a, b);
};

/**
 * Filtra y ordena las tiendas según lo que el cliente quiere ver.
 * Estrellas usa el promedio prudente: una sola reseña de 5 no le gana a una tienda con muchas reseñas buenas.
 */
export function tiendasSegun(lista: NegocioConDatos[], vista: VistaTiendas): NegocioConDatos[] {
  switch (vista) {
    case 'estrellas':
      return [...lista].sort((a, b) => b.rep.bayes - a.rep.bayes || porCercania(a, b));
    case 'todas':
      return [...lista].sort(porNombre);
    case 'domicilio':
      return lista.filter((d) => d.n.aDomicilio).sort(porCercania);
    case 'abiertas':
      return lista.filter((d) => !!d.n.duenoId && d.n.abierto).sort(porCercania);
    default:
      return [...lista].sort(porCercania);
  }
}

/** En qué destaca cada tienda frente a las otras de la lista (solo cuando hay con qué comparar). */
export function insigniasDeTiendas(lista: NegocioConDatos[]): Map<string, Insignia[]> {
  return insigniasTiendas(lista.map((d) => ({ id: d.n.id, dist: d.dist, rep: d.rep })));
}

export type OrdenProductos = 'cerca' | 'precio' | 'estrellas';

/** Ordena los productos encontrados. El precio solo se compara entre unidades equivalentes (kilo con medio kilo…). */
export function ordenarEncontrados(lista: ProductoEncontrado[], orden: OrdenProductos): ProductoEncontrado[] {
  const cercania = (a: ProductoEncontrado, b: ProductoEncontrado) => {
    if (a.dist != null && b.dist != null) return a.dist - b.dist;
    return a.dist != null ? -1 : b.dist != null ? 1 : 0;
  };
  if (orden === 'cerca') return [...lista].sort(cercania);
  if (orden === 'estrellas') return [...lista].sort((a, b) => b.rep.bayes - a.rep.bayes || cercania(a, b));
  // precio: se compara dentro de la unidad base que más productos comparten; lo demás va después, sin esconderse
  const cuenta = new Map<string, number>();
  for (const r of lista) {
    const pb = precioBase(r.p.precio, r.p.unidad);
    if (pb) cuenta.set(pb.base, (cuenta.get(pb.base) ?? 0) + 1);
  }
  let base: string | null = null;
  let max = 0;
  for (const [b, c] of cuenta) if (c > max) [base, max] = [b, c];
  return [...lista].sort((a, b) => {
    const pa = precioBase(a.p.precio, a.p.unidad);
    const pb = precioBase(b.p.precio, b.p.unidad);
    const ca = !!pa && pa.base === base;
    const cb = !!pb && pb.base === base;
    if (ca && cb) return (pa?.valor ?? 0) - (pb?.valor ?? 0) || cercania(a, b);
    if (ca !== cb) return ca ? -1 : 1;
    return cercania(a, b);
  });
}
