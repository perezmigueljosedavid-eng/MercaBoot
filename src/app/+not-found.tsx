import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import { Btn, Screen } from '../ui/kit';
import { Icon } from '../ui/Icon';
import { T } from '../ui/T';
import { C } from '../ui/theme';

/**
 * Pantalla para cuando la dirección no existe (por ejemplo, un enlace viejo o mal escrito en la versión web).
 * En lugar del mensaje en inglés de fábrica, explica qué pasó y deja volver al inicio.
 */
export default function NoEncontrada() {
  return (
    <Screen scroll={false} bottomInset contentStyle={{ paddingHorizontal: 24, paddingTop: 40, paddingBottom: 24 }}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <View style={{ width: 84, height: 84, borderRadius: 24, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="search" size={42} color={C.green} stroke={1.8} />
        </View>
        <T size={24} weight={800} ls={-0.02} style={{ textAlign: 'center' }}>
          No encontramos esa página
        </T>
        <T size={15} lh={1.45} color={C.muted} style={{ maxWidth: 300, textAlign: 'center' }}>
          Puede que el enlace esté viejo o mal escrito. Vuelve al inicio de Mercaboot para seguir.
        </T>
      </View>
      <Btn label="Ir al inicio" onPress={() => router.replace('/')} />
    </Screen>
  );
}
