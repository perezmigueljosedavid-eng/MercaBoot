import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';
// Se importa cada peso por separado para que el APK solo incluya las 5 fuentes que se usan.
import { PlusJakartaSans_400Regular } from '@expo-google-fonts/plus-jakarta-sans/400Regular';
import { PlusJakartaSans_500Medium } from '@expo-google-fonts/plus-jakarta-sans/500Medium';
import { PlusJakartaSans_600SemiBold } from '@expo-google-fonts/plus-jakarta-sans/600SemiBold';
import { PlusJakartaSans_700Bold } from '@expo-google-fonts/plus-jakarta-sans/700Bold';
import { PlusJakartaSans_800ExtraBold } from '@expo-google-fonts/plus-jakarta-sans/800ExtraBold';
import { UbicacionProvider } from '../lib/ubicacion';
import { StoreProvider, useStore } from '../store';
import { T } from '../ui/T';
import { C } from '../ui/theme';

SplashScreen.preventAutoHideAsync().catch(() => {});

/** Solo la ve quien arma la app: significa que falta pegar los datos de la base de datos en src/config.ts. */
function PantallaSinNube() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ gap: 14, padding: 24, paddingTop: insets.top + 32, paddingBottom: insets.bottom + 32 }}
    >
      <T size={24} weight={800} ls={-0.02}>
        Falta conectar la base de datos
      </T>
      <T size={15} lh={1.5} color={C.greyText}>
        Mercaboot guarda los negocios, productos y chats en la nube (Supabase), pero esta copia de la app todavía no sabe a qué proyecto conectarse.
      </T>
      <T size={15} lh={1.5} color={C.greyText}>
        1. Crea tu proyecto en supabase.com y ejecuta el archivo supabase/esquema.sql en «SQL Editor».{'\n'}
        2. Copia la dirección del proyecto (Project URL) y la llave pública (anon / publishable key).{'\n'}
        3. Pégalas en el archivo src/config.ts y vuelve a generar la app.
      </T>
      <T size={13} lh={1.45} color={C.muted}>
        Nunca pegues la llave «service_role» o «secret» en la app. Los pasos completos están en LEEME.md.
      </T>
    </ScrollView>
  );
}

/** Aviso corto que se quita solo (por ejemplo, cuando no se pudo cambiar un producto). */
function Aviso({ texto }: { texto: string | null }) {
  const insets = useSafeAreaInsets();
  if (!texto) return null;
  return (
    <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 88, alignItems: 'center' }}>
      <View
        accessibilityRole="alert"
        accessibilityLiveRegion="polite"
        style={{ maxWidth: 440, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, backgroundColor: C.ink }}
      >
        <T size={14} weight={600} lh={1.4} color={C.white}>
          {texto}
        </T>
      </View>
    </View>
  );
}

function Raiz({ fuentesListas }: { fuentesListas: boolean }) {
  const { ready, nubeOk, estadoRed, aviso } = useStore();
  const insets = useSafeAreaInsets();
  const lista = fuentesListas && ready;

  useEffect(() => {
    if (lista) SplashScreen.hideAsync().catch(() => {});
  }, [lista]);

  if (!lista) return null;
  if (!nubeOk) return <PantallaSinNube />;

  const sinInternet = estadoRed === 'sin-internet';

  return (
    <View style={{ flex: 1, backgroundColor: C.bg }}>
      {sinInternet ? (
        <View accessibilityRole="alert" style={{ paddingTop: insets.top + 6, paddingBottom: 8, paddingHorizontal: 16, backgroundColor: C.amberTint }}>
          <T size={12} weight={600} lh={1.35} color={C.amberDeep} style={{ textAlign: 'center' }}>
            Sin internet. Ves lo último que se guardó en este teléfono; para publicar o chatear necesitas conexión.
          </T>
        </View>
      ) : null}
      {/* Con el aviso arriba, las pantallas ya no necesitan dejar espacio para la barra del sistema. */}
      <SafeAreaInsetsContext.Provider value={sinInternet ? { ...insets, top: 0 } : insets}>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            contentStyle: { backgroundColor: C.bg },
          }}
        />
      </SafeAreaInsetsContext.Provider>
      <Aviso texto={aviso} />
    </View>
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
      <UbicacionProvider>
        <Raiz fuentesListas={fuentes || !!error} />
      </UbicacionProvider>
    </StoreProvider>
  );
}
