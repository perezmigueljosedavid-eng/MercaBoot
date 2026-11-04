// Revisa src/config.ts ANTES de armar el APK (lo usa .github/workflows/build-apk.yml; también sirve a mano:
//   node scripts/revisar-config.cjs
//
//  · Si siguen los datos de ejemplo (REEMPLAZA-ESTO) → "lista=false": el APK sale de prueba y NO se publica en Releases,
//    porque una app sin base de datos solo muestra una pantalla que explica qué falta.
//  · Si en la llave hay un secreto (service_role / secret) → termina con error: esa llave NUNCA debe ir dentro de la app.
//  · Si la dirección del proyecto no tiene la forma https://xxxx.supabase.co → termina con error.
//
// Solo lee el archivo; no imprime la llave completa.
const fs = require('fs');

const archivo = process.argv[2] || 'src/config.ts';
const texto = fs.readFileSync(archivo, 'utf8');

function tomar(nombre) {
  const m = texto.match(new RegExp(`const ${nombre} = '([^']*)'`));
  return m ? m[1].trim() : '';
}

/** Si la llave es un JWT (formato eyJ…), devuelve el «role» que trae adentro; si no, null. */
function rolDeLaLlave(llave) {
  const partes = llave.split('.');
  if (partes.length !== 3) return null;
  try {
    const json = Buffer.from(partes[1].replace(/-/g, '+').replace(/_/g, '/'), 'base64').toString('utf8');
    return JSON.parse(json).role || null;
  } catch {
    return null;
  }
}

function salida(lista) {
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `lista=${lista}\n`);
}

function fallar(mensaje) {
  console.error(`✗ ${mensaje}`);
  salida('false');
  process.exit(1);
}

const url = tomar('URL_NUBE');
const llave = tomar('LLAVE_PUBLICA');

if (!url || !llave || /REEMPLAZA/i.test(url + llave)) {
  console.log('• src/config.ts todavía tiene los datos de ejemplo (REEMPLAZA-ESTO).');
  console.log('  El APK se arma de PRUEBA (sin base de datos) y NO se publica en Releases.');
  console.log('  Pega la dirección del proyecto y la llave pública de Supabase en src/config.ts para el APK final.');
  salida('false');
  process.exit(0);
}

if (!/^https:\/\/[^\s/]+\/?$/.test(url)) {
  fallar('La dirección del proyecto (URL_NUBE) debe verse como https://xxxxxxxx.supabase.co, sin nada después del dominio.');
}
if (/\s/.test(llave) || llave.length < 20) {
  fallar('La llave pública (LLAVE_PUBLICA) está incompleta o tiene espacios. Cópiala otra vez, completa.');
}
if (/^sb_secret_/i.test(llave)) {
  fallar('Esa es una llave SECRETA (sb_secret_…). Jamás va dentro de la app. Usa la llave pública (sb_publishable_… o «anon»).');
}
const rol = rolDeLaLlave(llave);
if (rol && rol !== 'anon') {
  fallar(`Esa llave tiene el rol «${rol}». Jamás va dentro de la app. Usa la llave pública «anon» (o la «publishable»).`);
}

const tipo = /^sb_publishable_/i.test(llave) ? 'publishable' : rol === 'anon' ? 'anon' : 'pública (formato desconocido)';
console.log(`✓ src/config.ts listo: ${url.replace(/\/$/, '')} · llave ${tipo} (${llave.slice(0, 6)}…, ${llave.length} caracteres)`);
salida('true');
