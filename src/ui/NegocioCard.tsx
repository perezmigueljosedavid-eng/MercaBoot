import React from 'react';
import { View } from 'react-native';
import { router } from 'expo-router';
import type { NegocioConDatos } from '../lib/usarDatos';
import { Logo } from './Logo';
import { Btn, Card, OpenDot, Tag } from './kit';
import { T } from './T';
import { C } from './theme';

/** Tarjeta de un negocio con sus existencias y el botón para ver sus productos. */
export function NegocioCard({ d, frecuente = false }: { d: NegocioConDatos; frecuente?: boolean }) {
  const { n } = d;
  const reclamado = !!n.duenoId;
  const subtitulo = [n.giro, n.direccion].filter(Boolean).join(' · ');

  return (
    <Card style={{ gap: 12, padding: 14 }}>
      <View style={{ flexDirection: 'row', gap: 12 }}>
        <Logo uri={n.logoUri} nombre={n.nombre} size={72} r={14} />
        <View style={{ flex: 1, gap: 4, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
            <T size={16} weight={700} numberOfLines={1} style={{ flexShrink: 1 }}>
              {n.nombre}
            </T>
            {reclamado ? <OpenDot abierto={n.abierto} /> : null}
          </View>
          <T size={13} color={C.muted} numberOfLines={2}>
            {subtitulo}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            {reclamado ? (
              <Tag bg={d.disponibles ? C.greenTint : C.grey} fg={d.disponibles ? C.greenDark : C.greyText}>
                {d.disponibles ? `${d.disponibles} ${d.disponibles === 1 ? 'disponible' : 'disponibles'}` : 'Sin productos publicados'}
              </Tag>
            ) : (
              <Tag bg={C.grey} fg={C.greyText}>
                Aún sin productos publicados
              </Tag>
            )}
            {n.aDomicilio ? (
              <Tag bg={C.greenTint} fg={C.greenDark}>
                A domicilio
              </Tag>
            ) : null}
            {frecuente ? (
              <Tag bg={C.amberTint} fg={C.amberText}>
                Cliente frecuente
              </Tag>
            ) : null}
          </View>
        </View>
      </View>
      <Btn
        label={reclamado ? 'Ver productos' : 'Ver negocio'}
        variant="outline"
        h={44}
        r={12}
        size={14}
        weight={600}
        onPress={() => router.push(`/negocio/${n.id}`)}
      />
    </Card>
  );
}
