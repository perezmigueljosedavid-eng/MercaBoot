import { AppState, Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { SUPABASE_ANON_KEY, SUPABASE_URL } from '../config';

if (Platform.OS !== 'web') {
  // Supabase necesita la clase URL completa, que el teléfono no trae de fábrica.
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('react-native-url-polyfill/auto');
}

/**
 * Cliente de Supabase: cuentas (Auth), tablas (PostgREST) y avisos en vivo (Realtime).
 * La sesión se guarda en el teléfono para que no haya que iniciar sesión cada vez.
 */
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  // El latido más seguido detecta antes cuando se cae la conexión (por defecto tarda ~25 s en darse cuenta).
  realtime: { params: { eventsPerSecond: 10 }, heartbeatIntervalMs: 10000 },
});

// Con la app en segundo plano se deja de renovar la sesión; al volver se retoma.
if (Platform.OS !== 'web') {
  AppState.addEventListener('change', (estado) => {
    if (estado === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
