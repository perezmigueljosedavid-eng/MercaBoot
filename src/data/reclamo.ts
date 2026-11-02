import { SEMILLA_NEGOCIOS } from './semilla';
import type { Negocio } from './tipos';

/**
 * Seguridad para reclamar un negocio del directorio.
 *
 * Los negocios de src/data/semilla.ts aparecen en Mercaboot sin dueño. Para que nadie pueda quedarse con
 * una tienda ajena (ni por equivocación), cada una tiene un CÓDIGO DE RECLAMO secreto que el equipo de
 * Mercaboot le entrega solo al dueño de verdad. Sin el código correcto, la tienda no se puede reclamar.
 *
 * Aquí NO está el código: solo su "huella" (hash SHA-256). De una huella no se puede leer el código.
 * Para crear o cambiar un código:   node scripts/codigo-reclamo.mjs <id-del-negocio>
 * y pegar la línea que te da en HASHES_RECLAMO. Un negocio sin línea aquí NO se puede reclamar.
 *
 * Importante: mientras Mercaboot no tenga servidor en la nube, esta revisión ocurre dentro de la app.
 * Con la nube (Firebase) la misma regla la revisa el servidor y ya no depende del teléfono.
 */

/** A quién le piden su código los dueños. Cámbialo por tu WhatsApp o correo, por ejemplo «por WhatsApp al 951 000 0000». */
export const DONDE_PEDIR_CODIGO = 'al equipo de Mercaboot';

/** id del negocio → huella de su código de reclamo. */
export const HASHES_RECLAMO: Record<string, string> = {
  'carniceria-san-javier': '53d800e2eb3d91be37f691e4b61f500be7710c2280b2b0b2efdf1fcfb8cef4c9',
  'tortilleria-el-maizito': '21d67d0f16bea04c72a52be199fd5398415c1b5f7bbc91a539f49172290992b6',
  'carniceria-keren': 'ff360245ddcbce478cbeb1fc2097f9d6c6dd6013a9fc656fc38af4ef0d924d92',
};

/** «k7m2 9qxp-4hwd» y «K7M2-9QXP-4HWD» son el mismo código: no importan mayúsculas, espacios ni guiones. */
export const normalizarCodigo = (t: string) => t.toUpperCase().replace(/[^A-Z0-9]/g, '');

/** Lo que se escribe en la huella. Debe ser idéntico a scripts/codigo-reclamo.mjs. */
export const textoParaHuella = (negocioId: string, codigo: string) => `${negocioId}:${normalizarCodigo(codigo)}:mercaboot-reclamo`;

/* ───────── límite de intentos ───────── */

export interface Limitador {
  /** Milisegundos que faltan para poder intentar otra vez (0 si ya se puede). */
  espera: () => number;
  /** Anota un intento fallido y dice cuántos intentos quedan antes del bloqueo. */
  fallo: () => number;
  /** Un código correcto borra los intentos fallidos. */
  acierto: () => void;
}

/** Después de `max` códigos incorrectos seguidos, bloquea los intentos por `bloqueoMs`. */
export function crearLimitador(max = 5, bloqueoMs = 5 * 60_000, reloj: () => number = Date.now): Limitador {
  let fallos = 0;
  let hasta = 0;
  return {
    espera() {
      const t = reloj();
      if (hasta && t >= hasta) {
        hasta = 0;
        fallos = 0;
      }
      return hasta > t ? hasta - t : 0;
    },
    fallo() {
      fallos += 1;
      if (fallos >= max) hasta = reloj() + bloqueoMs;
      return Math.max(0, max - fallos);
    },
    acierto() {
      if (hasta > reloj()) return; // con el bloqueo activo, ni un acierto lo levanta
      fallos = 0;
      hasta = 0;
    },
  };
}

export function textoEspera(ms: number) {
  const min = Math.max(1, Math.ceil(ms / 60_000));
  return `Por seguridad esperamos unos minutos después de varios códigos incorrectos. Vuelve a intentar en ${min} ${min === 1 ? 'minuto' : 'minutos'}.`;
}

/* ───────── nombres parecidos a los del directorio ───────── */

const RELLENO_NOMBRE = new Set(['el', 'la', 'los', 'las', 'de', 'del', 'y', 'e']);

/** Un nombre sin acentos, mayúsculas, artículos ni orden: «Tortillería El Maizito» = «maizito tortilleria». */
export function claveDeNombre(nombre: string) {
  const palabras = nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .split(/[^a-z0-9]+/)
    .filter((w) => w && !RELLENO_NOMBRE.has(w));
  return [...new Set(palabras)].sort().join(' ');
}

/** El negocio del directorio que se llama igual (o casi) que este nombre; sirve para que nadie se haga pasar por otro. */
export function negocioDelDirectorioConNombre(nombre: string): Negocio | undefined {
  const clave = claveDeNombre(nombre);
  if (!clave) return undefined;
  return SEMILLA_NEGOCIOS.find((n) => claveDeNombre(n.nombre) === clave);
}
