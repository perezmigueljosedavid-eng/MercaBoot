# Mercaboot · Hoja de ruta de la versión 2

| | |
|---|---|
| **Proyecto** | Mercaboot |
| **Autor principal** | José David Pérez Miguel |
| **Segunda autora** | Izebel Altamirano Carreño |
| **Fecha** | 21 de noviembre de 2026 |
| **Estado** | Propuesta por aprobar. Todavía no se ha cambiado ninguna línea del código de la app. |
| **Rama** | `version-2` (sale de `version-voz`). La versión final y la versión con voz siguen intactas. |

© 2026 José David Pérez Miguel. Todos los derechos reservados (ver [LICENSE](../LICENSE)).

Este documento ordena lo que el autor pidió después de la exposición del proyecto.
**Pedido** significa que el autor pidió resolver ese tema; la forma concreta de resolverlo es una propuesta por aprobar.
**Recomendación** significa que es una idea que se propone para que el autor decida.
Cada tema explica qué se hará, cuánto cuesta y qué tiene que hacer el autor.

## 1. Resumen y orden recomendado

| Fase | Tema | Origen | Qué incluye | Cuenta o costo externo |
|---|---|---|---|---|
| 1 | Ideas para cocinar que entienda cualquier texto | Pedido | Entender mejor lo que se escribe, recetario de unas 300 recetas, IA opcional | Ninguno (la IA es opcional y de costo muy bajo) |
| 2 | Tiendas con muchos productos | Pedido | App liviana, catálogo listo, pantalla «Precios de hoy» | Ninguno |
| 3 | Notificaciones | Pedido | Mensajes, pedidos y avisos aunque la app esté cerrada | Firebase (gratis) |
| 4 | Boti con más funciones | Pedido | «Pregúntale a Boti», resumen del comerciante, respuestas rápidas, «avísame cuando haya…» | Ninguno |
| 5 | Importar y escanear productos | Pedido | Importar desde Excel o Google Sheets (CSV) y leer códigos de barras | Ninguno |
| 6 | Pagos con tarjeta | Pedido | Link de pago del propio negocio | Comisiones del proveedor de cada negocio |
| 7 | Opcionales con costo | Recomendación | IA para recetas, foto de lista → productos, Boti con IA | Cuenta de pago con un proveedor de IA |
| — | Mejoras pequeñas | Recomendación | Ver la sección 5; se reparten dentro de las fases | Ninguno |

**Por qué este orden** (cambia el que se había propuesto antes):

- La fase 1 va primero porque es un defecto que se vio funcionando mal, no necesita cuentas externas y se nota enseguida.
- La fase 2 va segunda porque hoy la app se vuelve pesada con muchos productos, y las fases 5 y 7 dependen de ello.
- La fase 3 necesita que el autor cree el proyecto de Firebase; eso se puede hacer mientras se trabaja en las fases 1 y 2.
- Las fases 4 y 5 aprovechan lo anterior (las notificaciones sirven para «avísame cuando haya…» y el catálogo sirve para importar).
- La fase 6 va casi al final porque la transferencia ya funciona y la tarjeta cobra comisión (ver 4.6).

Cada fase termina con una APK de prueba. Antes de empezar una fase se describe qué va a cambiar y se espera la aprobación del autor.

| Avance | Fase |
|---|---|
| ☐ | 1 · Ideas para cocinar |
| ☐ | 2 · Tiendas con muchos productos |
| ☐ | 3 · Notificaciones |
| ☐ | 4 · Boti con más funciones |
| ☐ | 5 · Importar y escanear |
| ☐ | 6 · Pagos con tarjeta |
| ☐ | 7 · Opcionales con costo |

## 2. Dónde estamos hoy

**Lo que ya existe**

- Cuentas de cliente y de comerciante, negocios con ubicación y distancia, productos con precio, unidad y disponibilidad.
- Chat por negocio, avisos del comerciante, favoritos, clientes frecuentes con descuento y reseñas con estrellas.
- Pedidos apartados (a recoger o a domicilio) con pago en persona o por transferencia. El negocio guarda sus datos de cuenta (son privados), el cliente transfiere desde su banco y toca «Ya pagué», y el comerciante confirma el pago.
- Datos en tiempo real mientras la app está abierta y una copia local para abrir rápido.
- Asistente «Ideas para cocinar»: un motor propio que corre dentro del celular, sin internet y sin costo, con 95 recetas.
- Boti: consejos por pantalla, emociones y sonidos. La voz está en la rama `version-voz`.

**Lo que todavía no existe**

- Notificaciones fuera de la app. El aviso «en vivo» solo funciona con la app abierta.
- Una forma ágil de cargar muchos productos. Además, al abrir o actualizar, la app baja todos los productos de todas las tiendas, con foto. Cada foto pesa unos 22 KB (medido en la base el 21 de noviembre de 2026), así que una tienda con 300 productos con foto serían más de 6 MB solo de ella en cada celular.
- Pago con tarjeta.
- Horario automático: hoy el horario es solo un texto y el interruptor «abierto» es manual.
- Forma de compartir una tienda (enlace o QR).
- Recetas para cualquier texto (ver 4.1).

## 3. Reglas para no dañar lo que ya funciona

1. **Ramas.** Todo el trabajo va en `version-2`. `version-final` (la del registro de derechos) y `version-voz` no se tocan.
2. **App aparte.** La versión 2 se instala junto a las otras, con nombre de paquete propio (propuesto: `com.mercaboot.v2`), y no pisa sus publicaciones (`final-apk` y `voz-apk`).
3. **Base de datos compartida.** Solo se agregan tablas y columnas. No se borra ni se cambia lo que existe, y cada cambio se prueba con la APK anterior para que siga funcionando.
4. **Secretos.** Ninguna llave secreta va en el repositorio, en la app ni en el chat (llave de servicio de Supabase, llaves de IA, llave privada de Firebase). Van como secretos de Supabase.
5. **Cada fase.** Primero se explica qué cambia, luego el autor aprueba, luego se construye y se prueba.
6. **No saturar.** Cada fase agrega como máximo dos pantallas nuevas; lo demás vive dentro de pantallas que ya existen.
7. **Autoría.** Los cambios se guardan con el nombre del autor principal.
8. **Plan gratis de Supabase.** El plan gratis pausa el proyecto tras 1 semana sin actividad. Está bien para pruebas; antes de usar la app con negocios reales hay que decidir si se sube a un plan de pago (ver sección 8).

## 4. Detalle por fase

### 4.1 Fase 1 · Ideas para cocinar que entienda cualquier texto (Pedido)

**Qué pasa hoy.** Se probó con 37 frases de platillos (galletas, pastel, pollo en salsa verde, pollo en salsa roja, mole, tamales, pizza…): solo 2 dieron la receta correcta y 5 dieron una parecida. Incluso platillos que sí están en el recetario («arroz con leche», «flan», «pollo en salsa verde») no salen cuando se escriben solos. El detalle está en [IDEAS-PARA-COCINAR-DIAGNOSTICO.md](IDEAS-PARA-COCINAR-DIAGNOSTICO.md).

**Qué se hará, en tres capas**

1. **Entender mejor (gratis, sin internet).** Si lo escrito se parece al nombre de un platillo, primero se busca la receta y solo después se buscan productos. Se corrigen las confusiones («roja» no es «verde»), se agregan sinónimos (galletas, pastel, agua de limón = limonada…) y, si no hay receta, se dice con honestidad «todavía no tengo esa receta» en lugar de mostrar recetas sin relación. Cuando se escribe algo general como «galletas» o «pastel», se ofrecen tres variantes para elegir.
2. **Recetario grande (gratis, sin internet).** De 95 a unas 300 recetas: platillos mexicanos y oaxaqueños comunes, horneados básicos (galletas, pastel, brownies, pan), salsas, sopas, antojitos y bebidas, más combinaciones del tipo «carne + salsa» («pollo en salsa roja», «res en salsa verde»). El autor revisa que el sabor sea el de la región.
3. **IA para lo que no esté (opcional).** Cuando no haya receta local, una función de Supabase pide la receta a un modelo de IA, la guarda en una tabla para que la próxima vez sea gratis y la app la muestra igual que las demás, con los ingredientes que sí hay en las tiendas. Lleva un límite de uso por persona (se reutiliza la tabla `limites_uso`) y una etiqueta «Receta sugerida por IA: revísala antes de cocinar».

**Aprendizaje continuo.** El texto de lo que no se encontró se guarda sin datos personales y sirve para escribir las siguientes recetas.

**Pruebas de aceptación.** Una lista de unas 60 frases que deben dar la receta correcta (las 37 de la prueba más las que pida el autor). Ninguna debe mostrar recetas sin relación.

**Costo de la capa 3.** Con los precios publicados de Claude Haiku 5.5 (US$0.10 por millón de tokens de entrada y US$0.50 por millón de salida; fuente secundaria) y suponiendo unos 1,500 tokens de entrada y 900 de salida, una receta nueva cuesta alrededor de US$0.0006 (menos de una décima de centavo). Mil recetas nuevas serían unos US$0.60. Las repetidas no cuestan por el caché.

**Lo que tiene que hacer el autor (solo si se activa la capa 3).** Crear una cuenta en la consola del proveedor de IA, cargar saldo, crear la llave y pegarla él mismo como secreto en Supabase. El texto que escribe la persona se enviaría a ese proveedor, así que hay que avisarlo en el aviso de privacidad.

### 4.2 Fase 2 · Tiendas con muchos productos (Pedido)

Un abarrote no necesita cargar sus 2,000 productos al inicio: basta con lo que más preguntan y lo que cambia cada día.

**Paso 0 · Que la app aguante (obligatorio, casi invisible)**

- El asistente necesita saber qué hay en todas las tiendas, así que seguirá bajando los datos de texto de cada producto (pesan muy poco), pero **sin las fotos**. La foto se pide solo cuando se ve el producto.
- Las fotos pasan de estar dentro de la base de datos a ser archivos en Supabase Storage, con miniaturas. El plan gratis incluye 500 MB de base de datos, 1 GB de archivos y 5 GB de transferencia al mes.
- La lista de productos de cada tienda y la del comerciante se muestran por partes, con búsqueda y categorías.
- La foto deja de ser necesaria: un producto sin foto muestra un dibujito (emoji) según su categoría.

**Catálogo Mercaboot (fruterías, verdulerías, abarrotes).** Unos 300 productos comunes con nombre, unidad, categoría y dibujito automático. El comerciante palomea lo que vende y escribe el precio. La foto propia es opcional.

**Pantalla «Precios de hoy».** Todos los productos en una lista con el precio editable, el interruptor hay / no hay, «marcar todo agotado», «copiar los precios de ayer», «subir o bajar X % a una categoría» y duplicar producto.

### 4.3 Fase 3 · Notificaciones (Pedido)

**Qué avisarían**

- Un mensaje nuevo en un chat, del cliente al comerciante y del comerciante al cliente.
- Un pedido nuevo o un cambio de estado (aceptado, listo, cancelado, «el cliente avisó su pago»).
- Los avisos de los negocios que sigue el cliente («hay pollo», «promo»).
- Cada persona elige cuáles recibir en Ajustes, y al tocar una notificación se abre ese chat o pedido.

**Cómo funciona.** Alguien manda un mensaje → la base de datos avisa a una función de Supabase → la función le pide a Firebase (servicio de Google) que toque el celular del otro.

**Qué se agrega**

- El plugin `expo-notifications` y el archivo `google-services.json` (no es secreto: contiene identificadores públicos).
- Una tabla `dispositivos` (persona + token, con permisos para que cada quien solo vea los suyos) y una tabla de preferencias.
- Disparadores en la base de datos que llaman a una función de Supabase, y esa función envía por Firebase (FCM v1).
- No hace falta cuenta de Expo: se usa el token nativo del celular (`getDevicePushTokenAsync`).

**Costos.** Firebase Cloud Messaging no tiene costo. El plan gratis de Supabase incluye 500,000 ejecuciones de funciones al mes.

**Límites**

- Solo funciona en la APK instalada (no en la versión web) y en celulares Android con servicios de Google.
- Desde Android 13 se pide permiso; Boti lo explica antes de pedirlo.
- En iPhone no, por ahora (necesita una cuenta de pago de Apple).
- El texto del mensaje se vería en la pantalla bloqueada; se agrega la opción de ocultarlo.
- Para probarlo hacen falta dos celulares: uno como cliente y otro como comerciante.

### 4.4 Fase 4 · Boti con más funciones (Pedido)

Hoy Boti da consejos por pantalla y el asistente de recetas es aparte. La propuesta es conectarlos:

- **«Pregúntale a Boti»** en cualquier pantalla, usando el motor que ya existe («¿dónde hay huevo?», «lo más barato hoy», «qué está abierto cerca»). Sin costo.
- **Boti para el comerciante.** Resumen del día (pedidos nuevos, productos sin actualizar hace días, qué preguntaron más) y respuestas rápidas en el chat: «Sí hay», «Se acabó», «Llega a las 5». Sin costo.
- **«Avísame cuando haya aguacate».** La persona pide un producto y llega una notificación cuando un negocio lo marque disponible (depende de la fase 3).
- **Voz.** Boti dice en voz alta avisos importantes mientras la app está abierta (la voz ya existe en `version-voz`).
- Más adelante (fase 7): IA de lenguaje real para entender frases libres.

### 4.5 Fase 5 · Importar y escanear (Pedido)

**Importar desde Excel o Google Sheets (CSV).** Una plantilla de 5 columnas (nombre, precio, unidad, categoría, hay). La app muestra cómo quedó antes de guardar y el comerciante confirma. También se podrá exportar la lista.

**Escáner de código de barras (abarrotes).** La cámara lee el código y busca el nombre en Open Food Facts, una base abierta.

- Los datos tienen licencia ODbL y las fotos CC BY-SA: hay que dar crédito (se pone en «Acerca de»).
- Hay que identificar la app con un User-Agent propio.
- Los límites publicados son 15 consultas por minuto por conexión para productos y 10 para búsquedas, por eso se consulta desde el celular de cada comerciante.
- Lo encontrado se guarda en una tabla compartida para no repetir consultas.
- No cubre fruta a granel ni todos los productos mexicanos; el comerciante revisa el nombre y pone el precio.

### 4.6 Fase 6 · Pagos (Pedido)

**Transferencia.** Ya funciona. Mejoras: botón «copiar CLABE» y aviso al comerciante cuando el cliente toque «Ya pagué» (con las notificaciones de la fase 3).

**Tarjeta, camino A (recomendado).** El negocio pega su propio link de cobro (Mercado Pago u otro proveedor). El cliente toca «Pagar con tarjeta», paga en la página del proveedor y vuelve a tocar «Ya pagué»; el comerciante confirma. La app nunca toca tarjetas ni dinero. Se reutilizan los estados de pago que ya existen y se prueba que la APK anterior no se rompa con un valor de pago nuevo.

**Tarjeta, camino B (más adelante).** Cobro integrado con Mercado Pago «marketplace»: cada negocio conecta su cuenta (OAuth), el dinero se reparte automáticamente entre el negocio y la plataforma, y el pedido se marca pagado solo. Es más trabajo (servidor, avisos de pago, devoluciones) y cada negocio necesita su cuenta.

**Comisiones.** El link de pago de Mercado Pago cobra 3.49 % + $4 al instante (3.19 % + $4 a 7 días y 2.95 % + $4 a 30 días). Stripe cobra 3.6 % + $3 + IVA por tarjeta nacional. En compras chicas pesa mucho:

| Pedido | Comisión (3.49 % + $4, sin IVA) | Porcentaje del pedido |
|---|---|---|
| $20 | $4.70 | 23.5 % |
| $50 | $5.75 | 11.5 % |
| $100 | $7.49 | 7.5 % |
| $300 | $14.47 | 4.8 % |

Por eso la tarjeta solo conviene en pedidos grandes.

**Dinero de otras personas.** No se cobraría todo en una sola cuenta del autor: manejar dinero ajeno trae obligaciones legales y fiscales que hay que revisar con un contador o un abogado.

### 4.7 Fase 7 · Opcionales con costo (Recomendación)

- IA en las recetas (la capa 3 de la fase 1).
- Foto de la lista de precios o del pizarrón → productos. Con los mismos precios publicados de Claude Haiku 5.5, una foto cuesta alrededor de US$0.001 (suponiendo unos 3,000 tokens de entrada y 1,500 de salida).
- Boti con IA de lenguaje real, para entender frases libres y ayudar a redactar avisos.

Requisitos comunes: una función de Supabase, la llave como secreto, caché, límite por persona y un tope mensual de gasto en el proveedor.

## 5. Mejoras pequeñas recomendadas (Recomendación)

Pocas y útiles. Cada una agrega como máximo un botón o una pantalla. El esfuerzo es una estimación.

| # | Mejora | Para quién | Qué cambia | Esfuerzo | Fase |
|---|---|---|---|---|---|
| 1 | Horario automático | Comerciante | Horario por días; la app abre y cierra la tienda sola; botón «hoy cierro temprano» | Bajo a medio | 2 |
| 2 | Aviso con un toque | Comerciante y clientes | Al marcar «agotado» o «ya hay», un botón «Avisar» crea el aviso y manda la notificación | Bajo | 3 |
| 3 | QR y enlace para compartir | Comerciante y clientes | QR para pegar en el escaparate y botón «Compartir por WhatsApp» | Bajo | 3 |
| 4 | Repetir pedido | Clientes | «Pedir otra vez»: arma el carrito con lo que hay hoy y avisa lo que ya no hay | Bajo | 4 |
| 5 | Lista del mandado | Clientes | Escribir la lista (huevo, tortillas, jitomate) y ver qué tienda la reúne o qué combinación conviene | Medio | 4 |
| 6 | Lo que buscan y no encuentran | Comerciante | Tarjeta semanal con búsquedas sin resultado, sin datos personales | Medio | 4 |
| 7 | Reportar y bloquear | Todos | Botón en chats y reseñas; seguridad básica cuando la app crezca | Bajo | 5 |

## 6. Lo que no se agregará por ahora

- Cobro con tarjeta integrado (camino B) hasta que haya negocios reales que lo pidan.
- Puntos, medallas o juegos.
- Feed o red social dentro de la app.
- Repartidores propios.
- Cuentas de empleados (se revisa cuando un negocio lo pida).

## 7. Lo que tiene que hacer el autor

**Firebase (fase 3, gratis)**

1. Entrar a la consola de Firebase con su cuenta de Google y crear un proyecto llamado «Mercaboot».
2. Agregar una app Android con el nombre de paquete de la versión 2 (propuesto: `com.mercaboot.v2`).
3. Descargar el archivo `google-services.json` y entregarlo (no es secreto).
4. En Configuración del proyecto → Cuentas de servicio, generar una nueva clave privada. Ese archivo **sí es secreto**: no se manda por chat ni se sube a GitHub. El autor lo pega él mismo como secreto en Supabase (Edge Functions → Secrets).

**Otras cuentas (solo si se activan las funciones con costo)**

- Cuenta en la consola del proveedor de IA, con saldo y un tope mensual de gasto (fases 1 y 7).
- Cada negocio crea su cuenta con su proveedor de pagos si usa el camino B de la fase 6.

**Pruebas y revisión**

- Probar con dos celulares (cliente y comerciante).
- Revisar que las recetas nuevas tengan el sabor de la región.
- Consultar con un contador o abogado lo relacionado con cobros antes de hacer el camino B.

## 8. Decisiones pendientes

- [ ] Base de la versión 2: `version-voz` (propuesta; la rama ya salió de ahí) o `version-final`.
- [ ] Orden de las fases (sección 1).
- [ ] Nombre de paquete de la versión 2: `com.mercaboot.v2`.
- [ ] Tarjeta: camino A (link de pago del negocio).
- [ ] Funciones de Boti que se quieren (sección 4.4).
- [ ] Mejoras pequeñas que se quieren (sección 5).
- [ ] IA para recetas y demás funciones con costo: sí, no o más adelante.
- [ ] Plan de Supabase: gratis para pruebas; decidir el plan Pro (desde US$25 al mes, no se pausa) antes de usar la app con negocios reales.

## 9. Datos y costos verificados

Consultados el 21 de noviembre de 2026. Los precios pueden cambiar; confirmar antes de contratar algo.

| Dato | Valor | Fuente |
|---|---|---|
| Firebase Cloud Messaging | Sin costo | [Firebase](https://firebase.google.com/products/cloud-messaging/) |
| Supabase plan gratis | 500 MB de base de datos, 1 GB de archivos, 5 GB de transferencia, 500,000 ejecuciones de funciones al mes; pausa tras 1 semana sin actividad | [Supabase](https://supabase.com/pricing) |
| Supabase plan Pro | Desde US$25 al mes; no se pausa por inactividad | [Supabase](https://supabase.com/pricing) |
| Mercado Pago, link de pago | 3.49 % + $4 al instante; 3.19 % + $4 a 7 días; 2.95 % + $4 a 30 días. La página menciona el IVA sobre el cargo fijo y los meses sin intereses, y no aclara si aplica a la tasa base | [Mercado Pago](https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago) |
| Stripe México | 3.6 % + MXN 3.00 por tarjeta nacional, más IVA; sin cuota mensual | [Stripe](https://stripe.com/en-mx/pricing) |
| Open Food Facts | 15 consultas por minuto por conexión (producto) y 10 (búsqueda); User-Agent obligatorio; datos ODbL con crédito; fotos CC BY-SA | [API](https://openfoodfacts.github.io/openfoodfacts-server/api) y [licencias](https://openfoodfacts.github.io/documentation/docs/Product-Opener/api/tutorials/license-be-on-the-legal-side/) |
| Claude Haiku 5.5 | US$0.10 por millón de tokens de entrada y US$0.50 de salida hasta 100,000 tokens (fuente secundaria) | [Apidog](https://apidog.com/blog/claude-haiku-5-5-pricing/) |

## 10. Fuentes

- [Expo · configuración de notificaciones push](https://docs.expo.dev/push-notifications/push-notifications-setup/)
- [Expo · credenciales FCM](https://docs.expo.dev/push-notifications/fcm-credentials)
- [Expo · token nativo de FCM](https://docs.expo.dev/push-notifications/obtaining-a-device-token-for-fcm-or-apns)
- [Supabase · enviar notificaciones push](https://supabase.com/docs/guides/functions/examples/push-notifications)
- [Mercado Pago · integración de marketplace](https://www.mercadopago.com.mx/developers/es/docs/checkout-pro/how-tos/integrate-marketplace)
- Las demás fuentes están en la tabla de la sección 9.

## 11. Registro de cambios de este documento

- **2026-11-21.** Primera versión: se ordenan los temas pedidos tras la exposición, se agrega el diagnóstico de «Ideas para cocinar» y las mejoras pequeñas recomendadas. Sin cambios en el código de la app.
