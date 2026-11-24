# Mercaboot 2 · Guía de activación, paso a paso

| | |
|---|---|
| **Proyecto** | Mercaboot |
| **Autor principal** | José David Pérez Miguel |
| **Segunda autora** | Izebel Altamirano Carreño |
| **Fecha** | 23 de noviembre de 2026 |
| **Para quién** | Para el autor. Se explica con palabras sencillas y con ejemplos; no hace falta saber programar. |
| **Rama** | `version-2` |

© 2026 José David Pérez Miguel. Todos los derechos reservados (ver [LICENSE](../LICENSE)).

## Cómo leer esta guía

Mercaboot 2 ya trae **todo programado**. Pero algunas funciones necesitan algo que **solo tú puedes crear**: una cuenta, una llave o un permiso.
Mientras no lo pongas, esas funciones están **«dormidas»**: están en la app, no estorban y avisan con un texto amable («todavía no está disponible»).
Cuando pongas lo que falta, **despiertan solas**, sin volver a programar nada.

> **Regla de oro de las llaves.** Una llave es como la contraseña de tu banco. **Nunca** la pegues en un chat (tampoco conmigo), en GitHub, en un archivo
> del proyecto ni en la app. Se pega **tú mismo**, una sola vez, en el panel de Supabase o en los «Secrets» de GitHub, y se guarda ahí.
> Si alguna se muestra por error, se **desactiva** en el sitio que la creó y se crea otra (borrarla de un archivo no basta: queda en el historial).

## 0. De un vistazo: qué está listo y qué depende de ti

| Función | ¿Ya funciona? | Qué falta | Paso |
|---|---|---|---|
| Todo lo de la versión final (cuentas, tiendas, chat, pedidos, reseñas, avisos, Boti) | Sí | Nada | — |
| Recetario grande y «Ideas para cocinar» que entiende cualquier platillo (177 recetas, sin internet) | Sí | Nada | — |
| Tiendas con muchos productos: Catálogo Mercaboot, Precios de hoy, horario automático | Sí | Nada (esa parte de la base de datos ya está aplicada) | — |
| Importar productos desde Excel / Google Sheets, escáner de códigos de barras (consulta Open Food Facts), compartir con enlace y QR, aviso con un toque, Boti con «mi mandado» y «¿qué tiendas están abiertas?» | Sí | Nada | — |
| Reportar y bloquear, «avísame cuando haya…», pagos con link de tarjeta, eliminar mi cuenta y que los códigos de barras se compartan entre comerciantes | **Casi**: están en la APK, pero necesitan la **actualización de la base de datos** | Aplicar un archivo SQL (una sola vez) | 1 |
| Recetas nuevas con IA (platillos que no están en el recetario) | Dormida | Llave de la IA | 3 |
| Importar la lista de precios **desde una foto** | Dormida | Llave de la IA + la función del servidor | 1 y 3 |
| Avisos al teléfono (mensajes, pedidos, avisos de tiendas favoritas, «ya hay aguacate») | Dormida | Proyecto de Firebase (gratis) | 4 |
| Pagar con tarjeta | Sí, **cada negocio** pega el link de su propio proveedor | Nada de tu parte | 5 |

**Orden recomendado:** 1 → 2 → probar → 3 → 4. La IA y los avisos son independientes: puedes activar solo una.

## 1. Actualizar la base de datos (una sola vez)

**Qué es.** La base de datos de Supabase es donde viven las cuentas, los productos y los chats. La versión 2 necesita **tablas y funciones nuevas** (para reportes y
bloqueos, códigos de barras, avisos al teléfono, links de pago, eliminar cuenta…). Todas vienen juntas en un solo archivo:
[`supabase/actualizacion-v2-todo.sql`](../supabase/actualizacion-v2-todo.sql).

**Qué garantiza.**

- Es **solo aditivo**: agrega cosas, no borra ni renombra nada. Un script del proyecto lo revisa solo (`node scripts/armar-sql-v2.cjs --revisar`) y falla si encuentra `DROP` o `TRUNCATE`.
- Por eso la versión final registrada y «Mercaboot Voz» **siguen funcionando igual** con la misma base de datos.
- Se puede correr **más de una vez** sin problema, y funciona como **una sola operación**: si algo fallara, no se aplica nada.
- Se probó contra una copia local de la base de datos real (comprobaciones de seguridad, permisos y límites) antes de entregarlo.
- Aun así, cualquier cambio en la base de datos real es serio: las copias de seguridad diarias son del plan Pro de Supabase, no del gratis. Por eso se pide permiso antes.

**Dos formas de hacerlo (elige una):**

### Opción A · Que lo aplique Claude (recomendada)

Tu proyecto de Supabase está conectado a Claude. Dile «aplica la actualización de la base de datos» y Claude, **después de que tú lo apruebes**:

1. Aplica el archivo completo como una migración.
2. Publica en Supabase las funciones del servidor que faltan (`enviar-notificacion` y `foto-a-productos`; `receta-ia` ya está publicada).
3. Revisa que todo quedó bien (tablas, permisos y los avisos de seguridad de Supabase) y te lo cuenta.

### Opción B · Pegarlo tú

1. Entra a [supabase.com](https://supabase.com) → tu proyecto **MercaBoot** → **SQL Editor** → **New query**.
2. Abre el archivo [`actualizacion-v2-todo.sql`](../supabase/actualizacion-v2-todo.sql) en GitHub, toca **Raw**, selecciona todo (`Ctrl+A`) y cópialo (`Ctrl+C`).
3. Pégalo en el editor (`Ctrl+V`) y toca **Run**.
4. Debe decir **«Success. No rows returned»**. Si Supabase pregunta «Run this query?» porque el archivo contiene la palabra `delete` (es la función de eliminar cuenta), es normal: toca **Run this query**.
5. Las funciones del servidor (`enviar-notificacion` y `foto-a-productos`) no se publican desde aquí; con esta opción hay que pedirle a Claude que las publique, o usar la terminal con
   `npx supabase functions deploy enviar-notificacion --project-ref osvcnthsulwjyisfhsny` (y lo mismo con `foto-a-productos`, después de `npx supabase login`).

**Cómo saber que salió bien.** En Supabase → **Table Editor** aparecen las tablas `bloqueos`, `reportes`, `codigos_barras`, `busquedas_sin_resultado`, `dispositivos`,
`alertas_producto` y `pedido_links`. En la app, las pantallas que decían «todavía no está disponible» (por ejemplo, **Perfil → Personas bloqueadas**) ya funcionan.

**Si da error.** Copia el mensaje completo y mándamelo (sin llaves). Como todo es una sola operación, no queda nada a medias y se puede volver a intentar.

## 2. Instalar la APK de Mercaboot 2

1. En el **celular Android**, abre [Releases](https://github.com/perezmigueljosedavid-eng/MercaBoot/releases) y entra a **«Mercaboot 2 · Versión 2 (Android)»** (etiqueta `v2-apk`).
2. Toca **`Mercaboot-v2.apk`** para descargarlo y ábrelo. Si Android avisa que bloquea la instalación, permite instalar desde esa fuente
   (Configuración → Instalar apps desconocidas). Si aparece Play Protect, toca **Instalar de todos modos** (es normal: no viene de Play Store).
3. Se instala como **otra app llamada «Mercaboot 2»**. **No reemplaza** a la versión final registrada ni a «Mercaboot Voz».
4. Usa la **misma base de datos y las mismas cuentas**: inicias sesión con el mismo correo y contraseña.

Cada vez que quieras volver a armarla (por ejemplo, después del paso 4), se hace sola en GitHub: edita `disparador-apk.txt` en la rama `version-2`,
cambia el número de compilación y toca **Commit changes**. Tarda unos 15 minutos. O simplemente dime «recompila el APK».

## 3. Activar la IA (recetas nuevas y foto de la lista de precios)

**Qué activa.** Dos funciones del servidor que usan la misma llave:

- **Recetas con IA**: cuando alguien escribe un platillo que no está en el recetario, la IA escribe la receta, se guarda para que la próxima vez sea gratis y
  la app la muestra con la etiqueta «Receta sugerida por IA».
- **Importar la lista de precios desde una foto**: el comerciante fotografía su lista o su pizarrón y la IA lee los productos; la persona los revisa antes de agregarlos.

**Cuánto cuesta (cifras de referencia).** El modelo que usa es **Claude Haiku 5.5**. Su precio oficial es de **US$0.10 por millón de tokens de entrada y US$0.50 por millón de
salida** (para peticiones de hasta 100,000 tokens; [precios oficiales](https://platform.claude.com/docs/en/about-claude/pricing)). Con cálculos aproximados:

| Qué | Costo aproximado | Para tener una idea |
|---|---|---|
| Una receta nueva | ≈ US$0.0006 (menos de una décima de centavo) | 1,000 recetas nuevas ≈ US$0.60 |
| Una foto de lista de precios | ≈ US$0.001 | 1,000 fotos ≈ US$1 |

Las recetas repetidas no cuestan: se guardan. Son estimaciones (dependen de lo que escriba la gente y del tamaño de la foto); lo real lo ves en la página **Usage** de la consola.

**Pasos**

1. Entra a la consola de Claude: [platform.claude.com](https://platform.claude.com/) y crea tu cuenta (o inicia sesión).
2. **Carga saldo** en [Billing](https://platform.claude.com/settings/billing) → **Buy credits**. Empieza con poco (por ejemplo US$5). **No enciendas la recarga automática**: así nunca se gasta más de lo que cargaste.
3. **Pon un tope mensual** en [Spend limits](https://platform.claude.com/settings/spend-limits) → **Monthly spend limit** → **Set limit** (por ejemplo US$5). Es tu freno de seguridad.
4. **Crea la llave** en [API keys](https://platform.claude.com/settings/keys) → **Create key**. Ponle de nombre «mercaboot». La consola muestra la llave (empieza con `sk-ant-`) **una sola vez**: cópiala.
5. **Pégala en Supabase**: tu proyecto → **Edge Functions → Secrets** ([enlace directo](https://supabase.com/dashboard/project/osvcnthsulwjyisfhsny/functions/secrets)) →
   Nombre: `ANTHROPIC_API_KEY` · Valor: la llave → **Save**. No hace falta volver a publicar nada: queda lista al instante.
6. **Prueba** (las recetas con IA ya quedan listas; para la foto de la lista hay que haber hecho antes el paso 1):
   - En un celular como **cliente**: en el **Inicio**, la tarjeta verde **«¿Qué se te antoja?»** (abre la pantalla «Pregúntale a Boti») → escribe un platillo que no esté en el recetario, por ejemplo «capirotada» o «tlayuda con tasajo». Debe salir una receta con la etiqueta «Receta sugerida por IA».
   - En un celular como **comerciante**: **Productos → «Importar mi lista»** → en la parte de **«Desde una foto»** toma o elige la foto de una lista de precios. La app muestra un resumen para revisar **antes** de agregar nada.

**Los límites que ya trae la app (para que nadie gaste de más).**

| | Por persona | En total (todos los usuarios) |
|---|---|---|
| Recetas con IA | 4 por minuto y 15 por día | 300 por día |
| Fotos de lista | 3 por minuto, 20 por hora y 12 por día | 150 por día |

Esos topes se pueden cambiar con los secretos `RECETA_IA_TOPE_USUARIO_DIA`, `RECETA_IA_TOPE_GLOBAL_DIA`, `FOTO_IA_TOPE_USUARIO_DIA` y `FOTO_IA_TOPE_GLOBAL_DIA` (un número), igual que se pone la llave.
La foto **no se guarda** en ningún lado.

**Para apagarla otra vez:** borra el secreto `ANTHROPIC_API_KEY` en Supabase. Las funciones vuelven a quedar dormidas al instante.

**Privacidad (importante).** Cuando la IA está activa, **el texto que la persona escribe** (recetas) y **la foto** (lista de precios) se mandan al proveedor de IA para dar la respuesta.
La pantalla **Acerca de** de la app ya lo explica y pide no escribir ni fotografiar datos personales. Si algún día publicas un aviso de privacidad aparte, debe decir lo mismo.

## 4. Activar los avisos al teléfono (Firebase, gratis)

**Qué activa.** Que llegue una notificación aunque la app esté cerrada: un mensaje nuevo en un chat, un pedido nuevo o que cambió, un aviso de una tienda favorita y «ya hay aguacate».
Funciona en la APK de Android (en iPhone todavía no: necesita una cuenta de pago de Apple). Cada persona elige cuáles recibir en **Perfil → Avisos al teléfono**.

**Cómo funciona (para que lo entiendas).** Alguien manda un mensaje → su app le avisa a una función de Supabase → la función le pide a **Firebase** (el servicio gratuito de Google para esto) que toque el teléfono de la otra persona.
Hacen falta **dos archivos distintos** de Firebase. Es fácil confundirlos, por eso van en lugares distintos:

| Archivo | Para qué | ¿Es secreto? | Dónde se pega |
|---|---|---|---|
| `google-services.json` | Que la **APK** pueda recibir avisos | No (son datos públicos de tu app) | GitHub → Secrets → `GOOGLE_SERVICES_JSON` |
| La **llave privada de la cuenta de servicio** (un `.json` que dice `private_key`) | Que el **servidor** pueda mandar avisos | **Sí, muy secreta** | Supabase → Secrets → `FCM_SERVICE_ACCOUNT` |

**Pasos**

1. Entra a la [consola de Firebase](https://console.firebase.google.com/) con tu cuenta de Google → **Crear un proyecto** → nombre **Mercaboot** (puedes apagar Google Analytics, no hace falta) → **Crear**.
2. En la pantalla principal del proyecto toca el ícono de **Android** («Agregar app») → en **Nombre del paquete de Android** escribe exactamente `com.mercaboot.v2` → **Registrar app**.
3. **Descarga `google-services.json`** y salta los pasos que siguen (**Siguiente → Continuar a la consola**). No hay que instalar nada.
4. En GitHub: tu repositorio → **Settings → Secrets and variables → Actions → New repository secret** ([enlace directo](https://github.com/perezmigueljosedavid-eng/MercaBoot/settings/secrets/actions/new)).
   Nombre: `GOOGLE_SERVICES_JSON` · Valor: abre el archivo con el Bloc de notas, selecciona **todo** (`Ctrl+A`), copia y pega → **Add secret**.
   Si pegas el archivo equivocado, la compilación se detiene sola y te lo explica (revisa que sea de la app `com.mercaboot.v2` y que no sea la llave privada).
5. **Vuelve a armar la APK** (sección 2): ahora saldrá con avisos al teléfono. Las notas del Release dicen «Avisos al teléfono en este APK: sí». Instálala encima.
6. En Firebase: **Configuración del proyecto** (el engrane) → pestaña **Cuentas de servicio** → **Generar nueva clave privada** → se descarga un archivo `.json`. **Es secreto: no lo mandes por chat, correo ni GitHub.**
7. En Supabase: **Edge Functions → Secrets** → Nombre: `FCM_SERVICE_ACCOUNT` · Valor: **todo el contenido** de ese archivo → **Save**. Después borra el archivo de tu computadora o guárdalo en un lugar privado.
8. Haz el **paso 1** si todavía no lo hiciste (ahí se publica la función `enviar-notificacion` y se crean las tablas de avisos).
9. **Prueba con dos celulares** (no se puede probar con uno solo): uno como cliente y otro como comerciante, los dos con «Mercaboot 2» y los avisos permitidos.
   Manda un mensaje desde uno, con la app **cerrada** en el otro: debe llegar la notificación y, al tocarla, abrir ese chat.

Si Firebase dice que la **API de Cloud Messaging (V1)** está desactivada, en **Configuración del proyecto → Cloud Messaging** actívala. Es gratis.

**Para apagarlo:** borra el secreto `FCM_SERVICE_ACCOUNT` en Supabase (el servidor deja de mandar avisos al instante).

## 5. Pagar con tarjeta (no hay nada que activar)

Mercaboot **nunca ve ni guarda tarjetas ni dinero**. Cada negocio pega el **link de cobro de su propio proveedor** (Mercado Pago, Clip, Stripe, PayPal…):
el cliente lo abre, paga allá y vuelve a tocar **«Ya pagué»**; el comerciante confirma. Qué hace cada persona, qué tan seguro es y qué comisión cobra el proveedor está en
[Pagos: transferencia y tarjeta](PAGOS.md).

Lo único que conviene que sepas:

- Las comisiones las cobra **el proveedor del negocio**, no Mercaboot. En compras chicas pesan mucho (con 3.49 % + $4, un pedido de $50 paga $5.75, el 11.5 %); por eso la transferencia y el efectivo siempre quedan disponibles.
- **No cobres tú el dinero de otros** en tu cuenta. Manejar dinero ajeno trae obligaciones legales y fiscales; si algún día quieres un cobro integrado, habla antes con un contador o un abogado.

## 6. Lista para probar todo con dos celulares

Un celular es el **comerciante (A)** y otro el **cliente (B)**, los dos con «Mercaboot 2».

| # | En… | Haz esto | Debe pasar |
|---|---|---|---|
| 1 | A | **Perfil → «Compartir mi negocio (QR y cartel)»** | Salen el enlace, el QR y el cartel para imprimir |
| 2 | B | **Perfil → «Escanear QR de un negocio»** (o abre el enlace) y apunta al QR de A | La primera vez pide permiso para la cámara (toca «Mientras se usa la app»); se abre el negocio de A |
| 3 | A | **Productos → «Catálogo Mercaboot»**: palomea 10 productos | Aparecen de golpe, sin foto, con su dibujito |
| 4 | A | **Productos → «Precios de hoy»**: ponles precio | B los ve con precio |
| 5 | A | **Productos → «Importar mi lista» → «Bajar la plantilla»**: llénala en Excel o Google Sheets y súbela con «Elegir archivo» | Resumen de lo nuevo y lo repetido; se agrega al confirmar |
| 6 | A | **Productos → «Escanear código»** con una caja o botella | Sale el nombre del producto; tú pones el precio |
| 7 | B | **Buscar** «aguacate» (que ninguna tienda tenga) → botón **«Avísame cuando haya aguacate»** | Queda guardado |
| 8 | A | Agrega «Aguacate» como disponible | A B le llega el aviso (si hiciste el paso 4) |
| 9 | B | En **«¿Qué se te antoja?»** escribe «mi mandado: huevo, tortillas, leche» y luego «¿qué tiendas están abiertas?» | Boti dice en qué tienda conviene cada cosa y cuáles están abiertas |
| 10 | B | Aparta un pedido con **Transferencia o tarjeta** | A lo acepta; B ve cómo pagar, copia la CLABE y toca «Ya pagué»; A confirma |
| 11 | A | **Productos → «Horario»**: pon uno | El negocio se abre y cierra solo según el horario |
| 12 | B | En un chat, mantén presionado un mensaje → **Reportar** | Se guarda el reporte (se revisa como dice [MODERACION.md](MODERACION.md)) |
| 13 | B | **⋮ → Bloquear** a A | A ya no puede escribirle a B; se desbloquea en **Perfil → Personas bloqueadas** |
| 14 | B | **«¿Qué se te antoja?»**: «galletas» y «pollo en salsa roja» | Receta correcta de las 177 (sin internet) |
| 15 | B | **«¿Qué se te antoja?»**: un platillo raro (paso 3) | Receta con la etiqueta «Receta sugerida por IA» |
| 16 | A | **Productos → «Importar mi lista» → «Desde una foto»** (paso 3) | Resumen para revisar antes de agregar |
| 17 | Una cuenta de prueba | **Perfil → Eliminar mi cuenta** (escribe `ELIMINAR`) | La cuenta y sus datos se borran; hazlo **solo con una cuenta de prueba** |

## 7. Decisiones tuyas antes de usarla con negocios reales

1. **Plan de Supabase.** El plan gratis sirve para pruebas y la entrega, pero **pausa el proyecto tras 1 semana sin actividad** (entonces la app «no carga» hasta que lo reactivas con **Restore project**) y tiene límites
   (500 MB de base de datos, 1 GB de archivos). Antes de usarla con negocios reales conviene el **plan Pro** (desde US$25 al mes; no se pausa y trae copias de seguridad diarias). Revisa [supabase.com/pricing](https://supabase.com/pricing): los precios cambian.
2. **Un tope mensual en la IA** (paso 3) y revisar de vez en cuando la página **Usage** de la consola.
3. **Quién revisa los reportes.** Alguien tiene que mirar la tabla `reportes` con cierta frecuencia (cada semana al principio). Cómo, en [MODERACION.md](MODERACION.md).
4. **Fotos dentro de la base de datos.** Los logos y las fotos de productos todavía se guardan reducidos dentro de la base de datos (ver la [hoja de ruta](HOJA-DE-RUTA-VERSION-2.md), sección «Lo que queda pendiente»).
   Con muchas tiendas con foto, conviene pasarlas a Supabase Storage.
5. **La página web para iPhone** sigue siendo la de la **versión 4.3**. Los enlaces y QR que compartes abren esa página; funcionan, pero la versión web de Mercaboot 2 no está publicada. Publicarla reemplazaría la página que hoy usa la versión registrada;
   por eso **no se hizo sin preguntarte**. Si la quieres, dime y la preparo aparte.
6. **El nombre «mercaboot://»** lo comparten las tres apps instaladas (final, Voz y 2). Si abres un enlace de ese tipo, Android puede preguntar con cuál abrirlo. Es normal.

## 8. Trámites de autoría (consulta con un profesional)

Esto no es asesoría legal; son cosas que conviene resolver con INDAUTOR o un abogado.

- **Convenio con Izebel.** El aviso de derechos dice que tú eres el titular y que Izebel es segunda autora. Conviene dejarlo **por escrito y firmado entre los dos** (qué le corresponde a cada quien).
- **¿Se registra la versión 2?** El registro que tienen es de la **versión final 4.3** (rama `version-final`, que queda intacta). Pregunta si conviene registrar la versión 2 como una obra nueva o derivada. El archivo [`LICENSE`](../LICENSE) todavía dice «versión final 4.3».
- **Código hecho con ayuda de una herramienta de IA.** Pregunta cómo debe declararse. Es mejor preguntar **antes** de registrar que enterarse después.
- **Cambios viejos que muestran a «Claude» como autor en GitHub.** Los cambios de la versión 2 están guardados **solo a tu nombre**. Pero el historial anterior (Avance 1, Avance 2, Avance 2.1, versión final, «Mercaboot Voz» y la revisión de seguridad) se hizo antes de que pidieras aparecer como único programador, y en GitHub esos cambios (son 21 en cada rama de las versiones, y 1 en `main`) siguen apareciendo con el autor «Claude» y con una línea de coautoría. La versión 2 comparte ese historial, así que también se ven ahí. **No se cambió nada**, porque reescribir ese historial **cambia los códigos de cada cambio y las etiquetas de la versión registrada** (`version-final`). Antes de decidir, pregunta a quien lleve tu registro si eso afecta. Las opciones están en el chat: dejarlo así, hacer **copias nuevas** de las ramas con tu nombre (sin tocar las originales) o reescribir las originales.
- **Piezas de terceros.** Open Food Facts (datos con licencia ODbL: se da el crédito en **Acerca de**), la fuente Plus Jakarta Sans (OFL), Expo y las demás: ver [`THIRD-PARTY-LICENSES.md`](../THIRD-PARTY-LICENSES.md).

**Si algún día la subes a Google Play:** pide que la app permita **eliminar la cuenta desde dentro** (ya lo tiene), una página web donde se pueda pedir ese borrado, un aviso de privacidad con dirección web,
reportar y bloquear en lo que escribe la gente (ya lo tiene) y un archivo de publicación distinto al APK de pruebas (el APK de ahora no está firmado para Play Store). Los requisitos cambian: revísalos cuando llegues ahí.

## 9. Si algo falla

| Qué ves | Qué significa | Qué hacer |
|---|---|---|
| «Todavía no está disponible» en una función nueva | Falta la actualización de la base de datos | Paso 1 |
| «La IA todavía no está activada» | No hay `ANTHROPIC_API_KEY` en Supabase | Paso 3 |
| «Vas muy rápido…» o «límite» | Se llegó a un tope de uso (por persona o diario) | Esperar o subir el tope (paso 3) |
| La IA deja de responder y la consola habla de saldo o de un límite | Se acabó el saldo o se llegó al tope mensual | Cargar saldo o subir el tope en la consola |
| «Avisos al teléfono: no disponible en esta versión» | La APK se armó sin `google-services.json` | Pasos 4.4 y 4.5 |
| La cámara no abre o dice que no tiene permiso | Se negó el permiso de la cámara (o tienes la primera APK, que salió sin él) | Ajustes del teléfono → Apps → Mercaboot 2 → Permisos → Cámara → permitir. Si en esa lista no aparece «Cámara», baja otra vez la APK de Releases e instálala encima: se actualiza sin perder tu sesión |
| El permiso de avisos se negó | Android no deja volver a preguntar | Ajustes del teléfono → Apps → Mercaboot 2 → Notificaciones → permitir |
| No llegan avisos aunque todo está puesto | Revisa: ahorro de batería del teléfono, el secreto `FCM_SERVICE_ACCOUNT` completo, y los **Logs** de la función `enviar-notificacion` (Supabase → Edge Functions) | Si el secreto está mal pegado, vuelve a pegarlo completo |
| La compilación del APK se puso en rojo | Falló algo al armarla | GitHub → **Actions**; el detalle técnico queda en la rama `build-log-v2` (archivos `estado.txt` y `errores.txt`). Mándamelo |
| «Supabase está pausado» o la app no carga | El plan gratis pausa tras 1 semana sin uso | Supabase → **Restore project** (conviene hacerlo antes de una demostración) |

## 10. Dónde se cambia cada cosa

| Quiero… | Dónde |
|---|---|
| Ver o cambiar la llave de la IA | Supabase → Edge Functions → Secrets (`ANTHROPIC_API_KEY`) |
| Ver o cambiar la llave de Firebase del servidor | Supabase → Edge Functions → Secrets (`FCM_SERVICE_ACCOUNT`) |
| Cambiar el archivo de Firebase de la APK | GitHub → Settings → Secrets and variables → Actions (`GOOGLE_SERVICES_JSON`) y volver a armar la APK |
| Ver cuánto gasta la IA | [platform.claude.com/usage](https://platform.claude.com/usage) |
| Ver lo que hacen las funciones del servidor | Supabase → Edge Functions → la función → **Logs** |
| Cambiar la dirección de la página web que llevan los enlaces y QR | `URL_WEB` en `src/config.ts` |
| Revisar reportes | Supabase → Table Editor → `reportes` ([MODERACION.md](MODERACION.md)) |
