# Mercaboot · Cómo funcionan los pagos (transferencia y tarjeta)

| | |
|---|---|
| **Proyecto** | Mercaboot |
| **Autor principal** | José David Pérez Miguel |
| **Segunda autora** | Izebel Altamirano Carreño |
| **Rama** | `version-2` |

© 2026 José David Pérez Miguel. Todos los derechos reservados (ver [LICENSE](../LICENSE)).

Este documento explica, con palabras sencillas, cómo se paga un pedido en Mercaboot y por qué la app **nunca toca dinero ni tarjetas**.

## 1. La idea principal

Mercaboot no es un banco ni una terminal de cobro. No recibe, no guarda y no mueve dinero. Lo que hace es **poner en orden la conversación**
entre el cliente y el negocio: cuánto es, a dónde pagar, quién avisó que pagó y quién confirmó que le llegó. El dinero siempre va directo del
cliente al negocio, por el camino que el propio negocio ya usa.

Esto es a propósito: manejar dinero de otras personas trae obligaciones legales, fiscales y de seguridad (permisos, contabilidad, devoluciones)
que hay que revisar con un contador o un abogado antes de hacerlo. Con este diseño, esas obligaciones no recaen en la app.

## 2. Las tres formas de pagar

| Forma | Cómo se hace | Quién confirma |
|---|---|---|
| **En persona** (efectivo) | Se paga al recoger o al recibir. No se cobra nada dentro de la app. | El comerciante, al entregar |
| **Transferencia** | El cliente transfiere a la cuenta que el negocio escribió. | El comerciante, al ver el dinero en su banco |
| **Tarjeta** (link de pago) | El cliente abre la página de pago del negocio (Mercado Pago, PayPal, Clip…), paga ahí con su tarjeta y regresa. | El comerciante, al ver el dinero en su cuenta del proveedor |

Transferencia y tarjeta son pagos **por adelantado**. En la base de datos los dos son el mismo tipo de pedido (`transferencia`) con el mismo
camino de estados: `por pagar` → `avisado` (el cliente tocó «Ya pagué») → `confirmado` (el comerciante confirmó). Así las versiones anteriores
de la app siguen funcionando sin cambios.

## 3. Paso a paso

**El cliente**

1. En el carrito elige «Transferencia» (o «Transferencia o tarjeta» si el negocio cobra con tarjeta) y aparta su pedido.
2. Cuando el negocio lo acepta, dentro del pedido aparece cómo pagar:
   - Los datos para transferir, con botones para **copiar la CLABE** y **copiar el monto**.
   - Si el negocio cobra con tarjeta, el botón **«Pagar con tarjeta»**. Muestra a qué sitio va a abrir y cuánto debe pagar.
3. Paga y regresa a Mercaboot. Toca **«Ya pagué»** (puede escribir el folio o número de operación).
4. Espera a que el negocio confirme. Mientras no avise su pago, el tiempo de apartado sigue corriendo.

**El comerciante**

1. En «Editar mi negocio» → «Pedidos y apartado» enciende **«Pago por adelantado»** y escribe sus datos para transferir y/o su link de pago.
2. Cuando llega un pedido con pago por adelantado, lo acepta. El cliente ve cómo pagar.
3. Si cobra con tarjeta y su proveedor usa links de monto fijo, en el pedido toca **«Enviar link de pago»** (ver sección 4).
4. Cuando el cliente avisa, revisa su banco o su cuenta del proveedor y toca **«Confirmar pago»**. Si no ve el dinero, toca **«No veo el pago»**: el pedido
   regresa a «por pagar» y se le dan 30 minutos más al cliente.

## 4. Dos tipos de link de pago

Cada proveedor funciona distinto, y esto importa:

| | Link general del negocio | Link por pedido |
|---|---|---|
| **Para qué proveedores sirve** | Los que dejan que el cliente **escriba el monto** (por ejemplo PayPal.Me o los links «paga lo que quieras» de Stripe) | Los que crean links con un **monto fijo** (por ejemplo el link de pago de Mercado Pago, donde el vendedor «ingresa el monto a cobrar») |
| **Dónde se pega** | «Editar mi negocio» → «Link de pago con tarjeta» (una sola vez) | En cada pedido aceptado → «Enviar link de pago» |
| **Qué ve el cliente** | El botón «Pagar con tarjeta» en todos sus pedidos por adelantado, con aviso del monto que debe escribir | El botón «Pagar con tarjeta» solo en ese pedido, ya con el monto correcto |

Si un pedido tiene su propio link, ese es el que se usa; si no, se usa el general. Cuando el comerciante manda un link por pedido, el cliente
recibe además un mensaje en el chat (y una notificación si activó los avisos del teléfono).

> **Por qué hay dos:** la primera idea era un solo link por negocio. Al revisar la página de Mercado Pago (noviembre de 2026) se vio que sus links
> llevan un monto fijo, así que un link general no serviría para pedidos de distinto total. Por eso se agregó el link por pedido.

## 5. Seguridad

- **El link de pago es privado.** Solo lo ve su dueño. El cliente lo recibe únicamente cuando el negocio ya aceptó su pedido, el pedido es de pago por
  adelantado y todavía no está confirmado el pago. Lo único público es el aviso «este negocio también cobra con tarjeta».
- **La base de datos revisa el link**, no solo la pantalla: debe empezar con `https://`, no llevar espacios y medir máximo 300 letras.
- **La app revisa más**: rechaza direcciones numéricas, `javascript:` y trucos como `paypal.com@sitio-falso.com`, y quita signos que se pegan
  al copiar (`<link>`, un punto final).
- **El cliente ve a dónde va** antes de pagar: el nombre del proveedor (si se reconoce) y el sitio. Si el sitio no es de un proveedor conocido,
  aparece un aviso para revisar el nombre del negocio y el monto, y no pagar si algo se ve raro.
- **Los datos de transferencia** también son privados y llegan igual (solo el cliente de ese pedido, con el pedido aceptado). La app avisa al
  comerciante si la CLABE que escribió no cuadra con su dígito de control (casi siempre es un error de dedo) y le pide confirmar antes de guardar.
- **Quien administra Mercaboot nunca ve tarjetas**: no pasan por la app ni por la base de datos.
- Si un negocio manda un link engañoso, el cliente puede **reportar al negocio** (ver [Reportes y bloqueos](MODERACION.md)).

## 6. Comisiones (las cobra el proveedor, no Mercaboot)

Cada pago con tarjeta tiene una comisión que cobra el proveedor del negocio. Cifras de referencia (revísalas en la página del proveedor, cambian):

| Proveedor | Comisión por tarjeta | Fuente |
|---|---|---|
| Mercado Pago, link de pago | 3.49 % + $4 si el dinero llega al instante (3.19 % + $4 a 7 días; 2.95 % + $4 a 30 días) | [Mercado Pago](https://www.mercadopago.com.mx/herramientas-para-vender/link-de-pago) |
| Stripe México | 3.6 % + $3 por tarjeta nacional, más IVA | [Stripe](https://stripe.com/en-mx/pricing) |

En compras chicas la comisión pesa mucho (por ejemplo, con 3.49 % + $4, sin IVA: un pedido de $50 paga $5.75, el 11.5 %; uno de $300 paga $14.47, el 4.8 %).
Por eso la app **siempre deja la transferencia y el efectivo disponibles** y el cobro con tarjeta es opcional para cada negocio.

## 7. Qué se instala en la base de datos

El archivo [`supabase/actualizacion-v2-pagos.sql`](../supabase/actualizacion-v2-pagos.sql) agrega:

- `negocios_privado.link_pago`: el link general (privado, solo su dueño).
- `negocios.acepta_tarjeta`: aviso público que la base de datos prende y apaga sola cuando hay (o no) un link general. Nadie lo escribe desde la app.
- `pedido_links`: el link de un pedido (tabla cerrada, solo se usa con las funciones de abajo).
- `link_pago_pedido()`: lo que usa el cliente para recibir su link.
- `poner_link_pedido()` y `mi_link_pedido()`: lo que usa el comerciante para poner, quitar y ver el link de un pedido.

**Solo agrega**: no cambia nada de lo que ya existe, así que las versiones anteriores de la app siguen funcionando igual, y se puede ejecutar
más de una vez sin problema. Antes de dejarlo así se probó con 80 comprobaciones automáticas (quién puede ver y cambiar cada link, reglas de
formato, estados del pedido, tablas cerradas) y con las pruebas de los revisores de links y de los textos de pago de la app.

Si la base de datos todavía no tiene este archivo, la app sigue funcionando y, al intentar guardar un link, avisa con un texto amable que
la opción aún no está disponible.

## 8. Lo que no se hace (todavía)

- **Cobro integrado** (que el pedido se marque pagado solo y que el dinero se reparta entre negocio y plataforma). Es más trabajo (servidor,
  avisos de pago, devoluciones, una cuenta por negocio) y solo valdría la pena cuando haya negocios reales que lo pidan.
- **Devoluciones**: si ya hubo un pago y el pedido se cancela, el comerciante y el cliente se ponen de acuerdo por el chat (la app lo recuerda en el aviso).
