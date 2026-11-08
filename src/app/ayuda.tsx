import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { COMUNIDAD } from '../data/contenido';
import { useStore } from '../store';
import { Icon } from '../ui/Icon';
import { BackBtn, Card, Group, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

const CLIENTES: [string, string][] = [
  ['¿Cómo busco un producto o un negocio?', 'En el inicio o en la pestaña «Buscar» escribe lo que necesitas, por ejemplo «pollo» o «tortillas». Verás los productos que publicaron las tiendas y los negocios que coinciden. Con «Disponible ahora» y «A domicilio» afinas la lista.'],
  ['¿Cómo sé qué tienda me conviene?', 'En el inicio ves «Lo más barato hoy» y «Tiendas para ti», donde eliges ver las más cercanas, las mejor calificadas, las que entregan a domicilio o las que están abiertas ahora. Cada tienda muestra sus estrellas, su distancia y si lleva tu pedido a casa. Las insignias («Más cercana», «Mejor calificada», «Más económica») solo aparecen cuando hay con qué comparar, y siempre ves todas las tiendas que tienen lo que buscas.'],
  ['¿Cómo funcionan las ideas para cocinar?', 'En el inicio toca «Ideas para cocinar»: elige una idea («algo barato», «algo con proteína», «solo verduras», «un plato fuerte», «una idea de desayuno»…) o escribe lo que se te antoja. El asistente solo propone cosas con lo que las tiendas publicaron como disponible, te dice en qué tienda conseguir cada ingrediente y cuál te conviene más por estrellas, precio o cercanía, sin dejar fuera a las demás. También te enseña lo que ya está preparado (postres, fresas con crema, comida corrida…). Funciona sin internet y no comparte nada tuyo.'],
  ['Un negocio no tiene productos', 'Algunos negocios de la comunidad aparecen en el directorio pero todavía no usan Mercaboot. Cuando su dueño se registre, publicará lo que tiene.'],
  ['¿Cómo aparto o pido productos?', 'Abre un negocio y toca «Agregar» en lo que quieras. Abajo aparece «Ver carrito»: ahí eliges si pasas a recoger o si te lo llevan, cómo pagas y tocas «Apartar pedido». El negocio recibe tu pedido al instante y los productos quedan guardados para ti. Tu carrito es de un solo negocio a la vez.'],
  ['¿Cuánto tiempo me guardan el pedido?', 'Cada negocio decide cuánto tiempo guarda un pedido (por ejemplo, 1 hora). Lo ves en tu pedido con una cuenta regresiva. Si no llegas o no pagas a tiempo, el pedido se cancela solo y los productos vuelven a estar a la venta para otras personas. Si necesitas más tiempo, avísale por el chat: el comerciante puede darte 30 minutos más.'],
  ['¿Cómo pago?', 'Hay dos formas: en persona (efectivo, al recoger o al recibir) y, si el negocio la acepta, por transferencia. Con transferencia, cuando el negocio acepta tu pedido ves sus datos de pago; después de transferir toca «Ya pagué» y el negocio confirma que llegó. El pago con tarjeta en línea llegará más adelante.'],
  ['¿Puedo cancelar un pedido?', 'Sí, desde el detalle del pedido, mientras no hayas avisado un pago. Si el negocio ya te lo dejó listo y cancelas, cuenta como un pedido sin recoger. Si en los últimos 30 días dejas 2 pedidos aceptados sin recoger, en ese negocio solo podrás apartar pagando por transferencia (o nada, si no la acepta); con 3, ya no podrás apartar ahí hasta que hables con el dueño.'],
  ['¿Qué es «Cliente frecuente»?', 'Es un trato especial que te da el negocio cuando le compras seguido: un descuento en tus pedidos, un regalo o un cupón. Lo decide el comerciante, no tú. Si un negocio te nombra cliente frecuente, te avisa por el chat, lo ves en tu pedido y en «Favoritos».'],
  ['¿Para qué sirve guardar en favoritos?', 'Es tu lista privada de negocios de siempre, para encontrarlos rápido. Abre un negocio y toca «Guardar en favoritos». El negocio no ve quién lo guardó.'],
  ['¿Cómo le escribo a un negocio?', 'Abre el negocio y toca «Chatear» (o tócalo en la lista). Escribe tu mensaje o usa una respuesta rápida, como «¿Qué hay hoy?». Tus conversaciones quedan en la pestaña «Chats» y te avisamos con un número rojo cuando te contesten. Cada pedido aparece como tarjeta en el chat, así los dos hablan del mismo pedido. Solo se puede chatear con los negocios que ya usan Mercaboot.'],
  ['¿Por qué piden mi ubicación?', 'Para mostrarte primero los negocios más cercanos y decirte a qué distancia están. Tu ubicación se usa solo en tu teléfono: no se guarda ni se envía a nadie. Si no quieres darla, la app funciona igual, solo que sin distancias.'],
  ['¿Cómo dejo una reseña?', 'Abre un negocio, toca la pestaña «Reseñas» y luego «Dejar reseña». Elige de 1 a 5 estrellas, marca lo que te gustó (producto fresco, buen trato, entrega rápida…) y, si quieres, escribe un comentario. Solo cuenta una reseña tuya por negocio: si vuelves a opinar, se cambia la anterior. Puedes editarla o quitarla en Perfil → «Mis reseñas». No se puede calificar el negocio propio.'],
  ['¿Qué son los avisos y regalos?', 'Los negocios publican promociones, productos que ya llegaron o se acabaron, y regalos o detalles en fechas especiales: Día del Amor y la Amistad, Día de las Madres, Día del Padre, Día de Muertos, Navidad, Reyes Magos y más. Los ves en el inicio, en la pestaña «Avisos» de cada negocio y en la campana de novedades. Los de «Ya no hay» y «Cerrado hoy» duran hasta que termina el día.'],
  ['¿Los productos se actualizan solos?', 'Sí. Cuando un comerciante publica algo, lo cambia o marca que ya se acabó, lo ves en tu teléfono en unos segundos, sin tener que cerrar la app. Lo que otra persona ya apartó no se puede pedir otra vez: verás cuántos quedan. Si pierdes el internet verás lo último que se guardó.'],
  ['¿Y si también quiero vender?', 'No necesitas otra cuenta. En tu perfil toca «Abrir mi negocio»: sigues comprando como cliente y cambias de modo cuando quieras. Si tu negocio ya aparece en la lista de la comunidad, para reclamarlo necesitas el código que el equipo de Mercaboot le da a su dueño.'],
];

const COMERCIANTES: [string, string][] = [
  ['¿Cómo publico lo que vendo?', 'En «Productos» toca «Agregar producto» y escribe lo que quieras: nombre, precio y unidad. Si vendes para cocinar en casa, deja «Para cocinar» (kilo, bolsa, docena…). Si vendes comida, postres, fresas con crema o bebidas, elige «Ya preparado» y vende por porción, vaso, rebanada, orden o lo que uses. Con el interruptor marcas si hay o ya se acabó, y puedes cambiarlo en cualquier momento. Si además escribes cuántos tienes en «Existencias», la app lleva la cuenta sola: descuenta lo que entregas y marca «Agotado» cuando llega a cero. Tus clientes lo ven en sus teléfonos en cuanto lo guardas.'],
  ['¿Cómo sabe el asistente qué tengo?', 'Lee los nombres de tus productos. Si escribes «Quesillo de Oaxaca» o «Mango», sabe que es un lácteo o una fruta; si escribes «Fresas con crema» o «Comida corrida», sabe que ya está preparado. Puedes corregir lo que lleva (carne, proteína…) y para cuándo sirve al agregar el producto. Así tu tienda aparece cuando alguien pide una idea para cocinar.'],
  ['¿Cómo me comparan con otras tiendas?', 'Con justicia: si tu tienda y otra tienen el mismo producto, aparecen las dos. Las insignias solo se dan por algo concreto (más cercana, mejor calificada, más económica) y las estrellas cuentan con un promedio prudente, así que una sola reseña no decide. Una tienda nueva sin reseñas no se castiga. Para destacar: mantén tus productos al día, responde los chats y ofrece entrega a domicilio.'],
  ['¿Cómo publico una promoción, un regalo o un aviso?', 'En la pestaña «Avisos» (o con los botones rápidos de tu inicio) elige «Ya no hay…», «Ya hay…», «Promoción», «Regalo», «Cerrado hoy» u otro aviso. «Ya no hay…» y «Ya hay…» cambian el producto a agotado o disponible al instante. Para fiestas como el Día de las Madres, Día de Muertos o Navidad, elige la fiesta y toca una idea pensada para tu tipo de negocio: el mensaje se llena solo y lo puedes cambiar. Puedes quitar un aviso cuando quieras.'],
  ['¿Cómo respondo a mis clientes?', 'Cuando un cliente te escribe, aparece un número rojo en la pestaña «Chats». Ábrela, toca la conversación y contesta con tu mensaje o con una respuesta rápida («Sí hay», «Ya se acabó», «Llega mañana»).'],
  ['¿Cómo recibo y atiendo pedidos?', 'Cuando un cliente aparta productos te llega un aviso y un número rojo en «Pedidos». Ábrelo y toca «Aceptar» (o «Rechazar»). Al aceptar, los productos quedan apartados con una cuenta regresiva. Cuando lo tengas listo toca «Marcar listo»; cuando el cliente lo reciba y te pague, toca «Entregado y cobrado».'],
  ['¿Qué pasa si el cliente no viene?', 'El pedido se cancela solo cuando se acaba el tiempo de apartado y los productos vuelven a estar a la venta, así no se quedan guardados para nadie. Si ves que sí viene, puedes darle 30 minutos más. Si no llegó, toca «No se presentó»: queda anotado y, si se repite, la app le pide pagar por transferencia antes de apartar y después deja de aceptarle pedidos.'],
  ['¿Cuánto tiempo aparto los productos?', 'Tú eliges, de 15 minutos a 24 horas, en «Pedidos» o en «Editar mi negocio» → «Pedidos y apartado». Si un día no puedes atender pedidos, apaga «Recibir pedidos»: tus clientes siguen viendo tus productos y pueden escribirte por el chat.'],
  ['¿Cómo cobro por transferencia?', 'En «Editar mi negocio» → «Pedidos y apartado» enciende «Pago por transferencia» y escribe tus datos (banco, CLABE y nombre). Solo los ve el cliente cuando aceptas su pedido. Cuando te avise que ya pagó, revisa tu banco y toca «Confirmar pago». Si no lo ves, toca «No veo el pago» y habla con él por el chat.'],
  ['¿Cómo nombro a un cliente frecuente?', 'Tú decides quién lo es. En «Clientes frecuentes» (en tu inicio o en tu perfil) toca «Nombrar frecuente» en quien te compra seguido y elige un descuento y/o un beneficio (un regalo, un cupón). El descuento se aplica solo en sus pedidos y el beneficio aparece en el pedido para que se lo des al entregarlo. También puedes hacerlo desde el chat o desde un pedido.'],
  ['¿Cómo pongo mi ubicación?', 'En «Perfil» → «Editar mi negocio», en la sección «¿Dónde estás?», toca «Usar mi ubicación actual» estando en tu negocio, o pega el enlace de Google Maps. Así tus clientes ven qué tan cerca estás y pueden pedir indicaciones. Si tu negocio no está en Google Maps no pasa nada: escribe tu dirección o una referencia y te encontrarán igual.'],
  ['¿Cómo reclamo un negocio que ya aparece en la lista?', 'Tócalo y escribe su código de reclamo: un código secreto de 12 letras y números (como K7M2-9QXP-4HWD) que el equipo de Mercaboot entrega solo al dueño. Sin ese código nadie puede quedarse con tu tienda, ni por error. Antes de terminar, la app te pregunta «¿Es tu negocio?» y puedes elegir «No, volver». Si tu negocio no está en la lista, elige «Mi negocio es nuevo».'],
  ['Reclamé un negocio por error', 'En tu perfil, hasta abajo, toca «Dejar de administrar este negocio». Tu cuenta sigue como cliente y la tienda vuelve a la lista sin dueño, lista para que su verdadero dueño la reclame con su código.'],
  ['¿Puedo cambiar mi logo y mis datos?', 'Sí. En «Perfil» → «Editar mi negocio» cambias logo, nombre, teléfono, correo, horario, dirección y todo lo demás cuando quieras.'],
  ['¿Y si también quiero comprar?', 'Con la misma cuenta. En tu perfil toca «Ver la app como cliente». Tu negocio sigue publicado y vuelves cuando quieras con «Cambiar a modo comerciante».'],
  ['¿Puedo dejar de ser comerciante?', 'Sí. En tu perfil, hasta abajo, toca «Dejar de ser comerciante» (o «Dejar de administrar este negocio» si era uno de la lista). Tu cuenta sigue como cliente y se quitan de Mercaboot tu negocio, productos, avisos y chats. Si solo quieres comprar un rato, mejor usa «Ver la app como cliente».'],
];

export default function Ayuda() {
  const { cuenta } = useStore();
  const lista = cuenta?.rol === 'comerciante' ? COMERCIANTES : CLIENTES;
  const [abierta, setAbierta] = useState<number | null>(0);

  return (
    <Screen bottomInset contentStyle={{ gap: 16, paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 16 }}>
        <BackBtn />
        <T size={18} weight={700}>
          Ayuda
        </T>
      </View>
      <View style={{ gap: 16, paddingHorizontal: 20 }}>
        <Group r={18}>
          {lista.map(([pregunta, respuesta], i) => (
            <Pressable key={pregunta} accessibilityRole="button" onPress={() => setAbierta(abierta === i ? null : i)} style={{ padding: 16, gap: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
                <T size={15} weight={700} lh={1.3} style={{ flex: 1 }}>
                  {pregunta}
                </T>
                <View style={{ transform: [{ rotate: abierta === i ? '180deg' : '0deg' }] }}>
                  <Icon name="down" size={18} color={C.muted} />
                </View>
              </View>
              {abierta === i ? (
                <T size={14} lh={1.5} color={C.greyText}>
                  {respuesta}
                </T>
              ) : null}
            </Pressable>
          ))}
        </Group>
        <Card style={{ padding: 16, gap: 6, backgroundColor: C.greenTint, borderColor: C.greenTint }}>
          <T size={14} weight={700} color={C.greenDark}>
            Mercaboot es para tu comunidad
          </T>
          <T size={13} lh={1.45} color={C.greenDark}>
            Hecho para los negocios de {COMUNIDAD}. Tu cuenta, tu negocio, tus productos y tus chats se guardan en la nube, así que se ven al instante en los teléfonos de los demás.
          </T>
        </Card>
      </View>
    </Screen>
  );
}
