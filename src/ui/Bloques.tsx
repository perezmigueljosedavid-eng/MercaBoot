import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import type { Bloque, DondeVista, GrupoIdeas, NegocioVista } from '../ia/vista';
import { useStore } from '../store';
import { AvisoFila, textoPrecio } from './bits';
import { Icon } from './Icon';
import { Chip, Group, OpenDot } from './kit';
import { Logo } from './Logo';
import { RecetaCard } from './RecetaCard';
import { Rasgos } from './Reputacion';
import { T } from './T';
import { C } from './theme';
import { TextoRico } from './TextoRico';

function Titulo({ texto }: { texto?: string }) {
  if (!texto) return null;
  return (
    <T size={13} weight={700} color={C.muted}>
      {texto}
    </T>
  );
}

function FilaProducto({ d }: { d: DondeVista }) {
  // Si no hay producto, el título ya es el negocio y no se repite abajo.
  const sub = [d.producto ? d.negocio : null, d.dist ?? d.direccion].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/negocio/${d.negocioId}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}
    >
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <T size={14} weight={700}>
          {d.producto ?? d.negocio}
        </T>
        <T size={12} color={C.muted} lh={1.3}>
          {sub}
          {d.abierto ? '' : `${sub ? ' · ' : ''}cerrado ahora`}
        </T>
        <Rasgos
          compacto
          estrellas={d.estrellas}
          resenas={d.resenas}
          aDomicilio={d.aDomicilio}
          porEncargo={d.porEncargo}
          insignias={d.insignias}
          nota={d.nota}
        />
      </View>
      {d.precio != null ? (
        <T size={13} weight={700} color={C.green}>
          {textoPrecio(d.precio, d.unidad)}
        </T>
      ) : null}
      <Icon name="next" size={16} color={C.muted} />
    </Pressable>
  );
}

function FilaNegocio({ n }: { n: NegocioVista }) {
  const { s } = useStore();
  const logo = s.negocios.find((x) => x.id === n.negocioId)?.logoUri;
  const sub = [n.giro, n.dist ?? n.direccion].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/negocio/${n.negocioId}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}
    >
      <Logo uri={logo} nombre={n.nombre} size={44} />
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <T size={14} weight={700} numberOfLines={1} style={{ flexShrink: 1 }}>
            {n.nombre}
          </T>
          {n.reclamado ? <OpenDot abierto={n.abierto} size={11} /> : null}
        </View>
        <T size={12} color={C.muted} lh={1.3} numberOfLines={2}>
          {sub}
        </T>
        <Rasgos compacto estrellas={n.estrellas} resenas={n.resenas} aDomicilio={n.aDomicilio} insignias={n.insignias} />
        <T size={12} weight={600} color={n.productos ? C.green : C.muted}>
          {n.productos ? `${n.productos} ${n.productos === 1 ? 'producto disponible' : 'productos disponibles'}` : 'Aún sin productos publicados'}
        </T>
      </View>
      <Icon name="next" size={16} color={C.muted} />
    </Pressable>
  );
}

/** Ideas para empezar: botones agrupados que mandan su texto como si la persona lo hubiera escrito. */
function Ideas({ grupos, onElegir }: { grupos: GrupoIdeas[]; onElegir?: (texto: string) => void }) {
  return (
    <View style={{ gap: 12, padding: 14, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
      {grupos.map((g) => (
        <View key={g.titulo} style={{ gap: 8 }}>
          <T size={12} weight={700} color={C.muted} ls={0.04}>
            {g.titulo.toUpperCase()}
          </T>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {g.chips.map((c) => (
              <Chip key={c} label={c} h={38} px={14} size={13} border={C.input} onPress={onElegir ? () => onElegir(c) : undefined} />
            ))}
          </View>
        </View>
      ))}
    </View>
  );
}

/** Dibuja lo que responde el asistente: texto, ideas, recetas, productos, tiendas y avisos. */
export function Bloques({
  bloques,
  hayProductos,
  onElegir,
}: {
  bloques: Bloque[];
  hayProductos: boolean;
  /** Se llama con el texto de una idea que la persona toca. */
  onElegir?: (texto: string) => void;
}) {
  return (
    <View style={{ gap: 10 }}>
      {bloques.map((b, i) => {
        switch (b.t) {
          case 'ideas':
            return <Ideas key={i} grupos={b.grupos} onElegir={onElegir} />;
          case 'texto':
            return (
              <View
                key={i}
                style={{
                  alignSelf: 'flex-start',
                  maxWidth: '92%',
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderTopLeftRadius: 18,
                  borderTopRightRadius: 18,
                  borderBottomRightRadius: 18,
                  borderBottomLeftRadius: 4,
                  backgroundColor: C.white,
                  borderWidth: 1,
                  borderColor: C.line,
                }}
              >
                <TextoRico texto={b.texto} />
              </View>
            );
          case 'receta':
            return <RecetaCard key={i} receta={b.receta} verPasos={b.verPasos} hayProductos={hayProductos} />;
          case 'productos':
            return (
              <View key={i} style={{ gap: 6 }}>
                <Titulo texto={b.titulo} />
                <Group>
                  {b.items.map((d, k) => (
                    <FilaProducto key={`${d.negocioId}-${d.productoId ?? k}`} d={d} />
                  ))}
                </Group>
              </View>
            );
          case 'negocios':
            return (
              <View key={i} style={{ gap: 6 }}>
                <Titulo texto={b.titulo} />
                <Group>
                  {b.items.map((n) => (
                    <FilaNegocio key={n.negocioId} n={n} />
                  ))}
                </Group>
              </View>
            );
          case 'avisos':
            return (
              <View key={i} style={{ gap: 6 }}>
                <Titulo texto={b.titulo} />
                <Group>
                  {b.items.map((a) => (
                    <AvisoFila key={a.id} a={a} />
                  ))}
                </Group>
              </View>
            );
          default:
            return null;
        }
      })}
    </View>
  );
}
