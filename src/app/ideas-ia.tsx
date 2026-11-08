import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable, ScrollView, ScrollViewInstance, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { bienvenida, responder } from '../ia/motor';
import { borrarHistorial, guardarHistorial, Historial, historialDe, historialVacio } from '../lib/historialIA';
import { useCatalogo } from '../lib/usarDatos';
import { useStore } from '../store';
import { Bloques } from '../ui/Bloques';
import { Icon } from '../ui/Icon';
import { BackBtn, Chip, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C, FONT } from '../ui/theme';

let numero = 0;
const nuevoId = () => `t${Date.now().toString(36)}${numero++}`;

export default function IdeasIA() {
  const params = useLocalSearchParams<{ antojo?: string; t?: string }>();
  const { cuenta } = useStore();
  const cat = useCatalogo();
  const insets = useSafeAreaInsets();
  const scroll = useRef<ScrollViewInstance>(null);
  const [texto, setTexto] = useState('');
  const [pensando, setPensando] = useState(false);
  const cuentaId = cuenta?.id ?? 'anonimo';

  const [h, setH] = useState<Historial>(() => {
    const previo = historialDe(cuentaId);
    if (previo) return previo;
    const b = bienvenida(cat, { nombre: cuenta?.nombre });
    return { turnos: [{ id: nuevoId(), quien: 'ia', bloques: b.bloques }], memoria: b.memoria, sugerencias: b.sugerencias };
  });

  const hRef = useRef(h);
  const catRef = useRef(cat);
  useEffect(() => {
    catRef.current = cat;
  }, [cat]);
  const vivo = useRef(true);
  useEffect(() => {
    vivo.current = true;
    return () => {
      vivo.current = false;
    };
  }, []);

  const poner = useCallback(
    (sig: Historial) => {
      hRef.current = sig;
      guardarHistorial(cuentaId, sig);
      setH(sig);
    },
    [cuentaId],
  );

  const enviar = useCallback(
    (mensaje: string) => {
      const limpio = mensaje.trim();
      if (!limpio) return;
      const antes = hRef.current;
      poner({ ...antes, turnos: [...antes.turnos, { id: nuevoId(), quien: 'yo', texto: limpio }], sugerencias: [] });
      setTexto('');
      setPensando(true);
      setTimeout(() => {
        const act = hRef.current;
        const r = responder(limpio, catRef.current, act.memoria, { nombre: cuenta?.nombre });
        if (vivo.current) setPensando(false);
        poner({
          ...act,
          turnos: [...act.turnos, { id: nuevoId(), quien: 'ia', bloques: r.bloques }],
          memoria: r.memoria,
          sugerencias: r.sugerencias,
        });
      }, 450);
    },
    [poner, cuenta?.nombre],
  );

  // El antojo escrito en el inicio se manda una sola vez.
  useEffect(() => {
    const a = (params.antojo ?? '').trim();
    const clave = `${a}|${params.t ?? ''}`;
    if (!a || hRef.current.ultimoEnvio === clave) return;
    poner({ ...hRef.current, ultimoEnvio: clave });
    enviar(a);
  }, [params.antojo, params.t, enviar, poner]);

  function reiniciar() {
    borrarHistorial(cuentaId);
    const b = bienvenida(catRef.current, { nombre: cuenta?.nombre });
    poner({ ...historialVacio(), turnos: [{ id: nuevoId(), quien: 'ia', bloques: b.bloques }], memoria: b.memoria, sugerencias: b.sugerencias, ultimoEnvio: hRef.current.ultimoEnvio });
  }

  const hayProductos = cat.items.length > 0;
  // Si lo último que se dijo ya trae el menú de ideas, no se repiten abajo
  const ultimo = h.turnos[h.turnos.length - 1];
  const ideasALaVista = ultimo?.quien === 'ia' && ultimo.bloques.some((b) => b.t === 'ideas');

  return (
    <Screen scroll={false}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 8,
          paddingTop: 8,
          paddingBottom: 10,
          paddingLeft: 8,
          paddingRight: 16,
          backgroundColor: C.bg,
          borderBottomWidth: 1,
          borderBottomColor: C.line,
        }}
      >
        <BackBtn />
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="sparkles" size={18} color={C.white} />
        </View>
        <View style={{ flex: 1 }}>
          <T size={17} weight={800} ls={-0.01}>
            Ideas para cocinar
          </T>
          <T size={11} color={C.muted}>
            Con lo que hay hoy, y qué tienda conviene
          </T>
        </View>
        <Pressable accessibilityRole="button" accessibilityLabel="Empezar una charla nueva" hitSlop={8} onPress={reiniciar}>
          <T size={13} weight={700} color={C.green}>
            Nueva
          </T>
        </Pressable>
      </View>

      <ScrollView
        ref={scroll}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 12, paddingVertical: 16, paddingHorizontal: 16 }}
        keyboardShouldPersistTaps="handled"
        onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: true })}
      >
        {h.turnos.map((t) =>
          t.quien === 'yo' ? (
            <View
              key={t.id}
              style={{
                alignSelf: 'flex-end',
                maxWidth: '82%',
                paddingVertical: 10,
                paddingHorizontal: 14,
                borderTopLeftRadius: 18,
                borderTopRightRadius: 18,
                borderBottomLeftRadius: 18,
                borderBottomRightRadius: 4,
                backgroundColor: C.green,
              }}
            >
              <T size={15} lh={1.4} color={C.white}>
                {t.texto}
              </T>
            </View>
          ) : (
            <Bloques key={t.id} bloques={t.bloques} hayProductos={hayProductos} onElegir={enviar} />
          ),
        )}
        {pensando ? (
          <View style={{ alignSelf: 'flex-start', paddingVertical: 10, paddingHorizontal: 16, borderRadius: 18, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
            <T size={15} color={C.muted}>
              Pensando…
            </T>
          </View>
        ) : null}
      </ScrollView>

      <View style={{ gap: 10, paddingTop: 10, paddingHorizontal: 16, paddingBottom: 12 + insets.bottom, backgroundColor: C.white, borderTopWidth: 1, borderTopColor: C.line }}>
        {h.sugerencias.length && !pensando && !ideasALaVista ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" contentContainerStyle={{ gap: 8 }}>
            {h.sugerencias.map((s) => (
              <Chip key={s} label={s} h={36} px={14} size={13} border={C.input} onPress={() => enviar(s)} />
            ))}
          </ScrollView>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <View style={{ flex: 1, height: 48, borderRadius: 24, backgroundColor: C.bg, paddingHorizontal: 16, justifyContent: 'center' }}>
            <TextInput
              value={texto}
              onChangeText={setTexto}
              placeholder="Cuéntame qué se te antoja…"
              placeholderTextColor={C.placeholder}
              accessibilityLabel="Escribe tu antojo"
              returnKeyType="send"
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
    </Screen>
  );
}
