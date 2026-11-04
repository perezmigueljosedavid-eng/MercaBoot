import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useStore, type EstadoRed } from '../../store';
import { haceCuanto, textoPrecio } from '../../ui/bits';
import { Card, Group, Screen, SectionTitle, Toggle } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

function Cifra({ valor, etiqueta, color = C.ink }: { valor: string; etiqueta: string; color?: string }) {
  return (
    <Card r={16} style={{ flexBasis: '48%', flexGrow: 1, gap: 4, padding: 16 }}>
      <T size={26} weight={800} color={color}>
        {valor}
      </T>
      <T size={13} color={C.muted}>
        {etiqueta}
      </T>
    </Card>
  );
}

/** Dice si lo que publicas llega al instante a los teléfonos de tus clientes. */
function EstadoEnVivo({ estado }: { estado: EstadoRed }) {
  const [texto, color, fondo] =
    estado === 'en-vivo'
      ? ['En vivo', C.greenDark, C.greenTint]
      : estado === 'sin-internet'
        ? ['Sin internet', C.amberDeep, C.amberTint]
        : ['Conectando', C.greyText, C.grey];
  return (
    <View
      accessibilityLabel={`Conexión: ${texto}`}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28, paddingHorizontal: 10, borderRadius: 14, backgroundColor: fondo }}
    >
      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: estado === 'en-vivo' ? C.green : color }} />
      <T size={12} weight={700} color={color}>
        {texto}
      </T>
    </View>
  );
}

export default function HomeComerciante() {
  const { s, negocio, actualizarNegocio, setDisponible, cuenta, numFrecuentes, pedidosPendientes, chatsSinLeer, estadoRed } = useStore();
  if (!negocio || !cuenta) return null;

  const propios = s.productos.filter((p) => p.negocioId === negocio.id);
  const disponibles = propios.filter((p) => p.disponible).length;
  const agotados = propios.length - disponibles;
  const vacio = propios.length === 0;
  const faltaPerfil = !negocio.direccion && negocio.lat === undefined;

  return (
    <Screen contentStyle={{ gap: 22, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      {/* cabecera */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <Logo uri={negocio.logoUri} nombre={negocio.nombre} size={52} r={16} />
        <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
          <T size={14} color={C.muted}>
            Tu negocio
          </T>
          <T size={22} weight={800} ls={-0.02} numberOfLines={1}>
            {negocio.nombre}
          </T>
        </View>
        <EstadoEnVivo estado={estadoRed} />
      </View>

      {/* estado */}
      <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, paddingVertical: 16, paddingHorizontal: 18 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={16} weight={700}>
            Estado del negocio
          </T>
          <T size={13} color={C.muted}>
            {negocio.abierto ? 'Tus clientes ven que estás abierto' : 'Tus clientes ven que estás cerrado'}
          </T>
        </View>
        <Toggle big value={negocio.abierto} onChange={(v) => actualizarNegocio({ abierto: v })} label="Negocio abierto" />
      </Card>

      {pedidosPendientes > 0 ? (
        <Pressable accessibilityRole="button" onPress={() => router.navigate('/comerciante/pedidos')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, backgroundColor: C.green, borderColor: C.green }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T size={16} weight={800} color={C.white}>
                🛒 {pedidosPendientes} {pedidosPendientes === 1 ? 'pedido nuevo' : 'pedidos nuevos'} por responder
              </T>
              <T size={13} lh={1.35} color="#CFE6D9">
                Sus productos ya están apartados. Acéptalos o recházalos antes de que se acabe el tiempo.
              </T>
            </View>
            <T size={22} color={C.white}>
              ›
            </T>
          </Card>
        </Pressable>
      ) : null}

      {faltaPerfil ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/editar-negocio')}>
          <Card style={{ gap: 4, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={15} weight={700} color={C.amberDeep}>
              Completa dónde está tu negocio
            </T>
            <T size={13} lh={1.4} color={C.amberDeep}>
              Agrega tu dirección y tu ubicación para que los clientes te encuentren y vean qué tan cerca estás. Toca aquí.
            </T>
          </Card>
        </Pressable>
      ) : null}

      {/* cifras */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        <Cifra valor={String(disponibles)} etiqueta="Productos disponibles" />
        <Cifra valor={String(agotados)} etiqueta="Agotados" color={agotados ? C.red : C.ink} />
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir pedidos" onPress={() => router.navigate('/comerciante/pedidos')} style={{ flexBasis: '48%', flexGrow: 1 }}>
          <Cifra valor={String(pedidosPendientes)} etiqueta={pedidosPendientes === 1 ? 'Pedido nuevo' : 'Pedidos nuevos'} color={pedidosPendientes ? C.red : C.ink} />
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Abrir chats" onPress={() => router.navigate('/comerciante/chats')} style={{ flexBasis: '48%', flexGrow: 1 }}>
          <Cifra valor={String(chatsSinLeer)} etiqueta={chatsSinLeer === 1 ? 'Chat sin leer' : 'Chats sin leer'} color={chatsSinLeer ? C.red : C.ink} />
        </Pressable>
      </View>

      {/* clientes frecuentes: los elige el comerciante */}
      <Pressable accessibilityRole="button" accessibilityLabel="Abrir clientes frecuentes" onPress={() => router.push('/clientes')}>
        <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16 }}>
          <T size={22}>⭐</T>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={15} weight={700}>
              {numFrecuentes} {numFrecuentes === 1 ? 'cliente frecuente' : 'clientes frecuentes'}
            </T>
            <T size={13} lh={1.35} color={C.muted}>
              Tú decides quién lo es y qué le das: descuento, regalo o cupón.
            </T>
          </View>
          <T size={22} color={C.muted}>
            ›
          </T>
        </Card>
      </Pressable>

      {/* productos */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Mis productos" link={propios.length ? 'Ver todos' : undefined} onLink={() => router.navigate('/comerciante/productos')} />
        {vacio ? (
          <T size={14} lh={1.45} color={C.muted}>
            Todavía no has publicado nada. Agrega lo que vendes, con el nombre que tú quieras, y marca si hay o ya se acabó.
          </T>
        ) : (
          <Group>
            {[...propios]
              .sort((a, b) => b.actualizado - a.actualizado)
              .slice(0, 4)
              .map((p) => (
                <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={15} weight={600}>
                      {p.nombre}
                    </T>
                    <T size={13} color={C.muted}>
                      {textoPrecio(p.precio, p.unidad)} · {haceCuanto(p.actualizado)}
                    </T>
                  </View>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={`${p.nombre}: ${p.disponible ? 'Disponible' : 'Agotado'}. Tocar para cambiar`}
                    onPress={() => (p.cantidad != null && p.cantidad <= 0 && !p.disponible ? router.push({ pathname: '/producto-form', params: { id: p.id } }) : setDisponible(p.id, !p.disponible))}
                    style={{ height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: p.disponible ? C.greenTint : C.redTint, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <T size={12} weight={700} color={p.disponible ? C.greenDark : C.red}>
                      {p.disponible ? 'Disponible' : 'Agotado'}
                    </T>
                  </Pressable>
                </View>
              ))}
          </Group>
        )}
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/producto-form')}
          style={{ height: 48, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: C.dash, alignItems: 'center', justifyContent: 'center' }}
        >
          <T size={15} weight={600}>
            + Agregar producto
          </T>
        </Pressable>
      </View>
    </Screen>
  );
}
