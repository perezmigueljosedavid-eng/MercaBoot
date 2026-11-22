import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import type { LineaPedido, Pedido } from '../../data/tipos';
import { abrirMapas, abrirTelefono } from '../../lib/geo';
import { esReferenciaDeTarjeta, montoParaCopiar, normalizarLinkDePago, referenciaDeTarjeta, sitioDeLink, TEXTO_SOLO_TARJETA } from '../../lib/pagos';
import { cantidadConUnidad, dinero, esActivo, etiquetaEstado, textoPago } from '../../lib/pedidos';
import { OTRO_NEGOCIO, useStore, type AccionPedido } from '../../store';
import { horaCorta, haceCuanto } from '../../ui/bits';
import { Confirmar } from '../../ui/Dialogo';
import { BackBtn, Btn, Card, Group, goBack, Screen, Tag } from '../../ui/kit';
import { BotonCopiar, PagoDelPedido, useCopiado } from '../../ui/Pagar';
import { Contador, EstadoTag, PedirTexto } from '../../ui/pedidos';
import { T } from '../../ui/T';
import { C, TONO } from '../../ui/theme';

type Rol = 'cliente' | 'comerciante';

/** Con qué puede pagar el cliente un pedido por adelantado (se sabe cuando ya cargaron los datos y el link). */
interface FormasDePago {
  tarjeta: boolean;
  transferencia: boolean;
}

/** Lo que se le explica a cada quien según cómo va el pedido. */
function explicacion(p: Pedido, rol: Rol, negocio: string, formas: FormasDePago): string {
  const hasta = p.venceEn ? horaCorta(p.venceEn) : '';
  const domicilio = p.entrega === 'domicilio';
  if (rol === 'cliente') {
    switch (p.estado) {
      case 'pendiente':
        return `Esperando que «${negocio}» acepte tu pedido. Tus productos ya están apartados; si no responde a tiempo, se liberan solos.`;
      case 'aceptado':
        if (p.pago === 'transferencia' && p.pagoEstado === 'por_pagar') {
          const como =
            formas.tarjeta && formas.transferencia
              ? 'Paga con tarjeta o con una transferencia (abajo están los datos)'
              : formas.tarjeta
                ? 'Paga con tarjeta con el botón de abajo'
                : formas.transferencia
                  ? 'Haz la transferencia con los datos de abajo'
                  : 'Paga como se indica abajo';
          return `${como} y toca «Ya pagué». Mientras no avises, el tiempo sigue corriendo.`;
        }
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
      if (p.pago === 'transferencia' && p.pagoEstado === 'por_pagar') return 'Esperando el pago del cliente.';
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
  const { s, cuenta, accionPedido, lineasDe, datosPagoDe, linkPagoDe, ponerLinkPedido, miLinkPedido, enviarComoNegocio, agregarAlCarrito, avisar } = useStore();
  const p = s.pedidos.find((x) => x.id === id);
  const negocio = p ? s.negocios.find((n) => n.id === p.negocioId) : undefined;
  const [lineas, setLineas] = useState<LineaPedido[] | null>(null);
  const [datos, setDatos] = useState<string | null | undefined>(undefined);
  /** El link para pagar con tarjeta (`undefined` = todavía no se pide o está cargando, `null` = el negocio no tiene). */
  const [link, setLink] = useState<string | null | undefined>(undefined);
  /** Con qué medio dirá el cliente que pagó: se marca al tocar «Pagar con tarjeta». */
  const [pagoConTarjeta, setPagoConTarjeta] = useState(false);
  const [error, setError] = useState('');
  const [ocupado, setOcupado] = useState(false);
  const [confirmar, setConfirmar] = useState<null | 'cancelar-cliente' | 'completar' | 'no-llego'>(null);
  const [pedir, setPedir] = useState<null | 'rechazar' | 'cancelar-negocio' | 'reportar' | 'no-veo-pago' | 'link-pago'>(null);
  /** (comerciante) El link de pago que ya puso en este pedido (`undefined` = todavía no se lee, `null` = no hay). */
  const [miLink, setMiLink] = useState<string | null | undefined>(undefined);
  const { copiado, copiar } = useCopiado();
  /** «Pedir otra vez» chocó con un carrito de otra tienda: se pregunta si se vacía. */
  const [otroCarrito, setOtroCarrito] = useState(false);

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

  // El link de pago con tarjeta solo existe si el negocio guardó uno; la base de datos solo se lo da al cliente de este pedido.
  // (Si el negocio manda un link nuevo, el pedido «cambia» y se vuelve a pedir.)
  const quiereLink = necesitaDatos && p?.pagoEstado !== 'confirmado';
  const versionDelPedido = p?.actualizado;
  useEffect(() => {
    if (!id || !quiereLink) return;
    let vivo = true;
    linkPagoDe(id).then((l) => {
      if (vivo) setLink(l);
    });
    return () => {
      vivo = false;
    };
  }, [id, quiereLink, versionDelPedido, linkPagoDe]);

  // El comerciante ve si ya le puso un link de pago a este pedido.
  const puedePonerLink = !!p && !!cuenta && p.clienteId !== cuenta.id && p.pago === 'transferencia' && (estadoActual === 'aceptado' || estadoActual === 'listo') && p.pagoEstado === 'por_pagar';
  useEffect(() => {
    if (!id || !puedePonerLink) return;
    let vivo = true;
    miLinkPedido(id).then((l) => {
      if (vivo) setMiLink(l);
    });
    return () => {
      vivo = false;
    };
  }, [id, puedePonerLink, versionDelPedido, miLinkPedido]);

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
  const nombreNegocio = negocio?.nombre ?? 'el negocio';
  const activo = esActivo(p);
  const conv = s.conversaciones.find((c) => c.negocioId === p.negocioId && c.clienteId === p.clienteId);
  const miTrato = rol === 'comerciante' ? s.frecuentes.find((f) => f.negocioId === p.negocioId && f.clienteId === p.clienteId) : undefined;
  const estado = etiquetaEstado(p);
  const volver = () => goBack(rol === 'cliente' ? '/cliente/pedidos' : '/comerciante/pedidos');
  const formas: FormasDePago = { tarjeta: !!link, transferencia: datos !== TEXTO_SOLO_TARJETA };
  // Si el negocio solo cobra con tarjeta, o el cliente ya abrió el link, el aviso de pago se manda como «Tarjeta · folio»
  const aviseConTarjeta = pagoConTarjeta || (datos === TEXTO_SOLO_TARJETA && !!link);

  async function hacer(accion: AccionPedido, texto?: string) {
    if (!p || ocupado) return;
    setError('');
    setOcupado(true);
    const err = await accionPedido(p.id, accion, texto);
    setOcupado(false);
    if (err) setError(err);
  }

  /** (comerciante) Guarda el link de pago de este pedido y le avisa al cliente con un mensaje normal del chat (así también le llega a su teléfono). */
  async function enviarLink(texto: string) {
    if (!p || ocupado) return;
    const r = normalizarLinkDePago(texto);
    if (!r.ok || !r.url) return setError(r.ok ? 'Pega el link de pago.' : r.motivo);
    setError('');
    setOcupado(true);
    const err = await ponerLinkPedido(p.id, r.url);
    if (err) {
      setOcupado(false);
      return setError(err);
    }
    setMiLink(r.url);
    if (conv) await enviarComoNegocio(conv.id, `💳 Te envié el link para pagar con tarjeta tu pedido ${p.codigo} (${dinero(p.total)}). Ábrelo desde el pedido, con el botón «Pagar con tarjeta».`);
    setOcupado(false);
    avisar('Listo: tu cliente ya ve el link en su pedido.');
  }

  async function quitarLink() {
    if (!p || ocupado) return;
    setError('');
    setOcupado(true);
    const err = await ponerLinkPedido(p.id, null);
    setOcupado(false);
    if (err) return setError(err);
    setMiLink(null);
  }

  /** «Pedir otra vez»: pone en el carrito lo mismo que se pidió, con lo que todavía haya, y abre el carrito para revisarlo. */
  async function pedirOtraVez(vaciar: boolean) {
    if (!p || ocupado) return;
    setError('');
    setOcupado(true);
    try {
      const ls = lineas && lineas.length > 0 ? lineas : await lineasDe(p.id);
      if (!ls || ls.length === 0) {
        setError('No pudimos leer los productos de este pedido. Revisa tu internet e inténtalo otra vez.');
        return;
      }
      const faltan: string[] = [];
      let primerMotivo = '';
      let agregados = 0;
      for (const l of ls) {
        if (!l.productoId) {
          faltan.push(l.nombre);
          continue;
        }
        const r = agregarAlCarrito(l.productoId, l.cantidad, vaciar);
        if (r === OTRO_NEGOCIO) {
          setOtroCarrito(true);
          return;
        }
        if (r) {
          faltan.push(l.nombre);
          primerMotivo = primerMotivo || r;
          continue;
        }
        agregados += 1;
      }
      if (agregados === 0) {
        setError(primerMotivo || 'Ningún producto de este pedido está disponible ahora.');
        return;
      }
      if (faltan.length > 0) avisar(`No se pudo agregar: ${faltan.slice(0, 3).join(', ')}${faltan.length > 3 ? '…' : ''}.`);
      router.push('/carrito');
    } finally {
      setOcupado(false);
    }
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
            {explicacion(p, rol, nombreNegocio, formas)}
          </T>
          <Contador p={p} />
          {activo && p.beneficio && rol === 'comerciante' ? (
            <T size={13} lh={1.4} color={C.amberText}>
              🎁 Prometiste a este cliente frecuente: {p.beneficio}
            </T>
          ) : null}
        </Card>

        {/* cómo pagar (solo el cliente, y solo cuando el negocio ya aceptó) */}
        {necesitaDatos && p.pagoEstado !== 'confirmado' ? (
          <PagoDelPedido datos={datos} link={link} total={p.total} avisado={p.pagoEstado === 'reportado'} alAbrirLink={() => setPagoConTarjeta(true)} />
        ) : null}

        {rol === 'comerciante' && p.pago === 'transferencia' && p.pagoEstado === 'reportado' ? (
          <Card style={{ gap: 4, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={14} weight={700} color={C.amberDeep}>
              El cliente avisó su pago
            </T>
            <T size={13} lh={1.4} color={C.amberDeep}>
              {esReferenciaDeTarjeta(p.referenciaPago)
                ? `Dice que pagó con tarjeta usando tu link de pago${p.referenciaPago && p.referenciaPago.length > 'Tarjeta'.length ? ` (${p.referenciaPago})` : ''}. Revisa en tu cuenta de cobros que haya llegado ${dinero(p.total)}.`
                : `${p.referenciaPago ? `Referencia: ${p.referenciaPago}. ` : ''}Revisa que haya llegado ${dinero(p.total)} a tu cuenta.`}
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
          <Dato titulo="Pago" texto={textoPago(p, rol, !!negocio?.aceptaTarjeta)} />
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
            {p.estado === 'completado' && negocio ? <Btn label="Pedir otra vez" onPress={ocupado ? undefined : () => void pedirOtraVez(false)} /> : null}
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
            {puedePonerLink ? (
              <Card style={{ gap: 8, padding: 14 }}>
                <T size={14} weight={700}>
                  ¿Cobras con tarjeta?
                </T>
                <T size={12.5} lh={1.4} color={C.muted}>
                  {miLink
                    ? `Ya le enviaste un link de pago (${sitioDeLink(miLink)}). Tu cliente lo ve en su pedido con el botón «Pagar con tarjeta».`
                    : `Crea en tu proveedor (Mercado Pago, Clip, PayPal…) un link de pago por ${dinero(p.total)} y pégalo aquí: tu cliente lo verá en su pedido. Es opcional; la transferencia sigue disponible.`}
                </T>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                  <BotonCopiar etiqueta={`Copiar ${dinero(p.total)}`} copiado={copiado === 'total'} onPress={() => void copiar('total', montoParaCopiar(p.total))} />
                </View>
                <View style={{ flexDirection: 'row', gap: 8 }}>
                  <Btn label={miLink ? 'Cambiar el link' : 'Enviar link de pago'} variant="outline" h={44} r={12} size={14} flex={1} onPress={ocupado ? undefined : () => setPedir('link-pago')} />
                  {miLink ? <Btn label="Quitar" variant="outline" h={44} r={12} size={14} flex={1} onPress={ocupado ? undefined : () => void quitarLink()} /> : null}
                </View>
              </Card>
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
        visible={otroCarrito}
        titulo="Tu carrito es de otra tienda"
        texto={`Un pedido es de una sola tienda. ¿Vaciamos tu carrito para pedir otra vez en «${nombreNegocio}»?`}
        confirmar="Sí, vaciar y pedir"
        cancelar="No"
        onCancelar={() => setOtroCarrito(false)}
        onConfirmar={() => {
          setOtroCarrito(false);
          void pedirOtraVez(true);
        }}
      />
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
        texto={
          aviseConTarjeta
            ? 'Si tu pago con tarjeta te dio un folio o número de operación, escríbelo para que sea fácil encontrarlo (opcional).'
            : 'Escribe el folio o la clave de rastreo de tu transferencia para que sea fácil encontrarla (opcional).'
        }
        etiqueta={aviseConTarjeta ? 'Folio o número de operación' : 'Folio o clave de rastreo'}
        placeholder="Ej. 884455"
        confirmar="Ya pagué"
        onCancelar={() => setPedir(null)}
        onConfirmar={(t) => {
          setPedir(null);
          hacer('reportar_pago', aviseConTarjeta ? referenciaDeTarjeta(t) : t);
        }}
      />
      <PedirTexto
        visible={pedir === 'link-pago'}
        titulo="Link de pago de este pedido"
        texto={`Crea un link de pago por ${dinero(p.total)} en tu proveedor (Mercado Pago, Clip, PayPal…), cópialo y pégalo aquí. Tu cliente lo verá dentro de su pedido, con el botón «Pagar con tarjeta».`}
        etiqueta="Link de pago"
        placeholder="https://…"
        obligatorio
        link
        confirmar="Enviar"
        validar={(t) => {
          const r = normalizarLinkDePago(t);
          return r.ok ? (r.url ? null : 'Pega el link de pago.') : r.motivo;
        }}
        onCancelar={() => setPedir(null)}
        onConfirmar={(t) => {
          setPedir(null);
          void enviarLink(t);
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
