import { textoEtiquetas } from '../data/contenido';
import type { Negocio, Sabor } from '../data/tipos';
import { etiquetaDistancia } from '../lib/distancia';
import { Catalogo, conIngredientes, Item, mejorPrimero, unoPorNegocio } from './catalogo';
import { comparar, Insignia, ofertasPorTienda } from './comparar';
import { INGREDIENTES } from './ingredientes';
import type { IngReceta, Momento, Receta } from './recetas';
import type { Reputacion } from './reputacion';
import { norm, palabraCoincide } from './texto';
import type { DondeVista, EstadoIng, RecetaVista, TiendaReceta } from './vista';

/* ───────── vistas de productos ───────── */

export function vistaDonde(it: Item, insignias?: Insignia[]): DondeVista {
  return {
    negocioId: it.n.id,
    negocio: it.n.nombre,
    dist: etiquetaDistancia(it.dist),
    direccion: it.n.direccion,
    abierto: it.n.abierto,
    producto: it.p.nombre,
    productoId: it.p.id,
    precio: it.p.precio,
    unidad: it.p.unidad,
    estrellas: it.rep.promedio,
    resenas: it.rep.total,
    aDomicilio: it.n.aDomicilio,
    porEncargo: it.p.porEncargo,
    nota: it.tipo === 'preparado' ? textoEtiquetas(it.etiquetas, 3) || undefined : undefined,
    insignias: insignias?.length ? insignias : undefined,
  };
}

/** Vistas de una lista de ofertas (una por tienda) con las insignias de comparación. */
export function vistasConInsignias(items: Item[], precio: boolean): DondeVista[] {
  const comp = comparar(items, { precio });
  return items.map((it) => vistaDonde(it, comp.insignias.get(it.p.id)));
}

/** Busca por nombre cuando el diccionario no conoce el producto (lo que el comerciante escribió tal cual). */
export function buscarPorNombre(cat: Catalogo, palabras: string[], soloNegocios?: Set<string>, tipo?: Item['tipo']): Item[] {
  const q = palabras.filter((w) => w.length >= 3);
  if (!q.length) return [];
  const res: { it: Item; pts: number }[] = [];
  for (const it of cat.items) {
    if (soloNegocios && !soloNegocios.has(it.n.id)) continue;
    if (tipo && it.tipo !== tipo) continue;
    let pts = 0;
    for (const w of q) if (it.palabras.some((x) => palabraCoincide(w, x, x.length >= 6) > 0)) pts++;
    if (pts) res.push({ it, pts });
  }
  if (!res.length) return [];
  res.sort((a, b) => b.pts - a.pts || mejorPrimero(a.it, b.it));
  const max = res[0].pts;
  return res.filter((r) => r.pts === max).map((r) => r.it);
}

/* ───────── evaluar una receta contra lo que hay ───────── */

interface Parte {
  ing: IngReceta;
  estado: EstadoIng;
  items: Item[];
}

/** Una tienda y cuántos ingredientes principales de la receta puede surtir. */
export interface Cobertura {
  n: Negocio;
  cubre: number;
  dist: number | null;
  rep: Reputacion;
}

export interface Evaluada {
  r: Receta;
  partes: Parte[];
  principales: number;
  cubiertos: number;
  faltan: IngReceta[];
  opcionalesHay: number;
  completa: boolean;
  /** La tienda que más conviene para esta receta. */
  mejor?: Cobertura & { de: number; motivos: string[] };
  /** Las demás tiendas que surten algo, para mostrarlas también. */
  otras: Cobertura[];
}

function estadoDe(ing: IngReceta, cat: Catalogo, tengo: Set<string>): { estado: EstadoIng; items: Item[] } {
  if (ing.ids.some((id) => tengo.has(id))) return { estado: 'tienes', items: [] };
  if (ing.ids.every((id) => INGREDIENTES[id]?.casa)) return { estado: 'casa', items: [] };
  const items = conIngredientes(
    cat,
    ing.ids.filter((id) => !INGREDIENTES[id]?.casa),
  );
  if (items.length) return { estado: 'hay', items };
  if (ing.ids.some((id) => INGREDIENTES[id]?.casa)) return { estado: 'casa', items: [] };
  return { estado: 'falta', items: [] };
}

/**
 * Qué tienda conviene más para una receta. Primero cuenta cuántos ingredientes principales surte cada una;
 * a igual cobertura pesan sus estrellas (con promedio prudente), qué tan cerca está y si está abierta.
 * Las demás tiendas que surten algo siempre se devuelven aparte para que se muestren también.
 */
function mejorTienda(partes: Parte[]): Pick<Evaluada, 'mejor' | 'otras'> {
  const cuenta = new Map<string, Cobertura>();
  let de = 0;
  for (const x of partes) {
    if (!x.ing.principal || x.estado !== 'hay') continue;
    de++;
    const vistos = new Set<string>();
    for (const it of x.items) {
      if (vistos.has(it.n.id)) continue;
      vistos.add(it.n.id);
      const c = cuenta.get(it.n.id) ?? { n: it.n, cubre: 0, dist: it.dist, rep: it.rep };
      c.cubre++;
      cuenta.set(it.n.id, c);
    }
  }
  if (!cuenta.size) return { otras: [] };
  const valor = (c: Cobertura) =>
    (c.rep.bayes - 4) * 12 - (c.dist != null ? Math.min(15, (c.dist / 1000) * 5) : 0) + (c.n.abierto ? 5 : 0);
  const lista = [...cuenta.values()].sort((a, b) => {
    if (b.cubre !== a.cubre) return b.cubre - a.cubre;
    const dv = valor(b) - valor(a);
    if (Math.abs(dv) > 0.01) return dv;
    if (a.dist != null && b.dist != null) return a.dist - b.dist;
    return a.dist != null ? -1 : b.dist != null ? 1 : 0;
  });
  const m = lista[0];
  const hayMejor = de >= 2 && m.cubre >= 2;
  const resto = lista.filter((c) => !hayMejor || c !== m);
  if (!hayMejor) return { otras: resto };

  const motivos = [`Tiene ${m.cubre} de ${de} ingredientes principales`];
  if (m.rep.promedio != null) motivos.push(`★ ${m.rep.promedio.toFixed(1)} (${m.rep.total} ${m.rep.total === 1 ? 'reseña' : 'reseñas'})`);
  const d = etiquetaDistancia(m.dist);
  if (d) motivos.push(d);
  if (m.n.aDomicilio) motivos.push('Entrega a domicilio');
  return { mejor: { ...m, de, motivos }, otras: resto };
}

export function evaluar(r: Receta, cat: Catalogo, tengo: Set<string>): Evaluada {
  const partes: Parte[] = r.ing.map((ing) => ({ ing, ...estadoDe(ing, cat, tengo) }));
  const principales = partes.filter((p) => p.ing.principal);
  const faltan = principales.filter((p) => p.estado === 'falta').map((p) => p.ing);
  return {
    r,
    partes,
    principales: principales.length,
    cubiertos: principales.length - faltan.length,
    faltan,
    opcionalesHay: partes.filter((p) => !p.ing.principal && p.estado === 'hay').length,
    completa: faltan.length === 0,
    ...mejorTienda(partes),
  };
}

const tiendaVista = (c: Cobertura, de: number): TiendaReceta => ({
  negocioId: c.n.id,
  nombre: c.n.nombre,
  dist: etiquetaDistancia(c.dist),
  cubre: c.cubre,
  de,
  abierto: c.n.abierto,
  estrellas: c.rep.promedio,
  resenas: c.rep.total,
  aDomicilio: c.n.aDomicilio,
});

/** Cuántas tiendas se muestran por ingrediente antes de decir "y N más". */
const POR_INGREDIENTE = 3;

const NOMBRE_MOMENTO: Record<Momento, string> = {
  desayuno: 'Desayuno',
  comida: 'Comida',
  cena: 'Cena',
  botana: 'Botana',
  postre: 'Postre',
  bebida: 'Bebida',
};

/** Características de una receta en palabras simples: qué lleva y para cuándo sirve. */
export function caracDe(r: Receta): string[] {
  const res: string[] = [];
  const soloPostre = r.mom.every((m) => m === 'postre' || m === 'bebida');
  if (!soloPostre) {
    if (r.vegetariana && r.verduras >= 0.6) res.push('Puras verduras');
    else if (r.vegetariana) res.push('Sin carne');
    else res.push('Con carne');
    if (r.proteina) res.push('Con proteína');
  }
  res.push(...r.mom.slice(0, 2).map((m) => NOMBRE_MOMENTO[m]));
  return res;
}

export function vistaReceta(ev: Evaluada): RecetaVista {
  const mejorId = ev.mejor?.n.id;
  const de = ev.mejor?.de ?? ev.partes.filter((p) => p.ing.principal && p.estado === 'hay').length;
  return {
    id: ev.r.id,
    nombre: ev.r.nombre,
    min: ev.r.min,
    por: ev.r.por,
    sabores: ev.r.sab,
    etiquetas: ev.r.tags,
    carac: caracDe(ev.r),
    ing: ev.partes.map(({ ing, estado, items }) => {
      let ofertas = ofertasPorTienda(items, 'cerca', 12);
      if (mejorId) ofertas = [...ofertas.filter((i) => i.n.id === mejorId), ...ofertas.filter((i) => i.n.id !== mejorId)];
      // El precio solo se compara cuando todas las ofertas son del mismo producto base
      const mismoIng = new Set(ofertas.map((o) => o.ing)).size === 1;
      const comp = comparar(ofertas, { precio: mismoIng });
      const visibles = ofertas.slice(0, POR_INGREDIENTE);
      return {
        txt: ing.txt,
        estado,
        opcional: ing.opcional || !ing.principal,
        donde: visibles.map((it) => vistaDonde(it, comp.insignias.get(it.p.id))),
        masTiendas: ofertas.length > visibles.length ? ofertas.length - visibles.length : undefined,
      };
    }),
    pasos: ev.r.pasos,
    tip: ev.r.tip,
    completa: ev.completa,
    faltan: ev.faltan.map((i) => i.txt),
    mejorTienda: ev.mejor && { ...tiendaVista(ev.mejor, ev.mejor.de), motivos: ev.mejor.motivos },
    otrasTiendas: ev.otras.length ? ev.otras.slice(0, 4).map((c) => tiendaVista(c, de)) : undefined,
  };
}

/* ───────── elegir qué sugerir ───────── */

export interface Filtros {
  sabor?: Sabor;
  momento?: Momento;
  rapido?: boolean;
  economico?: boolean;
  vegetariano?: boolean;
  caliente?: boolean;
  dieta?: 'carne' | 'proteina';
  soloVerduras?: boolean;
  ligero?: boolean;
  platoFuerte?: boolean;
  oaxaca?: boolean;
  /** Quiere algo ya preparado, sin cocinar. */
  listo?: boolean;
  /** Etiqueta de recetas de la festividad pedida. */
  festividad?: string;
  /** Si hay recetas marcadas para esa festividad, solo se ofrecen esas. */
  festividadExacta?: boolean;
  grupos: string[][];
  excluir: string[];
  yaMostradas: string[];
  /** Si es true, las recetas ya mostradas no vuelven a salir. */
  sinRepetir: boolean;
  hora: number;
  semilla: number;
  /** Con `true` se aceptan platillos un poco menos "de verduras" para no quedarse sin opciones. */
  relajado?: boolean;
}

export function momentoDeLaHora(hora: number): Momento {
  if (hora >= 5 && hora < 11) return 'desayuno';
  if (hora >= 11 && hora < 18) return 'comida';
  return 'cena';
}

const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Puntaje de una receta para lo que pidió la persona, o null si no cumple lo que pidió. */
export function puntuar(ev: Evaluada, f: Filtros): number | null {
  const r = ev.r;
  if (f.sabor && !r.sab.includes(f.sabor)) return null;
  if (f.vegetariano && !r.vegetariana) return null;
  if (f.momento && !r.mom.includes(f.momento)) return null;
  if (f.dieta === 'carne' && !r.conCarne) return null;
  if (f.dieta === 'proteina' && !r.proteina) return null;
  if (f.soloVerduras && r.verduras < (f.relajado ? 0.5 : 0.6)) return null;
  if (f.festividad && f.festividadExacta && !r.tags.includes(f.festividad)) return null;
  if (f.excluir.length && r.ing.some((i) => !i.opcional && i.ids.some((id) => f.excluir.includes(id)))) return null;
  if (f.sinRepetir && f.yaMostradas.includes(r.id)) return null;

  let pts = 0;
  if (f.grupos.length) {
    const coincide = f.grupos.filter((g) => r.ing.some((i) => i.ids.some((id) => g.includes(id)))).length;
    if (!coincide) return null;
    pts += coincide * 30;
  }
  pts += 100 * (ev.cubiertos / Math.max(1, ev.principales));
  if (ev.completa) pts += 40;
  pts += Math.min(4, ev.opcionalesHay) * 3;
  if (ev.mejor && ev.mejor.cubre >= ev.mejor.de) pts += 10;
  if (ev.mejor?.dist != null) pts -= Math.min(10, (ev.mejor.dist / 1000) * 2);

  const momentoEfectivo = f.momento ?? momentoDeLaHora(f.hora);
  const pideSalado = f.dieta || f.platoFuerte || f.soloVerduras;
  if (!f.sabor && (momentoEfectivo === 'comida' || momentoEfectivo === 'cena') && !r.sab.includes('salado')) pts -= 25;
  if (!f.momento) {
    if (r.mom.includes(momentoDeLaHora(f.hora))) pts += 8;
    if (!f.sabor && r.mom.length === 1 && r.mom[0] === 'bebida') pts -= 12;
    // Si pidió carne, proteína o verduras sin decir cuándo, un postre o una bebida no es lo que busca
    if (pideSalado && !r.mom.some((m) => m === 'comida' || m === 'cena' || m === 'desayuno')) pts -= 30;
  }
  if (f.rapido) pts += r.tags.includes('rapido') ? 12 : -8;
  if (f.economico) pts += r.tags.includes('economico') ? 14 : -6;
  if (f.caliente) pts += r.tags.includes('caliente') ? 10 : 0;
  if (f.ligero) pts += r.verduras >= 0.4 ? 18 : r.conCarne && r.min > 45 ? -10 : -4;
  if (f.platoFuerte) {
    pts += r.proteina ? 15 : -10;
    if (!r.sab.includes('salado')) pts -= 30;
    if (r.mom.length === 1 && r.mom[0] === 'botana') pts -= 20;
  }
  if (f.oaxaca) pts += r.tags.includes('oaxaca') || r.tags.includes('tradicional') ? 18 : -5;
  if (f.festividad) pts += r.tags.includes(f.festividad) ? 40 : 0;
  if (f.yaMostradas.includes(r.id)) pts -= 30;
  pts += (hash(r.id) + f.semilla) % 5;
  return pts;
}

/** ¿Pidió algo concreto (más que "dame ideas")? Si nada alcanza, vale la pena mostrar lo más cercano. */
export function pidioAlgoConcreto(f: Filtros): boolean {
  return !!(f.grupos.length || f.sabor || f.momento || f.dieta || f.soloVerduras || f.platoFuerte || f.oaxaca || f.festividad || f.vegetariano);
}

/**
 * Recetas ordenadas de la mejor a la peor para estos filtros. Solo las que se pueden hacer o casi.
 * Con `relajado` también entran las que se quedan más lejos (para cuando no hay nada mejor y la persona pidió algo concreto).
 */
export function recomendar(cat: Catalogo, f: Filtros, tengo: Set<string>, recetas: Receta[], relajado = false): Evaluada[] {
  const res: { ev: Evaluada; pts: number }[] = [];
  const cobertura = relajado ? 0.34 : 0.6;
  const maxFaltan = relajado ? 4 : 2;
  const filtros = relajado ? { ...f, relajado: true } : f;
  for (const r of recetas) {
    const ev = evaluar(r, cat, tengo);
    const minimo = ev.principales === 0 ? 0 : ev.cubiertos / ev.principales;
    if (!ev.completa && (minimo < cobertura || ev.faltan.length > maxFaltan)) continue;
    const pts = puntuar(ev, filtros);
    if (pts != null) res.push({ ev, pts });
  }
  return res.sort((a, b) => b.pts - a.pts).map((x) => x.ev);
}

/* ───────── platillos, postres y bebidas ya preparados ───────── */

/** Palabras con las que se reconoce, en el nombre de un platillo, algo típico de cada fecha. */
const PALABRAS_FIESTA: Record<string, RegExp> = {
  muertos: /\b(pan de muerto|chocolate|mole|tamal(?:es)?|atole|calabaza|ofrenda|dulce de)\b/,
  navidad: /\b(ponche|tamal(?:es)?|bacalao|pavo|romeritos|bunuelos?|pierna|lomo)\b/,
  independencia: /\b(pozole|tostadas?|esquites?|elotes?|chile en nogada|chiles en nogada|flautas|tacos)\b/,
  amor: /\b(fresas|pastel|chocolate|postre|gelatina|flan|cena|crepas?)\b/,
  madre: /\b(mole|pastel|flan|postre|comida corrida|enchiladas)\b/,
  padre: /\b(tasajo|cecina|carne asada|barbacoa|birria|costillas|tlayuda|tacos)\b/,
  reyes: /\b(rosca|chocolate|tamal(?:es)?)\b/,
  guadalupe: /\b(bunuelos?|atole|tamal(?:es)?|pozole|antojitos?)\b/,
  candelaria: /\b(tamal(?:es)?|atole)\b/,
  'semana-santa': /\b(pescado|camaron(?:es)?|mariscos?|ceviche|capirotada|torrejas?|tostadas? de atun)\b/,
  fiesta: /\b(pastel|pozole|mole|barbacoa|birria|tamal(?:es)?|charola|gelatina)\b/,
  nino: /\b(helados?|nieves?|paletas?|gelatina|pastel|hot cakes|hotcakes|licuado)\b/,
  oaxaca: /\b(tlayudas?|memelas?|tejate|tamal(?:es)?|mole|quesillo|tasajo|cecina|chocolate de agua|nieves?)\b/,
};

/** Reparte por turnos: primero lo mejor de cada tienda, luego lo siguiente, así ninguna tienda queda fuera. */
function repartirPorTienda(ordenados: Item[], max: number): Item[] {
  const porTienda = new Map<string, Item[]>();
  for (const it of ordenados) {
    const l = porTienda.get(it.n.id);
    if (l) l.push(it);
    else porTienda.set(it.n.id, [it]);
  }
  const res: Item[] = [];
  for (let ronda = 0; res.length < max; ronda++) {
    let alguno = false;
    for (const lista of porTienda.values()) {
      if (lista[ronda]) {
        res.push(lista[ronda]);
        alguno = true;
        if (res.length >= max) break;
      }
    }
    if (!alguno) break;
  }
  return res;
}

/**
 * Platillos, postres y bebidas que las tiendas ya tienen listos y que encajan con lo que se pidió.
 * Con `economico` van del más barato al más caro; si no, del más cercano al más lejano.
 */
export function itemsListos(cat: Catalogo, f: Filtros, max = 5): Item[] {
  if (f.grupos.length || f.soloVerduras || f.ligero) return [];
  // Sin ningún criterio ("dame ideas") no se llena la respuesta de platillos al azar
  const exige = !!(f.listo || f.sabor || f.momento || f.dieta || f.vegetariano || f.caliente || f.festividad || f.oaxaca || f.platoFuerte || f.economico);
  if (!exige) return [];
  const fiesta = f.festividad ? PALABRAS_FIESTA[f.festividad] : undefined;
  const lista = cat.items.filter((i) => {
    if (i.tipo !== 'preparado' || i.evitar) return false;
    if (f.sabor && !i.etiquetas.includes(f.sabor)) return false;
    if (f.momento && !i.etiquetas.includes(f.momento)) return false;
    if (f.dieta === 'carne' && !i.etiquetas.includes('carne')) return false;
    if (f.dieta === 'proteina' && !i.etiquetas.includes('proteina')) return false;
    if (f.vegetariano && !i.etiquetas.includes('sinCarne')) return false;
    if (f.caliente && !i.etiquetas.includes('caliente')) return false;
    if (f.platoFuerte && !(i.etiquetas.includes('comida') && !i.etiquetas.includes('postre') && !i.etiquetas.includes('bebida'))) return false;
    if (fiesta && !fiesta.test(norm(i.p.nombre))) return false;
    if (f.oaxaca && !PALABRAS_FIESTA.oaxaca.test(norm(i.p.nombre))) return false;
    return true;
  });
  if (!lista.length) return [];
  const precio = (i: Item) => i.p.precio ?? Infinity;
  const ordenados = f.economico ? [...lista].sort((a, b) => precio(a) - precio(b) || mejorPrimero(a, b)) : [...lista].sort(mejorPrimero);
  // Primero lo mejor de cada tienda, para que ninguna se quede sin aparecer; si busca barato, se muestran del más barato al más caro
  const elegidos = repartirPorTienda(ordenados, max);
  return f.economico ? elegidos.sort((a, b) => precio(a) - precio(b) || mejorPrimero(a, b)) : elegidos;
}

export { unoPorNegocio };
