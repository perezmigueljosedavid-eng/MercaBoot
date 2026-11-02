import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useStore } from '../store';
import { BackBtn, Btn, Field, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

export default function IniciarSesion() {
  const { entrar, s } = useStore();
  const [correo, setCorreo] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function enviar() {
    if (!correo.trim() || !password) {
      setError('Escribe tu correo y tu contraseña.');
      return;
    }
    setCargando(true);
    const err = await entrar(correo, password);
    setCargando(false);
    if (err) {
      setError(err);
      return;
    }
    const c = s.cuentas.find((x) => x.correo === correo.trim().toLowerCase());
    router.replace(c?.rol === 'comerciante' ? '/comerciante' : '/cliente');
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
        <BackBtn />
      </View>
      <View style={{ flex: 1, gap: 22, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 16 }}>
        <View style={{ gap: 8 }}>
          <T size={28} weight={800} ls={-0.02}>
            Bienvenido de nuevo
          </T>
          <T size={15} color={C.muted}>
            Entra con tu correo y contraseña.
          </T>
        </View>
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
          label="Contraseña"
          placeholder="••••••••"
          secureTextEntry
          autoCapitalize="none"
          value={password}
          onChangeText={(t) => {
            setPassword(t);
            setError('');
          }}
          onSubmitEditing={enviar}
        />
        <Pressable onPress={() => router.push('/recuperar')} accessibilityRole="link" style={{ alignSelf: 'flex-end' }} hitSlop={10}>
          <T size={14} weight={600} color={C.green}>
            ¿Olvidaste tu contraseña?
          </T>
        </Pressable>
        {error ? (
          <T size={14} weight={600} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        <Btn label={cargando ? 'Entrando…' : 'Entrar'} onPress={cargando ? undefined : enviar} />
        <View style={{ flex: 1 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 4 }}>
          <T size={14} color={C.muted}>
            ¿No tienes cuenta?
          </T>
          <Pressable onPress={() => router.replace('/tipo-cuenta')} accessibilityRole="link" hitSlop={10}>
            <T size={14} weight={700} color={C.green}>
              Regístrate
            </T>
          </Pressable>
        </View>
      </View>
    </Screen>
  );
}
