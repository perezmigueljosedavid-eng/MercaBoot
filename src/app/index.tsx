import React from 'react';
import { View } from 'react-native';
import { Redirect, router } from 'expo-router';
import { COMUNIDAD } from '../data/contenido';
import { useStore } from '../store';
import { Btn, Screen } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { T } from '../ui/T';
import { C } from '../ui/theme';

export default function Bienvenida() {
  const { cuenta } = useStore();
  if (cuenta) return <Redirect href={cuenta.rol === 'cliente' ? '/cliente' : '/comerciante'} />;

  return (
    <Screen light bg={C.green} scroll={false} bottomInset contentStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <View
          style={{
            width: 96,
            height: 96,
            borderRadius: 28,
            backgroundColor: C.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="bagCheck" size={52} color={C.green} stroke={1.8} />
        </View>
        <T size={40} weight={800} ls={-0.03} color={C.white}>
          Mercaboot
        </T>
        <T size={17} lh={1.45} color={C.white} style={{ maxWidth: 280, textAlign: 'center' }}>
          Lo que hay hoy en los negocios de tu barrio, antes de salir de casa.
        </T>
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
