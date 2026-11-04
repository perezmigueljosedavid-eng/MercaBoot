import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { abrirMapas, etiquetaDistancia } from '../lib/geo';
import type { NegocioConDatos } from '../lib/usarDatos';
import { useStore } from '../store';
import { Logo } from './Logo';
import { Btn, Card, OpenDot, Tag } from './kit';
import { T } from './T';
import { C } from './theme';

/** Tarjeta de un negocio con su distancia, sus existencias y los botones para verlo, chatear o llegar. */
export function NegocioCard({ d, favorito = false }: { d: NegocioConDatos; favorito?: boolean }) {
  const { n } = d;
  const { s, cuenta } = useStore();
  // «Cliente frecuente» lo decide el comerciante; «favorito» lo marca el propio cliente.
  const trato = cuenta ? s.frecuentes.find((f) => f.negocioId === n.id && f.clienteId === cuenta.id) : undefined;
  const reclamado = !!n.duenoId;
  const dist = etiquetaDistancia(d.dist);
  const subtitulo = [n.giro, dist ?? n.direccion].filter(Boolean).join(' · ');

  return (
    <Card style={{ gap: 12, padding: 14 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`Abrir ${n.nombre}`}
        onPress={() => router.push(`/negocio/${n.id}`)}
        style={{ flexDirection: 'row', gap: 12 }}
      >
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
            {trato ? (
              <Tag bg={C.amberTint} fg={C.amberText}>
                ⭐ Cliente frecuente{trato.descuentoPct > 0 ? ` ${trato.descuentoPct}%` : ''}
              </Tag>
            ) : null}
            {favorito ? (
              <Tag bg={C.grey} fg={C.greyText}>
                ♥ Favorito
              </Tag>
            ) : null}
          </View>
        </View>
      </Pressable>
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Btn
          label={reclamado ? 'Ver productos' : 'Ver negocio'}
          variant="outline"
          h={44}
          r={12}
          size={14}
          weight={600}
          flex={1}
          onPress={() => router.push(`/negocio/${n.id}`)}
        />
        {reclamado ? (
          <Btn label="Chatear" h={44} r={12} size={14} weight={600} flex={1} onPress={() => router.push(`/chat-negocio/${n.id}`)} />
        ) : (
          <Btn label="Cómo llegar" h={44} r={12} size={14} weight={600} flex={1} onPress={() => abrirMapas(n)} />
        )}
      </View>
    </Card>
  );
}
