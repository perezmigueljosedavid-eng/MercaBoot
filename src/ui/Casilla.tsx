import React from 'react';
import { View } from 'react-native';
import { Icon } from './Icon';
import { C } from './theme';

/** Casilla para marcar (✓). `apagada` = marcada pero que no se puede cambiar (se ve en gris). */
export function Casilla({ marcada, apagada }: { marcada: boolean; apagada?: boolean }) {
  return (
    <View
      style={{
        width: 24,
        height: 24,
        borderRadius: 7,
        borderWidth: marcada ? 0 : 1.5,
        borderColor: C.input,
        backgroundColor: marcada ? (apagada ? C.off : C.green) : C.white,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {marcada ? <Icon name="check" size={15} color={C.white} stroke={3} /> : null}
    </View>
  );
}
