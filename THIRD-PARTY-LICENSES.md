# Licencias de terceros

Mercaboot usa piezas de código abierto, datos abiertos y servicios de otras personas y empresas. Cada una conserva su propia licencia y sus propios autores;
**nada de lo que está aquí es de Mercaboot ni cambia a quién pertenece Mercaboot** (ver el archivo `LICENSE`).

## Código que se instala con `npm install`

- **Expo y la plantilla inicial del proyecto** (licencia MIT, copia más abajo) y los módulos de Expo que usa la app (`expo-router`, `expo-camera`, `expo-image-picker`, `expo-location`, `expo-notifications`, `expo-print`, `expo-sharing`, `expo-audio`, etc., todos MIT).
- **React, React Native, `@supabase/supabase-js`, `react-native-svg`** y demás paquetes (MIT): la lista completa está en `package.json` y `package-lock.json`, y cada paquete trae su licencia dentro de su carpeta en `node_modules`.
- **Plus Jakarta Sans**, la letra de la app (paquete `@expo-google-fonts/plus-jakarta-sans`: el paquete es MIT y la tipografía es de «The Plus Jakarta Sans Project Authors», licencia **SIL Open Font License 1.1**).
- **Componentes de Google dentro del APK de Android**, que trae `expo-camera` para leer códigos de barras y QR con la cámara: CameraX (Apache 2.0) y ML Kit / servicios de Google Play, que se rigen por los términos de Google.

## Datos y servicios externos

- **Open Food Facts** (<https://openfoodfacts.org>): al escanear un código de barras, la app consulta su base de datos abierta y toma **solo el nombre, la marca y la cantidad** del producto (no copia sus fotos). Esos datos son © de los colaboradores de Open Food Facts, bajo la licencia **ODbL 1.0** (el contenido individual, bajo DbCL; sus fotos, bajo CC BY-SA, que Mercaboot no usa). El crédito se da en la pantalla **Acerca de**. Lo que se encuentra se recuerda en la base de datos de Mercaboot para el siguiente comerciante.
- **Supabase** (base de datos, cuentas y funciones del servidor) y **GitHub** (código y armado del APK): servicios con sus propios términos.
- **Firebase Cloud Messaging, de Google** (avisos al teléfono): opcional; solo se usa si el autor lo conecta.
- **Claude Haiku 5.5, de Anthropic** (recetas y foto de la lista de precios con IA): opcional; es un servicio externo con sus propios términos, al que el servidor de Mercaboot le manda únicamente el texto o la foto que la persona pide procesar. No se distribuye ningún modelo ni código de Anthropic con la app.
- **Códigos QR**: el generador de QR de Mercaboot (`src/lib/qr.ts`) es propio y sigue el estándar ISO/IEC 18004; no copia código de otras librerías. «QR Code» es una marca registrada de DENSO WAVE INCORPORATED.

---

The MIT License (MIT)

Copyright (c) 2015-present 650 Industries, Inc. (aka Expo)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
