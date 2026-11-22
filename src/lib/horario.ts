import type { HorarioSemana, RangoHorario } from '../data/tipos';

/**
 * Horario de la semana de un negocio: lo que se guarda, cómo se lee y cómo se escribe para que lo lean los clientes.
 * Es una copia exacta de lo que hace la base de datos (supabase/actualizacion-v2-productos.sql, sección 5), para que la
 * pantalla diga lo mismo que va a hacer la base: abrir y cerrar el negocio sola.
 *
 * Los días van de domingo (lugar 0) a sábado (lugar 6), igual que `Date.getDay()`. Cada día es `null` (cerrado) o
 * hasta 2 tramos ["08:00", "14:00"]. Si un tramo termina «antes» de empezar (["19:00", "02:00"]) pasa de medianoche.
 * «24:00» sirve como final del día.
 *
 * Esta carpeta no importa nada de react-native: se puede probar con node.
 * Autor: José David Pérez Miguel
 */

export const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'] as const;
export const DIAS_CORTOS = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;
/** Cómo se muestran los días en pantalla: la semana empieza el lunes. */
export const ORDEN_DIAS = [1, 2, 3, 4, 5, 6, 0] as const;

/** Oaxaca (como todo el centro de México) está en UTC−6 todo el año desde 2022. La base de datos usa esa misma hora. */
const DESFASE_MS = -6 * 60 * 60 * 1000;
const MIN_DIA = 1440;

/** "08:00" → 480 · "24:00" → 1440 · cualquier otra cosa → null. */
export function horaAMinutos(p: unknown): number | null {
  if (typeof p !== 'string') return null;
  if (p === '24:00') return MIN_DIA;
  const m = /^([01][0-9]|2[0-3]):([0-5][0-9])$/.exec(p);
  return m ? Number(m[1]) * 60 + Number(m[2]) : null;
}

/** 480 → "08:00" · 1440 → "24:00". */
export function minutosAHora(min: number): string {
  const m = Math.max(0, Math.min(MIN_DIA, Math.round(min)));
  if (m === MIN_DIA) return '24:00';
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}

/** "14:30" → "2:30 PM" · "24:00" → "medianoche" · "00:00" → "12:00 AM". */
export function horaBonita(p: string): string {
  const m = horaAMinutos(p);
  if (m == null) return p;
  if (m === MIN_DIA) return 'medianoche';
  const h = Math.floor(m / 60);
  const min = m % 60;
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(min).padStart(2, '0')} ${h < 12 ? 'AM' : 'PM'}`;
}

/** ¿El tramo sirve? Las dos horas existen, no son la misma y el inicio no es «24:00». */
export function rangoValido(r: unknown): r is RangoHorario {
  if (!Array.isArray(r) || r.length !== 2) return false;
  const a = horaAMinutos(r[0]);
  const b = horaAMinutos(r[1]);
  return a != null && b != null && a !== b && a !== MIN_DIA;
}

/** ¿La semana tiene la forma que acepta la base de datos? (7 días, cada uno cerrado o con hasta 2 tramos válidos). */
export function semanaValida(s: unknown): s is HorarioSemana {
  if (!Array.isArray(s) || s.length !== 7) return false;
  return s.every((d) => d === null || (Array.isArray(d) && d.length <= 2 && d.every(rangoValido)));
}

/** Lee el horario que viene de la base de datos. Si no sirve, devuelve `undefined` (se ignora). */
export function leerSemana(v: unknown): HorarioSemana | undefined {
  let x = v;
  if (typeof x === 'string') {
    try {
      x = JSON.parse(x);
    } catch {
      return undefined;
    }
  }
  return semanaValida(x) ? (x as HorarioSemana) : undefined;
}

export const semanaVacia = (): HorarioSemana => [null, null, null, null, null, null, null];

/** Copia con el día cambiado (sin tocar la original). */
export function ponerDia(s: HorarioSemana, dia: number, rangos: RangoHorario[] | null): HorarioSemana {
  return s.map((d, i) => (i === dia ? (rangos && rangos.length > 0 ? rangos.map((r) => [r[0], r[1]] as RangoHorario) : null) : d));
}

/** Copia con los mismos tramos de un día puestos en otros días. */
export function copiarDia(s: HorarioSemana, desde: number, haciaDias: number[]): HorarioSemana {
  const origen = s[desde];
  return s.map((d, i) => (haciaDias.includes(i) ? (origen ? origen.map((r) => [r[0], r[1]] as RangoHorario) : null) : d));
}

/** Los mismos tramos en todos los días de la lista y cerrado en los demás. */
export function semanaDe(dias: readonly number[], rangos: RangoHorario[]): HorarioSemana {
  return semanaVacia().map((_, i) => (dias.includes(i) ? rangos.map((r) => [r[0], r[1]] as RangoHorario) : null));
}

export const sinHorario = (s: HorarioSemana | undefined | null) => !s || s.every((d) => d === null);

/** Pone los tramos de cada día en orden (primero el que empieza antes) y deja los días sin tramos como «cerrado». */
export function ordenarSemana(s: HorarioSemana): HorarioSemana {
  return s.map((d) => {
    if (!d || d.length === 0) return null;
    return [...d].sort((a, b) => (horaAMinutos(a[0]) ?? 0) - (horaAMinutos(b[0]) ?? 0)).map((r) => [r[0], r[1]] as RangoHorario);
  });
}

/** Hora de Oaxaca: día de la semana (0 = domingo) y minutos desde la medianoche. */
export function enOaxaca(ms: number = Date.now()): { dia: number; min: number } {
  const d = new Date(ms + DESFASE_MS);
  return { dia: d.getUTCDay(), min: d.getUTCHours() * 60 + d.getUTCMinutes() };
}

/** ¿A esa hora el horario dice que está abierto? (igual que `_horario_abierto` de la base de datos). */
export function abiertoSegun(s: HorarioSemana, ms: number = Date.now()): boolean {
  const { dia, min } = enOaxaca(ms);
  const ayer = (dia + 6) % 7;
  for (const r of s[dia] ?? []) {
    const a = horaAMinutos(r[0]);
    const b = horaAMinutos(r[1]);
    if (a == null || b == null) continue;
    if (b > a) {
      if (min >= a && min < b) return true;
    } else if (min >= a) {
      return true;
    }
  }
  // La parte de madrugada de lo que ayer pasó de medianoche
  for (const r of s[ayer] ?? []) {
    const a = horaAMinutos(r[0]);
    const b = horaAMinutos(r[1]);
    if (a == null || b == null) continue;
    if (b <= a && min < b) return true;
  }
  return false;
}

export interface CambioDeHorario {
  /** Lo que pasa en ese momento: se abre o se cierra. */
  abre: boolean;
  /** Cuándo (milisegundos). */
  en: number;
}

/** El siguiente momento en que el horario abre o cierra el negocio (en los próximos 8 días), o `null` si nunca cambia. */
export function proximoCambio(s: HorarioSemana, ms: number = Date.now()): CambioDeHorario | null {
  if (sinHorario(s)) return null;
  // Se empieza en el minuto exacto actual y se avanza de minuto en minuto
  const inicio = Math.floor(ms / 60000) * 60000;
  const ahora = abiertoSegun(s, inicio);
  for (let i = 1; i <= 8 * MIN_DIA; i++) {
    const t = inicio + i * 60000;
    const abierto = abiertoSegun(s, t);
    if (abierto !== ahora) return { abre: abierto, en: t };
  }
  return null;
}

/** «hoy a las 4:00 PM», «mañana a las 8:00 AM», «el lunes a las 8:00 AM». */
export function cuandoTexto(en: number, ahora: number = Date.now()): string {
  const b = enOaxaca(en);
  const diaDe = (ms: number) => Math.floor((ms + DESFASE_MS) / 86400000);
  const dif = diaDe(en) - diaDe(ahora);
  const hora = horaBonita(minutosAHora(b.min));
  if (dif <= 0) return `hoy a las ${hora}`;
  if (dif === 1) return `mañana a las ${hora}`;
  return `el ${DIAS[b.dia].toLowerCase()} a las ${hora}`;
}

/* ───────── cómo se escribe el horario para los clientes ───────── */

const tramosTexto = (rangos: RangoHorario[]) => rangos.map((r) => `${horaBonita(r[0])} a ${horaBonita(r[1])}`).join(' y ');

function etiquetaDias(dias: number[]): string {
  // Los días se agrupan en tramos seguidos (de lunes a domingo): «Lun a Jue y Dom»
  const lugares = dias.map((d) => ORDEN_DIAS.indexOf(d as (typeof ORDEN_DIAS)[number])).sort((a, b) => a - b);
  const tramos: number[][] = [];
  for (const l of lugares) {
    const ult = tramos[tramos.length - 1];
    if (ult && l === ult[ult.length - 1] + 1) ult.push(l);
    else tramos.push([l]);
  }
  const nombres = tramos.map((t) => {
    const n = t.map((l) => DIAS_CORTOS[ORDEN_DIAS[l]]);
    if (n.length === 1) return n[0];
    if (n.length === 2) return `${n[0]} y ${n[1]}`;
    return `${n[0]} a ${n[n.length - 1]}`;
  });
  if (nombres.length <= 1) return nombres[0] ?? '';
  return `${nombres.slice(0, -1).join(', ')} y ${nombres[nombres.length - 1]}`;
}

/** El horario escrito: «Lun a Sáb 8:00 AM a 2:00 PM y 4:00 PM a 8:00 PM · Dom cerrado». Es lo que ven los clientes. */
export function textoHorario(s: HorarioSemana): string {
  if (sinHorario(s)) return '';
  const firma = (d: RangoHorario[] | null) => (d && d.length > 0 ? tramosTexto(d) : 'cerrado');
  const dias = ORDEN_DIAS.map((i) => ({ i, f: firma(s[i]) }));
  if (dias.every((x) => x.f === dias[0].f)) {
    const r = s[ORDEN_DIAS[0]];
    if (r && r.length === 1 && r[0][0] === '00:00' && r[0][1] === '24:00') return 'Abierto las 24 horas';
    return `Todos los días ${dias[0].f}`;
  }
  const grupos: { dias: number[]; f: string }[] = [];
  for (const x of dias) {
    const ult = grupos[grupos.length - 1];
    if (ult && ult.f === x.f) ult.dias.push(x.i);
    else grupos.push({ dias: [x.i], f: x.f });
  }
  const partes = grupos.map((g) => `${etiquetaDias(g.dias)} ${g.f}`);
  // Los días cerrados se juntan al final para que se lea más fácil
  const abiertos = partes.filter((_, i) => grupos[i].f !== 'cerrado');
  const cerrados = grupos.filter((g) => g.f === 'cerrado').flatMap((g) => g.dias);
  const texto = abiertos.join(' · ') + (cerrados.length ? ` · ${etiquetaDias(cerrados)} cerrado` : '');
  return texto.slice(0, 300);
}

/** Algunos horarios comunes para empezar y luego ajustar. */
export const PLANTILLAS: { id: string; nombre: string; semana: HorarioSemana }[] = [
  { id: 'lun-sab', nombre: 'Lunes a sábado, 8:00 a 20:00', semana: semanaDe([1, 2, 3, 4, 5, 6], [['08:00', '20:00']]) },
  { id: 'diario', nombre: 'Todos los días, 8:00 a 21:00', semana: semanaDe([0, 1, 2, 3, 4, 5, 6], [['08:00', '21:00']]) },
  { id: 'partido', nombre: 'Lunes a sábado, mañana y tarde', semana: semanaDe([1, 2, 3, 4, 5, 6], [['08:00', '14:00'], ['16:00', '20:00']]) },
  { id: 'noche', nombre: 'Jueves a domingo, 19:00 a 2:00', semana: semanaDe([4, 5, 6, 0], [['19:00', '02:00']]) },
  { id: '24h', nombre: 'Las 24 horas', semana: semanaDe([0, 1, 2, 3, 4, 5, 6], [['00:00', '24:00']]) },
];

/** Dice qué está mal en el horario, con palabras sencillas; `null` si todo está bien. */
export function revisarSemana(s: HorarioSemana): string | null {
  if (!semanaValida(s)) return 'El horario no está completo. Revisa cada día.';
  for (let i = 0; i < 7; i++) {
    const rangos = s[i];
    if (!rangos) continue;
    for (const r of rangos) {
      if (r[0] === r[1]) return `${DIAS[i]}: la hora de abrir y la de cerrar no pueden ser la misma.`;
    }
    if (rangos.length === 2) {
      // Dos tramos que se encimen no tienen sentido (solo se comparan los que no pasan de medianoche)
      const [a, b] = rangos.map((r) => [horaAMinutos(r[0]) ?? 0, horaAMinutos(r[1]) ?? 0] as const);
      const normales = a[1] > a[0] && b[1] > b[0];
      if (normales && a[0] < b[1] && b[0] < a[1]) return `${DIAS[i]}: los dos horarios se encimen. Cambia uno de ellos.`;
    }
  }
  if (sinHorario(s)) return 'Marca al menos un día en que abres.';
  return null;
}
