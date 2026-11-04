import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { LineaPedido, Pedido } from '../../data/tipos';
import { abrirMapas, abrirTelefono } from '../../lib/geo';
import { cantidadConUnidad, dinero, esActivo, etiquetaEstado, textoPago } from '../../lib/pedidos';
import { useStore, type AccionPedido } from '../../store';
import { horaCorta, haceCuanto } from '../../ui/bits';
import { Confirmar } from '../../ui/Dialogo';
import { BackBtn, Btn, Card, Group, goBack, Screen, Tag } from '../../ui/kit';
import { Contador, EstadoTag, PedirTexto } from '../../ui/pedidos';
import { T } from '../../ui/T';
import { C, TONO } from '../../ui/theme';

type Rol = 'cliente' | 'comerciante';

/** Lo que se le explica a cada quien según cómo va el pedido. */
function explicacion(p: Pedido, rol: Rol, negocio: string): string {
  const hasta = p.venceEn ? horaCorta(p.venceEn) : '';
  const domicilio = p.entrega === 'domicilio';
  if (rol === 'cliente') {
    switch (p.estado) {
      case 'pendiente':
        return `Esperando que «${negocio}» acepte tu pedido. Tus productos ya están apartados; si no responde a tiempo, se liberan solos.`;
      case 'aceptado':
        if (p.pago === 'transferencia' && p.pagoEstado === 'por_pagar') return 'Haz la transferencia con los datos de abajo y toca «Ya pagué». Mientras no avises, el tiempo sigue corriendo.';
        if (p.pagoEstado === 'reportado') return 'Avisaste tu pago. Esperando que el negocio lo confirme.';
        if (domicilio) return `«${negocio}» aceptó tu pedido y lo está preparando.`;
        return `«${negocio}» aceptó tu pedido${hasta ? ` y te lo guarda hasta las ${hasta}` : ''}. Pasa por él.`;
      case 'listo':
        return domicilio ? 'Tu pedido va en camino.' : `¡Tu pedido está listo! Pasa por él${hasta ? ` antes de las ${hasta}` : ''}.`;
      case 'completado':
        return 'Pedido entregado. ¡Gracias por tu compra!';
      default:
        return p.motivo ?? 'Este pedido ya terminó.';
    }
  }
  switch (p.estado) {
    case 'pendiente':
      return `Pedido nuevo de ${p.clienteNombre}. Los productos ya están apartados: acéptalo o recházalo antes de que se libere${hasta ? ` (a las ${hasta})` : ''}.`;
    case 'aceptado':
      if (p.pagoEstado === 'reportado') return 'El cliente avisó que ya pagó. Revisa tu cuenta y confirma el pago.';
      if (p.pago === 'transferencia' && p.pagoEstado === 'por_pagar') return 'Esperando la transferencia del cliente.';
      return domicilio ? 'Prepáralo y avísale cuando salga.' : `Prepáralo y avísale cuando esté listo${hasta ? ` (se le guarda hasta las ${hasta})` : ''}.`;
    case 'listo':
      return domicilio ? 'Va en camino. Cuando lo entregues, márcalo como entregado.' : 'Esperando que el cliente pase por él.';
    case 'completado':
      return 'Pedido entregado.';
    default:
      return p.motivo ?? 'Este pedido ya terminó.';
  }
}

export default function DetallePedido() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, cuenta, accionPedido, lineasDe, datosPagoDe } = useStore();
  const p = s.pedidos.find((x) => x.id === id);
  const [lineas, setLineas] = useState<LineaPedido[] | null>(null);
  const [datos, setDatos] = useState<string | null | undefined>(undefined);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState<null | 'cancelar-cliente' | 'completar' | 'no-llego'>(null);
  const [pedir, setPedir] = useState<null | 'rechazar' | 'cancelar-negocio' | 'reportar' | 'no-veo-pago'>(null);

  const estadoActual = p?.estado;
  const necesitaDatos = !!p && !!cuenta && p.clienteId === cuenta.id && p.pago === 'transferencia' && (estadoActual === 'aceptado' || estadoActual === 'listo');

  useEffect(() => {
    if (!id) return;
    let vivo = true;
    lineasDe(id).then((l) => {
      if (vivo) setLineas(l);
    });
    return () => {
      vivo = false;
    };
  }, [id, lineasDe]);

  useEffect(() => {
    if (!id || !necesitaDatos) return;
    let vivo = true;
    datosPagoDe(id).then((d) => {
      if (vivo) setDatos(d);
    });
    return () => {
      vivo = false;
    };
  }, [id, necesitaDatos, datosPagoDe]);

  if (!p || !cuenta) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          No encontramos este pedido.
        </T>
      </Screen>
    );
  }

  const rol: Rol = p.clienteId === cuenta.id ? 'cliente' : 'comerciante';
  const negocio = s.negocios.find((n) => n.id === p.negocioId);
  const nombreNegocio = negocio?.nombre ?? 'el negocio';
  const activo = esActivo(p);
  const conv = s.conversaciones.find((c) => c.negocioId === p.negocioId && c.clienteId === p.clienteId);
  const miTrato = rol === 'comerciante' ? s.frecuentes.find((f) => f.negocioId === p.negocioId && f.clienteId === p.clienteId) : undefined;
  const estado = etiquetaEstado(p);
  const volver = () => goBack(rol === 'cliente' ? '/cliente/pedidos' : '/comerciante/pedidos');

  async function hacer(accion: AccionPedido, texto?: string) {
    if (!p || ocupado) return;
    setError('');
    setOcupado(true);
    const err = await accionPedido(p.id, accion, texto);
    setOcupado(false);
    if (err) setError(err);
  }

  const verChat = () => {
    if (rol === 'cliente') router.push(`/chat-negocio/${p.negocioId}`);
    else if (conv) router.push(`/chat-cliente/${conv.id}`);
  };

  const puedeCancelarCliente = rol === 'cliente' && activo && p.pagoEstado === 'por_pagar';
  const aceptadoOListo = p.estado === 'aceptado' || p.estado === 'listo';

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 28 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 4, paddingLeft: 8, paddingRight: 20 }}>
        <BackBtn onPress={volver} />
        <T size={18} weight={700} style={{ flex: 1 }}>
          Pedido {p.codigo}
        </T>
        <EstadoTag p={p} />
      </View>

      <View style={{ gap: 14, paddingHorizontal: 20, paddingTop: 8 }}>
        {/* qué sigue */}
        <Card
          style={{
            gap: 8,
            padding: 16,
            backgroundColor: TONO[estado.tono].bg,
            borderColor: estado.tono === 'verde' ? C.green : estado.tono === 'ambar' ? C.amber : C.line,
          }}
        >
          <T size={15} weight={700} lh={1.35} color={TONO[estado.tono].fg}>
            {explicacion(p, rol, nombreNegocio)}
          </T>
          <Contador p={p} />
          {activo && p.beneficio && rol === 'comerciante' ? (
            <T size={13} lh={1.4} color={C.amberText}>
              🎁 Prometiste a este cliente frecuente: {p.beneficio}
            </T>
          ) : null}
        </Card>

        {/* datos de pago (solo el cliente, y solo cuando el negocio ya aceptó) */}
        {necesitaDatos && p.pagoEstado !== 'confirmado' ? (
          <Card style={{ gap: 6, padding: 16 }}>
            <T size={14} weight={700}>
              Datos para tu transferencia
            </T>
            {datos === undefined ? (
              <T size={14} color={C.muted}>
                Cargando…
              </T>
            ) : datos ? (
              <T size={15} lh={1.5} selectable>
                {datos}
              </T>
            ) : (
              <T size={13} lh={1.45} color={C.muted}>
                No pudimos cargar los datos. Pídeselos al negocio por el chat.
              </T>
            )}
            <T size={12} color={C.muted}>
              Transfiere {dinero(p.total)} y después toca «Ya pagué».
            </T>
          </Card>
        ) : null}

        {rol === 'comerciante' && p.pago === 'transferencia' && p.pagoEstado === 'reportado' ? (
          <Card style={{ gap: 4, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={14} weight={700} color={C.amberDeep}>
              El cliente avisó su pago
            </T>
            <T size={13} lh={1.4} color={C.amberDeep}>
              {p.referenciaPago ? `Referencia: ${p.referenciaPago}. ` : ''}Revisa que haya llegado {dinero(p.total)} a tu cuenta.
            </T>
          </Card>
        ) : null}

        {/* lo que lleva */}
        <View style={{ gap: 8 }}>
          <T size={16} weight={800}>
            {rol === 'cliente' ? `Tu pedido en ${nombreNegocio}` : `Pedido de ${p.clienteNombre}`}
          </T>
          {lineas === null ? (
            <T size={13} color={C.muted}>
              Cargando los productos…
            </T>
          ) : (
            <Group>
              {lineas.map((l) => (
                <View key={l.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 11, paddingHorizontal: 14 }}>
                  <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
                    <T size={15} weight={600}>
                      {l.nombre}
                    </T>
                    <T size={12} color={C.muted}>
                      {cantidadConUnidad(l.cantidad, l.unidad)} × {dinero(l.precio)}
                    </T>
                  </View>
                  <T size={15} weight={700}>
                    {dinero(l.importe)}
                  </T>
                </View>
              ))}
            </Group>
          )}
          <Card style={{ gap: 6, padding: 14 }}>
            <Renglon texto="Subtotal" valor={dinero(p.subtotal)} />
            {p.descuentoPct > 0 ? <Renglon texto={`⭐ Cliente frecuente (${p.descuentoPct}%)`} valor={`-${dinero(p.descuento)}`} color={C.greenDark} /> : null}
            <Renglon texto="Total" valor={dinero(p.total)} fuerte />
            {p.beneficio && rol === 'cliente' ? (
              <T size={13} lh={1.4} color={C.amberText}>
                🎁 Tu beneficio: {p.beneficio}
              </T>
            ) : null}
          </Card>
        </View>

        {/* entrega y pago */}
        <Card style={{ gap: 8, padding: 16 }}>
          <Dato titulo={p.entrega === 'domicilio' ? 'A domicilio' : 'Para recoger'} texto={p.entrega === 'domicilio' ? (p.direccion ?? '') : negocio?.direccion ?? 'Usa «Cómo llegar» para ver el mapa.'} />
          <Dato titulo="Pago" texto={textoPago(p, rol)} />
          {p.nota ? <Dato titulo="Nota" texto={p.nota} /> : null}
          {rol === 'comerciante' ? <Dato titulo="Cliente" texto={p.clienteNombre + (p.clienteTelefono ? ` · ${p.clienteTelefono}` : '')} /> : null}
          <Dato titulo="Hecho" texto={haceCuanto(p.creado)} />
          {!activo && p.motivo ? <Dato titulo="Motivo" texto={p.motivo} /> : null}
        </Card>

        {miTrato ? (
          <Tag bg={C.amberTint} fg={C.amberText}>
            ⭐ Cliente frecuente
            {miTrato.descuentoPct > 0 ? ` · ${miTrato.descuentoPct}%` : ''}
          </Tag>
        ) : null}

        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}

        {/* acciones del cliente */}
        {rol === 'cliente' ? (
          <View style={{ gap: 10 }}>
            {necesitaDatos && p.pagoEstado === 'por_pagar' ? <Btn label="Ya pagué" onPress={ocupado ? undefined : () => setPedir('reportar')} /> : null}
            <Btn label="Escribir al negocio" variant="outline" onPress={verChat} />
            {p.entrega === 'recoger' && negocio ? <Btn label="Cómo llegar" variant="outline" onPress={() => abrirMapas(negocio)} /> : null}
            {puedeCancelarCliente ? <Btn label="Cancelar pedido" variant="danger" onPress={() => setConfirmar('cancelar-cliente')} /> : null}
            {activo && !puedeCancelarCliente ? (
              <T size={12} lh={1.4} color={C.muted}>
                Como ya hay un pago registrado, para cancelar escríbele al negocio por el chat.
              </T>
            ) : null}
          </View>
        ) : (
          /* acciones del comerciante */
          <View style={{ gap: 10 }}>
            {p.estado === 'pendiente' ? (
              <>
                <Btn label={ocupado ? 'Un momento…' : 'Aceptar pedido'} onPress={ocupado ? undefined : () => hacer('aceptar')} />
                <Btn label="Rechazar" variant="danger" onPress={() => setPedir('rechazar')} />
              </>
            ) : null}
            {p.pago === 'transferencia' && aceptadoOListo && p.pagoEstado !== 'confirmado' ? (
              <>
                <Btn label={p.pagoEstado === 'reportado' ? 'Confirmar pago' : 'Ya me pagaron (confirmar pago)'} variant={p.pagoEstado === 'reportado' ? 'primary' : 'outline'} onPress={ocupado ? undefined : () => hacer('confirmar_pago')} />
                {p.pagoEstado === 'reportado' ? <Btn label="No veo el pago" variant="outline" onPress={() => setPedir('no-veo-pago')} /> : null}
              </>
            ) : null}
            {p.estado === 'aceptado' ? (
              <Btn
                label={p.entrega === 'domicilio' ? 'Ya salió a domicilio' : 'Marcar listo para recoger'}
                variant={p.pago === 'transferencia' && p.pagoEstado !== 'confirmado' ? 'outline' : 'primary'}
                onPress={ocupado ? undefined : () => hacer('listo')}
              />
            ) : null}
            {aceptadoOListo ? (
              <Btn label={p.entrega === 'domicilio' ? 'Marcar como entregado' : 'Marcar como entregado y cobrado'} variant={p.estado === 'listo' ? 'primary' : 'outline'} onPress={() => setConfirmar('completar')} />
            ) : null}
            {activo && p.venceEn ? <Btn label="Dar 30 minutos más" variant="outline" onPress={ocupado ? undefined : () => hacer('extender')} /> : null}
            {conv ? <Btn label={`Chatear con ${p.clienteNombre.split(' ')[0]}`} variant="outline" onPress={verChat} /> : null}
            {p.clienteTelefono ? <Btn label="Llamar" variant="outline" onPress={() => abrirTelefono(p.clienteTelefono)} /> : null}
            {aceptadoOListo ? <Btn label="No se presentó" variant="danger" onPress={() => setConfirmar('no-llego')} /> : null}
            {activo && p.estado !== 'pendiente' ? <Btn label="Cancelar pedido" variant="danger" onPress={() => setPedir('cancelar-negocio')} /> : null}
            <Btn label={miTrato ? '⭐ Cambiar su trato de frecuente' : '⭐ Nombrar cliente frecuente'} variant="outline" onPress={() => router.push({ pathname: '/clientes', params: { cliente: p.clienteId } })} />
          </View>
        )}
      </View>

      <Confirmar
        visible={confirmar === 'cancelar-cliente'}
        titulo="¿Cancelar tu pedido?"
        texto={p.estado === 'listo' ? 'Ya está listo para ti. Si lo cancelas ahora cuenta como pedido no recogido y el negocio podría pedirte pagar por adelantado la próxima vez.' : 'Los productos se liberan para otros clientes.'}
        confirmar="Sí, cancelar"
        cancelar="No"
        peligro
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          setConfirmar(null);
          hacer('cancelar');
        }}
      />
      <Confirmar
        visible={confirmar === 'completar'}
        titulo="¿Ya lo entregaste?"
        texto={
          p.pago === 'transferencia' && p.pagoEstado !== 'confirmado'
            ? 'Este pedido es con transferencia: primero confirma que ya te pagaron.'
            : 'Se marca como entregado y cobrado. Las existencias de los productos que llevan la cuenta bajan solas.'
        }
        confirmar="Sí, entregado"
        cancelar="Todavía no"
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          setConfirmar(null);
          hacer('completar');
        }}
      />
      <Confirmar
        visible={confirmar === 'no-llego'}
        titulo="¿El cliente no se presentó?"
        texto="Los productos quedan libres para otros clientes y se le cuenta una ausencia. Con 2 ausencias seguidas en 30 días solo podrá apartar pagando por transferencia; con 3, no podrá apartar en tu negocio."
        confirmar="Sí, no llegó"
        cancelar="Todavía no"
        peligro
        onCancelar={() => setConfirmar(null)}
        onConfirmar={() => {
          setConfirmar(null);
          hacer('no_se_presento');
        }}
      />

      <PedirTexto
        visible={pedir === 'rechazar' || pedir === 'cancelar-negocio'}
        titulo={pedir === 'rechazar' ? 'Rechazar el pedido' : 'Cancelar el pedido'}
        texto="Le avisamos al cliente por el chat. Si quieres, dile el motivo."
        etiqueta="Motivo"
        placeholder="Ej. Se acabó el producto"
        confirmar={pedir === 'rechazar' ? 'Rechazar' : 'Cancelar pedido'}
        peligro
        onCancelar={() => setPedir(null)}
        onConfirmar={(t) => {
          setPedir(null);
          hacer('cancelar', t);
        }}
      />
      <PedirTexto
        visible={pedir === 'reportar'}
        titulo="Avisar que ya pagaste"
        texto="Escribe el folio o la clave de rastreo de tu transferencia para que sea fácil encontrarla (opcional)."
        etiqueta="Folio o clave de rastreo"
        placeholder="Ej. 884455"
        confirmar="Ya pagué"
        onCancelar={() => setPedir(null)}
        onConfirmar={(t) => {
          setPedir(null);
          hacer('reportar_pago', t);
        }}
      />
      <PedirTexto
        visible={pedir === 'no-veo-pago'}
        titulo="No veo el pago"
        texto="El pedido vuelve a «por pagar» y se le dan 30 minutos más. Dile qué pasó (opcional)."
        etiqueta="Qué pasó"
        placeholder="Ej. No me ha llegado nada todavía"
        confirmar="Avisar"
        onCancelar={() => setPedir(null)}
        onConfirmar={(t) => {
          setPedir(null);
          hacer('rechazar_pago', t);
        }}
      />
    </Screen>
  );
}

function Renglon({ texto, valor, fuerte = false, color = C.ink }: { texto: string; valor: string; fuerte?: boolean; color?: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <T size={fuerte ? 16 : 14} weight={fuerte ? 800 : 500} color={color} style={{ flex: 1 }}>
        {texto}
      </T>
      <T size={fuerte ? 18 : 14} weight={fuerte ? 800 : 600} color={color}>
        {valor}
      </T>
    </View>
  );
}

function Dato({ titulo, texto }: { titulo: string; texto: string }) {
  if (!texto) return null;
  return (
    <View style={{ gap: 1 }}>
      <T size={12} weight={700} color={C.muted}>
        {titulo}
      </T>
      <T size={14} lh={1.4}>
        {texto}
      </T>
    </View>
  );
}
