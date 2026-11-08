# Mercaboot · Versión final 4.0

App para saber **qué hay hoy en las tiendas de tu comunidad** (San Francisco Javier, Santa Cruz Xoxocotlán, Oaxaca).
Está hecha con Expo / React Native: **el mismo código** funciona en Android, en iPhone y en el navegador.

**Versión 4.0.0 · entrega final** de la materia de Inteligencia Artificial (UABJO). Reúne en una sola app todo lo de los avances anteriores
(Avance 1, Avance 2, Avance 2.1 y la versión 3.1.1 con el asistente, las reseñas y los avisos) y corrige lo que fallaba.

## Cómo instalarla en tu celular

| Teléfono | Qué se instala | Dónde se consigue |
| --- | --- | --- |
| **Android** | El **APK** (app real instalable) | [Releases → «Mercaboot · Versión final 4.0 (Android)»](https://github.com/perezmigueljosedavid-eng/MercaBoot/releases/tag/final-apk) |
| **iPhone** | La **app web** (se instala desde Safari y queda como una app más en la pantalla de inicio) | <https://perezmigueljosedavid-eng.github.io/MercaBoot/> |

> **¿Por qué en iPhone no hay un archivo como el APK?** Apple solo permite instalar apps «de fuera de la App Store» con una cuenta de desarrollador de pago
> (99 dólares al año). Por eso, para el iPhone la app se entrega como **app web instalable (PWA)**: es el mismo código, se ve y funciona igual
> (tiempo real, chat, ubicación, carrito, reseñas…), con su ícono propio y a pantalla completa. También funciona en Android y en computadora.

### Android (APK)

1. Desde el **celular**, abre el enlace de Releases de la tabla de arriba y toca **`Mercaboot-final.apk`** (se descarga).
2. Abre el archivo descargado. Si Android avisa que bloquea la instalación, toca **Configuración** y activa **Permitir desde esta fuente**.
3. Toca **Instalar** y luego **Abrir**. Si aparece «Play Protect», toca **Instalar de todos modos** (es normal: la app no viene de Play Store).
4. Necesita **internet** (Wi-Fi o datos). Si ya tenías un avance instalado, este se instala encima; si Android no lo permite, desinstala el anterior primero (tus datos están en la nube, no se pierden).

### iPhone (app web)

1. Abre **Safari** (tiene que ser Safari, no Chrome ni otro navegador) y entra a <https://perezmigueljosedavid-eng.github.io/MercaBoot/>.
2. Toca el botón **Compartir** (el cuadro con una flecha hacia arriba, abajo en el centro).
3. Baja en la lista y toca **Añadir a pantalla de inicio** → **Añadir**.
4. Abre **Mercaboot** desde el ícono nuevo. Se ve a pantalla completa, como una app. **Inicia sesión dentro de esa app** (la sesión de Safari y la de la app instalada son independientes).
5. Cuando la app pida la **ubicación**, toca **Permitir** (sirve para ver qué tan cerca está cada tienda).

> Lo mismo sirve en Android sin instalar el APK: en Chrome, menú ⋮ → **Instalar app** / **Añadir a pantalla de inicio**.

## Qué incluye

**Cuenta e inicio de sesión (los dos modos, con una sola cuenta)**

- Crear cuenta como **cliente** o como **comerciante** (nombre, correo, teléfono de 10 dígitos y contraseña de 8 o más caracteres; todo se valida).
- **Iniciar sesión** desde cualquier teléfono, **cerrar sesión**, **recuperar contraseña** y **editar mis datos**. La sesión se mantiene al cerrar y volver a abrir la app.
- Quien es cliente y después quiere vender (o al revés) **no necesita otra cuenta**: desde su perfil toca «Abrir mi negocio» o «Ver la app como cliente».

**Interfaz de cliente** (6 pestañas: Inicio · Buscar · Pedidos · Chats · Favoritos · Perfil)

- **Inicio**: saludo, buscador, **«¿Qué se te antoja?»** (asistente de recetas), la **fiesta que se acerca**, **«Lo más barato hoy»**, **«Tiendas para ti»** (vistas *Cerca de ti*, *Mejor calificadas*, *A domicilio* y *Abiertas ahora*, más categorías por tipo de negocio) y **«Avisos de hoy»**. La campana abre **Avisos y novedades**.
- **Buscar** productos y negocios (sin importar mayúsculas ni acentos), ordenados por *Más cerca*, *Más barato* o *Mejor calificadas*.
- **Ficha del negocio** con tres pestañas: **Productos** (hay / agotado / por encargo / cuántos quedan, en vivo y con el botón **Agregar** al carrito), **Avisos** y **Reseñas**. Además: dirección y distancia, horario, **Llamar**, **Cómo llegar**, **Chatear**, calificación con estrellas y guardar en **favoritos**.
- **Reseñas con estrellas** (de 1 a 5, con etiquetas como «Buen trato» y un comentario): una por persona y por negocio; se puede **editar** o **quitar** desde *Perfil → Mis reseñas*. El dueño no puede calificar su propio negocio.
- **Carrito y pedidos**: productos de **un** negocio; se elige **«Paso a recogerlo»** o **«A domicilio»** (con su dirección) y pagar **«En persona»** o **«Transferencia»**. Los productos quedan **apartados** por el tiempo que fije el negocio. Cada botón responde siempre: si el negocio no ofrece algo (por ejemplo, no entrega a domicilio), la app **lo explica** y ofrece **preguntar por el chat**.
- **Pedidos**: en qué va cada pedido (esperando respuesta, apartado con su cuenta regresiva, «va en camino», entregado), datos de transferencia, «Ya pagué», cancelar e historial.
- **Chats** con los negocios, con un número rojo cuando hay mensajes sin leer.
- **Favoritos** (privado) con el último aviso de cada tienda, y **«Tu trato especial»** con los negocios donde el comerciante te nombró **cliente frecuente**.
- **Ideas para cocinar**: el asistente propone recetas con lo que **hay hoy** en las tiendas de tu comunidad y dice **dónde conseguirlo**; entiende cosas como «algo con pollo» o «algo dulce». Funciona **sin internet** (usa reglas propias, no una IA externa).
- **Perfil**: mis datos, **Mis reseñas**, **Mi ubicación**, ayuda y cerrar sesión.

**Interfaz de comerciante** (6 pestañas: Inicio · Productos · Pedidos · Avisos · Chats · Perfil)

- **Registrar su negocio**: uno nuevo (nombre, tipo entre 28 giros u «Otro», dirección) o **reclamar una de las tiendas reales del directorio** con su código de reclamo.
- **Inicio**: interruptor de **abierto / cerrado**, indicador «En vivo», productos disponibles y agotados, **pedidos nuevos**, **chats sin leer**, **avisos publicados**, **calificación** con estrellas, la **fiesta que se acerca** con ideas para su giro y **botones rápidos** para publicar un aviso («Ya no hay…», «Ya hay…», «Promoción», «Regalo», «Cerrado hoy»).
- **Productos**: agregar, editar y eliminar; cada producto es **«Para cocinar»** (ingrediente) o **«Ya preparado»** y lleva **etiquetas** (dulce, picante, vegetariano…); **existencias**; marcar **disponible / agotado** con un toque.
- **Avisos**: *Ya no hay…* y *Ya hay…* (cambian solos el producto a agotado o disponible), *Promoción*, *Regalo* y *Cerrado hoy*, con vigencia (hoy, una semana, hasta Navidad…), ideas para **fiestas** (Día de las Madres, Día de Muertos, Navidad…) y **Quitar** cuando ya no valen. Los clientes los ven **en vivo**.
- **Pedidos**: llegan en vivo; **Aceptar / Rechazar**, **Marcar listo** o **Salió a domicilio**, **Confirmar pago**, **Dar 30 minutos más**, **No se presentó**, **Entregado y cobrado**.
- **Clientes frecuentes**: el comerciante decide quién lo es y qué le da (descuento de 0 a 50 %, regalo o cupón).
- **Chats** en vivo con respuestas rápidas.
- **Perfil**: editar el negocio (logo, nombre, tipo, descripción, teléfono, horario, **entrega a domicilio y zona**, dirección, **ubicación en el mapa**, tiempo de apartado y **transferencias** con sus datos de pago, que el cliente solo ve cuando el negocio acepta su pedido).

**Nube, tiempo real y ubicación**

- Todo se guarda en **Supabase** (PostgreSQL): cuentas, negocios, productos, pedidos, chats, reseñas y avisos. Lo que el comerciante publica **lo ve el cliente al instante**, y al revés (mensajes, pedidos, reseñas).
- La **ubicación del cliente no se guarda**: se usa solo dentro del teléfono para calcular distancias y ordenar «Cerca de ti». El comerciante sí guarda la ubicación **de su negocio**.
- Los pedidos que no se recogen ni se pagan a tiempo se **liberan solos** y el producto vuelve a estar a la venta.

## Lo que se corrigió respecto a los avances

- **«A domicilio» y «Paso a recogerlo» (carrito)**: en el Avance 2.1 esos botones, el de pago y «Apartar pedido» a veces **no hacían nada**. Ahora **siempre responden**: cambian la opción elegida o explican por qué no se puede (negocio cerrado, sin entrega a domicilio, sin transferencia, falta la dirección) y nunca se quedan mudos.
- Se juntaron en **una sola app** el asistente de recetas, las reseñas, los avisos y las fiestas de la versión 3.1.1 con la nube, el chat, la ubicación, el carrito y los pedidos del Avance 2.1.
- Se revisó **botón por botón** (cliente, comerciante y pantallas sin sesión) con una prueba automática que toca cada control como un dedo en un celular.

## Paso 1 · La base de datos (Supabase)

El proyecto de Supabase del equipo («MercaBoot») **ya tiene instalado** todo el esquema y `src/config.ts` ya trae su dirección y su llave pública. No hay que hacer nada más para usar la app.
Estos pasos sirven para repetirlo con **otro** proyecto. Se hace una sola vez y es gratis (cuenta en [supabase.com](https://supabase.com)).

1. **New project**: nombre (por ejemplo `mercaboot`), una contraseña de base de datos (guárdala en privado) y la región más cercana.
2. **SQL Editor → New query** → pega **todo** [`supabase/esquema.sql`](supabase/esquema.sql) → **Run**. Se puede ejecutar más de una vez sin borrar datos. Crea las tablas, las reglas de seguridad (RLS), el tiempo real, los pedidos, las reseñas, los avisos y las 3 tiendas del directorio.
   *Si ya tenías instalado el Avance 2.1*, basta con ejecutar [`supabase/actualizacion-final.sql`](supabase/actualizacion-final.sql) (agrega reseñas, avisos y los datos nuevos de los productos sin borrar nada).
   *Opcional*: activa la extensión **pg_cron** (Integrations → Cron) para que los pedidos vencidos y los avisos caducados se limpien cada minuto aunque nadie tenga la app abierta.
3. **Authentication → Sign In / Providers → Email**: **apaga «Confirm email»** y guarda (si no, cada cuenta nueva tendría que confirmarse desde un correo).
4. *(Opcional, para «¿Olvidaste tu contraseña?»)* **Authentication → URL Configuration → Redirect URLs** → agrega `mercaboot://**` y la dirección de la app web.
5. **Project Settings → API** → copia el **Project URL** y la **llave pública** («anon» o «publishable»). ⚠️ **Nunca** copies la «service_role» ni la «secret»: dan control total y no deben estar en la app ni en GitHub (si las pegas por error, la compilación se detiene sola).
6. Pégalos en [`src/config.ts`](src/config.ts) (`URL_NUBE` y `LLAVE_PUBLICA`). La llave pública **no es un secreto**: va dentro de la app por diseño y los datos los protegen las reglas de seguridad del esquema.

## Paso 2 · Cómo se arman el APK y la página web

Se hace «en la nube» de GitHub (no hace falta Android Studio ni una Mac). Sube **todos** los archivos a un repositorio (incluida la carpeta oculta `.github`).

- **APK de Android**: se arma **solo** cada vez que se sube un cambio al archivo `disparador-apk.txt` (pestaña **Actions → Construir APK** para ver cómo va). Tarda unos 15 minutos. Queda en **Releases** como `Mercaboot-final.apk` (etiqueta `final-apk`). Los de los avances anteriores siguen en sus propias etiquetas (`avance2-apk`, `avance2-1-apk`).
  **Para volver a armarlo**: en GitHub abre `disparador-apk.txt` (en la rama `version-final`), toca el lápiz ✏️, cambia el número de la compilación y presiona **Commit changes**. (El botón «Run workflow» solo aparece si el archivo del flujo está en la rama principal del repositorio; por eso se usa este archivo.)
- **App web (iPhone, Android y computadora)**: se arma **sola** al subir un cambio a `disparador-web.txt` (se vuelve a armar igual que el APK: editar ese archivo y hacer *Commit*). Tarda unos 3 minutos y publica la página en la rama `gh-pages`.
  **Una sola vez**, para que GitHub la muestre: **Settings → Pages → Build and deployment → Source: «Deploy from a branch» → Branch: `gh-pages`, carpeta `/ (root)` → Save**. A los 1–2 minutos la página queda en `https://<usuario>.github.io/<repositorio>/`.
- Antes de compilar, el flujo revisa `src/config.ts`: si todavía tiene `REEMPLAZA-ESTO`, arma una versión **de prueba sin base de datos** que no se publica; si encuentra una llave secreta, se detiene.
- Otra forma de armar el APK: **EAS** (`npx eas-cli@latest build --platform android --profile preview`, con cuenta gratis en [expo.dev](https://expo.dev)).

## Paso 3 · Probar el tiempo real, el chat y la ubicación (con dos teléfonos)

Un teléfono es el **comerciante (A)** y otro el **cliente (B)**. Si solo tienes uno, usa la computadora para uno de los dos.

1. **En A**: **Crear cuenta** → «Soy comerciante» → llena tus datos → **Mi negocio es nuevo** (nombre, tipo, dirección) → **Crear cuenta**. Luego **Perfil → Editar mi negocio → Usar mi ubicación actual**, activa **Entrega a domicilio** y guarda.
2. **En B**: **Crear cuenta** → «Soy cliente». En **Inicio** toca **Activar mi ubicación**: las tiendas se ordenan de la más cercana a la más lejana.
3. **En A**: **Productos → Agregar** (elige «Para cocinar» o «Ya preparado»). **En B aparece solo, en un par de segundos.** Marca el producto como **Agotado** o cierra el negocio: **en B cambia al instante**.
4. **Carrito**: **en B** abre el negocio, toca **Agregar**, **Ver carrito**. Toca **A domicilio** (aparece la dirección) y **Paso a recogerlo**; prueba **En persona** y **Transferencia**. Si el negocio no ofrece algo, la app lo explica. Toca **Apartar pedido**.
5. **Pedido**: **en A** llega el aviso «Pedido nuevo». Toca **Aceptar pedido** → **Marcar listo** (o **Salió a domicilio**) → **Entregado y cobrado**. **En B** se ve cada paso al instante y las existencias bajan solas.
6. **Chat**: **en B**, **Chatear** y manda un mensaje; **en A**, la pestaña **Chats** muestra el número rojo; responde y **en B** llega en vivo.
7. **Reseña**: **en B**, en la ficha del negocio, **Dejar reseña** (estrellas, etiquetas y comentario). **En A** se actualiza «Calificación». Se puede editar o quitar en **Perfil → Mis reseñas**.
8. **Avisos**: **en A**, pestaña **Avisos** → **Ya no hay…** con un producto (queda agotado solo), o **Promoción** con tu mensaje. **En B** aparece en **Avisos de hoy** y en la campana. **Quitar** lo borra para todos.
9. **Ideas para cocinar**: **en B**, en **Inicio** escribe «algo con pollo» o «algo dulce» y toca **Pedir ideas**: propone recetas y en qué tienda conseguirlas.
10. **Cliente frecuente**: **en A**, desde un pedido toca **Nombrar cliente frecuente** y elige descuento y/o beneficio. **En B** aparece «⭐ Eres cliente frecuente».
11. **Sin internet**: apaga el internet en B. Aparece el aviso «Sin internet…» y se ve lo último guardado; al volver, la app se pone al día sola.

## Probarla en tu computadora

1. Instala [Node.js](https://nodejs.org) (versión LTS).
2. Abre una terminal **dentro de esta carpeta** y escribe `npm install` (la primera vez).
3. Escribe `npx expo start --web --clear`. Se abre sola en el navegador (necesita `src/config.ts` con los datos de Supabase).
4. En el celular (opcional): `npx expo start`, instala **Expo Go** y escanea el código QR (mismo Wi-Fi).

Para armar la versión web a mano (la que se publica en GitHub Pages):

```
EXPO_WEB_BASE_URL=/MercaBoot npx expo export --platform web --output-dir dist
EXPO_WEB_BASE_URL=/MercaBoot node scripts/preparar-web.cjs dist
```

(`/MercaBoot` es el nombre del repositorio; en Windows se escribe distinto: `set EXPO_WEB_BASE_URL=/MercaBoot` en una línea antes del comando.)

## Reclamar un negocio con seguridad

Las tiendas reales del directorio (Carnicería San Javier, Tortillería El Maizito, Carnicería Keren) aparecen **sin dueño**. Cada una tiene un **código de reclamo** secreto de 12 letras y números que se le entrega **solo a su dueño de verdad**.

- Sin el código correcto la tienda **no se puede reclamar** (no importan mayúsculas, espacios ni guiones). Antes de quedarse con ella, la app pregunta **«¿Es tu negocio?»**.
- Si alguien reclamó por error, en su perfil toca **«Dejar de administrar este negocio»**: la tienda vuelve a la lista sin dueño.
- Después de **5 códigos incorrectos** se bloquean los intentos 5 minutos. Nadie puede crear un negocio nuevo con el nombre de una tienda del directorio.
- **El código no está escrito en la app ni en la base de datos**: solo queda su «huella» (un resumen que no se puede deshacer). La revisión ocurre **en el servidor**, no en el teléfono.

**Crear o cambiar un código** (necesitas Node.js; en la carpeta del proyecto):

```
node scripts/codigo-reclamo.mjs carniceria-keren                            # código nuevo para una tienda que ya existe
node scripts/codigo-reclamo.mjs nueva-tienda "Nombre de la tienda" "Giro"   # agrega una tienda nueva al directorio, con su código
node scripts/codigo-reclamo.mjs --revisar carniceria-keren K7M2-9QXP-4HWD   # ¿este código es el de la base de datos?
```

El script muestra el código (se lo das al dueño y lo guardas en privado, **no** en el proyecto ni en GitHub) y el SQL que se pega en **SQL Editor** para dejar la huella.
**Coordenadas de las tiendas del directorio**: aún no las tienen. Cuando las tengas: `update public.negocios set lat = 17.0000, lng = -96.7000 where id = 'carniceria-keren';` (con los números reales).

## Dónde cambiar cosas

| Quiero… | Archivo |
| --- | --- |
| Conectar la app a otro proyecto de Supabase | `src/config.ts` |
| Cambiar tablas, reglas de seguridad o las tiendas del directorio | `supabase/esquema.sql` (y volver a ejecutarlo en SQL Editor) |
| Agregar otra tienda real al directorio | `node scripts/codigo-reclamo.mjs …` (ver arriba) |
| Cambiar los tipos de negocio, categorías, etiquetas o la comunidad | `src/data/contenido.ts`, `src/data/giros.ts` |
| Cambiar las fiestas y las ideas de aviso | `src/data/festividades.ts` |
| Cambiar colores y letras | `src/ui/theme.ts` |
| Cambiar el ícono de la app o de la página web | `scripts/hacer-iconos.cjs` (carpeta `assets/`) y los PNG de `public/` |
| Cómo se leen y guardan datos, tiempo real y sesión | `src/store.tsx`, `src/lib/nube.ts`, `src/lib/supabase.ts` |
| Carrito, pedidos y clientes frecuentes | `src/app/carrito.tsx`, `src/app/pedido/[id].tsx`, `src/app/clientes.tsx`, `src/lib/pedidos.ts` (las reglas de verdad las aplica la base: `crear_pedido` y `pedido_accion` en `supabase/esquema.sql`) |
| Reseñas y avisos | `src/app/resena/[id].tsx`, `src/app/mis-resenas.tsx`, `src/app/comerciante/avisos.tsx`, `src/app/novedades.tsx` |
| El asistente «Ideas para cocinar» (recetas y reglas) | `src/ia/` (recetas en `recetas*.ts`, el motor en `motor.ts`) y `src/app/ideas-ia.tsx` |
| Chat | `src/ui/ChatView.tsx`, `src/app/chat-negocio/`, `src/app/chat-cliente/` |
| Ubicación y distancias | `src/lib/ubicacion.tsx`, `src/lib/geo.ts`, `src/lib/distancia.ts` |
| Pantallas del cliente / del comerciante | `src/app/cliente/` y `src/app/comerciante/` |
| La instalación en iPhone (nombre, ícono, colores) | `public/index.html`, `public/manifest.json`, `scripts/preparar-web.cjs` |

## Si algo falla

- **«Falta conectar la base de datos»**: faltan los datos en `src/config.ts` (Paso 1, punto 6) y volver a compilar.
- **Crear la cuenta se queda esperando o pide confirmar el correo**: sigue encendido «Confirm email» (Paso 1, punto 3).
- **«Invalid API key»** o no carga nada: la llave se copió incompleta o es de otro proyecto.
- **Los cambios no llegan al instante**: confirma que `supabase/esquema.sql` se ejecutó completo. Aun así, la app se actualiza sola cada pocos segundos como respaldo.
- **El proyecto de Supabase «está pausado»**: el plan gratis pausa los proyectos que pasan 7 días sin usarse. Entra a supabase.com, abre el proyecto y toca **Restore project** (conviene hacerlo antes de una demostración).
- **La página para iPhone da «404»**: falta prender GitHub Pages (Paso 2: **Settings → Pages → Branch: `gh-pages`**) o aún no termina de publicarse (espera 1–2 minutos).
- **En el iPhone la app instalada pide iniciar sesión otra vez**: es normal la primera vez; la sesión de Safari y la de la app instalada son independientes.

## Lo que todavía hay que saber

- **iPhone = app web, no un archivo `.ipa`**: un `.ipa` solo se puede instalar con una cuenta de desarrollador de Apple de pago. La app web es el mismo código y se instala sin cuenta.
- **El asistente «Ideas para cocinar» usa reglas propias** (funciona sin internet y sin llaves). **No usa Gemini**: conectar una IA externa necesita una llave de API propia del equipo, que **no** debe ir dentro de la app (se haría con una función en Supabase).
- **Los avisos de pedidos funcionan con la app abierta** (aviso dentro de la app y número rojo). Con la app cerrada no suena nada: eso necesita notificaciones «push» (Firebase) y queda como mejora futura.
- **El pago con tarjeta en línea no está** («próximamente»): hoy se paga en persona o por transferencia (el comerciante confirma que le llegó).
- **Se necesita internet** para publicar, chatear e iniciar sesión. Sin internet la app muestra lo último guardado, pero no deja cambiar nada.
- Las cuentas del Avance 1 estaban guardadas solo en cada teléfono: **no pasan a la nube**; hay que crearlas de nuevo.
- Quien administra el proyecto de Supabase puede ver las tablas, incluidos los chats. Entre usuarios, un chat solo lo ven las dos personas que participan.
- Los logos y fotos se reducen y se guardan dentro de la base de datos (con un límite de tamaño). Para una versión comercial conviene usar Supabase Storage.
- El plan gratis de Supabase alcanza para las pruebas y la entrega; para muchos usuarios habría que subir de plan.
- El APK no está firmado para Play Store: sirve para instalar y probar en un celular, **no** para subirlo a la tienda.

## Revisiones antes de entregar

```
npx tsc --noEmit                  # revisa tipos
npx expo lint                     # revisa estilo
node scripts/revisar-config.cjs   # ¿src/config.ts está listo y sin llaves secretas?
```
