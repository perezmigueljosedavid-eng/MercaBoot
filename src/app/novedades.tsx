import React, { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ORDEN_AVISOS, TIPOS_AVISO } from '../data/contenido';
import type { TipoAviso } from '../data/tipos';
import { avisosVigentes, useStore } from '../store';
import { AvisoFila } from '../ui/bits';
import { Icon } from '../ui/Icon';
import { BackBtn, Chip, Group, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C } from '../ui/theme';

export default function Novedades() {
  const { s } = useStore();
  const [tipo, setTipo] = useState<TipoAviso | 'todos'>('todos');
  const vigentes = useMemo(() => avisosVigentes(s.avisos), [s.avisos]);
  const presentes = ORDEN_AVISOS.filter((t) => vigentes.some((a) => a.tipo === t));
  const lista = vigentes.filter((a) => tipo === 'todos' || a.tipo === tipo);

  return (
    <Screen bottomInset contentStyle={{ gap: 16, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, paddingLeft: 8, paddingRight: 20, paddingTop: 4 }}>
        <BackBtn />
        <T size={20} weight={800} ls={-0.02}>
          Avisos y novedades
        </T>
      </View>
      <View style={{ paddingHorizontal: 20, gap: 16 }}>
        {presentes.length > 1 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            <Chip label="Todos" h={38} px={14} size={13} active={tipo === 'todos'} onPress={() => setTipo('todos')} />
            {presentes.map((t) => (
              <Chip key={t} label={TIPOS_AVISO[t].badge} h={38} px={14} size={13} active={tipo === t} onPress={() => setTipo(t)} />
            ))}
          </View>
        ) : null}

        {lista.length ? (
          <Group>
            {lista.map((a) => {
              const n = s.negocios.find((x) => x.id === a.negocioId);
              return (
                <Pressable key={a.id} accessibilityRole="link" onPress={() => router.push(`/negocio/${a.negocioId}`)}>
                  <AvisoFila a={{ ...a, negocio: n?.nombre ?? 'Negocio' }} />
                </Pressable>
              );
            })}
          </Group>
        ) : (
          <View style={{ alignItems: 'center', gap: 10, paddingVertical: 40, paddingHorizontal: 12 }}>
            <Icon name="gift" size={34} color={C.dash} />
            <T size={15} weight={700}>
              Aún no hay avisos
            </T>
            <T size={14} lh={1.45} color={C.muted} style={{ textAlign: 'center' }}>
              Aquí verás las promociones, los regalos de temporada (como los de diciembre) y lo que cada tienda tiene hoy.
            </T>
          </View>
        )}
      </View>
    </Screen>
  );
}
