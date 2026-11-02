# Mercaboot · Avance 1

App móvil para saber **qué hay hoy en las tiendas de tu comunidad** (San Francisco Javier, Santa Cruz Xoxocotlán, Oaxaca).
Está hecha con Expo / React Native: el mismo código funciona en Android, iPhone y en el navegador.

**Versión 1.0.0 · Avance 1** de la materia de Inteligencia Artificial (UABJO). Esta versión muestra **solo lo que pide el avance**:
inicios de sesión y la interfaz de cliente y de comerciante, con todos sus campos funcionando.
La versión completa (con asistente de recetas, ubicación, chat, reseñas y avisos) se conserva aparte; todavía **no** está en esta.

## Qué incluye

**Cuenta e inicio de sesión (los dos modos, con una sola cuenta)**

- Crear cuenta como **cliente** o como **comerciante** (nombre, correo, teléfono de 10 dígitos y contraseña de 8 o más caracteres; todo se valida).
- **Iniciar sesión**, **cerrar sesión**, **recuperar contraseña** (con correo y teléfono) y **editar mis datos** / cambiar contraseña.
- La sesión se mantiene al cerrar y volver a abrir la app. Las contraseñas se guardan como huella (SHA-256), nunca escritas.
- Quien es cliente y después quiere vender (o al revés) **no necesita otra cuenta**: desde su perfil toca «Abrir mi negocio» o «Ver la app como cliente».

**Interfaz de cliente** (4 pestañas: Inicio · Buscar · Favoritos · Perfil)

- **Inicio**: las tiendas de la comunidad con filtros **Todas / A domicilio / Abiertas ahora** y categorías por tipo de negocio; buscador.
- **Buscar** productos y negocios (sin importar mayúsculas ni acentos), con filtros «Disponible ahora» y «A domicilio».
- **Ficha del negocio**: dirección, horario, teléfono (botón Llamar), entrega a domicilio y sus productos (hay / agotado / por encargo).
- **Favoritos** («Cliente frecuente») y **Perfil** con ayuda.

**Interfaz de comerciante** (3 pestañas: Inicio · Productos · Perfil)

- **Registrar su negocio**: uno nuevo (nombre, tipo de negocio entre 28 giros u «Otro», dirección) o **reclamar uno de las tiendas reales del directorio** con su código de reclamo.
- **Inicio**: interruptor de negocio abierto/cerrado, cuántos productos hay y cuántos se agotaron, y los más recientes.
- **Productos**: agregar, editar y eliminar (nombre, precio, «se vende por», categoría, solo por encargo); marcar **disponible / agotado** con un toque; buscar y filtrar.
- **Perfil**: editar el negocio (logo, nombre, tipo, descripción, teléfono, correo, horario, entrega a domicilio y dirección), ver la app como cliente y dejar de administrar el negocio.

## Lo que todavía NO incluye (queda para los siguientes avances)

- Chatbot / asistente de ideas y recetas.
- Ubicación, mapas y distancias («Cómo llegar»).
- Chat cliente–comerciante, reseñas y estrellas, avisos y fiestas.
- Base de datos en la nube (ver «Lo que todavía hay que saber»).

## Probarla en tu computadora

1. Instala [Node.js](https://nodejs.org) (versión LTS) si no lo tienes.
2. Abre una terminal **dentro de esta carpeta**.
3. Escribe `npm install` (la primera vez).
4. Escribe `npx expo start --web --clear`. Se abre sola en el navegador.
5. En el celular (opcional): `npx expo start`, instala **Expo Go** y escanea el código QR. El celular y la computadora deben estar en el mismo Wi-Fi.

## Conseguir el APK (el instalador para Android)

**El APK de prueba del Avance 1 ya está armado.** Se descarga directo desde el celular en
https://github.com/perezmigueljosedavid-eng/MercaBoot/releases/download/avance1-apk/Mercaboot-avance1.apk
(página del Release: https://github.com/perezmigueljosedavid-eng/MercaBoot/releases/tag/avance1-apk). Para instalarlo, sigue «Instalar el APK en un celular Android» (más abajo).
Lo que sigue explica cómo armarlo otra vez o armar uno propio.

Armar el APK necesita las herramientas de Android, así que se hace «en la nube». Hay dos formas; con **una** basta.

**Forma 1 · Expo (EAS)** — la más directa. Necesitas una cuenta gratis en [expo.dev](https://expo.dev) y Node.js. En una terminal, dentro de esta carpeta:

```
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

La primera vez pregunta si quieres crear el proyecto en tu cuenta de Expo: responde **Y** (sí). Si pregunta por la llave de firma de Android, deja que Expo la genere.
Al terminar (de 15 a 30 minutos, según la fila de espera) muestra un **enlace y un código QR** para descargar el `.apk` desde el celular.

**Forma 2 · GitHub Actions.** Crea un repositorio en GitHub y sube **todos** los archivos de esta carpeta (incluida la carpeta oculta `.github`).
GitHub empieza a compilar solo (pestaña **Actions** → **Construir APK**; tarda unos 15–25 minutos) y deja `Mercaboot-avance1.apk` en **Releases** del repositorio.
Para compilar otra vez: **Actions** → **Construir APK** → **Run workflow**. Si el repositorio es privado, para descargar el APK en el celular tendrás que iniciar sesión en GitHub.
Con git, en la terminal:

```
git init
git add .
git commit -m "Mercaboot Avance 1"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/TU-REPOSITORIO.git
git push -u origin main
```

## Instalar el APK en un celular Android

1. Descarga el archivo `.apk` en el celular (con el enlace de Expo o desde Releases).
2. Ábrelo. Si Android avisa que bloquea la instalación, toca **Configuración** y activa **Permitir desde esta fuente** (para el navegador o el administrador de archivos que usaste).
3. Toca **Instalar** y luego **Abrir**. Si aparece «Play Protect», toca **Instalar de todos modos**: es normal, porque la app no viene de Play Store.

## Probar rápido (paso a paso, todo en el mismo teléfono)

Los datos se guardan **en cada teléfono** (ver abajo), así que para ver el recorrido completo usa un solo teléfono:

1. **Crear cuenta** → «Soy comerciante» → Continuar. Llena tus datos, elige **Mi negocio es nuevo**, escribe el nombre, el tipo de negocio y la dirección → **Crear cuenta**.
2. En **Productos** toca **Agregar** y publica un par de productos (nombre, precio, «se vende por»). Marca uno como **Agotado**.
3. En **Perfil** toca **Editar mi negocio**, agrega horario y teléfono, y activa **Entrega a domicilio**.
4. En **Perfil** toca **Cerrar sesión**. Crea otra cuenta, ahora como **cliente**: verás tu negocio en **Inicio**, lo encontrarás en **Buscar**, entrarás a su ficha y lo marcarás como **Cliente frecuente** (aparece en **Favoritos**).
5. **Iniciar sesión** con la primera cuenta regresa directo al modo comerciante.

## Reclamar un negocio con seguridad

Las tiendas reales del directorio (Carnicería San Javier, Tortillería El Maizito, Carnicería Keren) aparecen **sin dueño**.
Para que nadie se quede con una tienda ajena (ni por tocar sin querer), cada una tiene un **código de reclamo** secreto de 12 letras y números
que se le entrega **solo a su dueño de verdad**.

- Sin el código correcto la tienda **no se puede reclamar**. No importan mayúsculas, espacios ni guiones.
- Antes de quedarse con la tienda la app pregunta **«¿Es tu negocio?»** y se puede elegir **«No, volver»**.
- Si alguien reclamó por error, en su perfil toca **«Dejar de administrar este negocio»**: la tienda vuelve a la lista sin dueño.
- Después de **5 códigos incorrectos** la app bloquea los intentos 5 minutos.
- Nadie puede crear un negocio nuevo con el nombre de una tienda del directorio.
- En la app **no está escrito el código**, solo su «huella» (`src/data/reclamo.ts`).

**Crear o cambiar un código** (necesitas Node.js; en la carpeta del proyecto):

```
node scripts/codigo-reclamo.mjs --todos                  # códigos para todas las tiendas de src/data/semilla.ts
node scripts/codigo-reclamo.mjs carniceria-keren         # un código nuevo para una tienda
node scripts/codigo-reclamo.mjs --revisar carniceria-keren K7M2-9QXP-4HWD   # ¿este código es el de la app?
```

El script muestra el código (se lo das al dueño y lo guardas en privado, **no** en el proyecto ni en GitHub) y la línea que se pega dentro de
`HASHES_RECLAMO` en `src/data/reclamo.ts`. Si agregas una tienda a `src/data/semilla.ts`, genera también su código, o no se podrá reclamar.

**Límite honesto:** mientras no haya base de datos en la nube, la revisión del código ocurre dentro del teléfono. Frena los toques por error y a la
gente curiosa, pero una persona experta podría intentar adivinar códigos fuera de la app. Con la nube el código se revisa en el servidor.

## Dónde cambiar cosas

| Quiero… | Archivo |
| --- | --- |
| Agregar otra tienda real al directorio | `src/data/semilla.ts` (copia un bloque, cambia `id`, `nombre`, `giro`) y genera su código de reclamo |
| Cambiar los tipos de negocio, categorías de producto o la comunidad | `src/data/contenido.ts` |
| Cambiar las unidades de venta de cada giro (vaso, rebanada, kilo…) | `src/data/giros.ts` |
| Cambiar colores y letras | `src/ui/theme.ts` |
| Cambiar el ícono de la app o la pantalla de inicio (carpeta `assets/`) | `scripts/hacer-iconos.cjs`; luego `npm i --no-save sharp` y `node scripts/hacer-iconos.cjs` (GitHub lo hace solo al compilar) |
| Cambiar cómo se guardan cuentas, negocios y productos | `src/store.tsx` |
| Pantallas del cliente / del comerciante | `src/app/cliente/` y `src/app/comerciante/` |
| Códigos de reclamo y a quién se piden | `src/data/reclamo.ts` y `scripts/codigo-reclamo.mjs` |

## Lo que todavía hay que saber

- **Los datos se guardan en cada teléfono** (o navegador). Un comerciante y un cliente en teléfonos distintos todavía no se ven entre sí.
  Para que todos vean lo mismo se necesita una base de datos en la nube (por ejemplo Supabase, con PostgreSQL, o Firebase; los dos tienen plan gratis para empezar).
- Si desinstalas la app o borras sus datos, las cuentas y productos de ese teléfono se pierden.
- La revisión del código de reclamo se hace dentro del teléfono (ver arriba).
- El APK es de prueba: sirve para instalar y probar en un celular, **no** para subirlo a Play Store.

## Revisiones antes de entregar

```
npx tsc --noEmit    # revisa tipos
npx expo lint       # revisa estilo
```
