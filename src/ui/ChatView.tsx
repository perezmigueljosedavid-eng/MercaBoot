import React, { useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RESPUESTAS_RAPIDAS_CLIENTE, RESPUESTAS_RAPIDAS_COMERCIANTE } from '../data/contenido';
import type { Mensaje } from '../data/tipos';
import { abrirMapas } from '../lib/geo';
import { sinLeer, useStore } from '../store';
import { fechaCorta } from './bits';
import { Icon } from './Icon';
import { BackBtn, Btn, Chip, Screen } from './kit';
import { Logo } from './Logo';
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

function Burbuja({ m, mio }: { m: Mensaje; mio: boolean }) {
  return (
    <View
      accessibilityLabel={`${mio ? 'Tú' : 'Ellos'}: ${m.texto}`}
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
    </View>
  );
}

/**
 * Conversación entre cliente y negocio, en vivo: lo que escribe uno aparece al instante en el teléfono del otro.
 * modo "cliente": id = id del negocio · modo "comerciante": id = id de la conversación.
 */
export function ChatView({ modo, id, showBack }: { modo: 'cliente' | 'comerciante'; id: string; showBack: boolean }) {
  const { s, cuenta, negocio: miNegocio, mensajesDe, observarChat, enviarComoCliente, enviarComoNegocio, marcarLeida } = useStore();
  const insets = useSafeAreaInsets();
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');
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
  const rapidas = modo === 'cliente' ? RESPUESTAS_RAPIDAS_CLIENTE : RESPUESTAS_RAPIDAS_COMERCIANTE;
  const sinCuentaNegocio = modo === 'cliente' && !negocio.duenoId;
  const esMiNegocio = modo === 'cliente' && negocio.duenoId === cuenta.id;

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
            </T>
          ) : null}
        </View>
      </View>

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
              <Burbuja m={m} mio={m.autorId === cuenta.id} />
            </React.Fragment>
          );
        })}
      </ScrollView>

      {sinCuentaNegocio || esMiNegocio ? (
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
    </Screen>
  );
}
