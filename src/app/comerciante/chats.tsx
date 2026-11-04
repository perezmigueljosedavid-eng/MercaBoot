import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { sinLeer, textoUltimo, useStore } from '../../store';
import { haceCuanto } from '../../ui/bits';
import { Card, Group, Screen } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

/** Conversaciones de los clientes con el negocio; los mensajes nuevos aparecen al instante. */
export default function ChatsComerciante() {
  const { s, cuenta, negocio } = useStore();
  const miId = cuenta?.id ?? '';
  const mias = s.conversaciones
    .filter((c) => c.negocioId === negocio?.id && c.ultimoEn != null)
    .sort((a, b) => (b.ultimoEn ?? 0) - (a.ultimoEn ?? 0));

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 }}>
      <T size={24} weight={800} ls={-0.02}>
        Chats
      </T>
      {mias.length === 0 ? (
        <Card style={{ padding: 20, gap: 6 }}>
          <T size={16} weight={700}>
            Aún no te escribe ningún cliente
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            Cuando un cliente te pregunte por un producto, la conversación aparecerá aquí.
          </T>
        </Card>
      ) : (
        <Group r={18}>
          {mias.map((c) => {
            const nuevo = sinLeer(c, miId, false);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Chat con ${c.clienteNombre}${nuevo ? ', mensaje nuevo' : ''}`}
                onPress={() => router.push(`/chat-cliente/${c.id}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
              >
                <Logo nombre={c.clienteNombre} size={48} redondo />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <T size={15} weight={nuevo ? 800 : 700} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {c.clienteNombre}
                    </T>
                    <T size={12} color={C.muted}>
                      {haceCuanto(c.ultimoEn ?? c.creado)}
                    </T>
                  </View>
                  <T size={13} weight={nuevo ? 700 : 400} color={nuevo ? C.ink : C.muted} numberOfLines={1}>
                    {textoUltimo(c, miId)}
                  </T>
                </View>
                {nuevo ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.amber }} /> : null}
              </Pressable>
            );
          })}
        </Group>
      )}
    </Screen>
  );
}
