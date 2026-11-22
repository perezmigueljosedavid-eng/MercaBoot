// Revisa el archivo google-services.json ANTES de armar el APK (lo usa .github/workflows/build-apk.yml; también sirve a mano:
//   node scripts/revisar-firebase.cjs google-services.json com.mercaboot.v2
//
//  · Si el archivo no es un JSON válido de Firebase para Android → termina con error y explica qué pasó.
//  · Si en vez del google-services.json se pegó la llave PRIVADA de la cuenta de servicio (la que tiene «private_key»)
//    → termina con error: esa llave es secreta y jamás va dentro del APK ni en este archivo.
//  · Si el paquete de la app registrado en Firebase no coincide con el del APK → termina con error.
//
// Solo lee el archivo; no imprime llaves.
// Autor: José David Pérez Miguel
const fs = require('fs');

const archivo = process.argv[2] || 'google-services.json';
const paquete = process.argv[3] || 'com.mercaboot.v2';

function fallar(mensaje) {
  console.error(`✗ ${mensaje}`);
  process.exit(1);
}

let texto;
try {
  texto = fs.readFileSync(archivo, 'utf8');
} catch {
  fallar(`No encuentro el archivo ${archivo}.`);
}

let json;
try {
  json = JSON.parse(texto);
} catch {
  fallar(
    'El secreto GOOGLE_SERVICES_JSON no es un JSON válido. Abre el archivo google-services.json con el Bloc de notas, ' +
      'selecciona TODO (Ctrl+A), cópialo y pégalo completo como valor del secreto.',
  );
}

if (json && typeof json === 'object' && (json.private_key || json.type === 'service_account')) {
  fallar(
    'Pegaste la llave PRIVADA de la cuenta de servicio (la que dice «private_key»). Esa llave es secreta y NO va aquí: ' +
      'va solo en Supabase, como secreto FCM_SERVICE_ACCOUNT. Aquí va el archivo google-services.json que baja Firebase ' +
      'en «Configuración del proyecto → Tus apps → Android → google-services.json».',
  );
}

if (!json || typeof json !== 'object' || !json.project_info || !Array.isArray(json.client)) {
  fallar('Ese archivo no parece un google-services.json de Firebase (le falta «project_info» o «client»).');
}

const paquetes = json.client
  .map((c) => c && c.client_info && c.client_info.android_client_info && c.client_info.android_client_info.package_name)
  .filter(Boolean);

if (paquetes.length === 0) {
  fallar('Ese google-services.json no trae ninguna app de Android. En Firebase agrega una app Android y vuelve a bajarlo.');
}

if (!paquetes.includes(paquete)) {
  fallar(
    `El google-services.json es de otra app: trae «${paquetes.join('», «')}» y este APK es «${paquete}». ` +
      `En Firebase, agrega una app Android con el nombre de paquete exactamente «${paquete}» y baja su archivo.`,
  );
}

const proyecto = json.project_info.project_id || '(sin nombre)';
console.log(`✓ google-services.json correcto: proyecto «${proyecto}», app «${paquete}».`);
