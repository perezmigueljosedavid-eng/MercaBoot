import React, { useState } from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store';
import { BackBtn, Btn, Field, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/** Cambiar la contraseña comprobando el correo y el teléfono con los que se creó la cuenta. */
export default function Recuperar() {
  const { recuperarPassword } = useStore();
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');
  const [nueva, setNueva] = useState('');
  const [error, setError] = useState('');
  const [listo, setListo] = useState(false);
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!correo.trim() || !telefono.trim() || !nueva) return setError('Llena todos los campos.');
    setCargando(true);
    const err = await recuperarPassword(correo, telefono, nueva);
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
            Escribe el correo y el teléfono con los que creaste tu cuenta, y elige una contraseña nueva.
          </T>
        </View>
        {listo ? (
          <>
            <View style={{ padding: 16, borderRadius: 14, backgroundColor: C.greenTint, gap: 4 }}>
              <T size={15} weight={700} color={C.greenDark}>
                Listo, cambiamos tu contraseña
              </T>
              <T size={14} lh={1.4} color={C.greenDark}>
                Ya puedes entrar con la contraseña nueva.
              </T>
            </View>
            <Btn label="Ir a iniciar sesión" onPress={() => router.replace('/iniciar-sesion')} />
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
            />
            <Field
              label="Teléfono"
              placeholder="10 dígitos"
              keyboardType="phone-pad"
              value={telefono}
              onChangeText={(t) => {
                setTelefono(t);
                setError('');
              }}
            />
            <Field
              label="Contraseña nueva"
              placeholder="Mínimo 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
              value={nueva}
              onChangeText={(t) => {
                setNueva(t);
                setError('');
              }}
              onSubmitEditing={enviar}
            />
            {error ? (
              <T size={14} weight={600} color={C.red} accessibilityRole="alert">
                {error}
              </T>
            ) : null}
            <Btn label={cargando ? 'Cambiando…' : 'Cambiar contraseña'} onPress={cargando ? undefined : enviar} />
          </>
        )}
      </View>
    </Screen>
  );
}
