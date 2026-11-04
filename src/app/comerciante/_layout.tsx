import React from 'react';
import { Redirect, Tabs } from 'expo-router';
import { useStore } from '../../store';
import { makeTabBar } from '../../ui/TabBar';

const BarraComerciante = makeTabBar([
  { name: 'index', label: 'Inicio', icon: 'home' },
  { name: 'productos', label: 'Productos', icon: 'box' },
  { name: 'pedidos', label: 'Pedidos', icon: 'receipt', insignia: 'pedidos' },
  { name: 'chats', label: 'Chats', icon: 'chat', insignia: 'chats' },
  { name: 'perfil', label: 'Perfil', icon: 'user' },
]);

export default function ComercianteLayout() {
  const { cuenta } = useStore();
  if (!cuenta) return <Redirect href="/" />;
  if (cuenta.rol !== 'comerciante') return <Redirect href="/cliente" />;
  return (
    <Tabs tabBar={(p) => <BarraComerciante {...p} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="productos" />
      <Tabs.Screen name="pedidos" />
      <Tabs.Screen name="chats" />
      <Tabs.Screen name="perfil" />
    </Tabs>
  );
}
