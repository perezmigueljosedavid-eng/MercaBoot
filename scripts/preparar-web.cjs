// Deja lista la carpeta de la versión web para publicarla (GitHub Pages) y para instalarla en el celular.
//
// Uso (desde la carpeta del proyecto), después de  `npx expo export --platform web --output-dir dist`:
//   EXPO_WEB_BASE_URL=/MercaBoot node scripts/preparar-web.cjs dist
//
// Qué hace:
//   1. Cambia %BASE% por la ruta de la página (por ejemplo /MercaBoot) en index.html y manifest.json.
//   2. Copia index.html como 404.html: GitHub Pages lo muestra cuando alguien recarga o abre un enlace
//      directo (por ejemplo /MercaBoot/cliente), y la app arma la pantalla correcta desde la dirección.
//   3. Crea .nojekyll para que GitHub Pages no ignore las carpetas que empiezan con «_» (como _expo).
//   4. Revisa que no falte nada de lo que necesita la instalación («Añadir a pantalla de inicio»).
const fs = require('fs');
const path = require('path');

const carpeta = path.resolve(process.argv[2] || 'dist');
const base = (process.env.EXPO_WEB_BASE_URL || '').trim().replace(/\/+$/, '');

function leer(nombre) {
  const ruta = path.join(carpeta, nombre);
  if (!fs.existsSync(ruta)) {
    console.error(`✗ Falta ${nombre} en ${carpeta}. ¿Corriste «npx expo export --platform web --output-dir ${path.basename(carpeta)}» antes?`);
    process.exit(1);
  }
  return fs.readFileSync(ruta, 'utf8');
}

const html = leer('index.html').split('%BASE%').join(base);
const manifiesto = leer('manifest.json').split('%BASE%').join(base);

try {
  JSON.parse(manifiesto);
} catch (e) {
  console.error('✗ manifest.json no es un JSON válido:', e.message);
  process.exit(1);
}

fs.writeFileSync(path.join(carpeta, 'index.html'), html);
fs.writeFileSync(path.join(carpeta, 'manifest.json'), manifiesto);
fs.writeFileSync(path.join(carpeta, '404.html'), html);
fs.writeFileSync(path.join(carpeta, '.nojekyll'), '');

const m = JSON.parse(manifiesto);
const faltan = [];
for (const icono of m.icons) {
  const archivo = path.join(carpeta, icono.src.replace(new RegExp(`^${base}/`), ''));
  if (!fs.existsSync(archivo)) faltan.push(icono.src);
}
if (!fs.existsSync(path.join(carpeta, 'apple-touch-icon.png'))) faltan.push('apple-touch-icon.png');
for (const etiqueta of ['rel="manifest"', 'rel="apple-touch-icon"', 'apple-mobile-web-app-capable']) {
  if (!html.includes(etiqueta)) faltan.push(`etiqueta ${etiqueta} en index.html`);
}
if (/%BASE%/.test(html + manifiesto)) faltan.push('quedó un %BASE% sin cambiar');
if (faltan.length) {
  console.error('✗ La versión web no quedó completa. Falta:\n  - ' + faltan.join('\n  - '));
  process.exit(1);
}

console.log(`✓ Versión web lista en ${carpeta} (ruta base: «${base || '/'}»)`);
console.log(`  start_url: ${m.start_url} · íconos: ${m.icons.length} · 404.html y .nojekyll creados`);
