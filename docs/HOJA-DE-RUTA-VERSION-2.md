# Mercaboot · Versión 2: hoja de ruta y estado de la entrega

| | |
|---|---|
| **Proyecto** | Mercaboot |
| **Autor principal** | José David Pérez Miguel |
| **Segunda autora** | Izebel Altamirano Carreño |
| **Fecha** | 23 de noviembre de 2026 (primera versión de este documento: 21 de noviembre) |
| **Estado** | **Entregada.** Las siete fases y las siete mejoras pequeñas están programadas y probadas. Lo que depende de cuentas del autor (IA, Firebase) queda **dormido** hasta activarlo con la [guía de activación](GUIA-DE-ACTIVACION.md). La actualización de la base de datos y las funciones del servidor **ya están aplicadas** en la base real (23-nov-2026). |
| **App** | «Mercaboot 2» · paquete `com.mercaboot.v2` · versión 5.0.0 (código 7) |
| **Rama** | `version-2` (sale de `version-voz`). La versión final registrada (`version-final`) y «Mercaboot Voz» (`version-voz`) siguen intactas. |

© 2026 José David Pérez Miguel. Todos los derechos reservados (ver [LICENSE](../LICENSE)).

Este documento nació el 21 de noviembre como propuesta: ordenaba lo que el autor pidió después de la exposición, en qué orden y cuánto costaba. Ahora dice **qué se hizo con cada punto**,
qué quedó pendiente y por qué. Se escribió sin exagerar: lo que no se hizo, o se hizo a medias, está marcado.

**Cómo leer las marcas**

| Marca | Significa |
|---|---|
| ✅ | Hecho y probado. |
| ✅ 🔑 | Hecho y probado, pero **dormido**: despierta cuando el autor pone una llave o una cuenta (ver la guía). |
| ◐ | Hecho en parte; se dice qué falta. |
| ☐ | No se hizo (con la razón). |

## 1. Resumen por fase

| Fase | Tema | Origen | Estado | En una línea |
|---|---|---|---|---|
| 1 | Ideas para cocinar que entienda cualquier texto | Pedido | ✅ 🔑 | Las 37 frases de platillos que fallaban ahora dan su receta; el recetario pasó de 95 a **177** recetas (la meta era ~300); la IA para lo que falte está lista y dormida |
| 2 | Tiendas con muchos productos | Pedido | ◐ | Catálogo de 321 productos, «Precios de hoy», horario automático, listas con buscador y fotos que se piden al verlas. Falta mover las fotos a Supabase Storage |
| 3 | Notificaciones | Pedido | ✅ 🔑 | Mensajes, pedidos, avisos de tiendas favoritas y «ya hay…»; se activan al conectar Firebase |
| 4 | Boti con más funciones | Pedido | ◐ | «Pregúntale a Boti», «mi mandado», tiendas abiertas, «avísame cuando haya…», resumen del día y respuestas rápidas. Faltan la voz para avisos y la IA de lenguaje libre |
| 5 | Importar y escanear | Pedido | ✅ | Excel / Google Sheets (CSV) y escáner de códigos de barras con Open Food Facts |
| 6 | Pagos con tarjeta | Pedido | ✅ | Camino A: link de pago del propio negocio (general o por pedido), copiar CLABE y monto. El cobro integrado (camino B) no se hace |
| 7 | Opcionales con costo | Recomendación | ✅ 🔑 | IA para recetas y foto de la lista de precios → productos. Falta «Boti con IA de lenguaje real» |
| — | Mejoras pequeñas #1 a #7 | Recomendación | ✅ | Las siete, ver la sección 3 |
| — | Mejoras de ingeniería | Recomendación | ✅ | Ver la sección 4 |

## 2. Qué se hizo en cada fase

### 2.1 Fase 1 · Ideas para cocinar

**Resultado medido.** El 21 de noviembre se probaron 37 frases de platillos con un catálogo de prueba de 5 tiendas y 26 productos: solo 2 daban la receta correcta, 5 una parecida y 30 nada útil o equivocada
(detalle en [IDEAS-PARA-COCINAR-DIAGNOSTICO.md](IDEAS-PARA-COCINAR-DIAGNOSTICO.md)). Con las mismas 37 frases y el mismo catálogo, **ahora las 37 muestran la receta de ese platillo**
(o la variante más común, ofreciendo las demás). Por ejemplo, «pollo en salsa roja» da *Pollo en salsa roja*, «pastel» da *Pastel de vainilla* con otras opciones, y «agua de limón» da *Limonada*.
Los pedidos por ingrediente o antojo («qué cocino con pollo y papa», «algo dulce», «tengo huevo y jitomate», «dónde hay huevo») siguen funcionando igual.

| Capa | Estado | Qué hace |
|---|---|---|
| 1 · Entender mejor | ✅ | `src/ia/platillo.ts`: quita el relleno («dame la receta de…»), compara con el nombre de cada receta, distingue «roja» de «verde» (y «fresa» de «plátano», «pollo» de «res»), ofrece variantes («galletas» → mantequilla, avena, chispas) y **nunca** muestra como respuesta una receta que solo se parece. Frases de charla («otra opción», «para niños», «ingredientes para…») ya no se confunden con platillos |
| 2 · Recetario grande | ◐ | De 95 a **177** recetas: 56 escritas a mano (galletas, pasteles, lasaña, ceviche, tamales, brownies…) y 26 armadas con «alimento + salsa» (pollo en salsa roja, res en salsa verde…) con su punto de cocción. Las de carne y huevo traen la cocción completa. **No se llegó a las ~300 de la meta**; lo que falte lo cubre la capa 3 |
| 3 · IA para lo que no esté | ✅ 🔑 | Función `receta-ia`: pide la receta a un modelo de IA, la revisa, la guarda para que la próxima vez sea gratis, la muestra con la etiqueta «Receta sugerida por IA» y su aviso de cocción segura. Límites por persona y en total. **Ya está publicada en Supabase**; sin la llave `ANTHROPIC_API_KEY` responde «no activada» y la app lo explica y propone recetas parecidas |

Cuando la IA está activa, cada receta nueva queda en la tabla `recetas_ia`: sirve para ver qué platillos pide la gente y pasar los mejores al recetario. Si está apagada, lo que no se encontró no se guarda.
Falta que el autor revise que las recetas tengan el sabor de la región.

### 2.2 Fase 2 · Tiendas con muchos productos

| Parte | Estado | Qué hace |
|---|---|---|
| Catálogo Mercaboot | ✅ | **321** productos comunes por tipo de negocio (frutería, verdulería, abarrotes…). El comerciante palomea lo que vende y se agregan de golpe, con nombre, unidad, categoría y dibujito automático (**Productos → «Catálogo Mercaboot»**) |
| Precios de hoy | ✅ | Todos los productos en una pantalla: precio editable, hay / se acabó, «subir o bajar precios» por porcentaje, «marcar todo agotado / disponible» y «volver a los precios de ayer» (**Productos → «Precios de hoy»**). La copia de ayer vive solo en el teléfono, para deshacer errores |
| Horario automático | ✅ | Horas por días (hasta 2 tramos por día; pasa de medianoche) y el negocio se **abre y cierra solo**, aun con la app cerrada (la base de datos lo hace con `pg_cron`). Aviso en el inicio del comerciante |
| Lista de productos liviana | ✅ | Buscador, categorías y «Ver más» cuando hay muchos productos (de 12 en adelante). Productos por páginas, recarga con tope de frecuencia, avisos en tiempo real por tandas y respaldo local recortado |
| Fotos bajo demanda | ◐ | La foto ya **no se baja junto con todos los productos**: se pide cuando se ve, con un dibujito (emoji) de respaldo. Las fotos **siguen guardadas dentro de la base de datos** |
| Fotos en Supabase Storage con miniaturas | ☐ | **Pendiente.** Se dejó para después porque mover fotos ya guardadas es un cambio grande y delicado (hay que copiar, comprobar y recién entonces borrar). Con pocas tiendas con foto no hace falta; con muchas, sí (ver la sección 6) |
| Tope por negocio | ✅ | De 500 a **1,500** productos por negocio (cambio en la base de datos; las otras apps siguen funcionando) |
| Duplicar producto | ☐ | No se hizo: el catálogo y la importación cubren la necesidad |

### 2.3 Fase 3 · Notificaciones

| Parte | Estado |
|---|---|
| Mensaje nuevo en un chat (cliente → comerciante y al revés) | ✅ 🔑 |
| Pedido nuevo o cambio de estado (aceptado, listo, entregado, cancelado, «avisó su pago», pago confirmado) | ✅ 🔑 |
| Avisos de las tiendas favoritas y «ya hay…» de lo que la persona le pidió a Boti | ✅ 🔑 |
| Pantalla **Perfil → «Avisos al teléfono»**: elegir qué recibir (mensajes, pedidos, avisos de favoritas) y «No molestar de noche» (10 pm a 7 am; los pedidos sí llegan) | ✅ |
| Al tocar el aviso se abre ese chat o pedido | ✅ |
| Opción de **ocultar el texto** del mensaje en la pantalla bloqueada | ☐ Pendiente: la notificación muestra los primeros 140 caracteres del mensaje |
| iPhone | ☐ Necesita una cuenta de pago de Apple |

**Cómo funciona.** Alguien manda un mensaje → su app le avisa a la función `enviar-notificacion` → la función le pregunta a la base de datos si procede y a quién avisar (la base de datos decide, no la app)
→ le pide a Firebase (FCM v1) que toque el teléfono. Hay límites por persona y por día, y los teléfonos que ya no existen se borran solos.
**Dormido por diseño:** si el APK se arma sin `google-services.json`, la app no pide permisos ni llama a la función; sin la llave `FCM_SERVICE_ACCOUNT`, la función no hace nada.

### 2.4 Fase 4 · Boti con más funciones

| Función propuesta | Estado | Cómo quedó |
|---|---|---|
| «Pregúntale a Boti» | ✅ | La pantalla del asistente ya se llama así. Se llega desde la tarjeta verde **«¿Qué se te antoja?»** del inicio y desde el globo de Boti («Pregúntame») |
| «Mi mandado» | ✅ | «mi mandado: huevo, tortillas, leche» → Boti dice en qué tienda conviene cada cosa o qué combinación de tiendas conviene |
| Tiendas abiertas, más baratas, cerca | ✅ | «¿qué tiendas están abiertas?», «lo más barato hoy»… con el motor local, sin costo |
| «Avísame cuando haya aguacate» | ✅ 🔑 | La persona lo pide (o toca «Avísame cuando haya…» en una búsqueda sin resultado). Cuando una tienda lo marca disponible (al agregarlo, al publicar «Ya hay…» o al subir una lista de precios) llega el aviso al teléfono, y Boti lo dice dentro de la app si está abierta. «Ya no me avises de aguacate» lo quita. El aviso al teléfono necesita la fase 3 activa |
| Boti para el comerciante: resumen del día | ✅ | En el inicio del comerciante: chats sin leer, productos sin revisar hace días y lo más buscado que nadie tiene (con botones «Ya hay» o «Agregar») |
| Respuestas rápidas del comerciante | ✅ | En el chat: «Sí hay», «Sí hay, apártalo desde la app», «Ya se acabó», «Llega mañana» y «Llega a las…» con selector de hora |
| Voz | ◐ | Boti conserva el **saludo hablado de bienvenida** de «Mercaboot Voz». Decir avisos importantes en voz alta **no se hizo** |
| IA de lenguaje real para frases libres | ☐ | No se hizo. El motor local entiende las frases típicas; una IA para frases libres o para ayudar a redactar avisos queda como idea futura |

### 2.5 Fase 5 · Importar y escanear

| Parte | Estado | Detalle |
|---|---|---|
| Importar desde Excel o Google Sheets (CSV) | ✅ | **Productos → «Importar mi lista»**. Baja la plantilla, la llenas y la subes. Lee archivos con coma, punto y coma o tabulador (UTF-8, ANSI de Windows o UTF-16), precios como «$1,250.50» o «12,5» y encabezados flexibles. **Antes de agregar nada muestra un resumen** (nuevos, repetidos, filas con problemas) y deja actualizar precios y existencias de lo que ya tiene. También exporta tus productos («Bajar mis productos») |
| Escáner de código de barras | ✅ | **Productos → «Escanear código»**. EAN-13, EAN-8 y UPC-A con revisión del dígito de control. Busca primero en la memoria compartida de Mercaboot (tabla `codigos_barras`: guarda el código y el nombre del producto; nadie más ve quién lo escaneó) y luego en **Open Food Facts**; lo nuevo se recuerda para el siguiente comerciante. La consulta sale del teléfono del comerciante, y la licencia ODbL se cumple dando el crédito en **Acerca de** |
| Límites que se mantienen | — | No cubre fruta a granel ni todos los productos mexicanos: el comerciante revisa el nombre y pone el precio |

### 2.6 Fase 6 · Pagos

Detalle completo, seguridad y comisiones en [PAGOS.md](PAGOS.md).

| Parte | Estado |
|---|---|
| Transferencia con botones **«copiar CLABE»** y **«copiar monto»**; aviso al comerciante cuando el cliente toca «Ya pagué» | ✅ |
| **Camino A · tarjeta con el link de pago del propio negocio**: link general o link por pedido; el cliente paga en la página del proveedor y vuelve a tocar «Ya pagué»; el comerciante confirma. Mercaboot nunca ve ni guarda tarjetas ni dinero | ✅ |
| Revisión de los links (solo `https`, sin trucos tipo `paypal.com@sitio-falso.com`), el cliente ve a dónde va antes de pagar, y la CLABE se revisa con su dígito de control | ✅ |
| Compatibilidad: los estados de pago de siempre se reutilizan, así que la versión final y «Mercaboot Voz» no se rompen | ✅ |
| **Camino B · cobro integrado** (el pedido se marca pagado solo y el dinero se reparte) | ☐ No se hace por ahora: más trabajo (servidor, avisos de pago, devoluciones, una cuenta por negocio) y manejar dinero ajeno trae obligaciones legales y fiscales. Solo valdría la pena con negocios reales que lo pidan |

### 2.7 Fase 7 · Opcionales con costo

| Parte | Estado | Detalle |
|---|---|---|
| IA en las recetas | ✅ 🔑 | Ver 2.1 (capa 3) |
| Foto de la lista de precios o del pizarrón → productos | ✅ 🔑 | **Productos → «Importar mi lista» → «Desde una foto»**. Función `foto-a-productos`: solo cuentas con negocio, revisa que sea una foto de verdad, límites por persona (3 por minuto, 20 por hora, 12 por día) y en total (150 por día), **no guarda la foto** y revisa lo que contesta la IA. Se ve el mismo resumen de la importación y **nada se agrega sin revisarlo** |
| Boti con IA de lenguaje real | ☐ | No se hizo (ver 2.4) |

Requisitos comunes de las funciones con IA: la llave va como secreto de Supabase, hay caché, límite por persona y en total, y se recomienda un tope mensual de gasto en el proveedor (guía, paso 3).

## 3. Mejoras pequeñas recomendadas

| # | Mejora | Estado | Dónde está |
|---|---|---|---|
| 1 | Horario automático | ✅ | **Productos → «Horario»** y **Editar mi negocio**; la base de datos abre y cierra el negocio |
| 2 | Aviso con un toque | ✅ | Al marcar un producto como agotado o disponible aparece **«Avisar a mis clientes»** (publica «Ya hay aguacate.» o «Ya no hay aguacate por hoy.» y manda el aviso al teléfono) |
| 3 | QR y enlace para compartir | ✅ | **Perfil → «Compartir mi negocio (QR y cartel)»**: enlace por WhatsApp, copiar el enlace y **cartel en PDF listo para imprimir** con tu QR. **Perfil → «Escanear QR de un negocio»** lo lee dentro de la app. El QR se genera dentro de la app, sin librerías externas |
| 4 | Pedir otra vez | ✅ | En un pedido entregado: **«Pedir otra vez»** llena el carrito con lo que todavía hay y avisa lo que ya no |
| 5 | Lista del mandado | ✅ | «mi mandado: huevo, tortillas, leche» con Boti (ver 2.4) |
| 6 | Lo que buscan y no encuentran | ✅ | Se cuenta solo el texto de las búsquedas sin resultado (sin acentos, sin datos de quién buscó) y el comerciante lo ve en su resumen del día |
| 7 | Reportar y bloquear | ✅ | Reportar un mensaje (mantenerlo presionado), una persona, un negocio o una reseña; bloquear desde el menú ⋮ del chat; **Perfil → «Personas bloqueadas»**. Cómo se revisan los reportes: [MODERACION.md](MODERACION.md) |

## 4. Mejoras de ingeniería (no estaban pedidas)

Son cosas que un ingeniero de software agregaría para que la app sea segura y fácil de mantener, sin saturar de pantallas:

- **Eliminar mi cuenta** (**Perfil → «Eliminar mi cuenta»**): explica qué se borra y qué se queda sin tu nombre, no deja continuar con pedidos en curso y pide escribir `ELIMINAR`. La base de datos lo hace en una sola operación (o se borra todo o nada); si eras dueño de una tienda del directorio, la tienda vuelve a la lista con sus datos de antes. Las tiendas de aplicaciones, como Google Play, piden esta función.
- **Pantalla de error con «Intentar de nuevo»**: la app ya no se queda en blanco si algo falla.
- **«Acerca de»**: autoría, privacidad (incluye que el texto y la foto de las funciones con IA se mandan al proveedor), reglas de la comunidad y créditos de terceros.
- **Ayuda completa**: preguntas frecuentes de todo lo nuevo, para clientes y comerciantes.
- **Límites de uso en todo lo nuevo** (por persona y por tiempo) y registro de seguridad sin datos personales.
- **Todo lo nuevo de la base de datos es solo aditivo** y está en **un solo archivo** (`supabase/actualizacion-v2-todo.sql`), que se arma con un script y se revisa solo (falla si alguien le agrega un `DROP` o un `TRUNCATE`). Se aplica en una sola operación y se puede repetir sin problema.
- **Dormido por diseño:** lo que necesita una llave o una cuenta no falla ni estorba si no está; avisa con un texto amable.
- **App aparte:** «Mercaboot 2» se instala junto a las otras dos y no las reemplaza; usa la misma base de datos y las mismas cuentas.
- **Revisión en cada subida de código** (`.github/workflows/verificar.yml`): tipos, estilo, que no haya llaves secretas en la conexión y que el archivo único de la base de datos esté al día y solo agregue cosas. Si algo falla, GitHub marca la subida con una ✗ roja.
- **Revisiones en cada compilación:** tipos (`tsc`), datos de conexión sin llaves secretas, `google-services.json` del paquete correcto, **permisos de Android** (que no falte la cámara, internet, la ubicación ni los avisos, tanto en el proyecto como en el APK ya armado; si falta alguno, la corrida se detiene y no publica nada) y registro de cómo terminó cada corrida en la rama técnica `build-log-v2`.
- **Pruebas automáticas** de la lógica y de la base de datos (sección 5). Se corrieron con programas de prueba aparte; pasarlos al repositorio para correrlos en cada subida está pendiente (sección 6).

## 5. Pruebas

**Lo que se probó con programas** (cada una se corrió completa antes de entregar, sin fallas):

| Área | Comprobaciones |
|---|---|
| Base de datos: reportar y bloquear | 117 |
| Base de datos: códigos de barras | 32 |
| Base de datos: Boti (lo que buscan y no encuentran) | 6 |
| Base de datos: avisos al teléfono y alertas de productos | 58 |
| Base de datos: pagos (links y estados) | 80 |
| Base de datos: eliminar mi cuenta | 136 |
| App: importar y exportar CSV | 144 |
| App: pagos (links, CLABE, textos) | 95 + 29 |
| App: foto de la lista de precios (servidor y app) | 91 + 48 |
| App: horario automático | 86 |
| App: enlaces y QR (más 130 códigos QR leídos con un lector independiente) | 61 |
| App: códigos de barras | 44 |
| App: eliminar mi cuenta | 45 |
| App: «mi mandado» y «avísame cuando haya…» | 41 |
| App: aviso con un toque | 28 |
| Servidor: avisos al teléfono (firma y mensajes) | 28 |
| App: resumen del día | 22 |
| Compilación: revisión de permisos (con y sin cámara, en el proyecto y en el APK, sin avisos, archivo que no existe) | 6 casos |

Además, las 37 frases de platillos del diagnóstico (sección 2.1), la revisión de tipos (`npx tsc --noEmit`) y de estilo (`npx expo lint`), y la prueba de que el archivo SQL único
da exactamente el mismo resultado que los archivos por separado, sobre una copia de la base de datos real, aplicado dos veces seguidas.
Las pruebas de base de datos se corrieron en una copia local (Postgres), **nunca** en la base real. Al aplicar la actualización a la base real solo se hicieron **lecturas** para comprobar que quedó igual a la copia probada (funciones, permisos, tablas y datos) y se revisó el asesor de seguridad de Supabase; no se corrió ninguna prueba que escriba datos en la base real.

**Lo que NO se pudo probar sin un celular real** (hay que hacerlo con la lista de la [guía, sección 6](GUIA-DE-ACTIVACION.md)): abrir la cámara de verdad (escáner de códigos, lector de QR, foto de la lista), los avisos al teléfono de punta a punta,
el cartel en PDF en un celular, el pago con un link real y la apariencia de las pantallas nuevas en distintos tamaños de teléfono.

**Un error que se encontró y se corrigió al revisar el APK.** La primera compilación (código 6) salió **sin el permiso de la cámara**: la opción `cameraPermission: false` del plugin del selector de fotos (`expo-image-picker`) bloquea ese permiso para todo el proyecto, también para el escáner y el lector de QR. Se encontró al leer el manifiesto del APK ya publicado, se quitó la opción (código 7) y ahora cada compilación comprueba los permisos con `scripts/revisar-permisos.cjs`, antes y después de armar el APK. Faltaría confirmar con un celular real que la cámara abre.

## 6. Lo que queda pendiente

| Pendiente | Por qué | Qué sigue |
|---|---|---|
| Fotos a Supabase Storage con miniaturas | Es un cambio grande y delicado (copiar, comprobar y recién borrar); con pocas fotos no hace falta | Hacerlo antes de abrir muchas tiendas con foto. Mientras tanto, las fotos se piden solo al verse |
| Recetario de ~300 recetas | Se llegó a 177; el resto lo cubre la IA cuando se active | Ampliarlo a mano con lo que la gente pida (tabla `recetas_ia`) y revisar el sabor de la región |
| Boti con IA de lenguaje real; avisos en voz alta | No era indispensable y suma costo y complejidad | Idea futura |
| Ocultar el texto del mensaje en la pantalla bloqueada | Se dejó fuera para no saturar la pantalla de avisos | Agregar una opción en «Avisos al teléfono» |
| Avisos en iPhone | Necesita una cuenta de pago de Apple | Cuando haya cuenta |
| Cobro con tarjeta integrado (camino B) | Obligaciones legales y fiscales, más trabajo | Solo si hay negocios reales que lo pidan |
| Página web de la versión 2 | Hoy la web (iPhone, enlaces y QR) es la de la versión 4.3. Publicar la nueva reemplazaría la que usa la versión registrada | Decisión del autor |
| Pruebas dentro del repositorio | Los programas de prueba de la sección 5 se corrieron desde un entorno de trabajo aparte; **no están en el repositorio**, así que hoy no se pueden volver a correr desde GitHub | Pasarlos a una carpeta `pruebas/` con un comando `npm test` y correrlos en cada subida. Ojo: la prueba de avisos depende de la hora (de 10 de la noche a 7 de la mañana entra «No molestar» y el aviso no sale), así que al pasarla hay que fijarle una hora de día |
| Panel para revisar reportes | Hoy se revisan en Supabase (tabla `reportes`) | Hacerlo si crece el uso |
| `LICENSE` | Dice «versión final 4.3» | Decidir con INDAUTOR o un abogado si se registra la versión 2 (guía, sección 8) |

## 7. Base de datos y servidor: qué está aplicado

| Archivo | Qué agrega | ¿En la base real? |
|---|---|---|
| `esquema.sql`, `actualizacion-2-1.sql`, `actualizacion-final.sql`, `actualizacion-seguridad.sql`, `actualizacion-detalle-productos.sql` | La versión final registrada | Sí |
| `actualizacion-receta-ia.sql` | Caché y límites de la IA de recetas | Sí |
| `actualizacion-v2-productos.sql` | Productos por lote, horario automático (`pg_cron`), tope de 1,500 | Sí |
| `actualizacion-v2-todo.sql` (junta las 6 partes de abajo) | Reportar y bloquear · códigos de barras · lo que buscan y no encuentran · avisos al teléfono y alertas · pagos con link · eliminar mi cuenta | **Sí.** Aplicado el 23-nov-2026 como una sola migración (`v2_reportes_codigos_boti_notificaciones_pagos_cuenta`) |

| Función del servidor | Qué hace | ¿Publicada? |
|---|---|---|
| `receta-ia` | Recetas con IA | Sí (dormida: falta `ANTHROPIC_API_KEY`) |
| `foto-a-productos` | Lista de precios desde una foto | Sí (dormida: falta `ANTHROPIC_API_KEY`) |
| `enviar-notificacion` | Avisos al teléfono | Sí (dormida: falta `FCM_SERVICE_ACCOUNT`) |

**Cómo se aplicó (23 de noviembre de 2026).** El archivo único entró como **una sola migración**: o entraba todo o no entraba nada. Después se comprobó, solo leyendo, que la base real quedó igual a la copia local probada: las 26 funciones nuevas con las mismas definiciones y los mismos permisos, 9 tablas nuevas (26 tablas y 79 funciones en total) y los datos que ya había, intactos. El asesor de seguridad de Supabase solo marca avisos esperados: las funciones que la app usa a propósito con sesión iniciada (más 3 públicas para el registro que ya existían), un ajuste opcional que sigue pendiente en `lista_de_textos_cortos` y la protección contra contraseñas filtradas, que solo ofrece el plan de pago.

**Un ajuste de seguridad antes de aplicarla.** Al probar la copia local con los mismos permisos por omisión que usa Supabase se vio que las funciones nuevas nacen abiertas para cualquiera con sesión iniciada, incluso las internas (las de ayuda y las de los disparadores). Las seis partes y el archivo único se corrigieron para cerrarlas y abrir solo las que usa la app (cambio guardado en el commit `adda722`).

La APK vigente (código 7) se armó con el commit `6e509d3`; los cambios posteriores solo agregan documentación y archivos de la base de datos, no código de la app, así que **no hace falta armar otra APK**.

## 8. Lo que no se agregará por ahora

- Cobro con tarjeta integrado (camino B) hasta que haya negocios reales que lo pidan.
- Puntos, medallas o juegos.
- Feed o red social dentro de la app.
- Repartidores propios.
- Cuentas de empleados (se revisa cuando un negocio lo pida).

## 9. Reglas que se cumplieron

1. **Ramas.** Todo el trabajo nuevo va en `version-2`. `version-final` (la del registro de derechos) y `version-voz` no se tocaron.
2. **App aparte.** «Mercaboot 2» (`com.mercaboot.v2`) se instala junto a las otras y no pisa sus publicaciones (`final-apk` y `voz-apk`); la suya es `v2-apk`.
3. **Base de datos compartida.** Solo se agregan tablas, columnas y funciones. No se borró ni se cambió nada de lo que existe (tampoco al aplicarla en la base real).
4. **Secretos.** Ninguna llave secreta está en el repositorio, en la app ni en el chat (llave de servicio de Supabase, llaves de IA, llave privada de Firebase). Van como secretos de Supabase o de GitHub.
5. **No saturar.** Las funciones nuevas viven dentro de pantallas que ya existían (Productos, Perfil, el chat, el inicio); las pantallas nuevas son las de cada herramienta.
6. **Autoría.** Todos los cambios de la versión 2 se guardaron con el nombre del autor principal, José David Pérez Miguel. Los cambios anteriores, de la versión final y de «Mercaboot Voz», siguen como estaban (ver la guía, sección 8).
7. **Plan gratis de Supabase.** Sirve para pruebas y la entrega; antes de usar la app con negocios reales hay que decidir si se sube a un plan de pago (guía, sección 7).

## 10. Datos y costos verificados

Consultados el 21 de noviembre de 2026 (el precio de la IA, también el 23 de noviembre en la página oficial). Los precios pueden cambiar; confirmar antes de contratar algo.

| Dato | Valor | Fuente |
|---|---|---|
| Firebase Cloud Messaging | Sin costo | [Firebase](https://firebase.google.com/products/cloud-messaging/) |
| Supabase plan gratis | 500 MB de base de datos, 1 GB de archivos, 5 GB de transferencia, 500,000 ejecuciones de funciones al mes; pausa tras 1 semana sin actividad | [Supabase](https://supabase.com/pricing) |
| Supabase plan Pro | Desde US$25 al mes; no se pausa por inactividad | [Supabase](https://supabase.com/pricing) |
| Claude Haiku 5.5 (el modelo de las funciones con IA) | US$0.10 por millón de tokens de entrada y US$0.50 de salida, para peticiones de hasta 100,000 tokens | [Precios de Claude](https://platform.claude.com/docs/en/about-claude/pricing) |
| Costo estimado de una receta nueva con IA | ≈ US$0.0006 (suponiendo ~1,500 tokens de entrada y ~900 de salida) | Cálculo propio con el precio oficial |
| Costo estimado de una foto de lista de precios | ≈ US$0.001 (suponiendo ~3,000 tokens de entrada y ~1,500 de salida) | Cálculo propio con el precio oficial |
| Mercado Pago, link de pago | 3.49 % + $4 al instante; 3.19 % + $4 a 7 días; 2.95 % + $4 a 30 días. La página menciona el IVA sobre el cargo fijo y los meses sin intereses, y no aclara si aplica a la tasa base | [Mercado Pago](https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago) |
| Stripe México | 3.6 % + MXN 3.00 por tarjeta nacional, más IVA; sin cuota mensual | [Stripe](https://stripe.com/en-mx/pricing) |
| Open Food Facts | 15 consultas por minuto por conexión (producto) y 10 (búsqueda); User-Agent obligatorio; datos ODbL con crédito; fotos CC BY-SA | [API](https://openfoodfacts.github.io/openfoodfacts-server/api) y [licencias](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/) |

En compras chicas la comisión de la tarjeta pesa mucho (con 3.49 % + $4, sin IVA):

| Pedido | Comisión | Porcentaje del pedido |
|---|---|---|
| $20 | $4.70 | 23.5 % |
| $50 | $5.75 | 11.5 % |
| $100 | $7.49 | 7.5 % |
| $300 | $14.47 | 4.8 % |

Por eso la tarjeta solo conviene en pedidos grandes y la transferencia y el efectivo siempre quedan disponibles.

## 11. Fuentes

- [Expo · configuración de notificaciones push](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Expo · credenciales FCM](https://docs.expo.dev/push-notifications/fcm-credentials)
- [Expo · token nativo de FCM](https://docs.expo.dev/push-notifications/obtaining-a-device-token-for-fcm-or-apns)
- [Supabase · secretos de las funciones](https://supabase.com/docs/guides/functions/secrets)
- [Supabase · enviar notificaciones push](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Claude · límites de gasto y de uso](https://platform.claude.com/docs/en/api/rate-limits)
- [Mercado Pago · integración de marketplace](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/how-tos/integrate-marketplace)
- Las demás fuentes están en la tabla de la sección 10.

## 12. Registro de cambios de este documento

- **2026-11-21.** Primera versión: se ordenan los temas pedidos tras la exposición, se agrega el diagnóstico de «Ideas para cocinar» y las mejoras pequeñas recomendadas. Sin cambios en el código de la app.
- **2026-11-23.** Entrega de la versión 2: el documento pasa de propuesta a estado real. Cada fase y mejora se marca como hecha, dormida, parcial o pendiente, se agregan las mejoras de ingeniería, las pruebas, el estado de la base de datos y los pendientes. La guía para activar lo que depende de cuentas del autor está en [GUIA-DE-ACTIVACION.md](GUIA-DE-ACTIVACION.md).
- **2026-11-23 (noche).** Se encontró y corrigió que la primera APK no traía el permiso de la cámara (ver la sección 5). Cambios: `app.json` (código 7), revisión automática de permisos en cada compilación, texto de la Ayuda corregido («¿Qué se te antoja?» → «Pedir ideas») y este documento al día. Se quitó de pendientes el texto de la Ayuda.
- **2026-11-23 (más tarde, de noche).** Se aplicó la actualización de la base de datos a la base real y se publicaron las funciones `enviar-notificacion` y `foto-a-productos`. Antes se encontró y corrigió que las funciones nuevas nacían abiertas para quien tiene sesión iniciada (sección 7). Este documento y la [guía de activación](GUIA-DE-ACTIVACION.md) pasan de «pendiente» a «aplicado». Cambios en archivos: las seis partes de `supabase/actualizacion-v2-*.sql`, `actualizacion-v2-todo.sql` y estos documentos; el código de la app no cambia.
