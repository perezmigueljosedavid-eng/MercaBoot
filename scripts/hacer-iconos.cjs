// Genera los 4 íconos de la app (assets/*.png): la bolsa con palomita de Mercaboot.
// Uso (desde la carpeta del proyecto):
//   npm i --no-save sharp
//   node scripts/hacer-iconos.cjs
// GitHub lo ejecuta solo al compilar el APK (ver .github/workflows/build-apk.yml).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const VERDE = '#1F7A4D';
const BLANCO = '#FFFFFF';
// Mismo dibujo que el ícono «bagCheck» de src/ui/Icon.tsx (cuadrícula de 24 × 24).
const BOLSA = [
  'M5 8h14l-1.2 11.1a2 2 0 0 1-2 1.9H8.2a2 2 0 0 1-2-1.9z',
  'M9 8V6a3 3 0 0 1 6 0v2',
  'M9.5 13.5 11 15l3.5-3.5',
];

// La bolsa centrada en un lienzo de 1024 × 1024; «caja» es el tamaño (en px) de su cuadrícula de 24.
function glifo(color, caja, grosor = 1.5) {
  const escala = caja / 24;
  const origen = (1024 - caja) / 2;
  const trazos = BOLSA.map((d) => `<path d="${d}"/>`).join('');
  return (
    `<g transform="translate(${origen} ${origen}) scale(${escala})" fill="none" stroke="${color}"` +
    ` stroke-width="${grosor}" stroke-linecap="round" stroke-linejoin="round">${trazos}</g>`
  );
}

const lienzo = (contenido) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${contenido}</svg>`;

const dibujos = {
  // Ícono de la app: bolsa blanca sobre fondo verde.
  'icon.png': lienzo(`<rect width="1024" height="1024" fill="${VERDE}"/>${glifo(BLANCO, 600)}`),
  // Primer plano del ícono adaptable de Android: solo la bolsa blanca, sin fondo.
  'adaptive-icon.png': lienzo(glifo(BLANCO, 520)),
  // Pantalla de inicio: baldosa blanca con la bolsa verde (el fondo verde lo pone app.json).
  'splash-icon.png': lienzo(`<rect x="192" y="192" width="640" height="640" rx="190" fill="${BLANCO}"/>${glifo(VERDE, 350, 1.8)}`),
};

async function main() {
  const carpeta = path.join(__dirname, '..', 'assets');
  fs.mkdirSync(carpeta, { recursive: true });
  for (const [nombre, svg] of Object.entries(dibujos)) {
    const destino = path.join(carpeta, nombre);
    const imagen = sharp(Buffer.from(svg));
    // El ícono principal no lleva transparencia.
    await (nombre === 'icon.png' ? imagen.flatten({ background: VERDE }) : imagen).png().toFile(destino);
    console.log('listo:', destino);
  }
  // Ícono de la versión web: el ícono principal en 256 × 256.
  const favicon = path.join(carpeta, 'favicon.png');
  await sharp(path.join(carpeta, 'icon.png')).resize(256, 256).flatten({ background: VERDE }).png().toFile(favicon);
  console.log('listo:', favicon);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
