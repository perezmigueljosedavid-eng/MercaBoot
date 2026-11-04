import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { sinLeer, textoUltimo, useStore } from '../../store';
import { haceCuanto } from '../../ui/bits';
import { Card, Group, Screen } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

/** Conversaciones del cliente con los negocios; se actualizan al instante cuando el negocio responde. */
export default function ChatsCliente() {
  const { s, cuenta } = useStore();
  const miId = cuenta?.id ?? '';
  const mias = s.conversaciones
    .filter((c) => c.clienteId === miId && c.ultimoEn != null)
    .sort((a, b) => (b.ultimoEn ?? 0) - (a.ultimoEn ?? 0));

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 }}>
      <T size={24} weight={800} ls={-0.02}>
        Chats
      </T>
      {mias.length === 0 ? (
        <Card style={{ padding: 20, gap: 6 }}>
          <T size={16} weight={700}>
            Aún no tienes conversaciones
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            Abre un negocio y toca “Chatear” para preguntar si tiene lo que buscas.
          </T>
        </Card>
      ) : (
        <Group r={18}>
          {mias.map((c) => {
            const n = s.negocios.find((x) => x.id === c.negocioId);
            const nombre = n?.nombre ?? 'Negocio';
            const nuevo = sinLeer(c, miId, true);
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityLabel={`Chat con ${nombre}${nuevo ? ', mensaje nuevo' : ''}`}
                onPress={() => router.push(`/chat-negocio/${c.negocioId}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
              >
                <Logo uri={n?.logoUri} nombre={nombre} size={48} redondo />
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', gap: 8 }}>
                    <T size={15} weight={nuevo ? 800 : 700} numberOfLines={1} style={{ flexShrink: 1 }}>
                      {nombre}
                    </T>
                    <T size={12} color={C.muted}>
                      {haceCuanto(c.ultimoEn ?? c.creado)}
                    </T>
                  </View>
                  <T size={13} weight={nuevo ? 700 : 400} color={nuevo ? C.ink : C.muted} numberOfLines={1}>
                    {textoUltimo(c, miId)}
                  </T>
                </View>
                {nuevo ? <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: C.green }} /> : null}
              </Pressable>
            );
          })}
        </Group>
      )}
    </Screen>
  );
}
