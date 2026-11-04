import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { correoValido, useStore } from '../store';
import { BackBtn, Btn, Field, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/** Manda al correo un enlace para escribir una contraseña nueva. */
export default function Recuperar() {
  const { recuperarPassword } = useStore();
  const [correo, setCorreo] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!correoValido(correo)) return setError('Escribe el correo con el que creaste tu cuenta.');
    setCargando(true);
    const err = await recuperarPassword(correo);
    setCargando(false);
    if (err) return setError(err);
    setListo(true);
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
        <BackBtn />
      </View>
      <View style={{ flex: 1, gap: 20, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ gap: 8 }}>
          <T size={28} weight={800} ls={-0.02}>
            Recupera tu contraseña
          </T>
          <T size={15} lh={1.45} color={C.muted}>
            Escribe el correo con el que creaste tu cuenta. Te enviaremos un enlace para elegir una contraseña nueva.
          </T>
        </View>
        {listo ? (
          <>
            <View style={{ padding: 16, borderRadius: 14, backgroundColor: C.greenTint, gap: 4 }}>
              <T size={15} weight={700} color={C.greenDark}>
                Revisa tu correo
              </T>
              <T size={14} lh={1.4} color={C.greenDark}>
                Si ese correo tiene una cuenta, te enviamos un enlace. Ábrelo desde este teléfono y escribe tu contraseña nueva. Si no llega en unos minutos, revisa la carpeta de spam.
              </T>
            </View>
            <Btn label="Volver a iniciar sesión" onPress={() => router.replace('/iniciar-sesion')} />
          </>
        ) : (
          <>
            <Field
              label="Correo electrónico"
              placeholder="tucorreo@ejemplo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={correo}
              onChangeText={(t) => {
                setCorreo(t);
                setError('');
              }}
              onSubmitEditing={enviar}
            />
            {error ? (
              <T size={14} weight={600} color={C.red} accessibilityRole="alert">
                {error}
              </T>
            ) : null}
            <Btn label={cargando ? 'Enviando…' : 'Enviarme el enlace'} onPress={cargando ? undefined : enviar} />
          </>
        )}
      </View>
    </Screen>
  );
}
