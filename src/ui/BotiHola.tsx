import React, { useEffect, useState } from 'react';
import { Animated, View } from 'react-native';
import { useBoti } from '../lib/boti';
import { Boti, type DisparoEmocion } from './Boti';
import { T } from './T';
import { C } from './theme';

/**
 * Boti diciendo solo «Hi!» en la pantalla de crear cuenta: aparece con un brinquito, saluda con su sonido
 * y su globito; si lo tocan, vuelve a decirlo. Respeta los ajustes de Boti (si está apagado, se queda quieto y callado).
 */
export function BotiHola() {
  const { sonar } = useBoti();
  const [turno, setTurno] = useState(0);
  const [emocion, setEmocion] = useState<DisparoEmocion | null>(null);
  // El globo «se infla» cada vez que Boti dice algo.
  const pop = useState(() => new Animated.Value(0))[0];

  const saluda = (n: number) => {
    setTurno(n);
    setEmocion({ tipo: n % 2 === 0 ? 'alegre' : 'brinco', id: n + 1 });
    sonar('hola');
    pop.setValue(0);
    Animated.spring(pop, { toValue: 1, friction: 5, tension: 120, useNativeDriver: true }).start();
  };

  // Al abrir la pantalla saluda solito, un momento después de que se vea todo.
  useEffect(() => {
    const espera = setTimeout(() => saluda(0), 350);
    return () => clearTimeout(espera);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const escala = pop.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] });

  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <Boti pose="saludo" size={96} emocion={emocion} onPress={() => saluda(turno + 1)} />
      <Animated.View style={{ flex: 1, opacity: pop, transform: [{ scale: escala }], alignItems: 'flex-start' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          {/* piquito del globo, apuntando a Boti */}
          <View
            style={{
              width: 0,
              height: 0,
              borderTopWidth: 8,
              borderBottomWidth: 8,
              borderRightWidth: 10,
              borderTopColor: 'transparent',
              borderBottomColor: 'transparent',
              borderRightColor: C.greenTint,
            }}
          />
          <View style={{ flexShrink: 1, backgroundColor: C.greenTint, borderRadius: 18, borderTopLeftRadius: 6, paddingVertical: 8, paddingHorizontal: 18, gap: 0 }}>
            <T size={26} weight={800} ls={-0.02} color={C.greenDark}>
              Hi!
            </T>
          </View>
        </View>
      </Animated.View>
    </View>
  );
}
