import React from 'react';
import { ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Boti } from './Boti';
import { Btn } from './kit';
import { T } from './T';
import { C } from './theme';

/**
 * La pantalla que sale si una pantalla de la app se rompe por un error inesperado (en vez de quedarse en blanco o cerrarse sola).
 * No usa los datos de la app (ni la sesión ni la tienda), porque justo pudo ser ahí donde falló. Lo que el usuario tiene guardado está
 * en la nube y no se pierde; «Intentar de nuevo» vuelve a armar la pantalla desde cero.
 * Autor: José David Pérez Miguel
 */

/** Del error, solo un renglón corto y sin saltos, para quien arma la app (nada que asuste ni que ocupe media pantalla). */
export function detalleDelError(error: unknown): string {
  const texto = error instanceof Error ? error.message : typeof error === 'string' ? error : '';
  const limpio = texto.replace(/\s+/g, ' ').trim();
  return limpio.length > 240 ? limpio.slice(0, 239).trimEnd() + '…' : limpio;
}

export function PantallaDeError({ error, retry }: { error: unknown; retry: () => void | Promise<void> }) {
  const insets = useSafeAreaInsets();
  const detalle = detalleDelError(error);
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: C.bg }}
      contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', gap: 16, padding: 24, paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 }}
    >
      <View style={{ alignItems: 'center' }}>
        <Boti pose="dormido" size={120} />
      </View>
      <T size={24} weight={800} ls={-0.02} style={{ textAlign: 'center' }} accessibilityRole="header">
        Algo salió mal
      </T>
      <T size={15} lh={1.5} color={C.greyText} style={{ textAlign: 'center' }}>
        Boti se tropezó con un problema inesperado. No se perdió nada: tus productos, pedidos y mensajes siguen guardados en la nube.
      </T>
      <Btn label="Intentar de nuevo" onPress={() => void retry()} />
      <T size={13} lh={1.45} color={C.muted} style={{ textAlign: 'center' }}>
        Si vuelve a pasar, cierra Mercaboot por completo y ábrela otra vez.
      </T>
      {detalle ? (
        <T size={11} lh={1.4} color={C.muted} style={{ textAlign: 'center', opacity: 0.8 }} selectable>
          Detalle para quien arma la app: {detalle}
        </T>
      ) : null}
    </ScrollView>
  );
}
