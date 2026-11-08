import { festividad } from '../data/festividades';
import { avisosVista } from './consultas';
import type { Entendido } from './entender';
import { evaluar, Evaluada, Filtros, itemsListos, momentoDeLaHora, pidioAlgoConcreto, recomendar, vistaDonde, vistaReceta } from './evaluar';
import { Ctx, lista, MENSAJE_SIN_PRODUCTOS, mayus, Parcial, PARA_MOMENTO, pick, TEXTO_SABOR } from './frases';
import { nombreIngrediente } from './ingredientes';
import { receta, RECETAS } from './recetas';
import type { Momento } from './recetas';
import type { Bloque } from './vista';

const unicos = <A>(l: A[]) => [...new Set(l)];

/** Cuántas veces hay que multiplicar una receta para que alcance. */
export function textoPorciones(por: number, personas: number): string {
  const f = personas / por;
  if (f > 0.8 && f < 1.25) return `Rinde para ${por}, así que te alcanza para ${personas}.`;
  if (f <= 0.6) return `Rinde para ${por}; para ${personas} usa más o menos la mitad de las cantidades.`;
  const x = Math.round(f * 2) / 2;
  return `Rinde para ${por}; para ${personas} personas usa ${x === 1.5 ? 'una vez y media' : `unas ${x} veces`} las cantidades.`;
}

/**
 * Lo que la persona pidió, mezclado con lo que ya venía pidiendo cuando solo está ajustando ("más rápido", "otra opción").
 * Una petición nueva (otro sabor, "algo con carne"…) empieza de cero; solo "vegetariano" se recuerda siempre.
 */
export function filtrosDe(e: Entendido, ctx: Ctx, soloModificar: boolean): Filtros {
  const { mem, ahora } = ctx;
  const sigue = soloModificar;
  const quiereCarne = e.dieta === 'carne';
  const soloVerduras = e.soloVerduras || (sigue && !!mem.soloVerduras && !quiereCarne);
  const fiesta = festividad(e.festividad ?? (sigue ? mem.festividad : undefined));
  return {
    sabor: e.sabor ?? (sigue ? mem.sabor : undefined),
    momento: e.momento ?? (sigue ? (mem.momento as Momento | undefined) : undefined),
    rapido: (e.rapido || (sigue && !!mem.rapido)) && !e.sinPrisa,
    economico: e.economico || (sigue && !!mem.economico),
    vegetariano: !quiereCarne && (e.vegetariano || !!mem.vegetariano || soloVerduras),
    caliente: e.caliente || (sigue && !!mem.caliente),
    dieta: e.dieta ?? (sigue && !e.soloVerduras ? mem.dieta : undefined),
    soloVerduras,
    ligero: e.ligero || (sigue && !!mem.ligero),
    platoFuerte: e.platoFuerte || (sigue && !!mem.platoFuerte),
    oaxaca: e.oaxaca || (sigue && !!mem.oaxaca),
    listo: e.listo || (sigue && !!mem.listo),
    festividad: fiesta?.tag,
    festividadExacta: !!fiesta && RECETAS.some((r) => r.tags.includes(fiesta.tag)),
    grupos: e.grupos.length ? e.grupos : sigue ? mem.ingredientes.map((i) => [i]) : [],
    excluir: unicos([...e.excluir, ...(sigue ? mem.excluir : [])]),
    yaMostradas: sigue ? mem.recetasMostradas : [],
    sinRepetir: sigue,
    hora: ahora.getHours(),
    semilla: mem.turno,
  };
}

/** "económico y con carne", "rápido, ligero y de puras verduras"… */
function rasgos(f: Filtros): string[] {
  const r: string[] = [];
  if (f.sabor) r.push(TEXTO_SABOR[f.sabor].replace('algo ', ''));
  if (f.economico) r.push('económico');
  if (f.rapido) r.push('rápido');
  if (f.ligero) r.push('ligero');
  if (f.caliente) r.push('calientito');
  if (f.oaxaca) r.push('oaxaqueño');
  if (f.soloVerduras) r.push('de puras verduras');
  else if (f.dieta === 'carne') r.push('con carne');
  else if (f.dieta === 'proteina') r.push('con proteína');
  else if (f.vegetariano && f.momento !== 'postre' && f.momento !== 'bebida' && f.sabor !== 'dulce') r.push('sin carne');
  return r;
}

const enMinuscula = (s: string) => s.charAt(0).toLowerCase() + s.slice(1);

function textoIntro(f: Filtros, turno: number): string {
  if (f.grupos.length) {
    const nom = lista(unicos(f.grupos.map((g) => (g.length === 1 ? nombreIngrediente(g[0]).toLowerCase() : 'eso'))));
    return pick([`Con ${nom} puedes preparar:`, `Para cocinar con ${nom}, mira estas ideas:`, `Con ${nom} se me ocurre esto:`], turno);
  }
  const r = rasgos(f);
  if (f.sabor && r.length === 1 && !f.platoFuerte && !f.momento) {
    const t = TEXTO_SABOR[f.sabor];
    return pick(
      [
        `¡Se antoja! Para ${t}, esto se puede preparar con productos que hoy hay en las tiendas de la comunidad:`,
        `Para ${t}, mira lo que encontré con lo que hay hoy en las tiendas:`,
        `${mayus(t)}, ¡buena idea! Con lo que tienen hoy las tiendas, te propongo:`,
      ],
      turno,
    );
  }
  const m = f.momento ?? (f.platoFuerte ? 'comida' : undefined);
  if (!r.length && !f.platoFuerte) {
    const mm = m ?? momentoDeLaHora(f.hora);
    return `${PARA_MOMENTO[mm]}${m ? '' : ' de hoy'}, con lo que hay en las tiendas, te propongo:`;
  }
  const que = f.platoFuerte ? 'un plato fuerte' : 'algo';
  const como = r.length ? ` ${lista(r)}` : '';
  const cuando = f.momento ? ` ${enMinuscula(PARA_MOMENTO[f.momento])}` : f.platoFuerte ? ' para la comida' : '';
  return pick(
    [
      `${mayus(que)}${como}${cuando}: esto se puede preparar con lo que hay hoy en las tiendas:`,
      `Va ${que}${como}${cuando}, con productos de las tiendas de la comunidad:`,
      `Para ${que}${como}${cuando}, mira lo que encontré hoy:`,
    ],
    turno,
  );
}

function fraseSinResultados(f: Filtros, otra: boolean, tengo: boolean): string {
  if (otra) return 'Ya te mostré todo lo que puedo armar con lo que hay hoy. Prueba con otro antojo, o dime qué ingredientes tienes en casa y te digo qué cocinar.';
  if (f.grupos.length && tengo) {
    const nom = lista(unicos(f.grupos.map((g) => (g.length === 1 ? nombreIngrediente(g[0]).toLowerCase() : 'eso'))));
    return `Con ${nom} solos no me alcanza para una receta completa. Dime qué más tienes en casa (verduras, tortillas, arroz…) y vuelvo a buscar.`;
  }
  if (f.grupos.length) {
    const nom = lista(unicos(f.grupos.map((g) => (g.length === 1 ? nombreIngrediente(g[0]).toLowerCase() : 'eso'))));
    return `Con ${nom} no me sale una receta que se pueda armar con lo que hay publicado hoy en las tiendas. Si ya lo tienes en casa, dime «tengo ${nom}» y busco con eso.`;
  }
  const r = rasgos(f);
  if (f.soloVerduras) return 'Con las verduras que hay publicadas hoy todavía no me alcanza para un platillo de puras verduras. Cuando las tiendas suban más verduras, vuelve a preguntarme; mientras tanto puedo sugerirte algo sin carne.';
  if (f.dieta === 'carne') return 'Todavía no hay suficiente carne publicada para armar un platillo completo. Cuando las tiendas la suban, vuelve a preguntarme.';
  if (f.dieta === 'proteina') return 'Todavía no hay suficientes productos con proteína (carne, huevo, queso, frijol…) para armar un platillo completo. Cuando las tiendas suban más, vuelve a preguntarme.';
  if (f.festividad) return 'Para esa fecha todavía no me alcanza con lo que hay publicado hoy. Revisa los avisos de las tiendas: ahí cuentan qué tienen para festejar.';
  if (r.length || f.platoFuerte) return `Con lo que hay publicado hoy no me alcanza para ${f.platoFuerte ? 'un plato fuerte' : `algo ${lista(r)}`}. Cuando las tiendas suban más productos, vuelve a preguntarme.`;
  return 'Con lo que hay publicado hoy no me alcanza para armar una receta completa. Cuando las tiendas suban más productos, vuelve a preguntarme.';
}

/** Qué sugerir después, según lo que se acaba de pedir: siempre algo distinto a lo que ya se vio. */
function chipsDespues(f: Filtros): string[] {
  const c: string[] = ['¿Dónde lo compro?', 'Otra opción'];
  if (!f.economico) c.push('Algo más barato');
  else c.push('Algo con carne');
  c.push(f.rapido ? 'Algo más elaborado' : 'Algo más rápido');
  if (f.soloVerduras) c.push('Algo con proteína');
  else if (f.dieta === 'carne') c.push('Algo de solo verduras');
  else if (f.platoFuerte) c.push('Algo ligero');
  else if (f.momento === 'desayuno') c.push('Un plato fuerte');
  else if (f.sabor === 'dulce') c.push('Mejor algo salado');
  else c.push('Se me antoja algo dulce');
  return c;
}

/** Alterna dos clases de resultados (por ejemplo con carne y sin carne) sin cambiar el orden dentro de cada una. */
function intercalar<T>(l: T[], esDelPrimerGrupo: (x: T) => boolean): T[] {
  const a = l.filter(esDelPrimerGrupo);
  const b = l.filter((x) => !esDelPrimerGrupo(x));
  const empiezaA = l.length === 0 || esDelPrimerGrupo(l[0]);
  const res: T[] = [];
  while (a.length || b.length) {
    const turnoA = (res.length % 2 === 0) === empiezaA;
    const cola = (turnoA ? a : b).length ? (turnoA ? a : b) : turnoA ? b : a;
    res.push(cola.shift() as T);
  }
  return res;
}

/* ───────── "se me antoja algo dulce", "algo con carne", "qué cocino con pollo" ───────── */

export function sugerir(e: Entendido, ctx: Ctx, soloModificar = false, refiere = false): Parcial {
  const { cat, mem, ahora } = ctx;
  const tengo = new Set([...(soloModificar ? mem.tengo : []), ...(e.tengo ? e.grupos.flat() : [])]);
  const f = filtrosDe(e, ctx, soloModificar);
  if (refiere && !f.grupos.length && mem.ingredientes.length) f.grupos = mem.ingredientes.map((i) => [i]);
  const fiesta = festividad(e.festividad ?? (soloModificar ? mem.festividad : undefined));

  const guardar = (vistas: string[]): Parcial['mem'] => ({
    ultimaReceta: vistas[0] ?? mem.ultimaReceta,
    recetasMostradas: unicos([...(soloModificar ? mem.recetasMostradas : []), ...vistas]),
    sabor: f.sabor,
    momento: f.momento,
    rapido: f.rapido,
    economico: f.economico,
    caliente: f.caliente,
    vegetariano: f.vegetariano,
    dieta: f.dieta,
    soloVerduras: f.soloVerduras,
    ligero: f.ligero,
    platoFuerte: f.platoFuerte,
    oaxaca: f.oaxaca,
    listo: f.listo,
    festividad: fiesta?.id,
    personas: e.personas ?? mem.personas,
    ingredientes: unicos(f.grupos.flat()),
    excluir: f.excluir,
    tengo: [...tengo],
    modo: 'recetas',
  });

  if (!cat.items.length && tengo.size === 0) {
    return { bloques: [{ t: 'texto', texto: MENSAJE_SIN_PRODUCTOS }], chips: ['¿Cómo se hacen unas tlayudas?', 'Receta de arroz con leche'], mem: guardar([]) };
  }

  let todas = recomendar(cat, f, tengo, RECETAS);
  // Si pidió algo concreto y nada alcanza, se muestra lo más cercano y se dice qué falta.
  if (!todas.length && pidioAlgoConcreto(f)) todas = recomendar(cat, f, tengo, RECETAS, true);
  // "Algo con proteína" no es solo carne: se alternan platillos con carne y con huevo, queso o frijol
  if (f.dieta === 'proteina' && !f.vegetariano) todas = intercalar(todas, (x) => x.r.conCarne);
  const completas = todas.filter((x) => x.completa);
  let elegidas: Evaluada[] = completas.slice(0, 3);
  if (elegidas.length < 2) elegidas = [...elegidas, ...todas.filter((x) => !x.completa).slice(0, 3 - elegidas.length)];

  // Platillos, postres y bebidas que las tiendas ya tienen preparados (fonda, pastelería, puesto de fresas…)
  const listos = !e.pideOtra && !soloModificar ? itemsListos(cat, f, f.listo ? 6 : 4) : [];
  const listoPrimero = f.listo || ((!!f.sabor || f.momento === 'bebida' || f.momento === 'postre' || f.momento === 'botana') && !f.dieta && !f.platoFuerte);
  const bloquesListos: Bloque[] = listos.length
    ? [
        {
          t: 'texto',
          texto: f.listo
            ? 'Esto ya está preparado, para llevar o comer hoy:'
            : f.sabor && listoPrimero
              ? `Si lo quieres ya listo, esto es lo ${TEXTO_SABOR[f.sabor].replace('algo ', '')} que hay hoy:`
              : listoPrimero
                ? 'Ya listo, esto es lo que hay hoy:'
                : '¿No quieres cocinar? Esto ya está preparado:',
        },
        { t: 'productos', items: listos.map((i) => vistaDonde(i)) },
      ]
    : [];

  const chips = chipsDespues(f);
  const bloques: Bloque[] = [];
  const hechoListo = f.listo && listos.length > 0;
  if (hechoListo || listoPrimero) bloques.push(...bloquesListos);

  if (hechoListo) {
    bloques.push({ t: 'texto', texto: 'Si prefieres cocinar en casa, dime «qué cocino» y te doy recetas con lo que hay hoy.' });
    return { bloques, chips: ['¿Qué puedo cocinar?', 'Algo barato', 'Tiendas mejor calificadas', 'Tiendas con servicio a domicilio'], mem: guardar([]) };
  }

  if (!elegidas.length) {
    // Si pidió ideas para una fiesta, se le dice claro que se trata de eso antes de ofrecer lo que sí hay
    if (fiesta && bloquesListos.length) {
      bloques.unshift({ t: 'texto', texto: `Para **${fiesta.corto}** todavía no me alcanza, con lo que hay publicado hoy, para armar un platillo de temporada.` });
      const encabezado = bloquesListos[0];
      if (encabezado.t === 'texto') encabezado.texto = 'Lo que sí encuentras ya preparado:';
    }
    if (bloquesListos.length && !listoPrimero) bloques.push(...bloquesListos);
    const deFiesta = fiesta ? avisosVista(cat, ahora, fiesta.id, 4) : [];
    if (deFiesta.length) bloques.push({ t: 'texto', texto: `Las tiendas avisan esto para ${fiesta?.corto}:` }, { t: 'avisos', items: deFiesta });
    bloques.push({
      t: 'texto',
      texto: bloquesListos.length
        ? 'Y para cocinar algo en casa, todavía no hay productos suficientes publicados.'
        : f.listo
          ? 'Todavía ninguna tienda tiene platillos o postres ya preparados publicados. Cuando los suban te aviso; mientras tanto puedo darte recetas.'
          : fraseSinResultados(f, soloModificar, tengo.size > 0),
    });
    const alterno = f.soloVerduras ? 'Algo sin carne' : f.dieta ? 'Algo de solo verduras' : 'Algo salado y rápido';
    return { bloques, chips: ['¿Qué hay hoy?', alterno, 'Se me antoja algo dulce'], mem: guardar([]) };
  }

  const sinCompleta = completas.length === 0;
  if (f.listo && !listos.length) bloques.push({ t: 'texto', texto: 'Todavía ninguna tienda tiene platillos ya preparados publicados, pero con lo que hay puedes cocinar:' });
  else if (fiesta && !f.festividadExacta) {
    bloques.push({ t: 'texto', texto: `No tengo recetas marcadas para **${fiesta.corto}**, pero esto se puede preparar con lo que hay hoy en las tiendas:` });
  } else if (fiesta && !sinCompleta) {
    bloques.push({ t: 'texto', texto: pick([`Para **${fiesta.corto}**, estas ideas se arman con lo que hay hoy en las tiendas:`, `**${fiesta.corto}** se festeja así; con lo que hay hoy puedes preparar:`], mem.turno) });
  } else {
    bloques.push({
      t: 'texto',
      texto: sinCompleta ? 'No encontré una receta completa con lo que hay publicado hoy, pero esta es la más cercana:' : textoIntro(f, mem.turno),
    });
  }
  elegidas.forEach((ev, i) => bloques.push({ t: 'receta', receta: vistaReceta(ev), verPasos: i === 0 }));
  if (bloquesListos.length && !listoPrimero) bloques.push(...bloquesListos);

  // Si el cliente preguntó por una fiesta, también se le dice qué avisan las tiendas
  if (fiesta) {
    const deFiesta = avisosVista(cat, ahora, fiesta.id, 4);
    if (deFiesta.length) bloques.push({ t: 'texto', texto: `Y las tiendas avisan esto para ${fiesta.corto}:` }, { t: 'avisos', items: deFiesta });
  }

  const primera = elegidas[0];
  const cierre: string[] = [];
  const personas = e.personas ?? mem.personas;
  if (personas) cierre.push(textoPorciones(primera.r.por, personas));
  const m = primera.mejor;
  if (m && primera.completa) {
    const porque = m.motivos.slice(1).join(' · ');
    cierre.push(
      m.cubre >= m.de
        ? `Para **${primera.r.nombre}**, todo lo principal lo encuentras en **${m.n.nombre}**${porque ? ` (${porque})` : ''}.`
        : `Para **${primera.r.nombre}**, **${m.n.nombre}** reúne ${m.cubre} de ${m.de} ingredientes principales${porque ? ` (${porque})` : ''}.`,
    );
    if (primera.otras.length) cierre.push('Las otras tiendas que también surten algo aparecen en cada receta, por si prefieres comparar.');
  }
  cierre.push(
    pick(
      [
        '¿Te animas? Dime «otra opción» si prefieres algo distinto.',
        'Si quieres, te digo dónde conseguir cada ingrediente o te doy otra idea.',
        'Puedo darte otra opción o decirte dónde comprar lo que falta.',
      ],
      mem.turno,
    ),
  );
  bloques.push({ t: 'texto', texto: cierre.join(' ') });

  return { bloques, chips, mem: guardar(elegidas.map((x) => x.r.id)) };
}

/* ───────── "cómo se hace…", "receta de…" ───────── */

export function recetaNombrada(e: Entendido, ctx: Ctx): Parcial {
  const { cat, mem } = ctx;
  const tengo = new Set(e.tengo ? e.grupos.flat() : []);
  const [primera, ...otras] = e.recetas;
  const ev = evaluar(primera, cat, tengo);
  const bloques: Bloque[] = [
    { t: 'texto', texto: pick([`Claro, así se prepara **${primera.nombre}**:`, `Va la receta de **${primera.nombre}**:`, `**${primera.nombre}**, ¡buena elección! Mira:`], mem.turno) },
    { t: 'receta', receta: vistaReceta(ev), verPasos: true },
  ];
  const notas: string[] = [];
  const personas = e.personas ?? mem.personas;
  if (personas) notas.push(textoPorciones(primera.por, personas));
  if (!cat.items.length) notas.push('Todavía no hay productos publicados en las tiendas, así que no sé dónde conseguir los ingredientes; en cuanto los suban te lo digo.');
  else if (ev.faltan.length) notas.push(`Por ahora ninguna tienda tiene publicado: ${lista(ev.faltan.map((x) => x.txt.toLowerCase()))}.`);
  if (otras.length) notas.push(`También tengo ${lista(otras.map((o) => `**${o.nombre}**`))}, por si buscabas otra.`);
  if (notas.length) bloques.push({ t: 'texto', texto: notas.join(' ') });
  return {
    bloques,
    chips: ['¿Dónde lo compro?', 'Otra opción', ...(otras[0] ? [`Receta de ${otras[0].nombre}`] : [])],
    mem: { ultimaReceta: primera.id, recetasMostradas: unicos([...mem.recetasMostradas, primera.id]), personas, tengo: [...tengo], modo: 'recetas' },
  };
}

const SIN_ULTIMA: Parcial = {
  bloques: [{ t: 'texto', texto: 'Cuéntame qué se te antoja (algo barato, con carne, de solo verduras, un desayuno…) o qué ingredientes tienes, y te propongo una receta.' }],
  chips: ['Algo barato', 'Se me antoja algo dulce', 'Un plato fuerte'],
};

export function pasos(ctx: Ctx): Parcial {
  const r = ctx.mem.ultimaReceta ? receta(ctx.mem.ultimaReceta) : undefined;
  if (!r) return SIN_ULTIMA;
  const ev = evaluar(r, ctx.cat, new Set(ctx.mem.tengo));
  return {
    bloques: [
      { t: 'texto', texto: `Aquí van los pasos de **${r.nombre}**:` },
      { t: 'receta', receta: vistaReceta(ev), verPasos: true },
    ],
    chips: ['¿Dónde lo compro?', 'Otra opción'],
  };
}

export function dondeComprar(ctx: Ctx): Parcial {
  const r = ctx.mem.ultimaReceta ? receta(ctx.mem.ultimaReceta) : undefined;
  if (!r) return SIN_ULTIMA;
  const ev = evaluar(r, ctx.cat, new Set(ctx.mem.tengo));
  const v = vistaReceta(ev);
  const m = v.mejorTienda;
  const porque = m ? m.motivos.slice(1).join(' · ') : '';
  let texto: string;
  if (!ctx.cat.items.length) texto = 'Todavía no hay productos publicados por las tiendas, así que no puedo decirte dónde conseguir los ingredientes.';
  else if (m && v.completa && m.cubre >= m.de) {
    texto = `Lo más práctico: ve a **${m.nombre}**${porque ? ` (${porque})` : ''}. Ahí encuentras todo lo principal de **${r.nombre}**.`;
  } else if (m && m.cubre >= m.de) {
    texto = `En **${m.nombre}**${porque ? ` (${porque})` : ''} consigues los ingredientes de **${r.nombre}** que hay publicados.`;
  } else if (m) {
    texto = `**${m.nombre}**${porque ? ` (${porque})` : ''} reúne ${m.cubre} de ${m.de} ingredientes principales; el resto está en otras tiendas, abajo.`;
  } else texto = `Así se consigue cada ingrediente de **${r.nombre}**:`;
  if (m && v.otrasTiendas?.length) texto += ` También surten algo ${lista(v.otrasTiendas.map((o) => `**${o.nombre}**`))}: abajo ves qué tiene cada una, por si prefieres comparar.`;
  if (v.faltan.length) texto += ` Por ahora nadie tiene publicado: ${lista(v.faltan.map((x) => x.toLowerCase()))}.`;
  return {
    bloques: [
      { t: 'texto', texto },
      { t: 'receta', receta: v, verPasos: false },
    ],
    chips: ['¿Cómo se hace?', 'Otra opción', 'Tiendas mejor calificadas', 'Tiendas cerca de mí'],
  };
}
