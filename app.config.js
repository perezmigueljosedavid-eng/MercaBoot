// Configuración de Expo. Toma todo lo de app.json y agrega dos cosas:
//
// 1) Avisos al teléfono (Firebase). Si en la raíz del proyecto está el archivo «google-services.json» (lo baja Firebase;
//    NO es secreto), se usa para que el APK pueda recibir avisos y se marca extra.avisosTelefono = true. Si el archivo no
//    está, el APK sale igual y todo funciona; solo que sin avisos al teléfono (la app lo explica en «Avisos al teléfono»).
// 2) Al exportar la versión WEB para GitHub Pages se define EXPO_WEB_BASE_URL (por ejemplo "/MercaBoot"), que es la ruta
//    donde vive la página. El APK de Android NO usa esa variable, así que queda exactamente igual.
const fs = require('fs');
const path = require('path');

module.exports = ({ config }) => {
  const archivoFirebase = path.join(__dirname, 'google-services.json');
  const conFirebase = fs.existsSync(archivoFirebase);

  const listo = {
    ...config,
    extra: { ...(config.extra ?? {}), avisosTelefono: conFirebase },
    android: { ...(config.android ?? {}), ...(conFirebase ? { googleServicesFile: './google-services.json' } : {}) },
  };

  const base = (process.env.EXPO_WEB_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) return listo;
  return { ...listo, experiments: { ...(listo.experiments ?? {}), baseUrl: base } };
};
