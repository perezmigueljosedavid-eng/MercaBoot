import type { Catalogo } from './catalogo';
import { avisos, cerca, hoy, ordenar, producto, tienda, tiendas } from './consultas';
import { entender, Entendido } from './entender';
import { buscarPorNombre } from './evaluar';
import { CHIPS_INICIO, chipsInicio, Ctx, gruposInicio, Parcial, pick, resumenCatalogo, saludoHora } from './frases';
import { receta } from './recetas';
import { dondeComprar, pasos, recetaNombrada, sugerir, textoPorciones } from './sugerencias';
import { norm } from './texto';
import { MEMORIA_INICIAL, Memoria, Respuesta } from './vista';

export { MEMORIA_INICIAL } from './vista';
export type { Bloque, Memoria, Respuesta } from './vista';

export interface Opciones {
  ahora?: Date;
  /** Nombre de la persona, para saludarla. */
  nombre?: string;
}

const primerNombre = (n?: string) => n?.trim().split(/\s+/)[0] ?? '';

/* ───────── charla ───────── */

function saludo(ctx: Ctx): Parcial {
  const nom = primerNombre(ctx.nombre);
  return {
    bloques: [
      {
        t: 'texto',
        texto:
          `${saludoHora(ctx.ahora.getHours())}${nom ? `, ${nom}` : ''}. Soy el asistente de Mercaboot: te ayudo a decidir qué cocinar o comer con lo que hay hoy en las tiendas de San Francisco Javier, a comparar tiendas (estrellas, precio, cercanía y entrega a domicilio) y a encontrar dónde comprarlo. ` +
          `${resumenCatalogo(ctx.cat)} Prueba con «algo barato», «algo con proteína», «un plato fuerte», «dónde hay tortillas» o toca una de las ideas de abajo.`,
      },
      { t: 'ideas', grupos: gruposInicio(ctx.ahora) },
    ],
    chips: chipsInicio(ctx.ahora),
  };
}

function ayuda(ctx: Ctx): Parcial {
  return {
    bloques: [
      {
        t: 'texto',
        texto:
          'Esto es lo que puedo hacer, siempre con los productos que las tiendas de la comunidad tienen publicados:\n' +
          '• Sugerirte qué cocinar: algo barato, con carne, con proteína, de solo verduras, un desayuno, un plato fuerte, algo ligero, típico de Oaxaca o para una fiesta (Día de Muertos, Navidad, Día de las Madres…).\n' +
          '• Mostrarte lo que ya está preparado: postres, fresas con crema, comida corrida, pan, bebidas…\n' +
          '• Explicarte cómo se prepara cada receta, paso a paso, y cuánto rinde para tus invitados.\n' +
          '• Decirte en qué tienda conviene comprar: comparo por estrellas, precio, cercanía y si entregan a domicilio, y siempre te muestro todas las tiendas que tienen lo que buscas.\n' +
          '• Contarte qué hay hoy, las promociones y los regalos de cada temporada.',
      },
      { t: 'ideas', grupos: gruposInicio(ctx.ahora) },
    ],
    chips: chipsInicio(ctx.ahora),
  };
}

const gracias = (ctx: Ctx): Parcial => ({
  bloques: [{ t: 'texto', texto: pick(['¡Con gusto! ¿Se te antoja algo más?', '¡Para eso estoy! Si quieres otra idea, dime.', 'Qué bueno. Aquí sigo por si se te ocurre otro antojo.'], ctx.mem.turno) }],
  chips: ['Otra opción', 'Algo barato', 'Tiendas mejor calificadas'],
});

const despedida = (ctx: Ctx): Parcial => ({
  bloques: [{ t: 'texto', texto: pick(['¡Que aproveche! Aquí estaré cuando quieras otra idea.', '¡Buen provecho! Vuelve cuando tengas otro antojo.'], ctx.mem.turno) }],
  chips: [],
});

/* ───────── seguimiento ───────── */

function otra(e: Entendido, ctx: Ctx): Parcial {
  const { mem } = ctx;
  const soloPersonas = !!e.personas && !e.pideOtra && !e.rapido && !e.economico && !e.vegetariano && !e.caliente && !e.sinPrisa;
  if (soloPersonas && mem.ultimaReceta) {
    const r = receta(mem.ultimaReceta);
    const base = pasos(ctx);
    if (r && e.personas) base.bloques.push({ t: 'texto', texto: textoPorciones(r.por, e.personas) });
    base.mem = { personas: e.personas };
    return base;
  }
  const hayContexto = mem.recetasMostradas.length > 0 || !!mem.sabor || !!mem.momento || mem.ingredientes.length > 0;
  return sugerir(e, ctx, hayContexto);
}

function ingrediente(e: Entendido, ctx: Ctx): Parcial {
  const a = producto(e, ctx);
  if (!a.ok) {
    if (e.recetas.length) {
      const pre = recetaNombrada(e, ctx);
      return {
        bloques: [
          a.bloques[0],
          { t: 'texto', texto: `Pero puedes prepararl${/s$/i.test(e.dicho.trim()) ? 'os' : 'o'} en casa. Te dejo la receta de **${e.recetas[0].nombre}**:` },
          ...pre.bloques.slice(1),
        ],
        chips: pre.chips,
        mem: pre.mem,
      };
    }
    a.bloques.push({ t: 'texto', texto: 'Si ya lo tienes en casa, dime «tengo ...» y busco recetas con eso.' });
    return a;
  }
  const b = sugerir({ ...e, tipo: 'sugerir' }, ctx);
  const recetas = b.bloques.filter((x) => x.t === 'receta').slice(0, 2);
  if (!recetas.length) return a;
  return {
    bloques: [
      ...a.bloques,
      { t: 'texto', texto: 'Y con eso puedes preparar:' },
      ...recetas.map((x) => (x.t === 'receta' ? { ...x, verPasos: false } : x)),
    ],
    chips: b.chips,
    mem: { ...a.mem, ...b.mem },
    ok: true,
  };
}

function recetaDesconocida(e: Entendido, ctx: Ctx): Parcial {
  const que = e.palabras.slice(0, 4).join(' ');
  return {
    bloques: [
      {
        t: 'texto',
        texto: `Todavía no tengo la receta de «${que}» en mi recetario. Puedo proponerte otras con lo que hay hoy en las tiendas; cuéntame si se te antoja algo dulce, salado o picante, o qué ingredientes tienes.`,
      },
    ],
    chips: CHIPS_INICIO.slice(0, 4),
  };
}

function nada(e: Entendido, ctx: Ctx): Parcial {
  if (e.palabras.length && ctx.cat.items.length && buscarPorNombre(ctx.cat, e.palabras).length) {
    return producto({ ...e, tipo: 'producto' }, ctx);
  }
  // «Dónde hay caviar»: si preguntó dónde conseguir algo que nadie tiene publicado, se le dice claro (no «no te entendí»)
  if (e.pideDonde && e.palabras.length >= 1 && e.palabras.length <= 3) return producto({ ...e, tipo: 'producto' }, ctx);
  return {
    bloques: [
      {
        t: 'texto',
        texto: pick(
          [
            'No estoy seguro de haberte entendido. Puedo decirte qué cocinar con lo que hay en las tiendas: cuéntame si se te antoja algo dulce, salado o picante, qué ingredientes tienes, o pregúntame dónde encontrar un producto.',
            'Eso no lo tengo claro todavía. Prueba con algo como «se me antoja algo dulce», «qué cocino con papa» o «dónde hay quesillo».',
          ],
          ctx.mem.turno,
        ),
      },
    ],
    chips: CHIPS_INICIO.slice(0, 4),
  };
}

/* ───────── punto de entrada ───────── */

/** Primer mensaje al abrir el chat. */
export function bienvenida(cat: Catalogo, opciones: Opciones = {}): Respuesta {
  const ctx: Ctx = { cat, mem: MEMORIA_INICIAL, ahora: opciones.ahora ?? new Date(), nombre: opciones.nombre };
  const p = saludo(ctx);
  return { bloques: p.bloques, sugerencias: p.chips, memoria: { ...MEMORIA_INICIAL } };
}

/**
 * Responde a un mensaje. Solo usa lo que las tiendas tienen publicado (el catálogo) y las recetas
 * que ya conoce; nunca inventa que un producto existe.
 */
export function responder(texto: string, cat: Catalogo, memoria: Memoria = MEMORIA_INICIAL, opciones: Opciones = {}): Respuesta {
  const ctx: Ctx = { cat, mem: memoria, ahora: opciones.ahora ?? new Date(), nombre: opciones.nombre };
  const e = entender(texto, cat.negocios, memoria);
  const refiere = /\b(eso|ese|esa|esos|esas|lo mismo|con ello)\b/.test(norm(texto));

  let p: Parcial;
  switch (e.tipo) {
    case 'saludo':
      p = saludo(ctx);
      break;
    case 'gracias':
      p = gracias(ctx);
      break;
    case 'despedida':
      p = despedida(ctx);
      break;
    case 'ayuda':
      p = ayuda(ctx);
      break;
    case 'pasos':
      p = pasos(ctx);
      break;
    case 'donde':
      p = dondeComprar(ctx);
      break;
    case 'otra':
      p = otra(e, ctx);
      break;
    case 'recetas':
      p = recetaNombrada(e, ctx);
      break;
    case 'producto':
      p = producto(e, ctx);
      break;
    case 'tienda':
      p = tienda(e, ctx);
      break;
    case 'cerca':
      p = cerca(ctx);
      break;
    case 'hoy':
      p = hoy(ctx);
      break;
    case 'avisos':
      p = avisos(ctx, e);
      break;
    case 'tiendas':
      p = tiendas(e, ctx);
      break;
    case 'ordenar':
      p = ordenar(e, ctx);
      break;
    case 'ingrediente':
      p = ingrediente(e, ctx);
      break;
    case 'receta_desconocida':
      p = recetaDesconocida(e, ctx);
      break;
    case 'sugerir':
      p = sugerir(e, ctx, false, refiere);
      break;
    default:
      p = nada(e, ctx);
  }

  const mem: Memoria = { ...memoria, ...(p.mem ?? {}), turno: memoria.turno + 1 };
  if (e.vegetariano) mem.vegetariano = true;
  if (e.dieta === 'carne' && !e.vegetariano) mem.vegetariano = false;
  if (e.personas) mem.personas = e.personas;
  const largo = e.tipo === 'saludo' || e.tipo === 'ayuda';
  return { bloques: p.bloques, sugerencias: p.chips.slice(0, largo ? 12 : 5), memoria: mem };
}
