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
  ['Un negocio no tiene productos', 'Algunos negocios de la comunidad aparecen en el directorio pero todavía no usan Mercaboot. Cuando su dueño se registre, publicará lo que tiene.'],
  ['¿Qué es «Cliente frecuente»?', 'Es tu lista de negocios de siempre. Abre un negocio, toca «Cliente frecuente» y lo encontrarás en la pestaña Favoritos.'],
  ['¿Y si también quiero vender?', 'No necesitas otra cuenta. En tu perfil toca «Abrir mi negocio»: sigues comprando como cliente y cambias de modo cuando quieras. Si tu negocio ya aparece en la lista de la comunidad, para reclamarlo necesitas el código que el equipo de Mercaboot le da a su dueño.'],
];

const COMERCIANTES: [string, string][] = [
  ['¿Cómo publico lo que vendo?', 'En «Productos» toca «Agregar producto» y escribe lo que quieras: nombre, precio y unidad. Con el interruptor marcas si hay o ya se acabó, y puedes cambiarlo en cualquier momento.'],
  ['¿Cómo reclamo un negocio que ya aparece en la lista?', 'Tócalo y escribe su código de reclamo: un código secreto de 12 letras y números (como K7M2-9QXP-4HWD) que el equipo de Mercaboot entrega solo al dueño. Sin ese código nadie puede quedarse con tu tienda, ni por error. Antes de terminar, la app te pregunta «¿Es tu negocio?» y puedes elegir «No, volver». Si tu negocio no está en la lista, elige «Mi negocio es nuevo».'],
  ['Reclamé un negocio por error', 'En tu perfil, hasta abajo, toca «Dejar de administrar este negocio». Tu cuenta sigue como cliente y la tienda vuelve a la lista sin dueño, lista para que su verdadero dueño la reclame con su código.'],
  ['¿Puedo cambiar mi logo y mis datos?', 'Sí. En «Perfil» → «Editar mi negocio» cambias logo, nombre, teléfono, correo, horario, dirección y todo lo demás cuando quieras.'],
  ['¿Y si también quiero comprar?', 'Con la misma cuenta. En tu perfil toca «Ver la app como cliente». Tu negocio sigue publicado y vuelves cuando quieras con «Cambiar a modo comerciante».'],
  ['¿Puedo dejar de ser comerciante?', 'Sí. En tu perfil, hasta abajo, toca «Dejar de ser comerciante» (o «Dejar de administrar este negocio» si era uno de la lista). Tu cuenta sigue como cliente y se quitan de Mercaboot tu negocio y tus productos. Si solo quieres comprar un rato, mejor usa «Ver la app como cliente».'],
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
            Hecho para los negocios de {COMUNIDAD}. Mientras la app no tenga un servidor en la nube, tus datos se guardan en este teléfono.
          </T>
        </Card>
      </View>
    </Screen>
  );
}
