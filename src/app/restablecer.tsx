import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import * as Linking from 'expo-linking';
import { router } from 'expo-router';
import { supabase } from '../lib/supabase';
import { useStore } from '../store';
import { BackBtn, Btn, Field, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/** Se abre con el enlace del correo de «Olvidé mi contraseña»: lee el permiso del enlace y deja escribir la contraseña nueva. */
export default function Restablecer() {
  const { restablecerPassword } = useStore();
  const url = Linking.useURL();
  const [estado, setEstado] = useState<'revisando' | 'listo' | 'invalido'>('revisando');
  const [nueva, setNueva] = useState('');
  const [repetida, setRepetida] = useState('');
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    if (!url) return;
    let vivo = true;
    (async () => {
      const resto = url.includes('#') ? url.slice(url.indexOf('#') + 1) : url.includes('?') ? url.slice(url.indexOf('?') + 1) : '';
      const q = new URLSearchParams(resto);
      const acceso = q.get('access_token');
      const refresco = q.get('refresh_token');
      if (!acceso || !refresco || q.get('error')) {
        if (vivo) setEstado('invalido');
        return;
      }
      const { error: e } = await supabase.auth.setSession({ access_token: acceso, refresh_token: refresco });
      if (vivo) setEstado(e ? 'invalido' : 'listo');
    })();
    return () => {
      vivo = false;
    };
  }, [url]);

  // Si el enlace no trae nada (o ya no sirve), no se queda esperando para siempre.
  useEffect(() => {
    const t = setTimeout(() => setEstado((e) => (e === 'revisando' ? 'invalido' : e)), 8000);
    return () => clearTimeout(t);
  }, []);

  async function guardar() {
    if (nueva !== repetida) return setError('Las contraseñas no coinciden.');
    setCargando(true);
    const err = await restablecerPassword(nueva);
    setCargando(false);
    if (err) return setError(err);
    setGuardado(true);
  }

  return (
    <Screen bottomInset contentStyle={{ paddingBottom: 24 }}>
      <View style={{ paddingTop: 8, paddingHorizontal: 12 }}>
        <BackBtn />
      </View>
      <View style={{ flex: 1, gap: 20, paddingTop: 12, paddingHorizontal: 24, paddingBottom: 16 }}>
        <T size={28} weight={800} ls={-0.02}>
          Contraseña nueva
        </T>
        {estado === 'revisando' ? (
          <T size={15} color={C.muted}>
            Revisando tu enlace…
          </T>
        ) : null}
        {estado === 'invalido' ? (
          <>
            <View style={{ padding: 16, borderRadius: 14, backgroundColor: C.amberTint, gap: 4 }}>
              <T size={15} weight={700} color={C.amberDeep}>
                Este enlace ya no sirve
              </T>
              <T size={14} lh={1.4} color={C.amberDeep}>
                Los enlaces del correo duran poco y solo se usan una vez. Pide uno nuevo.
              </T>
            </View>
            <Btn label="Pedir otro enlace" onPress={() => router.replace('/recuperar')} />
          </>
        ) : null}
        {estado === 'listo' && !guardado ? (
          <>
            <Field label="Contraseña nueva" placeholder="Mínimo 8 caracteres" secureTextEntry autoCapitalize="none" value={nueva} onChangeText={(t) => { setNueva(t); setError(''); }} />
            <Field label="Repite la contraseña" secureTextEntry autoCapitalize="none" value={repetida} onChangeText={(t) => { setRepetida(t); setError(''); }} onSubmitEditing={guardar} />
            {error ? (
              <T size={14} weight={600} color={C.red} accessibilityRole="alert">
                {error}
              </T>
            ) : null}
            <Btn label={cargando ? 'Guardando…' : 'Guardar contraseña'} onPress={cargando ? undefined : guardar} />
          </>
        ) : null}
        {guardado ? (
          <>
            <View style={{ padding: 16, borderRadius: 14, backgroundColor: C.greenTint, gap: 4 }}>
              <T size={15} weight={700} color={C.greenDark}>
                Listo, cambiamos tu contraseña
              </T>
              <T size={14} lh={1.4} color={C.greenDark}>
                Ya entraste con tu cuenta.
              </T>
            </View>
            <Btn label="Continuar" onPress={() => router.replace('/')} />
          </>
        ) : null}
      </View>
    </Screen>
  );
}
