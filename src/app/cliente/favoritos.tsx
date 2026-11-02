import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useNegociosOrdenados } from '../../lib/usarDatos';
import { useStore } from '../../store';
import { Card, OpenDot, Screen } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

export default function Favoritos() {
  const { favoritos } = useStore();
  const lista = useNegociosOrdenados().filter((d) => favoritos.includes(d.n.id));

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 }}>
      <View style={{ gap: 4 }}>
        <T size={24} weight={800} ls={-0.02}>
          Mis negocios frecuentes
        </T>
        <T size={14} color={C.muted}>
          Tus negocios de siempre, a un toque.
        </T>
      </View>
      {lista.length === 0 ? (
        <Card style={{ padding: 20, gap: 6 }}>
          <T size={16} weight={700}>
            Aún no tienes negocios frecuentes
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            Abre un negocio y toca “Cliente frecuente” para verlo aquí.
          </T>
        </Card>
      ) : (
        lista.map((d) => {
          const n = d.n;
          const sub = [n.giro, n.duenoId ? `${d.disponibles} ${d.disponibles === 1 ? 'disponible' : 'disponibles'}` : null].filter(Boolean).join(' · ');
          return (
            <Pressable key={n.id} accessibilityRole="button" onPress={() => router.push(`/negocio/${n.id}`)}>
              <Card style={{ gap: 10, padding: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                  <Logo uri={n.logoUri} nombre={n.nombre} size={52} r={14} />
                  <View style={{ flex: 1, gap: 2 }}>
                    <T size={16} weight={700}>
                      {n.nombre}
                    </T>
                    <T size={13} color={C.muted}>
                      {sub}
                    </T>
                  </View>
                  {n.duenoId ? <OpenDot abierto={n.abierto} /> : null}
                </View>
              </Card>
            </Pressable>
          );
        })
      )}
    </Screen>
  );
}
