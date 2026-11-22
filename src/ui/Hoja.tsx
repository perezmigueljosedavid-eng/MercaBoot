import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from './Icon';
import { T } from './T';
import { C } from './theme';

/**
 * Hoja que sube desde abajo (para elegir una hora, copiar un día, etc.). Funciona igual en el teléfono y en el navegador.
 * Se cierra tocando afuera, con «✕» o con el botón de regresar de Android.
 * Autor: José David Pérez Miguel
 */
export function Hoja({
  visible,
  titulo,
  onCerrar,
  children,
  alto = '75%',
}: {
  visible: boolean;
  titulo: string;
  onCerrar: () => void;
  children: React.ReactNode;
  /** Altura máxima de la hoja. */
  alto?: `${number}%`;
}) {
  const insets = useSafeAreaInsets();
  return (
    <Modal transparent animationType="slide" visible={visible} onRequestClose={onCerrar}>
      <Pressable
        accessibilityLabel="Cerrar"
        onPress={onCerrar}
        style={{ flex: 1, backgroundColor: 'rgba(26,31,28,0.45)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: C.white, borderTopLeftRadius: 22, borderTopRightRadius: 22, maxHeight: alto, paddingBottom: insets.bottom + 12 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 16, paddingBottom: 10, paddingLeft: 20, paddingRight: 10 }}>
            <T size={17} weight={800} style={{ flex: 1 }}>
              {titulo}
            </T>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Cerrar"
              onPress={onCerrar}
              hitSlop={8}
              style={{ width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}
            >
              <Icon name="close" size={20} color={C.muted} />
            </Pressable>
          </View>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}
