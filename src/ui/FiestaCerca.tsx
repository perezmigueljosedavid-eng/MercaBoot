import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { enTemporada, textoFaltan, textoFecha } from '../data/festividades';
import { Icon } from './Icon';
import { T } from './T';
import { C } from './theme';

/** Para el cliente: la fiesta que se acerca, con un toque para pedirle al asistente ideas de qué cocinar. */
export function FiestaCerca() {
  const [o] = useState(() => enTemporada(new Date())[0] ?? null);
  if (!o) return null;
  return (
    <Pressable
      accessibilityRole="button"
      onPress={() => router.push({ pathname: '/ideas-ia', params: { antojo: `Ideas para ${o.f.corto}`, t: String(Date.now()) } })}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 16, backgroundColor: C.amberTint, borderWidth: 1, borderColor: '#F0D5A8' }}
    >
      <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="gift" size={22} color={C.amberText} />
      </View>
      <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
        <T size={14} weight={700} color={C.amberDeep}>
          {o.f.nombre}: {textoFaltan(o)}
        </T>
        <T size={12} lh={1.35} color={C.amberText}>
          {textoFecha(o)}. Toca para ver ideas de qué cocinar y en qué tienda conseguirlo.
        </T>
      </View>
      <Icon name="next" size={18} color={C.amberText} />
    </Pressable>
  );
}
