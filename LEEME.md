# Mercaboot · Avance 2.1

App móvil para saber **qué hay hoy en las tiendas de tu comunidad** (San Francisco Javier, Santa Cruz Xoxocotlán, Oaxaca).
Está hecha con Expo / React Native: el mismo código funciona en Android, iPhone y en el navegador.

**Versión 2.1.0 · Avance 2.1** de la materia de Inteligencia Artificial (UABJO). Sobre el Avance 1 (inicios de sesión y las interfaces de cliente y de comerciante) el **Avance 2** agregó:

1. **Base de datos en la nube** (Supabase, que usa PostgreSQL): las cuentas, los negocios, los productos, los «clientes frecuentes» y los chats se guardan en internet, ya no en cada teléfono.
2. **Tiempo real**: lo que el comerciante publica o cambia (un producto nuevo, «agotado», abrir o cerrar el negocio) lo ve el cliente **al instante, sin recargar**. Y al revés: los mensajes y los «clientes frecuentes» del cliente le llegan al comerciante en vivo.
3. **Ubicación integrada**: distancia a cada tienda, «Cerca de ti» (lo más cercano primero) y «Cómo llegar».
4. **Chat** entre cliente y comerciante, con su vista de cliente y su vista de comerciante.

Y el **Avance 2.1** (esta versión) agrega:

5. **Carrito y pedidos apartados**: el cliente agrega productos de **un** negocio a su carrito y toca «Apartar pedido»; elige si pasa a recogerlo o si se lo llevan, y si paga **en persona** o **por transferencia**. Los productos quedan **apartados** (nadie más puede pedir lo mismo) por el tiempo que fije el negocio, de 15 minutos a 24 horas. Si el cliente no llega o no paga a tiempo, el pedido se **libera solo** y el producto vuelve a estar a la venta: así el comerciante no pierde ventas ni se quedan productos guardados para nadie.
6. **Existencias**: el comerciante puede escribir cuántos tiene de un producto; la app descuenta lo que entrega, lo marca «Agotado» al llegar a cero y le muestra al cliente cuántos quedan.
7. **Clientes frecuentes que elige el comerciante**: ya no se lo pone el propio cliente. El comerciante nombra a quien le compra seguido y le da un **descuento** (de 0 a 50 %) y/o un **beneficio** (un regalo, un cupón…). El corazón del cliente pasó a ser **«Favoritos»**, una lista privada que el negocio no ve.
8. **Pedido y chat juntos**: cada pedido aparece como una tarjeta dentro del chat entre el cliente y el comerciante, y cada cambio (aceptado, listo, cancelado, pago…) deja un aviso en la conversación.
9. **Para que el comerciante no pierda**: +30 minutos que puede dar si el cliente avisa que viene, máximo 2 pedidos activos por negocio, y quien deja pedidos sin recoger (2 en 30 días) solo puede apartar pagando por transferencia; con 3 queda bloqueado en ese negocio.

Todavía **no** incluye el pago con tarjeta en línea (necesita una cuenta con un proveedor de pagos), los avisos «push» con la app cerrada, el chatbot / asistente de recetas, las reseñas ni las fiestas (quedan para los siguientes avances).

## Qué incluye

**Cuenta e inicio de sesión (los dos modos, con una sola cuenta)**

- Crear cuenta como **cliente** o como **comerciante** (nombre, correo, teléfono de 10 dígitos y contraseña de 8 o más caracteres; todo se valida).
- **Iniciar sesión** desde cualquier teléfono con el mismo correo y contraseña, **cerrar sesión**, **recuperar contraseña** (te llega un correo con un enlace) y **editar mis datos**.
- La sesión se mantiene al cerrar y volver a abrir la app. Las contraseñas las guarda Supabase de forma segura (nunca escritas tal cual).
- Quien es cliente y después quiere vender (o al revés) **no necesita otra cuenta**: desde su perfil toca «Abrir mi negocio» o «Ver la app como cliente».

**Interfaz de cliente** (6 pestañas: Inicio · Buscar · Pedidos · Chats · Favoritos · Perfil)

- **Inicio**: las tiendas de la comunidad con las vistas **Cerca de ti / Todas / A domicilio / Abiertas ahora**, categorías por tipo de negocio y buscador. Con la ubicación activada se ve la distancia a cada tienda.
- **Buscar** productos y negocios (sin importar mayúsculas ni acentos), con filtros «Disponible ahora» y «A domicilio».
- **Ficha del negocio**: dirección y distancia, horario, teléfono (botón **Llamar**), **Cómo llegar**, **Chatear**, entrega a domicilio y sus productos (hay / agotado / por encargo / cuántos quedan), que se actualizan en vivo. Cada producto tiene su botón **Agregar** al carrito.
- **Chats**: tus conversaciones con los negocios; un círculo rojo con un número avisa cuántos chats tienen mensajes sin leer.
- **Carrito** y **Pedidos**: el carrito, el pedido que está esperando respuesta, el que ya está apartado (con su cuenta regresiva «Quedan 24 min»), los datos para pagar por transferencia, «Ya pagué», cancelar y el historial.
- **Favoritos** («♡ Guardar en favoritos», privado) con los negocios donde el comerciante te nombró **cliente frecuente**, y **Perfil** con ayuda.

**Interfaz de comerciante** (5 pestañas: Inicio · Productos · Pedidos · Chats · Perfil)

- **Registrar su negocio**: uno nuevo (nombre, tipo de negocio entre 28 giros u «Otro», dirección) o **reclamar una de las tiendas reales del directorio** con su código de reclamo.
- **Inicio**: interruptor de negocio abierto/cerrado, indicador «En vivo», cuántos productos hay y cuántos se agotaron, cuántos **pedidos nuevos** hay por responder, cuántos **clientes frecuentes** nombró, cuántos **chats sin leer** y los productos más recientes.
- **Productos**: agregar, editar y eliminar (nombre, precio, «se vende por», categoría, solo por encargo, **existencias**); marcar **disponible / agotado** con un toque; buscar y filtrar. Se ve cuánto hay y cuánto está apartado.
- **Pedidos**: los pedidos llegan en vivo con aviso; **Aceptar / Rechazar**, **Marcar listo**, **Confirmar pago** (transferencia), **Dar 30 minutos más**, **No se presentó**, **Entregado y cobrado**; interruptor para dejar de recibir pedidos.
- **Clientes frecuentes**: el comerciante decide quién lo es y qué le da (descuento, regalo o cupón).
- **Chats**: los mensajes de sus clientes llegan en vivo; puede responder con texto o con respuestas rápidas.
- **Perfil**: editar el negocio (logo, nombre, tipo, descripción, teléfono, correo, horario, entrega a domicilio, dirección, **ubicación en el mapa** y, en «Pedidos y apartado», el **tiempo de apartado**, si acepta **transferencias** y sus datos de pago, que solo ve el cliente cuando acepta su pedido), ver la app como cliente y dejar de administrar el negocio.

**Ubicación (y tu privacidad)**

- El cliente toca **Activar mi ubicación** y Android le pide permiso. Con eso la app calcula la distancia y ordena las tiendas. **La ubicación del cliente no se guarda ni se envía a ningún lado**: se usa solo dentro del teléfono.
- El comerciante guarda la ubicación **de su negocio** (Perfil → Editar mi negocio → **Usar mi ubicación actual**, o **Pegar enlace de Google Maps**). Esa sí se guarda, para que los clientes vean qué tan lejos está.
- **Cómo llegar** abre Google Maps (la app, o el navegador si no la tienes) con la ruta hacia el negocio.

## Paso 1 · Preparar la base de datos (Supabase)

Se hace una sola vez y es gratis. Necesitas una cuenta en [supabase.com](https://supabase.com).

> **Estado del proyecto del equipo:** el proyecto de Supabase «MercaBoot» ya tiene el esquema instalado y `src/config.ts` ya trae su dirección y su llave pública (anon). Solo queda el punto 3 (apagar «Confirm email»). Los pasos de abajo sirven para repetirlo con otro proyecto.

1. **New project**: ponle un nombre (por ejemplo `mercaboot`), inventa una contraseña de base de datos (guárdala en privado) y elige la región más cercana. Espera un par de minutos a que termine de crearse.
2. Menú **SQL Editor** → **New query** → pega **todo** el archivo [`supabase/esquema.sql`](supabase/esquema.sql) → **Run**. Debe terminar sin errores (se puede ejecutar más de una vez sin problema; no borra datos). Esto crea las tablas, las reglas de seguridad, el tiempo real, los pedidos y las 3 tiendas del directorio.
   *Si ya tenías instalado el Avance 2.0*, no hace falta empezar de cero: pega y ejecuta solo [`supabase/actualizacion-2-1.sql`](supabase/actualizacion-2-1.sql) (agrega pedidos, existencias y clientes frecuentes sin borrar nada).
   *Opcional, para que los pedidos vencidos se liberen cada minuto aunque nadie tenga la app abierta*: en Supabase activa la extensión **pg_cron** (Integrations → Cron); el esquema programa solo la tarea. Sin ella, igual se liberan cuando alguien abre la app o hace un pedido.
3. **Authentication → Sign In / Providers → Email** (el nombre puede cambiar un poco): **apaga «Confirm email»** y guarda. Sin esto, cada cuenta nueva tendría que confirmarse desde un correo y el registro se quedaría esperando.
4. *(Opcional, solo para «¿Olvidaste tu contraseña?»)* **Authentication → URL Configuration → Redirect URLs** → agrega `mercaboot://**`. Así el enlace del correo abre la app. El envío de correos del plan gratis es muy limitado: sirve para probar, no para muchos usuarios.
5. **Project Settings → API** (o el botón **Connect**) → copia dos datos:
   - **Project URL** (se ve como `https://xxxxxxxx.supabase.co`).
   - La **llave pública**: la «anon» o la «publishable» (`sb_publishable_…`).
   - ⚠️ **Nunca** copies la «service_role» ni la «secret»: esas dan control total y no deben estar en la app ni en GitHub. Si las pegas por error, la compilación se detiene sola.
6. Pega esos dos datos en [`src/config.ts`](src/config.ts) (las líneas `URL_NUBE` y `LLAVE_PUBLICA`, donde dice `REEMPLAZA-ESTO`). La llave pública **no es un secreto**: va dentro de la app por diseño y los datos los protegen las reglas de seguridad (RLS) del esquema.

Mientras `src/config.ts` tenga `REEMPLAZA-ESTO`, la app solo muestra una pantalla que explica qué falta.

## Paso 2 · Conseguir el APK (el instalador para Android)

Armar el APK necesita las herramientas de Android, así que se hace «en la nube». Hay dos formas; con **una** basta.

**Forma 1 · GitHub Actions** (la que usamos). Sube **todos** los archivos de esta carpeta a un repositorio de GitHub (incluida la carpeta oculta `.github`).
GitHub compila solo cuando subes cambios que incluyan el archivo `disparador-apk.txt` (pestaña **Actions** → **Construir APK**; tarda unos 15–25 minutos), o a mano con **Run workflow**.
El resultado queda en **Releases** del repositorio: `Mercaboot-avance2-1.apk` (etiqueta `avance2-1-apk`). El del Avance 2.0 sigue disponible como `Mercaboot-avance2.apk` (etiqueta `avance2-apk`).

- Antes de compilar, el flujo revisa `src/config.ts`. Si todavía tiene `REEMPLAZA-ESTO`, arma un APK **de prueba sin base de datos** que **no** se publica en Releases (queda solo como «artifact» de la corrida). Si encuentra una llave secreta, se detiene con un aviso.
- Para compilar otra vez después de un cambio, edita `disparador-apk.txt` (por ejemplo, cambia el número de compilación) o usa **Run workflow**.
- Si el repositorio es privado, para descargar el APK en el celular tendrás que iniciar sesión en GitHub.

**Forma 2 · Expo (EAS)**. Necesitas una cuenta gratis en [expo.dev](https://expo.dev) y Node.js. En una terminal, dentro de esta carpeta:

```
npm install
npx eas-cli@latest login
npx eas-cli@latest build --platform android --profile preview
```

La primera vez pregunta si quieres crear el proyecto en tu cuenta de Expo: responde **Y** (sí). Al terminar (de 15 a 30 minutos) muestra un **enlace y un código QR** para descargar el `.apk` desde el celular.

## Paso 3 · Instalar el APK en un celular Android

1. Descarga el archivo `.apk` en el celular (desde Releases o con el enlace de Expo).
2. Ábrelo. Si Android avisa que bloquea la instalación, toca **Configuración** y activa **Permitir desde esta fuente** (para el navegador o el administrador de archivos que usaste).
3. Toca **Instalar** y luego **Abrir**. Si aparece «Play Protect», toca **Instalar de todos modos**: es normal, porque la app no viene de Play Store.
4. La app necesita **internet** (Wi-Fi o datos) para funcionar en vivo.

## Paso 4 · Probar el tiempo real, el chat y la ubicación (con dos teléfonos)

Usa un teléfono como **comerciante (A)** y otro como **cliente (B)**. Si solo tienes uno, usa la computadora (`npx expo start --web`) para uno de los dos.

1. **En A**: **Crear cuenta** → «Soy comerciante» → Continuar → llena tus datos → elige **Mi negocio es nuevo**, escribe nombre, tipo de negocio y dirección → **Crear cuenta**.
2. **En A**: **Perfil → Editar mi negocio → Usar mi ubicación actual** (acepta el permiso) → **Guardar cambios**. Así los clientes verán la distancia.
3. **En B**: **Crear cuenta** → «Soy cliente». En **Inicio** toca **Activar mi ubicación**. Verás los negocios ordenados del más cercano al más lejano (vista **Cerca de ti**), cada uno con su distancia.
4. **En B**: toca **Ver productos** del negocio de A y déjalo abierto.
5. **En A**: pestaña **Productos → Agregar** y publica un producto. **En B aparece solo, en un par de segundos, sin tocar nada.**
6. **En A**: marca ese producto como **Agotado**, o apaga el interruptor de «abierto». **En B cambia al instante.**
7. **Chat, de B a A**: en la ficha del negocio toca **Chatear**, escribe un mensaje (o toca una respuesta rápida). **En A**, la pestaña **Chats** muestra un círculo rojo con el número 1; ábrela y responde. **En B** la respuesta llega al instante.
8. **Favoritos (privado)**: **en B** toca **♡ Guardar en favoritos** en la ficha. **En A** no se entera: lo suyo lo decide él.
9. **Carrito y apartado**: **en A**, en **Perfil → Editar mi negocio → Pedidos y apartado**, deja 30 minutos de apartado y enciende «Pago por transferencia» con sus datos; en **Productos** escribe «Existencias» (por ejemplo, 5). **En B**, toca **Agregar** en un producto, abre **Ver carrito**, elige «Transferencia» y **Apartar pedido**. **En A** aparece solo el aviso «Pedido nuevo» y el número rojo en **Pedidos**.
10. **Atender el pedido**: **en A**, abre el pedido y toca **Aceptar pedido**. **En B** aparece al instante «Haz la transferencia…» con los datos de pago; toca **Ya pagué**. **En A**: **Confirmar pago** → **Marcar listo** → **Entregado y cobrado**. Las existencias bajan solas y el pedido queda también como tarjeta en el chat.
11. **Cliente frecuente (lo elige el comerciante)**: **en A**, desde el pedido toca **Nombrar cliente frecuente**, elige un descuento y/o un beneficio y guarda. **En B** aparece «⭐ Eres cliente frecuente» y su siguiente pedido ya lleva el descuento.
12. **Que no se pierda el producto**: **en B** aparta un pedido y no lo atiendas. Al acabarse el tiempo (en el APK real, hasta 1 minuto después) el pedido pasa a «Venció» y el producto vuelve a estar a la venta; **en A** puedes darle **30 minutos más** antes de que venza.
13. **Sin internet**: apaga el internet en B. Aparece el aviso «Sin internet…» y se ve lo último guardado. Al volver el internet, la app se pone al día sola.

## Probarla en tu computadora

1. Instala [Node.js](https://nodejs.org) (versión LTS) si no lo tienes.
2. Abre una terminal **dentro de esta carpeta**.
3. Escribe `npm install` (la primera vez).
4. Escribe `npx expo start --web --clear`. Se abre sola en el navegador (necesita `src/config.ts` ya con los datos de Supabase).
5. En el celular (opcional): `npx expo start`, instala **Expo Go** y escanea el código QR. El celular y la computadora deben estar en el mismo Wi-Fi.

## Reclamar un negocio con seguridad

Las tiendas reales del directorio (Carnicería San Javier, Tortillería El Maizito, Carnicería Keren) aparecen **sin dueño**.
Para que nadie se quede con una tienda ajena (ni por tocar sin querer), cada una tiene un **código de reclamo** secreto de 12 letras y números
que se le entrega **solo a su dueño de verdad**.

- Sin el código correcto la tienda **no se puede reclamar**. No importan mayúsculas, espacios ni guiones.
- Antes de quedarse con la tienda la app pregunta **«¿Es tu negocio?»** y se puede elegir **«No, volver»**.
- Si alguien reclamó por error, en su perfil toca **«Dejar de administrar este negocio»**: la tienda vuelve a la lista sin dueño.
- Después de **5 códigos incorrectos** se bloquean los intentos 5 minutos.
- Nadie puede crear un negocio nuevo con el nombre de una tienda del directorio.
- **El código no está escrito en la app ni en la base de datos**: solo queda su «huella» (un resumen que no se puede deshacer). La revisión ocurre **en el servidor** (Supabase), no en el teléfono, así que no se puede saltar desde la app.

**Crear o cambiar un código** (necesitas Node.js; en la carpeta del proyecto):

```
node scripts/codigo-reclamo.mjs carniceria-keren                       # código nuevo para una tienda que ya existe
node scripts/codigo-reclamo.mjs nueva-tienda "Nombre de la tienda" "Giro"   # agrega una tienda nueva al directorio, con su código
node scripts/codigo-reclamo.mjs --revisar carniceria-keren K7M2-9QXP-4HWD   # ¿este código es el de la base de datos?
```

El script muestra el código (se lo das al dueño y lo guardas en privado, **no** en el proyecto ni en GitHub) y el SQL que se pega en **SQL Editor** de Supabase para dejar la huella.

**Coordenadas de las tiendas del directorio**: aún no las tienen. Cuando las tengas, en **SQL Editor**:
`update public.negocios set lat = 17.0000, lng = -96.7000 where id = 'carniceria-keren';`
(cambia los números por los reales). Con eso aparece su distancia a los clientes.

## Dónde cambiar cosas

| Quiero… | Archivo |
| --- | --- |
| Conectar la app a otro proyecto de Supabase | `src/config.ts` |
| Cambiar tablas, reglas de seguridad o las tiendas del directorio | `supabase/esquema.sql` (y volver a ejecutarlo en SQL Editor) |
| Agregar otra tienda real al directorio | `node scripts/codigo-reclamo.mjs …` (ver arriba) |
| Cambiar los tipos de negocio, categorías de producto o la comunidad | `src/data/contenido.ts` |
| Cambiar las unidades de venta de cada giro (vaso, rebanada, kilo…) | `src/data/giros.ts` |
| Cambiar colores y letras | `src/ui/theme.ts` |
| Cambiar el ícono de la app o la pantalla de inicio (carpeta `assets/`) | `scripts/hacer-iconos.cjs`; luego `npm i --no-save sharp` y `node scripts/hacer-iconos.cjs` (GitHub lo hace solo al compilar) |
| Cómo se leen y guardan datos, tiempo real y sesión | `src/store.tsx`, `src/lib/nube.ts`, `src/lib/supabase.ts` |
| Chat | `src/ui/ChatView.tsx` y `src/app/chat-negocio/`, `src/app/chat-cliente/` |
| Carrito, pedidos y clientes frecuentes (pantallas) | `src/app/carrito.tsx`, `src/app/pedido/[id].tsx`, `src/app/clientes.tsx`, `src/app/cliente/pedidos.tsx`, `src/app/comerciante/pedidos.tsx` |
| Reglas y textos de los pedidos (tiempos, estados, totales) | `src/lib/pedidos.ts` (las reglas de verdad las aplica la base: `supabase/esquema.sql`, funciones `crear_pedido` y `pedido_accion`) |
| Ubicación y distancias | `src/lib/ubicacion.tsx`, `src/lib/geo.ts`, `src/lib/distancia.ts` |
| Pantallas del cliente / del comerciante | `src/app/cliente/` y `src/app/comerciante/` |

## Si algo falla

- **«Falta conectar la base de datos»** al abrir la app: faltan los datos en `src/config.ts` (Paso 1, punto 6) y volver a compilar.
- **Crear la cuenta se queda esperando o pide confirmar el correo**: sigue encendido «Confirm email» (Paso 1, punto 3).
- **«Invalid API key»** o no carga nada: la llave se copió incompleta o es de otro proyecto. Copia otra vez la URL y la llave del **mismo** proyecto.
- **Los cambios no llegan al instante**: confirma que `supabase/esquema.sql` se ejecutó completo. Aun así, la app se actualiza sola cada pocos segundos como respaldo.
- **El proyecto de Supabase «está pausado»**: el plan gratis pausa los proyectos que pasan 7 días sin usarse. Entra a supabase.com, abre el proyecto y toca **Restore project**.

## Lo que todavía hay que saber

- **Los avisos de pedidos funcionan con la app abierta** (un aviso dentro de la app y el número rojo). Con la app cerrada no suena nada: eso necesita notificaciones «push» (Firebase) y queda para un siguiente avance.
- **El pago con tarjeta en línea no está**: hoy se paga en persona o por transferencia (el comerciante confirma que le llegó). Cobrar con tarjeta necesita una cuenta con un proveedor de pagos.
- La cuenta regresiva usa el reloj del teléfono; quien manda es la base de datos, que libera los pedidos vencidos.
- **Se necesita internet** para publicar, chatear e iniciar sesión. Sin internet la app muestra lo último que guardó en el teléfono, pero no deja cambiar nada.
- Las cuentas y productos del Avance 1 estaban guardados solo en cada teléfono: **no pasan a la nube**; hay que crear las cuentas de nuevo.
- Quien administra el proyecto de Supabase puede ver las tablas, incluidos los mensajes de los chats. Entre usuarios, un chat solo lo ven las dos personas que participan.
- Los logos y fotos se reducen y se guardan dentro de la base de datos (con un límite de tamaño). Para una versión final conviene usar Supabase Storage.
- El plan gratis de Supabase es suficiente para el avance y las pruebas; para muchos usuarios habría que subir de plan.
- El APK es de prueba: sirve para instalar y probar en un celular, **no** para subirlo a Play Store.

## Revisiones antes de entregar

```
npx tsc --noEmit    # revisa tipos
npx expo lint       # revisa estilo
node scripts/revisar-config.cjs   # ¿src/config.ts está listo y sin llaves secretas?
```
