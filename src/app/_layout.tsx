import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
// Se importa cada peso por separado para que el APK solo incluya las 5 fuentes que se usan.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { StoreProvider, useStore } from '../store';
import { C } from '../ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

function Raiz({ fuentesListas }: { fuentesListas: boolean }) {
  const { ready } = useStore();
  const lista = fuentesListas && ready;

  useEffect(() => {
    if (lista) SplashScreen.hideAsync().catch(() => {});
  }, [lista]);

  if (!lista) return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: 'slide_from_right',
        contentStyle: { backgroundColor: C.bg },
      }}
    />
  );
}

export default function Layout() {
  const [fuentes, error] = useFonts({
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_600SemiBold,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
  });

  return (
    <StoreProvider>
      <Raiz fuentesListas={fuentes || !!error} />
    </StoreProvider>
  );
}
