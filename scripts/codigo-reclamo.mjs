#!/usr/bin/env node
/**
 * Códigos de reclamo de los negocios del directorio.
 *
 * Qué hace:   crea un código secreto para un negocio y te da el SQL que se pega en Supabase (SQL Editor).
 *             El código se lo entregas (en persona o por WhatsApp) al dueño de verdad. En la nube solo queda
 *             una "huella" (hash) del código, nunca el código escrito.
 *
 * Cómo usarlo (desde la carpeta del proyecto):
 *   node scripts/codigo-reclamo.mjs carniceria-keren
 *       → código nuevo para una tienda que YA existe en el directorio (reemplaza el anterior)
 *   node scripts/codigo-reclamo.mjs nueva-tienda "Nombre de la tienda" "Giro"
 *       → agrega una tienda nueva al directorio, con su código
 *   node scripts/codigo-reclamo.mjs --revisar carniceria-keren K7M2-9QXP-4HWD
 *       → dice si ese código corresponde al que quedó en supabase/esquema.sql
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
// Debe ser idéntico a lo que calcula la función comprobar_reclamo de supabase/esquema.sql.
const huella = (id, codigo) => createHash('sha256').update(`${id}:${normalizar(codigo)}:mercaboot-reclamo`).digest('hex');
const sql = (t) => `'${String(t).replace(/'/g, "''")}'`;

function codigoNuevo() {
  let c = '';
  for (let i = 0; i < LARGO; i++) c += ALFABETO[randomInt(ALFABETO.length)];
  return c.match(/.{4}/g).join('-');
}

function huellaGuardada(id) {
  const texto = readFileSync(join(raiz, 'supabase/esquema.sql'), 'utf8');
  const m = texto.match(new RegExp(`\\(\\s*'${id.replace(/[^a-z0-9-]/g, '')}'\\s*,\\s*'([0-9a-f]{64})'`));
  return m ? m[1] : undefined;
}

const [, , a, b, c] = process.argv;

if (a === '--revisar') {
  const codigo = process.argv.slice(4).join(' '); // el código puede venir con espacios: ky4q rvmc txp5
  if (!b || !codigo) {
    console.log('Uso: node scripts/codigo-reclamo.mjs --revisar <id-del-negocio> <código>');
    process.exit(1);
  }
  const esperado = huellaGuardada(b);
  if (!esperado) {
    console.log(`«${b}» no tiene código guardado en supabase/esquema.sql.`);
    process.exit(1);
  }
  const ok = huella(b, codigo) === esperado;
  console.log(ok ? `✔ El código SÍ corresponde a «${b}».` : `✘ El código NO corresponde a «${b}».`);
  process.exit(ok ? 0 : 1);
}

const id = (a ?? '').trim();
if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(id)) {
  console.log(
    'Uso:\n' +
      '  node scripts/codigo-reclamo.mjs <id-del-negocio>                       (código nuevo para una tienda que ya existe)\n' +
      '  node scripts/codigo-reclamo.mjs <id-nuevo> "Nombre" "Giro"            (tienda nueva en el directorio)\n' +
      '  node scripts/codigo-reclamo.mjs --revisar <id-del-negocio> <código>\n' +
      'El id va en minúsculas y con guiones, por ejemplo: carniceria-keren',
  );
  process.exit(1);
}

const codigo = codigoNuevo();
const h = huella(id, codigo);

console.log(`\nCÓDIGO DE RECLAMO de «${id}» (entrégaselo solo a su dueño y guárdalo en privado):\n`);
console.log(`  ${codigo}\n`);
console.log('Pega esto en Supabase → SQL Editor → Run:\n');
if (b) {
  const giro = c ?? 'Negocio';
  console.log(`insert into public.negocios (id, nombre, giro, a_domicilio, abierto) values (${sql(id)}, ${sql(b)}, ${sql(giro)}, false, true)`);
  console.log('on conflict (id) do nothing;\n');
  console.log('insert into public.negocios_reclamo (negocio_id, huella, original) values');
  console.log(`  (${sql(id)}, ${sql(h)},`);
  console.log(`   ${sql(JSON.stringify({ nombre: b, giro }))})`);
  console.log('on conflict (negocio_id) do update set huella = excluded.huella;\n');
} else {
  console.log(`update public.negocios_reclamo set huella = ${sql(h)} where negocio_id = ${sql(id)};\n`);
}
