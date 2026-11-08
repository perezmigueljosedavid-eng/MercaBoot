import { festividad, proxima, textoFaltan } from '../data/festividades';
import type { Aviso, Negocio } from '../data/tipos';
import { distanciaA, etiquetaDistancia } from '../lib/distancia';
import { Catalogo, conIngredientes, Item, mejorPrimero } from './catalogo';
import { baratasHoy, comparar, Criterio, dinero, Insignia, insigniasTiendas, NOMBRE_CRITERIO, ofertasPorTienda, resumenComparacion } from './comparar';
import type { Entendido } from './entender';
import { buscarPorNombre, vistaDonde, vistasConInsignias } from './evaluar';
import { Ctx, lista, MENSAJE_SIN_PRODUCTOS, Parcial, pick, plural, resumenCatalogo } from './frases';
import { INGREDIENTES, nombreIngrediente } from './ingredientes';
import { SIN_RESENAS } from './reputacion';
import { palabraCoincide } from './texto';
import type { AvisoVista, Bloque, NegocioVista } from './vista';

/* ───────── tiendas ───────── */

export function vistaNegocio(n: Negocio, cat: Catalogo, insignias?: Insignia[]): NegocioVista {
  const rep = cat.rep.get(n.id) ?? SIN_RESENAS;
  return {
    negocioId: n.id,
    nombre: n.nombre,
    giro: n.giro,
    dist: etiquetaDistancia(distanciaA(n, cat.origen)),
    abierto: n.abierto,
    direccion: n.direccion,
    productos: cat.items.filter((i) => i.n.id === n.id).length,
    reclamado: !!n.duenoId,
    estrellas: rep.promedio,
    resenas: rep.total,
    aDomicilio: !!n.aDomicilio,
    insignias: insignias?.length ? insignias : undefined,
  };
}

/** Vistas de varias tiendas con las insignias que les tocan frente a las otras de la lista. */
export function vistasNegocios(ns: Negocio[], cat: Catalogo): NegocioVista[] {
  const ins = insigniasTiendas(ns.map((n) => ({ id: n.id, dist: distanciaA(n, cat.origen), rep: cat.rep.get(n.id) ?? SIN_RESENAS })));
  return ns.map((n) => vistaNegocio(n, cat, ins.get(n.id)));
}

const porDistancia = (cat: Catalogo) => (a: Negocio, b: Negocio) => {
  const da = distanciaA(a, cat.origen);
  const db = distanciaA(b, cat.origen);
  if (da != null && db != null) return da - db;
  if (da != null) return -1;
  if (db != null) return 1;
  return a.nombre.localeCompare(b.nombre);
};

/** Tiendas ordenadas por cercanía o por estrellas (con promedio prudente). Ninguna se descarta. */
export function ordenarTiendas(ns: Negocio[], cat: Catalogo, criterio: Criterio): Negocio[] {
  const rep = (n: Negocio) => cat.rep.get(n.id) ?? SIN_RESENAS;
  const cerca = porDistancia(cat);
  if (criterio === 'estrellas') return [...ns].sort((a, b) => rep(b).bayes - rep(a).bayes || cerca(a, b));
  return [...ns].sort(cerca);
}

const unicosLista = <A>(l: A[]) => [...new Set(l)];

/** Categorías en las que tiene sentido ofrecer otro producto parecido. */
const ALTERNATIVAS: Record<string, string> = {
  carne: 'carnes',
  ave: 'aves',
  pescado: 'pescados y mariscos',
  lacteo: 'lácteos y huevo',
  verdura: 'verduras',
  fruta: 'frutas',
  pan: 'pan',
  masa: 'tortillas y masa',
  dulce: 'dulces',
};

const SIN_PRODUCTOS: Parcial = {
  bloques: [{ t: 'texto', texto: MENSAJE_SIN_PRODUCTOS }],
  chips: ['¿Cómo se hacen unas tlayudas?', 'Receta de arroz con leche', '¿Qué tiendas hay?'],
};

/* ───────── ¿dónde hay…? ───────── */

interface Hallazgo {
  titulo?: string;
  items: Item[];
  /** Todas las ofertas son del mismo producto, así que sus precios se pueden comparar. */
  mismo: boolean;
}

/** Cuántas tiendas se muestran por producto (siempre en orden, nunca solo "la ganadora"). */
const MAX_TIENDAS = 8;

/** ¿El producto contiene todas las palabras que escribió la persona? */
const coincideTodo = (it: Item, palabras: string[]) =>
  palabras.length > 0 && palabras.every((w) => it.palabras.some((x) => palabraCoincide(w, x, x.length >= 6) > 0));

export function producto(e: Entendido, ctx: Ctx, criterioBase: Criterio = 'cerca'): Parcial {
  const { cat, mem } = ctx;
  if (!cat.items.length) return SIN_PRODUCTOS;

  const criterio: Criterio = e.ordenar ?? criterioBase;
  const soloNeg = e.negocios.length ? new Set(e.negocios.map((n) => n.id)) : undefined;
  const ids = [...new Set(e.grupos.flat())];

  // 1) lo que el diccionario reconoce como ingrediente
  const hallazgos: Hallazgo[] = [];
  for (const g of e.grupos.slice(0, 4)) {
    const items = conIngredientes(cat, g).filter((i) => !soloNeg || soloNeg.has(i.n.id));
    if (items.length) hallazgos.push({ titulo: g.length === 1 ? nombreIngrediente(g[0]) : e.dicho || 'lo que buscas', items, mismo: g.length === 1 });
  }

  // 2) platillos, postres y bebidas ya preparados, y todo lo que el diccionario no conoce, por su nombre
  let preparados: Item[] = [];
  if (hallazgos.length) {
    preparados = buscarPorNombre(cat, e.palabras, soloNeg, 'preparado');
  } else {
    const porNombre = buscarPorNombre(cat, e.palabras, soloNeg);
    preparados = porNombre.filter((i) => i.tipo === 'preparado');
    const crudos = porNombre.filter((i) => i.tipo !== 'preparado');
    if (crudos.length) hallazgos.push({ items: crudos, mismo: true });
  }
  if (preparados.length) {
    const bloque: Hallazgo = { titulo: hallazgos.length ? 'Ya preparado' : undefined, items: preparados, mismo: true };
    // si lo que escribió es justo el nombre de un platillo, ese va primero
    if (hallazgos.length && e.palabras.length >= 2 && coincideTodo(preparados[0], e.palabras)) hallazgos.unshift(bloque);
    else hallazgos.push(bloque);
  }

  // Si buscó por nombre ("fresas con crema") se usa el nombre completo del producto, no solo las palabras sueltas
  const nombre = ids.length
    ? e.dicho || lista(unicosLista(e.grupos.map((g) => (g.length === 1 ? nombreIngrediente(g[0]) : 'lo que buscas'))))
    : lista([...new Set(hallazgos.flatMap((h) => h.items).slice(0, 2).map((i) => i.p.nombre))]) || e.dicho;

  const guardar: Partial<typeof mem> = {
    ingredientes: ids,
    modo: 'productos',
    ordenar: criterio,
    busqueda: { grupos: e.grupos, palabras: e.palabras, dicho: e.dicho, negocios: e.negocios.map((n) => n.id) },
  };

  if (hallazgos.length) {
    // Una oferta por tienda, todas las tiendas, en el orden pedido
    let ningunaEntrega = false;
    const filas = hallazgos.map((h) => {
      let ofertas = ofertasPorTienda(h.items, criterio, 30);
      let sinEntrega: Item[] = [];
      if (e.domicilio) {
        const con = ofertas.filter((i) => i.n.aDomicilio);
        if (con.length) {
          sinEntrega = ofertas.filter((i) => !i.n.aDomicilio);
          ofertas = con;
        } else ningunaEntrega = true;
      }
      return { h, ofertas: ofertas.slice(0, MAX_TIENDAS), sinEntrega };
    });

    const principal = filas[0];
    const n = principal.ofertas.length;
    const intro =
      e.conviene && n > 1
        ? `Depende de lo que te importe más: el precio, las estrellas o la distancia. Estas son todas las tiendas que tienen **${nombre}** y lo que destaca de cada una:`
        : filas.length > 1
          ? `Esto encontré de **${nombre}**:`
          : e.domicilio && !ningunaEntrega
            ? `Entregan **${nombre}** a domicilio en ${n === 1 ? 'esta tienda' : `estas ${n} tiendas`}:`
            : pick(
                [
                  `Sí hay. Encontré **${nombre}** en ${n} ${plural(n, 'tienda', 'tiendas')}:`,
                  `**${nombre}** lo tienen en ${n === 1 ? 'esta tienda' : `estas ${n} tiendas`}:`,
                  `Mira, esto es lo que hay de **${nombre}** hoy:`,
                ],
                mem.turno,
              );

    const bloques: Bloque[] = [{ t: 'texto', texto: intro }];
    for (const fila of filas) {
      bloques.push({ t: 'productos', titulo: filas.length > 1 ? fila.h.titulo : undefined, items: vistasConInsignias(fila.ofertas, fila.h.mismo) });
    }

    // Quién destaca en qué (sin dejar a las demás fuera) y lo que pidió sobre domicilio
    const cierre: string[] = [];
    const comp = comparar(principal.ofertas, { precio: principal.h.mismo });
    const resumen = resumenComparacion(principal.ofertas, comp);
    if (resumen) cierre.push(resumen);
    else if (n === 1) {
      const it = principal.ofertas[0];
      const d = etiquetaDistancia(it.dist);
      cierre.push(`Lo tiene **${it.n.nombre}**${d ? ` (${d})` : ''}.`);
    }
    // Si pidió ver las estrellas, se dice cuál va primero aunque la diferencia sea poca para ponerle insignia
    const primero = principal.ofertas[0];
    if (criterio === 'estrellas' && n > 1 && primero.rep.total > 0 && primero.rep.promedio != null && !comp.insignias.get(primero.p.id)?.includes('calificada')) {
      cierre.push(`Por estrellas va primero **${primero.n.nombre}** (★ ${primero.rep.promedio.toFixed(1)} · ${primero.rep.total} ${plural(primero.rep.total, 'reseña', 'reseñas')}).`);
    }
    if (n > 1) cierre.push(`Aquí están todas las tiendas que lo tienen, ordenadas por ${NOMBRE_CRITERIO[criterio]}.`);
    if (!cat.origen && cat.hayUbicaciones && criterio === 'cerca' && n > 1) cierre.push('Activa tu ubicación y te digo cuál te queda más cerca.');
    if (e.domicilio) {
      if (ningunaEntrega) cierre.push('Ninguna de estas tiendas ofrece entrega a domicilio por ahora; tendrías que pasar por tus productos.');
      else if (principal.sinEntrega.length) {
        cierre.push(`También lo tienen, pero sin entrega a domicilio: ${lista(principal.sinEntrega.map((i) => `**${i.n.nombre}**`))}.`);
      }
    }
    if (cierre.length) bloques.push({ t: 'texto', texto: cierre.join(' ') });

    const chips: string[] = [];
    if (n > 1) {
      if (criterio !== 'precio') chips.push('Por precio');
      if (criterio !== 'estrellas') chips.push('Por estrellas');
      if (criterio !== 'cerca') chips.push('Más cerca');
    }
    if (!e.domicilio) chips.push('¿Quién entrega a domicilio?');
    const corto = e.grupos.length === 1 && ids.length === 1 ? (e.dicho || nombreIngrediente(ids[0])).toLowerCase() : null;
    if (hallazgos.some((h) => h.items.some((i) => i.tipo === 'ingrediente'))) chips.push(corto ? `¿Qué cocino con ${corto}?` : '¿Qué puedo cocinar?');
    chips.push('Tiendas cerca de mí');
    return { bloques, chips, mem: guardar, ok: true };
  }

  const bloques: Bloque[] = [
    { t: 'texto', texto: `Ahora mismo ninguna tienda tiene **${nombre || 'eso'}** marcado como disponible. Puede que se haya agotado o que todavía no lo publiquen.` },
  ];
  const tipo = ids.length ? ALTERNATIVAS[INGREDIENTES[ids[0]]?.cat ?? 'otro'] : undefined;
  if (tipo) {
    const categoria = INGREDIENTES[ids[0]].cat;
    const otros = ofertasPorTienda(
      cat.items.filter((i) => i.cat === categoria && !i.evitar && !ids.includes(i.ing ?? '')),
      'cerca',
      4,
    );
    if (otros.length) bloques.push({ t: 'texto', texto: `Lo que sí hay de ${tipo}:` }, { t: 'productos', items: otros.map((i) => vistaDonde(i)) });
  }
  bloques.push({ t: 'texto', texto: 'Si es urgente, escríbele a la tienda desde su perfil para preguntar si ya les llegó.' });
  // Una búsqueda sin resultados no borra la anterior: "por precio" después sigue hablando de lo último que sí se encontró
  return { bloques, chips: ['¿Qué hay hoy?', 'Tiendas cerca de mí'], mem: { ingredientes: ids, modo: 'productos' } };
}

/** "Por precio", "Por estrellas", "¿Quién entrega a domicilio?" sobre la última búsqueda de productos. */
export function ordenar(e: Entendido, ctx: Ctx): Parcial {
  const b = ctx.mem.busqueda;
  if (!b) return tiendas(e, ctx);
  const e2: Entendido = {
    ...e,
    tipo: 'producto',
    grupos: b.grupos,
    palabras: b.palabras,
    dicho: b.dicho,
    negocios: ctx.cat.negocios.filter((n) => b.negocios.includes(n.id)),
  };
  return producto(e2, ctx, ctx.mem.ordenar ?? 'cerca');
}

/* ───────── una tienda en particular ───────── */

export function tienda(e: Entendido, ctx: Ctx): Parcial {
  const { cat } = ctx;
  const ns = [...e.negocios].sort(porDistancia(cat)).slice(0, 6);
  if (ns.length > 1) {
    return {
      bloques: [
        { t: 'texto', texto: `Encontré ${ns.length} tiendas que coinciden:` },
        { t: 'negocios', items: vistasNegocios(ns, cat) },
      ],
      chips: ns.slice(0, 2).map((n) => `¿Qué hay en ${n.nombre}?`),
    };
  }
  const n = ns[0];
  const items = cat.items.filter((i) => i.n.id === n.id);
  const bloques: Bloque[] = [];
  if (items.length) {
    bloques.push({ t: 'texto', texto: `En **${n.nombre}** hay hoy:` }, { t: 'negocios', items: [vistaNegocio(n, cat)] }, { t: 'productos', items: items.slice(0, 10).map((i) => vistaDonde(i)) });
  } else if (!n.duenoId) {
    bloques.push(
      {
        t: 'texto',
        texto: `**${n.nombre}** aparece en el directorio de la comunidad, pero todavía no ha publicado sus productos en Mercaboot. Puedes pasar a verla o preguntarle cuando se registre.`,
      },
      { t: 'negocios', items: [vistaNegocio(n, cat)] },
    );
  } else {
    bloques.push(
      { t: 'texto', texto: `**${n.nombre}** no tiene productos marcados como disponibles en este momento.` },
      { t: 'negocios', items: [vistaNegocio(n, cat)] },
    );
  }
  return { bloques, chips: ['¿Qué cocino con lo que tienen?', 'Tiendas cerca de mí'] };
}

/* ───────── cuáles tiendas: cerca, mejor calificadas, con domicilio ───────── */

export function cerca(ctx: Ctx): Parcial {
  const { cat } = ctx;
  if (!cat.negocios.length) {
    return { bloques: [{ t: 'texto', texto: 'Todavía no hay tiendas registradas. En cuanto se sumen las verás aquí, ordenadas por cercanía.' }], chips: [] };
  }
  const ordenadas = ordenarTiendas(cat.negocios, cat, 'cerca').slice(0, 8);
  let texto: string;
  if (!cat.origen) {
    texto =
      'Para decirte cuál tienda te queda más cerca necesito tu ubicación. Actívala desde el inicio de la app o en tu perfil y vuelve a preguntarme. Mientras tanto, estas son las tiendas de la comunidad:';
  } else if (!cat.hayUbicaciones) {
    texto = 'Todavía ninguna tienda tiene su ubicación marcada en el mapa, así que no puedo calcular distancias. Estas son las tiendas de la comunidad:';
  } else {
    texto = 'Estas son las tiendas que te quedan más cerca. Al lado de cada una ves sus estrellas y si entrega a domicilio:';
  }
  return {
    bloques: [
      { t: 'texto', texto },
      { t: 'negocios', items: vistasNegocios(ordenadas, cat) },
    ],
    chips: ['Tiendas mejor calificadas', 'Tiendas con servicio a domicilio', '¿Dónde sale más barato?', 'Algo barato'],
    mem: { modo: 'tiendas' },
  };
}

/** Ranking de tiendas: por estrellas, por entrega a domicilio o, sin producto, lo más barato del día. */
export function tiendas(e: Entendido, ctx: Ctx): Parcial {
  const { cat } = ctx;
  if (!cat.negocios.length) {
    return { bloques: [{ t: 'texto', texto: 'Todavía no hay tiendas registradas. En cuanto se sumen las verás aquí.' }], chips: [] };
  }
  const criterio: Criterio = e.ordenar ?? (e.domicilio ? 'cerca' : 'estrellas');
  if (criterio === 'precio' && !e.domicilio) return masBaratas(ctx);

  let ns = cat.negocios;
  let sin: Negocio[] = [];
  let intro: string;
  if (e.domicilio) {
    const con = ns.filter((n) => n.aDomicilio);
    sin = ns.filter((n) => !n.aDomicilio);
    if (con.length) {
      ns = con;
      intro =
        criterio === 'estrellas'
          ? 'Estas tiendas entregan a domicilio, de la mejor calificada a la menos:'
          : `Estas tiendas entregan a domicilio${cat.origen && cat.hayUbicaciones ? ', de la más cercana a la más lejana' : ''}:`;
    } else {
      sin = [];
      intro = 'Por ahora ninguna tienda tiene activada la entrega a domicilio. Estas son las tiendas de la comunidad, por si prefieres pasar por tus productos:';
    }
  } else if (criterio === 'cerca') {
    intro = 'Estas son las tiendas, de la más cercana a la más lejana:';
  } else {
    intro =
      'Así califican los clientes a las tiendas, de la mejor a la menos calificada. Las tiendas nuevas, sin reseñas, no se castigan: aparecen sin estrellas hasta que alguien las califique.';
  }
  const ordenadas = ordenarTiendas(ns, cat, criterio).slice(0, 8);
  const bloques: Bloque[] = [
    { t: 'texto', texto: intro },
    { t: 'negocios', items: vistasNegocios(ordenadas, cat) },
  ];
  if (sin.length) {
    bloques.push({ t: 'texto', texto: `${lista(sin.map((n) => `**${n.nombre}**`))} ${sin.length === 1 ? 'todavía no entrega' : 'todavía no entregan'} a domicilio; puedes pasar por tus productos.` });
  } else if (!e.domicilio && !cat.rep.size) {
    bloques.push({ t: 'texto', texto: 'Todavía nadie ha calificado a las tiendas. Cuando compres, deja tu reseña desde el perfil de la tienda: ayuda a que otros vecinos elijan.' });
  }
  const chips: string[] = [];
  if (!e.domicilio) chips.push('Tiendas con servicio a domicilio');
  if (criterio !== 'estrellas') chips.push('Tiendas mejor calificadas');
  chips.push('¿Dónde sale más barato?', 'Tiendas cerca de mí', '¿Qué hay hoy?');
  return { bloques, chips, mem: { modo: 'tiendas' } };
}

/** Lo que hoy cuesta menos en una tienda que en otra (mismo producto, misma unidad). */
function masBaratas(ctx: Ctx): Parcial {
  const { cat } = ctx;
  const ofertas = baratasHoy(cat.items, 6);
  if (!ofertas.length) {
    return {
      bloques: [
        {
          t: 'texto',
          texto:
            'Para decirte dónde sale más barato necesito el mismo producto en dos o más tiendas, y hoy todavía no hay ninguno que se pueda comparar. Dime qué buscas (por ejemplo «tortillas» o «pollo») y te muestro quién lo tiene y a qué precio.',
        },
      ],
      chips: ['Algo barato', 'Tiendas mejor calificadas', '¿Qué hay hoy?'],
      mem: { modo: 'tiendas' },
    };
  }
  return {
    bloques: [
      { t: 'texto', texto: 'Esto es lo que hoy sale más barato en una tienda que en otra. Solo comparo el mismo producto en la misma unidad:' },
      {
        t: 'productos',
        items: ofertas.map((o) => ({
          ...vistaDonde(o.mejor, ['barata']),
          nota: `Hasta ${dinero(o.ahorro)} menos por ${o.unidad} que en otra tienda · ${o.tiendas} tiendas lo tienen`,
        })),
      },
      { t: 'texto', texto: 'Las demás tiendas también lo tienen a otro precio: pregúntame «dónde hay …» y te las muestro todas.' },
    ],
    chips: ['Tiendas mejor calificadas', 'Tiendas con servicio a domicilio', 'Algo barato', 'Tiendas cerca de mí'],
    mem: { modo: 'tiendas' },
  };
}

/* ───────── qué hay hoy ───────── */

export function hoy(ctx: Ctx): Parcial {
  const { cat } = ctx;
  if (!cat.items.length) return SIN_PRODUCTOS;
  const conStock = ordenarTiendas(
    cat.negocios.filter((n) => cat.items.some((i) => i.n.id === n.id)),
    cat,
    'cerca',
  ).slice(0, 6);
  const recientes = [...cat.items].sort((a, b) => b.p.actualizado - a.p.actualizado).slice(0, 6);
  return {
    bloques: [
      { t: 'texto', texto: resumenCatalogo(cat) },
      { t: 'negocios', items: vistasNegocios(conStock, cat) },
      { t: 'texto', texto: 'Lo último que actualizaron:' },
      { t: 'productos', items: recientes.sort(mejorPrimero).map((i) => vistaDonde(i)) },
    ],
    chips: ['Algo barato', 'Algo con carne', 'Algo de solo verduras', '¿Hay promociones?'],
    mem: { modo: 'tiendas' },
  };
}

/* ───────── avisos, promociones y regalos ───────── */

const vigente = (a: Aviso, ahora: Date) => !a.hasta || a.hasta > ahora.getTime();

/** Avisos activos de tiendas que existen, como los muestra el chat; opcionalmente solo los de una fiesta. */
export function avisosVista(cat: Catalogo, ahora: Date, festividadId?: string, max = 8): AvisoVista[] {
  const nombres = new Map(cat.negocios.map((n) => [n.id, n.nombre]));
  return cat.avisos
    .filter((a) => vigente(a, ahora) && nombres.has(a.negocioId) && (!festividadId || a.festividad === festividadId))
    .sort((a, b) => b.fecha - a.fecha)
    .slice(0, max)
    .map((a) => ({
      id: a.id,
      negocioId: a.negocioId,
      negocio: nombres.get(a.negocioId) ?? '',
      tipo: a.tipo,
      texto: a.texto,
      hasta: a.hasta,
      festividad: festividad(a.festividad)?.corto,
    }));
}

export function avisos(ctx: Ctx, e?: Entendido): Parcial {
  const { cat, ahora } = ctx;
  const fiesta = festividad(e?.festividad);
  const todos = avisosVista(cat, ahora);
  if (!todos.length) {
    const prox = fiesta ? proxima(fiesta, ahora) : null;
    return {
      bloques: [
        {
          t: 'texto',
          texto: fiesta
            ? `Por ahora ninguna tienda ha publicado algo para **${fiesta.corto}**${prox ? ` (${textoFaltan(prox)})` : ''}. Cuando lo hagan lo verás aquí.`
            : 'Por ahora ninguna tienda tiene avisos ni promociones activos. Cuando publiquen uno (por ejemplo los regalos de diciembre, como trastes, cubetas o bolsas de mandado) lo verás aquí.',
        },
      ],
      chips: ['¿Qué hay hoy?', 'Tiendas cerca de mí'],
    };
  }
  if (fiesta) {
    const deFiesta = avisosVista(cat, ahora, fiesta.id);
    if (deFiesta.length) {
      return {
        bloques: [
          { t: 'texto', texto: `Esto avisan las tiendas para **${fiesta.corto}**:` },
          { t: 'avisos', items: deFiesta },
        ],
        chips: [`Ideas para ${fiesta.corto}`, '¿Qué hay hoy?', 'Tiendas cerca de mí'],
      };
    }
    return {
      bloques: [
        { t: 'texto', texto: `Todavía ninguna tienda publicó algo para **${fiesta.corto}**. Esto es lo que avisan hoy:` },
        { t: 'avisos', items: todos },
      ],
      chips: [`Ideas para ${fiesta.corto}`, '¿Qué hay hoy?', 'Tiendas cerca de mí'],
    };
  }
  const regalos = todos.filter((a) => a.tipo === 'regalo').length;
  return {
    bloques: [
      { t: 'texto', texto: regalos ? '¡Hay regalos! Esto es lo que avisan las tiendas:' : 'Esto es lo que avisan las tiendas:' },
      { t: 'avisos', items: todos },
    ],
    chips: ['¿Qué hay hoy?', 'Tiendas cerca de mí'],
  };
}
