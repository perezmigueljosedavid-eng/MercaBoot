import React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { COMUNIDAD } from '../data/contenido';
import { useStore } from '../store';
import { Boti } from '../ui/Boti';
import { Btn, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

export default function Bienvenida() {
  const { cuenta } = useStore();
  if (cuenta) return <Redirect href={cuenta.rol === 'cliente' ? '/cliente' : '/comerciante'} />;

  return (
    <Screen light bg={C.green} scroll={false} bottomInset contentStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <T size={40} weight={800} ls={-0.03} color={C.white}>
          Mercaboot
        </T>
        <View style={{ alignItems: 'center' }}>
          <View style={{ backgroundColor: C.white, borderRadius: 18, paddingVertical: 12, paddingHorizontal: 16, maxWidth: 290 }}>
            <T size={15} lh={1.4} weight={600} style={{ textAlign: 'center' }}>
              ¡Hola! Soy Boti. Te enseño qué hay hoy en los negocios de tu barrio, antes de salir de casa.
            </T>
          </View>
          {/* piquito del globo de diálogo */}
          <View
            style={{
              width: 0,
              height: 0,
              borderLeftWidth: 10,
              borderRightWidth: 10,
              borderTopWidth: 11,
              borderLeftColor: 'transparent',
              borderRightColor: 'transparent',
              borderTopColor: C.white,
            }}
          />
          <Boti pose="saludo" size={190} claro />
        </View>
        <T size={13} lh={1.4} color={C.white} style={{ maxWidth: 260, textAlign: 'center', opacity: 0.85 }}>
          {COMUNIDAD}
        </T>
      </View>
      <View style={{ gap: 12 }}>
        <Btn label="Crear cuenta" variant="amber" onPress={() => router.push('/tipo-cuenta')} />
        <Btn label="Ya tengo cuenta" variant="outlineWhite" onPress={() => router.push('/iniciar-sesion')} />
      </View>
    </Screen>
  );
}
