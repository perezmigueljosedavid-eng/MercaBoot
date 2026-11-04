import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useStore } from '../../store';
import { makeTabBar } from '../../ui/TabBar';

const BarraCliente = makeTabBar([
  { name: 'index', label: 'Inicio', icon: 'home' },
  { name: 'buscar', label: 'Buscar', icon: 'search' },
  { name: 'pedidos', label: 'Pedidos', icon: 'receipt', insignia: 'pedidos' },
  { name: 'chats', label: 'Chats', icon: 'chat', insignia: 'chats' },
  { name: 'favoritos', label: 'Favoritos', icon: 'heart' },
  { name: 'perfil', label: 'Perfil', icon: 'user' },
]);

export default function ClienteLayout() {
  const { cuenta } = useStore();
  if (!cuenta) return <Redirect href="/" />;
  if (cuenta.rol !== 'cliente') return <Redirect href="/comerciante" />;
  return (
    <Tabs tabBar={(p) => <BarraCliente {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="buscar" />
      <Tabs.Screen name="pedidos" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="favoritos" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
