// Revisa que a la app NO le falte un permiso de Android que necesita (lo usa .github/workflows/build-apk.yml; también sirve a mano).
//
//   node scripts/revisar-permisos.cjs [android/app/src/main/AndroidManifest.xml]
//        → revisa el proyecto que arma «npx expo prebuild» (se corre ANTES de la compilación larga)
//   node scripts/revisar-permisos.cjs --apk permisos-apk.txt
//        → revisa el APK ya armado (el archivo es lo que imprime «aapt2 dump permissions Mercaboot-v2.apk»)
//
// Por qué existe: un plugin de Expo puede BLOQUEAR un permiso para TODO el proyecto (en el manifiesto queda con
// tools:node="remove"). Pasó con «cameraPermission: false» del plugin expo-image-picker: quitó la cámara también al escáner
// de códigos, al lector de QR y a «Desde una foto», y nadie lo notó hasta mirar el APK. Esta revisión detiene la compilación
// y explica qué pasó, en vez de entregar un APK al que le falta la cámara.
//
// Solo lee el archivo; no cambia nada.
// Autor: José David Pérez Miguel
const fs = require('fs');

// Permisos que la app necesita sí o sí, y para qué (el texto sale en el mensaje de error).
const NECESARIOS_PROYECTO = [
  ['android.permission.CAMERA', 'el escáner de códigos de barras, el lector de QR de un negocio y «Desde una foto»'],
  ['android.permission.INTERNET', 'hablar con la base de datos (sin esto la app no carga nada)'],
  ['android.permission.ACCESS_COARSE_LOCATION', 'mostrar primero los negocios más cercanos'],
  ['android.permission.ACCESS_FINE_LOCATION', 'mostrar primero los negocios más cercanos'],
];
// En el APK ya armado también está el que agrega la librería de avisos (en el proyecto todavía no aparece, se suma al armar).
const NECESARIOS_APK = [...NECESARIOS_PROYECTO, ['android.permission.POST_NOTIFICATIONS', 'los avisos (Android 13 en adelante)']];

// Bloqueados a propósito: la app no graba audio.
const BLOQUEADOS_A_PROPOSITO = new Set(['android.permission.RECORD_AUDIO']);

const args = process.argv.slice(2);
const modoApk = args[0] === '--apk';
const archivo = modoApk ? args[1] : args[0] || 'android/app/src/main/AndroidManifest.xml';
if (!archivo) {
  console.error('Uso: node scripts/revisar-permisos.cjs [AndroidManifest.xml]   ·   node scripts/revisar-permisos.cjs --apk permisos-apk.txt');
  process.exit(2);
}

let texto;
try {
  texto = fs.readFileSync(archivo, 'utf8');
} catch {
  console.error(`Error: no encuentro el archivo ${archivo}.`);
  process.exit(2);
}

const declarados = new Set();
const bloqueados = new Set();
if (modoApk) {
  // Cada línea: uses-permission: name='android.permission.CAMERA' (a veces con maxSdkVersion='32')
  for (const m of texto.matchAll(/^uses-permission(?:-sdk-23)?:\s*name='([^']+)'/gm)) declarados.add(m[1]);
} else {
  // Cada etiqueta: <uses-permission android:name="android.permission.CAMERA" tools:node="remove"/>
  for (const m of texto.matchAll(/<uses-permission\b[^>]*>/g)) {
    const nombre = /android:name="([^"]+)"/.exec(m[0]);
    if (!nombre) continue;
    if (/tools:node="remove"/.test(m[0])) bloqueados.add(nombre[1]);
    else declarados.add(nombre[1]);
  }
}

const necesarios = modoApk ? NECESARIOS_APK : NECESARIOS_PROYECTO;
const fallas = [];
for (const [permiso, para] of necesarios) {
  if (declarados.has(permiso)) continue;
  const corto = permiso.replace('android.permission.', '');
  if (bloqueados.has(permiso)) {
    fallas.push(
      `${corto} está BLOQUEADO (tools:node="remove") y la app lo necesita para ${para}. ` +
        (permiso.endsWith('.CAMERA')
          ? 'Casi siempre es «"cameraPermission": false» en el plugin expo-image-picker de app.json: en vez de false va un texto en español.'
          : 'Revisa en app.json qué plugin lo bloquea (un valor false en sus opciones, o android.blockedPermissions).'),
    );
  } else {
    fallas.push(`${corto} no está en ${modoApk ? 'el APK' : 'el proyecto'} y la app lo necesita para ${para}.`);
  }
}

const inesperados = [...bloqueados].filter((p) => !BLOQUEADOS_A_PROPOSITO.has(p) && !necesarios.some(([n]) => n === p));
if (inesperados.length) console.log(`• Aviso: también hay permisos bloqueados: ${inesperados.map((p) => p.replace('android.permission.', '')).join(', ')}.`);

if (fallas.length) {
  for (const f of fallas) console.error(`Error: ${f}`);
  console.error('✗ La compilación se detiene aquí para no entregar una app a la que le falta algo que necesita.');
  process.exit(1);
}

console.log(
  `✓ Permisos en orden (${modoApk ? 'APK' : 'proyecto'}): ${necesarios.map(([p]) => p.replace('android.permission.', '')).join(', ')}.`,
);
