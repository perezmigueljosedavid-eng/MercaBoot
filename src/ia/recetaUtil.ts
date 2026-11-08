import type { Momento, Sabor } from '../data/tipos';
import { INGREDIENTES } from './ingredientes';

export type { Momento };

export interface IngReceta {
  /** Ingredientes que sirven para este paso (cualquiera de ellos). */
  ids: string[];
  /** Cómo se escribe en la receta, con cantidad. */
  txt: string;
  /** Si falta, la receta no se puede hacer. */
  principal: boolean;
  opcional: boolean;
}

export interface Receta {
  id: string;
  nombre: string;
  sab: Sabor[];
  mom: Momento[];
  /** Minutos totales aproximados. */
  min: number;
  /** Porciones. */
  por: number;
  tags: string[];
  ing: IngReceta[];
  pasos: string[];
  tip?: string;
  /** No lleva carne, pollo ni pescado. */
  vegetariana: boolean;
  /** Lleva carne, pollo o pescado como ingrediente principal. */
  conCarne: boolean;
  /** Buena fuente de proteína: carne, huevo, queso, frijol o lentejas. */
  proteina: boolean;
  /** Qué parte de la receta son verduras (0 a 1); no cuenta la fruta ni los básicos de casa. */
  verduras: number;
}

const SABOR: Record<string, Sabor> = { D: 'dulce', S: 'salado', P: 'picante', A: 'acido', M: 'amargo' };
const MOMENTO: Record<string, Momento> = { d: 'desayuno', c: 'comida', n: 'cena', b: 'botana', p: 'postre', e: 'bebida' };

type Ing = [ids: string, txt: string, banderas?: string];

/** Ingredientes que cuentan como buena fuente de proteína (además de toda carne, ave y pescado). */
const PROTEICOS = new Set(['huevo', 'quesillo', 'queso', 'requeson', 'frijol', 'lenteja', 'yogurt', 'cacahuate']);
const ES_PROTEINA = (id: string) => PROTEICOS.has(id) || ['carne', 'ave', 'pescado'].includes(INGREDIENTES[id]?.cat ?? '');

/**
 * Crea una receta con una escritura corta.
 * sab: letras D S P A M · mom: letras d(esayuno) c(omida) n(cena) b(otana) p(ostre) e(bebida)
 * Ingredientes: [ids separados por "|", texto, "p" = principal, "o" = opcional]
 */
export function R(
  id: string,
  nombre: string,
  sab: string,
  mom: string,
  min: number,
  por: number,
  tags: string,
  ing: Ing[],
  pasos: string[],
  tip?: string,
): Receta {
  const lista: IngReceta[] = ing.map(([ids, txt, b = '']) => ({
    ids: ids.split('|'),
    txt,
    principal: b.includes('p'),
    opcional: b.includes('o'),
  }));
  const obligatorios = lista.filter((i) => !i.opcional);
  const conCarne = obligatorios.some((i) => i.ids.every((x) => ['carne', 'ave', 'pescado'].includes(INGREDIENTES[x]?.cat ?? '')));
  const proteina = obligatorios.some((i) => i.ids.every((x) => ES_PROTEINA(x)));
  // Qué parte del platillo son verduras (sin contar fruta, ni sal, aceite y demás básicos de casa).
  const aportan = obligatorios.filter((i) => !i.ids.every((x) => INGREDIENTES[x]?.casa));
  const verduras = aportan.length ? aportan.filter((i) => i.ids.every((x) => INGREDIENTES[x]?.cat === 'verdura')).length / aportan.length : 0;
  return {
    id,
    nombre,
    sab: sab.split('').map((l) => SABOR[l]),
    mom: mom.split('').map((l) => MOMENTO[l]),
    min,
    por,
    tags: [...tags.split(' ').filter(Boolean), ...(min <= 20 ? ['rapido'] : [])],
    ing: lista,
    pasos,
    tip,
    vegetariana: !conCarne,
    conCarne,
    proteina,
    verduras,
  };
}
