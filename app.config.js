// Configuración de Expo. Toma todo lo de app.json y solo agrega una cosa:
// al exportar la versión WEB para GitHub Pages se define EXPO_WEB_BASE_URL (por ejemplo "/MercaBoot"),
// que es la ruta donde vive la página. El APK de Android NO usa esa variable, así que queda exactamente igual.
module.exports = ({ config }) => {
  const base = (process.env.EXPO_WEB_BASE_URL || '').trim().replace(/\/+$/, '');
  if (!base) return config;
  return { ...config, experiments: { ...(config.experiments ?? {}), baseUrl: base } };
};
