import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { dinero, esActivo } from '../../lib/pedidos';
import { useStore } from '../../store';
import { Icon } from '../../ui/Icon';
import { Btn, Card, Screen, SectionTitle } from '../../ui/kit';
import { PedidoCard } from '../../ui/pedidos';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

/** Los pedidos del cliente: lo que tiene apartado ahora y lo que ya pasó. */
export default function PedidosCliente() {
  const { s, cuenta, carrito } = useStore();
  const [todos, setTodos] = useState(false);
  const miId = cuenta?.id ?? '';
  const mios = s.pedidos.filter((p) => p.clienteId === miId).sort((a, b) => b.creado - a.creado);
  const activos = mios.filter(esActivo);
  const anteriores = mios.filter((p) => !esActivo(p));
  const verAnteriores = todos ? anteriores : anteriores.slice(0, 8);
  const nombreDe = (negocioId: string) => s.negocios.find((n) => n.id === negocioId)?.nombre ?? 'Negocio';

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ gap: 4 }}>
        <T size={24} weight={800} ls={-0.02}>
          Mis pedidos
        </T>
        <T size={14} color={C.muted}>
          Lo que tienes apartado y lo que ya pediste.
        </T>
      </View>

      {carrito ? (
        <Pressable accessibilityRole="button" onPress={() => router.push('/carrito')}>
          <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, backgroundColor: C.greenTint, borderColor: C.green }}>
            <Icon name="cart" size={24} color={C.greenDark} />
            <View style={{ flex: 1, gap: 2 }}>
              <T size={15} weight={700} color={C.greenDark}>
                Tienes un carrito sin apartar
              </T>
              <T size={13} color={C.greenDark} numberOfLines={1}>
                {carrito.cuantos} {carrito.cuantos === 1 ? 'producto' : 'productos'} de {carrito.negocio.nombre} · {dinero(carrito.subtotal)}
              </T>
            </View>
            <Icon name="next" size={18} color={C.greenDark} />
          </Card>
        </Pressable>
      ) : null}

      {mios.length === 0 ? (
        <Card style={{ padding: 20, gap: 10 }}>
          <T size={16} weight={700}>
            Aún no has hecho pedidos
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            Abre un negocio, agrega lo que quieras al carrito y aparta tu pedido. El negocio lo guarda un rato para que pases por él (o te lo lleve) y no se le acabe a nadie.
          </T>
          <Btn label="Buscar negocios" h={46} r={12} size={15} onPress={() => router.navigate('/cliente/buscar')} />
        </Card>
      ) : null}

      {activos.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionTitle title={`Activos (${activos.length})`} />
          {activos.map((p) => (
            <PedidoCard key={p.id} p={p} quien="cliente" nombre={nombreDe(p.negocioId)} onPress={() => router.push(`/pedido/${p.id}`)} />
          ))}
        </View>
      ) : mios.length > 0 ? (
        <T size={14} color={C.muted}>
          No tienes pedidos activos ahora.
        </T>
      ) : null}

      {anteriores.length > 0 ? (
        <View style={{ gap: 12 }}>
          <SectionTitle title="Anteriores" link={anteriores.length > 8 ? (todos ? 'Ver menos' : 'Ver todos') : undefined} onLink={() => setTodos((v) => !v)} />
          {verAnteriores.map((p) => (
            <PedidoCard key={p.id} p={p} quien="cliente" nombre={nombreDe(p.negocioId)} onPress={() => router.push(`/pedido/${p.id}`)} />
          ))}
        </View>
      ) : null}
    </Screen>
  );
}
