import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { useNegociosOrdenados } from '../../lib/usarDatos';
import { useStore } from '../../store';
import { Card, OpenDot, Screen, Tag } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

/**
 * «Mis favoritos»: los negocios que el cliente guardó (es algo privado, solo suyo).
 * Aparte, «Tu trato especial»: los negocios donde el propio comerciante lo nombró cliente frecuente.
 */
export default function Favoritos() {
  const { favoritos, s, cuenta } = useStore();
  const todos = useNegociosOrdenados();
  const lista = todos.filter((d) => favoritos.includes(d.n.id));
  const tratos = cuenta ? s.frecuentes.filter((f) => f.clienteId === cuenta.id) : [];
  const conTrato = tratos.map((f) => ({ f, d: todos.find((d) => d.n.id === f.negocioId) })).filter((x) => !!x.d);

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 }}>
      <View style={{ gap: 4 }}>
        <T size={24} weight={800} ls={-0.02}>
          Mis favoritos
        </T>
        <T size={14} color={C.muted}>
          Tus negocios de siempre, a un toque. Solo tú ves esta lista.
        </T>
      </View>

      {conTrato.length > 0 ? (
        <View style={{ gap: 10 }}>
          <T size={15} weight={700}>
            ⭐ Tu trato especial
          </T>
          {conTrato.map(({ f, d }) => (
            <Pressable key={f.id} accessibilityRole="button" accessibilityLabel={`Abrir ${d!.n.nombre}`} onPress={() => router.push(`/negocio/${d!.n.id}`)}>
              <Card style={{ gap: 6, padding: 14, backgroundColor: C.amberTint, borderColor: C.amber }}>
                <T size={15} weight={700} color={C.amberDeep}>
                  {d!.n.nombre}
                </T>
                <T size={13} lh={1.4} color={C.amberDeep}>
                  Te nombró cliente frecuente
                  {f.descuentoPct > 0 ? `: ${f.descuentoPct}% de descuento en tus pedidos` : ''}
                  {f.beneficio ? `${f.descuentoPct > 0 ? ' · ' : ': '}${f.beneficio}` : ''}
                </T>
              </Card>
            </Pressable>
          ))}
        </View>
      ) : null}

      {lista.length === 0 ? (
        <Card style={{ padding: 20, gap: 6 }}>
          <T size={16} weight={700}>
            Aún no tienes favoritos
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            Abre un negocio y toca “Guardar en favoritos” para verlo aquí.
          </T>
        </Card>
      ) : (
        lista.map((d) => {
          const n = d.n;
          const trato = tratos.find((f) => f.negocioId === n.id);
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
                    {trato ? (
                      <View style={{ flexDirection: 'row', marginTop: 2 }}>
                        <Tag bg={C.amberTint} fg={C.amberText}>
                          ⭐ Cliente frecuente{trato.descuentoPct > 0 ? ` ${trato.descuentoPct}%` : ''}
                        </Tag>
                      </View>
                    ) : null}
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
