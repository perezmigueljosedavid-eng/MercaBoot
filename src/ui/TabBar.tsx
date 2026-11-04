import React, { useEffect, useState } from 'react';
import { Keyboard, Platform, Pressable, View } from 'react-native';
import { Tabs } from 'expo-router';
import { C } from './theme';
import { T } from './T';
import { Icon, IconName } from './Icon';
import { useStore } from '../store';

type TabBarProps = Parameters<NonNullable<React.ComponentProps<typeof Tabs>['tabBar']>>[0];

export type TabItem = { name: string; label: string; icon: IconName; /** Muestra un punto cuando hay chats sin leer. */ chats?: boolean };

/** Barra inferior con el mismo aspecto del diseño (ícono + etiqueta de 11px). */
export function makeTabBar(items: TabItem[]) {
  return function MercabootTabBar({ state, navigateToTab, insets }: TabBarProps) {
    const [teclado, setTeclado] = useState(false);
    const { chatsSinLeer } = useStore();
    useEffect(() => {
      const mostrar = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
        () => setTeclado(true),
      );
      const ocultar = Keyboard.addListener(
        Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
        () => setTeclado(false),
      );
      return () => {
        mostrar.remove();
        ocultar.remove();
      };
    }, []);

    if (teclado) return null;

    return (
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          backgroundColor: C.white,
          borderTopWidth: 1,
          borderTopColor: C.line,
          height: 68 + Math.max(insets.bottom, 8),
          paddingBottom: Math.max(insets.bottom, 8),
        }}
      >
        {state.routes.map((route, i) => {
          const item = items.find((it) => it.name === route.name);
          if (!item) return null;
          const activo = state.index === i;
          const color = activo ? C.green : C.muted;
          return (
            <Pressable
              key={route.key}
              accessibilityRole="tab"
              accessibilityLabel={item.label}
              accessibilityState={{ selected: activo }}
              onPress={() => navigateToTab(route.key)}
              style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4, minHeight: 56 }}
            >
              <View>
                <Icon name={item.icon} size={22} color={color} />
                {item.chats && chatsSinLeer > 0 ? (
                  <View
                    accessibilityLabel={`${chatsSinLeer} ${chatsSinLeer === 1 ? 'chat sin leer' : 'chats sin leer'}`}
                    style={{
                      position: 'absolute',
                      top: -4,
                      right: -9,
                      minWidth: 16,
                      height: 16,
                      paddingHorizontal: 4,
                      borderRadius: 8,
                      backgroundColor: C.red,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <T size={10} weight={800} color={C.white}>
                      {chatsSinLeer > 9 ? '9+' : String(chatsSinLeer)}
                    </T>
                  </View>
                ) : null}
              </View>
              <T size={11} weight={activo ? 700 : 600} color={color}>
                {item.label}
              </T>
            </Pressable>
          );
        })}
      </View>
    );
  };
}
