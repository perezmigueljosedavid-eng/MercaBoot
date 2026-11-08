import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { baratasHoy, dinero, precioTexto } from '../ia/comparar';
import { etiquetaDistancia } from '../lib/distancia';
import { useCatalogo } from '../lib/usarDatos';
import { Icon } from './Icon';
import { Group, SectionTitle, Tag } from './kit';
import { textoEstrellas } from './Reputacion';
import { T } from './T';
import { C } from './theme';

/**
 * "Lo más barato hoy": el mismo producto comparado entre las tiendas que lo tienen publicado.
 * Se muestra la más económica, pero también las demás, para que ninguna tienda quede fuera.
 */
export function LoMasBarato({ max = 4 }: { max?: number }) {
  const cat = useCatalogo();
  const ofertas = useMemo(() => baratasHoy(cat.items, max), [cat.items, max]);

  return (
    <View style={{ gap: 10 }}>
      <SectionTitle title="Lo más barato hoy" link="Ver más" onLink={() => router.push({ pathname: '/ideas-ia', params: { antojo: '¿Dónde sale más barato?', t: String(Date.now()) } })} />
      {ofertas.length === 0 ? (
        <T size={14} lh={1.45} color={C.muted}>
          Aquí verás dónde sale más barato cada producto. Aparece cuando dos o más tiendas publican lo mismo.
        </T>
      ) : (
        <>
          <Group>
            {ofertas.map((o) => {
              const it = o.mejor;
              const dist = etiquetaDistancia(it.dist);
              return (
                <View key={it.p.id} style={{ gap: 10, paddingVertical: 12, paddingHorizontal: 14 }}>
                  <Pressable
                    accessibilityRole="link"
                    onPress={() => router.push(`/negocio/${it.n.id}`)}
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}
                  >
                    <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                      <T size={15} weight={700}>
                        {it.p.nombre}
                      </T>
                      <T size={12} color={C.muted} lh={1.3}>
                        {[it.n.nombre, dist].filter(Boolean).join(' · ')}
                      </T>
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
                        <T size={12} weight={it.rep.promedio != null ? 700 : 500} color={it.rep.promedio != null ? C.amberText : C.muted}>
                          {textoEstrellas(it.rep.promedio, it.rep.total)}
                        </T>
                        {it.n.aDomicilio ? (
                          <Tag bg={C.greenTint} fg={C.greenDark}>
                            A domicilio
                          </Tag>
                        ) : null}
                      </View>
                    </View>
                    <View style={{ alignItems: 'flex-end', gap: 4 }}>
                      <T size={14} weight={800} color={C.green}>
                        {it.p.precio != null && it.p.unidad ? precioTexto(it.p.precio, it.p.unidad) : ''}
                      </T>
                      <Tag bg={C.green} fg={C.white}>
                        Más económico
                      </Tag>
                    </View>
                    <Icon name="next" size={16} color={C.muted} />
                  </Pressable>
                  <T size={12} lh={1.35} color={C.muted}>
                    Ahorras hasta {dinero(Math.round(o.ahorro * 100) / 100)} por {o.unidad} ({o.porcentaje}%) frente a la tienda más cara. {o.tiendas} tiendas lo tienen:
                  </T>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                    {o.otras.map((x) => (
                      <Pressable
                        key={x.p.id}
                        accessibilityRole="link"
                        onPress={() => router.push(`/negocio/${x.n.id}`)}
                        style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 10, backgroundColor: C.grey }}
                      >
                        <T size={12} weight={600} color={C.greyText}>
                          {x.n.nombre}
                          {x.p.precio != null && x.p.unidad ? ` · ${precioTexto(x.p.precio, x.p.unidad)}` : ''}
                        </T>
                      </Pressable>
                    ))}
                  </View>
                </View>
              );
            })}
          </Group>
          <T size={11} lh={1.4} color={C.muted}>
            Se compara el mismo producto en la misma medida (por ejemplo, kilo con kilo). Siempre aparecen todas las tiendas que lo tienen.
          </T>
        </>
      )}
    </View>
  );
}
