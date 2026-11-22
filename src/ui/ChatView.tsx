import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RESPUESTAS_RAPIDAS_CLIENTE, RESPUESTAS_RAPIDAS_COMERCIANTE } from '../data/contenido';
import type { Mensaje } from '../data/tipos';
import { abrirMapas } from '../lib/geo';
import { horaBonita } from '../lib/horario';
import { dinero, esActivo, etiquetaEstado } from '../lib/pedidos';
import { bloquear, cargarBloqueos, desbloquear, useBloqueados } from '../lib/seguridad';
import { sinLeer, useStore } from '../store';
import { fechaCorta } from './bits';
import { Confirmar } from './Dialogo';
import { Hoja } from './Hoja';
import { Icon, type IconName } from './Icon';
import { BackBtn, Btn, Card, Chip, Screen } from './kit';
import { Logo } from './Logo';
import { Contador, EstadoTag } from './pedidos';
import { ReportarHoja, type ObjetoReportado } from './Reportar';
import { SelectorHora } from './SelectorHora';
import { T } from './T';
import { C, FONT } from './theme';

const hora = (ms: number) => {
  const d = new Date(ms);
  return `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
};

function etiquetaDia(ms: number) {
  const hoy = new Date();
  const d = new Date(ms);
  const dia = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const dif = Math.round((dia(hoy) - dia(d)) / 86400000);
  if (dif === 0) return 'Hoy';
  if (dif === 1) return 'Ayer';
  return fechaCorta(ms);
}

function Burbuja({ m, mio, alMantener }: { m: Mensaje; mio: boolean; alMantener?: () => void }) {
  return (
    <Pressable
      accessibilityLabel={`${mio ? 'Tú' : 'Ellos'}: ${m.texto}`}
      accessibilityHint={alMantener ? 'Mantén presionado para reportar este mensaje' : undefined}
      onLongPress={alMantener}
      delayLongPress={450}
      style={{
        alignSelf: mio ? 'flex-end' : 'flex-start',
        maxWidth: '78%',
        paddingVertical: 9,
        paddingHorizontal: 14,
        gap: 3,
        borderTopLeftRadius: 18,
        borderTopRightRadius: 18,
        borderBottomLeftRadius: mio ? 18 : 4,
        borderBottomRightRadius: mio ? 4 : 18,
        backgroundColor: mio ? C.green : C.white,
        borderWidth: mio ? 0 : 1,
        borderColor: C.line,
        opacity: m.pendiente ? 0.65 : 1,
      }}
    >
      <T size={15} lh={1.4} color={mio ? C.white : C.ink}>
        {m.texto}
      </T>
      <T size={10} color={mio ? '#CFE6D9' : C.muted} style={{ alignSelf: 'flex-end' }}>
        {m.pendiente ? 'Enviando…' : hora(m.creado)}
      </T>
    </Pressable>
  );
}

/** Una opción del menú de la conversación (reportar, bloquear…). */
function FilaMenu({ icono, texto, ayuda, peligro = false, onPress }: { icono: IconName; texto: string; ayuda?: string; peligro?: boolean; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={ayuda ? `${texto}. ${ayuda}` : texto}
      onPress={onPress}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 14, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
    >
      <View style={{ width: 42, height: 42, borderRadius: 21, backgroundColor: peligro ? C.redTint : C.grey, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name={icono} size={20} color={peligro ? C.red : C.ink} />
      </View>
      <View style={{ flex: 1, gap: 1 }}>
        <T size={15} weight={700} color={peligro ? C.red : C.ink}>
          {texto}
        </T>
        {ayuda ? (
          <T size={12.5} lh={1.35} color={C.muted}>
            {ayuda}
          </T>
        ) : null}
      </View>
    </Pressable>
  );
}

/** Un aviso del sistema dentro del chat: un pedido cambió de estado, o el negocio te nombró cliente frecuente. */
function AvisoSistema({ m }: { m: Mensaje }) {
  const pedidoId = m.pedidoId;
  return (
    <Pressable
      accessibilityRole={pedidoId ? 'button' : 'text'}
      accessibilityLabel={m.texto}
      disabled={!pedidoId}
      onPress={() => pedidoId && router.push(`/pedido/${pedidoId}`)}
      style={{ alignSelf: 'center', maxWidth: '92%', gap: 2, paddingVertical: 8, paddingHorizontal: 14, borderRadius: 14, backgroundColor: C.greenTint }}
    >
      <T size={13} weight={600} lh={1.4} color={C.greenDark} style={{ textAlign: 'center' }}>
        {m.texto}
      </T>
      <T size={10} color={C.muted} style={{ textAlign: 'center' }}>
        {pedidoId ? `Toca para ver el pedido · ${hora(m.creado)}` : hora(m.creado)}
      </T>
    </Pressable>
  );
}

/** La tarjeta que queda en el chat cuando alguien aparta un pedido; muestra cómo va en este momento. */
function TarjetaPedido({ m, mio }: { m: Mensaje; mio: boolean }) {
  const { s } = useStore();
  const p = m.pedidoId ? s.pedidos.find((x) => x.id === m.pedidoId) : undefined;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={m.texto}
      disabled={!p}
      onPress={() => p && router.push(`/pedido/${p.id}`)}
      style={{ alignSelf: mio ? 'flex-end' : 'flex-start', width: '86%' }}
    >
      <Card r={16} style={{ gap: 8, padding: 14, borderColor: C.green }}>
        <T size={15} weight={700} lh={1.35}>
          {m.texto}
        </T>
        {p ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <EstadoTag p={p} />
            <Contador p={p} compacto />
          </View>
        ) : null}
        <T size={13} weight={700} color={C.green}>
          {p ? 'Ver pedido' : 'Pedido'} · {hora(m.creado)}
        </T>
      </Card>
    </Pressable>
  );
}

/**
 * Conversación entre cliente y negocio, en vivo: lo que escribe uno aparece al instante en el teléfono del otro.
 * modo "cliente": id = id del negocio · modo "comerciante": id = id de la conversación.
 */
export function ChatView({ modo, id, showBack }: { modo: 'cliente' | 'comerciante'; id: string; showBack: boolean }) {
  const { s, cuenta, negocio: miNegocio, mensajesDe, observarChat, enviarComoCliente, enviarComoNegocio, marcarLeida, refrescar } = useStore();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
  /** El comerciante elige a qué hora llega algo («Llega a las…»). */
  const [eligiendoHora, setEligiendoHora] = useState(false);
  /** Menú de la conversación (reportar / bloquear), lo que se está reportando y la confirmación de bloquear. */
  const [menu, setMenu] = useState(false);
  const [reportando, setReportando] = useState<ObjetoReportado | null>(null);
  const [confirmandoBloqueo, setConfirmandoBloqueo] = useState(false);
  const [ocupado, setOcupado] = useState(false);
  const bloqueados = useBloqueados();
  const scroll = useRef<ScrollViewInstance>(null);

  const conv =
    modo === 'cliente'
      ? s.conversaciones.find((c) => c.negocioId === id && c.clienteId === cuenta?.id)
      : s.conversaciones.find((c) => c.id === id && c.negocioId === miNegocio?.id);
  const negocio = modo === 'cliente' ? s.negocios.find((n) => n.id === id) : miNegocio;
  const hayNoLeidos = conv && cuenta ? sinLeer(conv, cuenta.id, modo === 'cliente') : false;
  const convId = conv?.id;

  // Mientras la pantalla está abierta, la conversación se mantiene al día.
  useEffect(() => {
    if (!convId) return;
    return observarChat(convId);
  }, [convId, observarChat]);

  useEffect(() => {
    if (convId && hayNoLeidos) marcarLeida(convId);
  }, [convId, hayNoLeidos, marcarLeida]);

  // A quién tiene bloqueado esta persona (para avisarle en el chat y dejarla desbloquear)
  useEffect(() => {
    void cargarBloqueos();
  }, []);

  if (!cuenta || !negocio || (modo === 'comerciante' && !conv)) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 16 }}>
        <BackBtn />
        <T size={16} weight={700}>
          No encontramos esta conversación.
        </T>
      </Screen>
    );
  }

  const nombre = modo === 'cliente' ? negocio.nombre : (conv?.clienteNombre ?? 'Cliente');
  const msgs = convId ? mensajesDe(convId) : [];
  // Pedidos que este cliente tiene en este negocio y todavía no terminan.
  const clienteId = modo === 'cliente' ? cuenta.id : conv?.clienteId;
  const activos = clienteId
    ? s.pedidos.filter((p) => p.negocioId === negocio.id && p.clienteId === clienteId && esActivo(p)).sort((a, b) => b.creado - a.creado)
    : [];
  const trato = clienteId ? s.frecuentes.find((f) => f.negocioId === negocio.id && f.clienteId === clienteId) : undefined;
  const rapidas = modo === 'cliente' ? RESPUESTAS_RAPIDAS_CLIENTE : RESPUESTAS_RAPIDAS_COMERCIANTE;
  const sinCuentaNegocio = modo === 'cliente' && !negocio.duenoId;
  const esMiNegocio = modo === 'cliente' && negocio.duenoId === cuenta.id;
  /** La otra persona de esta conversación: el dueño del negocio (si eres cliente) o el cliente (si eres el comerciante). */
  const otroId = modo === 'cliente' ? negocio.duenoId : conv?.clienteId;
  const puedeModerar = !!otroId && otroId !== cuenta.id && !sinCuentaNegocio && !esMiNegocio;
  const yoBloquee = !!otroId && bloqueados.some((b) => b.usuarioId === otroId);

  async function bloquearAhora() {
    if (!otroId || ocupado) return;
    setConfirmandoBloqueo(false);
    setOcupado(true);
    setError('');
    const err = await bloquear(otroId, nombre);
    setOcupado(false);
    if (err) setError(err);
    else void refrescar(); // al bloquear a un negocio, deja de estar en tus favoritos
  }

  async function desbloquearAhora() {
    if (!otroId || ocupado) return;
    setOcupado(true);
    setError('');
    const err = await desbloquear(otroId);
    setOcupado(false);
    if (err) setError(err);
  }

  async function enviar(t: string) {
    const limpio = t.trim();
    if (!limpio) return;
    setError('');
    setTexto('');
    const err = modo === 'cliente' ? await enviarComoCliente(id, limpio) : conv ? await enviarComoNegocio(conv.id, limpio) : null;
    if (err) {
      setError(err);
      setTexto(limpio);
    }
  }

  return (
    <Screen bg={C.white} scroll={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          paddingTop: 8,
          paddingBottom: 12,
          paddingLeft: showBack ? 8 : 16,
          paddingRight: 16,
          backgroundColor: C.white,
          borderBottomWidth: 1,
          borderBottomColor: C.line,
        }}
      >
        {showBack ? <BackBtn /> : null}
        <Logo uri={modo === 'cliente' ? negocio.logoUri : undefined} nombre={nombre} size={42} redondo />
        <View style={{ flex: 1, gap: 2 }}>
          <T size={16} weight={700} numberOfLines={1}>
            {nombre}
          </T>
          {modo === 'cliente' && !sinCuentaNegocio ? (
            <T size={12} weight={600} color={negocio.abierto ? C.green : C.muted}>
              {negocio.abierto ? 'Abierto ahora' : 'Cerrado'}
              {trato ? ` · ⭐ Cliente frecuente${trato.descuentoPct > 0 ? ` ${trato.descuentoPct}%` : ''}` : ''}
            </T>
          ) : null}
        </View>
        {modo === 'comerciante' && conv ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Cliente frecuente"
            onPress={() => router.push({ pathname: '/clientes', params: { cliente: conv.clienteId } })}
            style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, justifyContent: 'center', backgroundColor: trato ? C.amberTint : C.grey }}
          >
            <T size={12} weight={700} color={trato ? C.amberText : C.greyText}>
              {trato ? '⭐ Frecuente' : '☆ Frecuente'}
            </T>
          </Pressable>
        ) : null}
        {puedeModerar ? (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Más opciones: reportar o bloquear"
            onPress={() => setMenu(true)}
            hitSlop={6}
            style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="more" size={22} color={C.ink} />
          </Pressable>
        ) : null}
      </View>

      {activos.length > 0 ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={activos.length === 1 ? `Ver el pedido ${activos[0].codigo}` : `Ver ${activos.length} pedidos activos`}
          onPress={() => router.push(`/pedido/${activos[0].id}`)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingHorizontal: 16, backgroundColor: C.greenTint, borderBottomWidth: 1, borderBottomColor: C.line }}
        >
          <Icon name="bagCheck" size={20} color={C.greenDark} />
          <View style={{ flex: 1, gap: 2 }}>
            <T size={13} weight={700} color={C.greenDark} numberOfLines={1}>
              {activos.length === 1
                ? `Pedido ${activos[0].codigo} · ${etiquetaEstado(activos[0]).label} · ${dinero(activos[0].total)}`
                : `${activos.length} pedidos activos`}
            </T>
            <Contador p={activos[0]} compacto />
          </View>
          <Icon name="next" size={16} color={C.greenDark} />
        </Pressable>
      ) : null}

      <ScrollView
        ref={scroll}
        style={{ flex: 1, backgroundColor: C.bg }}
        contentContainerStyle={{ gap: 8, paddingVertical: 18, paddingHorizontal: 16, flexGrow: 1 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {msgs.length === 0 ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 24 }}>
            <Icon name="chat" size={30} color={C.dash} />
            <T size={14} color={C.muted} lh={1.45} style={{ textAlign: 'center' }}>
              {sinCuentaNegocio
                ? `${negocio.nombre} todavía no usa Mercaboot, así que no puede responder mensajes por aquí.`
                : esMiNegocio
                  ? 'Este es tu propio negocio: los mensajes de tus clientes llegan a la pestaña Chats de tu modo comerciante.'
                  : `Escríbele a ${negocio.nombre}. Por ejemplo, pregunta si tiene lo que buscas.`}
            </T>
          </View>
        ) : null}
        {msgs.map((m, i) => {
          const nuevoDia = i === 0 || etiquetaDia(m.creado) !== etiquetaDia(msgs[i - 1].creado);
          return (
            <React.Fragment key={m.id}>
              {nuevoDia ? (
                <T size={12} color={C.muted} style={{ alignSelf: 'center', marginTop: i ? 6 : 0 }}>
                  {etiquetaDia(m.creado)}
                </T>
              ) : null}
              {m.tipo === 'aviso' ? (
                <AvisoSistema m={m} />
              ) : m.tipo === 'pedido' ? (
                <TarjetaPedido m={m} mio={m.autorId === cuenta.id} />
              ) : (
                <Burbuja
                  m={m}
                  mio={m.autorId === cuenta.id}
                  alMantener={m.autorId !== cuenta.id && !m.pendiente && puedeModerar ? () => setReportando({ tipo: 'mensaje', id: m.id, queSe: 'este mensaje' }) : undefined}
                />
              )}
            </React.Fragment>
          );
        })}
      </ScrollView>

      {yoBloquee ? (
        <View style={{ gap: 10, padding: 16, paddingBottom: 16 + insets.bottom, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line }}>
          <T size={14} lh={1.45} color={C.muted}>
            Bloqueaste a {nombre}. No pueden escribirse ni hacerse pedidos nuevos mientras esté bloqueado{modo === 'cliente' ? ', y dejaste de seguir este negocio' : ''}.
          </T>
          {error ? (
            <T size={13} weight={600} color={C.red} accessibilityRole="alert">
              {error}
            </T>
          ) : null}
          <Btn label={ocupado ? 'Desbloqueando…' : 'Desbloquear'} variant="outline" h={46} r={12} size={15} disabled={ocupado} onPress={() => void desbloquearAhora()} />
        </View>
      ) : sinCuentaNegocio || esMiNegocio ? (
        <View style={{ gap: 10, padding: 16, paddingBottom: 16 + insets.bottom, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line }}>
          <Btn label="Cómo llegar" h={46} r={12} size={15} onPress={() => abrirMapas(negocio)} />
        </View>
      ) : (
        <View
          style={{
            gap: 10,
            paddingTop: 12,
            paddingHorizontal: 16,
            paddingBottom: 12 + insets.bottom,
            backgroundColor: C.white,
            borderTopWidth: 1,
            borderTopColor: C.line,
          }}
        >
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {rapidas.map((r) => (
              <Chip key={r} label={r} h={36} px={12} size={13} border={C.input} onPress={() => enviar(r)} />
            ))}
            {modo === 'comerciante' ? <Chip label="Llega a las…" h={36} px={12} size={13} border={C.input} onPress={() => setEligiendoHora(true)} /> : null}
          </View>
          {error ? (
            <T size={13} weight={600} color={C.red} accessibilityRole="alert">
              {error}
            </T>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
            <View style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: C.bg, paddingHorizontal: 16, justifyContent: 'center' }}>
              <TextInput
                value={texto}
                onChangeText={(t) => {
                  setTexto(t);
                  setError('');
                }}
                placeholder="Escribe un mensaje"
                placeholderTextColor={C.placeholder}
                accessibilityLabel="Mensaje"
                returnKeyType="send"
                maxLength={2000}
                onSubmitEditing={() => enviar(texto)}
                style={{ fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
              />
            </View>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Enviar"
              onPress={() => enviar(texto)}
              style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="send" size={20} color={C.white} />
            </Pressable>
          </View>
        </View>
      )}
      <Hoja visible={menu} titulo={nombre} onCerrar={() => setMenu(false)} alto="70%">
        <View style={{ paddingHorizontal: 20, paddingBottom: 8, gap: 2 }}>
          {conv && otroId ? (
            <FilaMenu
              icono="flag"
              texto={modo === 'cliente' ? 'Reportar al dueño' : 'Reportar a este cliente'}
              ayuda="Por cómo escribió o te trató"
              onPress={() => {
                setMenu(false);
                setReportando({ tipo: 'usuario', id: otroId, queSe: modo === 'cliente' ? 'esta persona' : 'este cliente' });
              }}
            />
          ) : null}
          {modo === 'cliente' ? (
            <FilaMenu
              icono="store"
              texto="Reportar el negocio"
              ayuda="Si la tienda o sus productos son falsos o engañan"
              onPress={() => {
                setMenu(false);
                setReportando({ tipo: 'negocio', id: negocio.id, queSe: 'este negocio' });
              }}
            />
          ) : null}
          <FilaMenu
            icono="ban"
            peligro={!yoBloquee}
            texto={yoBloquee ? 'Desbloquear' : modo === 'cliente' ? 'Bloquear este negocio' : 'Bloquear a este cliente'}
            ayuda={yoBloquee ? undefined : 'Dejan de poder escribirse. No se le avisa'}
            onPress={() => {
              setMenu(false);
              if (yoBloquee) void desbloquearAhora();
              else setConfirmandoBloqueo(true);
            }}
          />
          <T size={12} lh={1.4} color={C.muted} style={{ marginTop: 6 }}>
            Para reportar un mensaje en concreto, mantén el dedo sobre él.
          </T>
        </View>
      </Hoja>
      <ReportarHoja objeto={reportando} onCerrar={() => setReportando(null)} />
      <Confirmar
        visible={confirmandoBloqueo}
        titulo={`¿Bloquear a ${nombre}?`}
        texto={
          modo === 'cliente'
            ? 'Ya no podrán escribirse ni hacerse pedidos nuevos, y dejarás de seguir este negocio. No se le avisa. Cuando quieras lo desbloqueas desde tu perfil.'
            : 'Este cliente ya no podrá escribirte ni hacerte pedidos nuevos. No se le avisa. Los pedidos que ya están en marcha se pueden terminar. Cuando quieras lo desbloqueas desde tu perfil.'
        }
        confirmar="Bloquear"
        peligro
        onConfirmar={() => void bloquearAhora()}
        onCancelar={() => setConfirmandoBloqueo(false)}
      />
      {modo === 'comerciante' ? (
        <SelectorHora
          visible={eligiendoHora}
          titulo="¿A qué hora llega?"
          valor="12:00"
          onCerrar={() => setEligiendoHora(false)}
          onElegir={(h) => {
            setEligiendoHora(false);
            void enviar(`Llega hoy a las ${horaBonita(h)}.`);
          }}
        />
      ) : null}
    </Screen>
  );
}
