// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    // Las funciones de Supabase se escriben para Deno, no para la app: se revisan aparte
    ignores: ['dist/*', 'supabase/functions/*'],
  },
]);
