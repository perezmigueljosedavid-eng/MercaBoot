import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { minutosEnPalabras } from '../../lib/pedidos';
import { useStore } from '../../store';
import { Btn, Card, Chip, Screen, Toggle } from '../../ui/kit';
import { PedidoCard, PedirTexto } from '../../ui/pedidos';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

type Vista = 'nuevos' | 'curso' | 'historial';

/** Los pedidos que recibe el negocio: los nuevos esperan que los aceptes; los demás van en curso o ya terminaron. */
export default function PedidosComerciante() {
  const { s, negocio, actualizarNegocio, accionPedido } = useStore();
  const [elegida, setElegida] = useState<Vista | null>(null);
  const [rechazando, setRechazando] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState<string | null>(null);
  if (!negocio) return null;

  const mios = s.pedidos.filter((p) => p.negocioId === negocio.id).sort((a, b) => b.creado - a.creado);
  const nuevos = mios.filter((p) => p.estado === 'pendiente');
  const enCurso = mios.filter((p) => p.estado === 'aceptado' || p.estado === 'listo');
  const historial = mios.filter((p) => !['pendiente', 'aceptado', 'listo'].includes(p.estado));
  // Si no se eligió nada, se muestra lo que más urge.
  const vista: Vista = elegida ?? (nuevos.length > 0 ? 'nuevos' : enCurso.length > 0 ? 'curso' : 'nuevos');
  const lista = vista === 'nuevos' ? nuevos : vista === 'curso' ? [...enCurso].sort((a, b) => (a.venceEn ?? Infinity) - (b.venceEn ?? Infinity)) : historial.slice(0, 40);
  const esFrecuente = (clienteId: string) => s.frecuentes.some((f) => f.negocioId === negocio.id && f.clienteId === clienteId);

  async function hacer(id: string, accion: 'aceptar' | 'cancelar', texto?: string) {
    setError('');
    setOcupado(id);
    const err = await accionPedido(id, accion, texto);
    setOcupado(null);
    if (err) setError(err);
  }

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ gap: 4 }}>
        <T size={24} weight={800} ls={-0.02}>
          Pedidos
        </T>
        <T size={14} color={C.muted}>
          Lo que tus clientes te apartan desde la app.
        </T>
      </View>

      <Card style={{ gap: 10, padding: 16 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={15} weight={700}>
              Recibir pedidos
            </T>
            <T size={12} lh={1.4} color={C.muted}>
              {negocio.aceptaPedidos ? 'Tus clientes pueden apartar productos desde la app.' : 'Pausado: tus clientes solo pueden escribirte por el chat.'}
            </T>
          </View>
          <Toggle value={negocio.aceptaPedidos} onChange={(v) => actualizarNegocio({ aceptaPedidos: v })} label="Recibir pedidos" />
        </View>
        <T size={12} lh={1.4} color={C.muted}>
          Guardas cada pedido {minutosEnPalabras(negocio.apartadoMin)}. {negocio.aceptaTransferencia ? 'Aceptas transferencia.' : 'Solo pago en persona.'}{' '}
          <T size={12} weight={700} color={C.green} onPress={() => router.push('/editar-negocio')}>
            Cambiar
          </T>
        </T>
      </Card>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label={`Nuevos (${nuevos.length})`} h={38} px={14} size={13} tone="green" active={vista === 'nuevos'} onPress={() => setElegida('nuevos')} />
        <Chip label={`En curso (${enCurso.length})`} h={38} px={14} size={13} tone="green" active={vista === 'curso'} onPress={() => setElegida('curso')} />
        <Chip label="Historial" h={38} px={14} size={13} tone="green" active={vista === 'historial'} onPress={() => setElegida('historial')} />
      </View>

      {error ? (
        <T size={14} weight={600} color={C.red} accessibilityRole="alert">
          {error}
        </T>
      ) : null}

      {lista.length === 0 ? (
        <Card style={{ padding: 20, gap: 6 }}>
          <T size={16} weight={700}>
            {vista === 'nuevos' ? 'No hay pedidos nuevos' : vista === 'curso' ? 'No hay pedidos en curso' : 'Aún no hay historial'}
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            {vista === 'nuevos'
              ? 'Cuando un cliente aparte algo, aparece aquí al instante y sus productos quedan apartados para que no los vendas a otra persona.'
              : vista === 'curso'
                ? 'Aquí ves los pedidos que aceptaste y todavía no se entregan.'
                : 'Aquí quedan los pedidos entregados, cancelados o vencidos.'}
          </T>
        </Card>
      ) : (
        lista.map((p) => (
          <PedidoCard
            key={p.id}
            p={p}
            quien="comerciante"
            nombre={`${esFrecuente(p.clienteId) ? '⭐ ' : ''}${p.clienteNombre}`}
            onPress={() => router.push(`/pedido/${p.id}`)}
          >
            {p.estado === 'pendiente' ? (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <Btn label={ocupado === p.id ? 'Un momento…' : 'Aceptar'} h={44} r={12} size={14} flex={1} onPress={ocupado ? undefined : () => hacer(p.id, 'aceptar')} />
                <Btn label="Rechazar" variant="danger" h={44} r={12} size={14} flex={1} onPress={() => setRechazando(p.id)} />
              </View>
            ) : null}
          </PedidoCard>
        ))
      )}

      <PedirTexto
        visible={rechazando != null}
        titulo="Rechazar el pedido"
        texto="Le avisamos al cliente por el chat y se liberan sus productos. Si quieres, dile el motivo."
        etiqueta="Motivo"
        placeholder="Ej. Se acabó el producto"
        confirmar="Rechazar"
        peligro
        onCancelar={() => setRechazando(null)}
        onConfirmar={(t) => {
          const id = rechazando;
          setRechazando(null);
          if (id) hacer(id, 'cancelar', t);
        }}
      />
    </Screen>
  );
}
