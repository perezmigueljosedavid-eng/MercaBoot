#!/usr/bin/env node
/**
 * Códigos de reclamo de los negocios del directorio.
 *
 * Qué hace:   crea un código secreto para un negocio y te da la línea que se pega en src/data/reclamo.ts.
 *             El código se lo entregas (en persona o por WhatsApp) al dueño de verdad. En la app solo queda
 *             una "huella" (hash) del código, nunca el código escrito.
 *
 * Cómo usarlo (desde la carpeta del proyecto):
 *   node scripts/codigo-reclamo.mjs --todos                    → códigos para todas las tiendas de src/data/semilla.ts
 *   node scripts/codigo-reclamo.mjs carniceria-keren           → un código nuevo para esa tienda
 *   node scripts/codigo-reclamo.mjs --revisar carniceria-keren K7M2-9QXP-4HWD
 *                                                              → dice si ese código corresponde al que está en la app
 *
 * Importante: guarda los códigos en un lugar privado (no en el proyecto ni en GitHub).
 */
import { createHash, randomInt } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const raiz = join(dirname(fileURLToPath(import.meta.url)), '..');

// Mismo alfabeto que usa la app: sin I, L, O, 0 ni 1 para que no se confundan al copiarlos.
const ALFABETO = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const LARGO = 12;

const normalizar = (t) => t.toUpperCase().replace(/[^A-Z0-9]/g, '');
const huella = (id, codigo) => createHash('sha256').update(`${id}:${normalizar(codigo)}:mercaboot-reclamo`).digest('hex');

function codigoNuevo() {
  let c = '';
  for (let i = 0; i < LARGO; i++) c += ALFABETO[randomInt(ALFABETO.length)];
  return c.match(/.{4}/g).join('-');
}

function idsDelDirectorio() {
  const texto = readFileSync(join(raiz, 'src/data/semilla.ts'), 'utf8');
  return [...texto.matchAll(/^\s+id:\s*'([^']+)'/gm)].map((m) => m[1]);
}

function huellasGuardadas() {
  const texto = readFileSync(join(raiz, 'src/data/reclamo.ts'), 'utf8');
  return Object.fromEntries([...texto.matchAll(/^\s+'([^']+)':\s*'([0-9a-f]{64})'/gm)].map((m) => [m[1], m[2]]));
}

const [, , a, b] = process.argv;
const c = process.argv.slice(4).join(' '); // el código puede venir con espacios: ky4q rvmc txp5

if (a === '--revisar') {
  if (!b || !c) {
    console.log('Uso: node scripts/codigo-reclamo.mjs --revisar <id-del-negocio> <código>');
    process.exit(1);
  }
  const esperado = huellasGuardadas()[b];
  if (!esperado) {
    console.log(`«${b}» no tiene código guardado en src/data/reclamo.ts.`);
    process.exit(1);
  }
  const ok = huella(b, c) === esperado;
  console.log(ok ? `✔ El código SÍ corresponde a «${b}».` : `✘ El código NO corresponde a «${b}».`);
  process.exit(ok ? 0 : 1);
}

const ids = a === '--todos' ? idsDelDirectorio() : a ? [a] : [];
if (!ids.length) {
  console.log('Uso:\n  node scripts/codigo-reclamo.mjs --todos\n  node scripts/codigo-reclamo.mjs <id-del-negocio>\n  node scripts/codigo-reclamo.mjs --revisar <id-del-negocio> <código>');
  process.exit(1);
}

const lineas = [];
console.log('\nCÓDIGOS DE RECLAMO (entrégaselos solo a cada dueño y guárdalos en privado):\n');
for (const id of ids) {
  const codigo = codigoNuevo();
  console.log(`  ${id.padEnd(28)} ${codigo}`);
  lineas.push(`  '${id}': '${huella(id, codigo)}',`);
}
console.log('\nPega estas líneas dentro de HASHES_RECLAMO en src/data/reclamo.ts (reemplazan a las anteriores del mismo negocio):\n');
console.log(lineas.join('\n'));
console.log('');
