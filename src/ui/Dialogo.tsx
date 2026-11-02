import React from 'react';
import { Modal, Pressable, View } from 'react-native';
import { Btn } from './kit';
import { T } from './T';
import { C } from './theme';

/** Ventana de confirmación (funciona igual en el teléfono y en el navegador). */
export function Confirmar({
  visible,
  titulo,
  texto,
  confirmar = 'Aceptar',
  cancelar = 'Cancelar',
  peligro = false,
  onConfirmar,
  onCancelar,
}: {
  visible: boolean;
  titulo: string;
  texto?: string;
  confirmar?: string;
  cancelar?: string;
  peligro?: boolean;
  onConfirmar: () => void;
  onCancelar: () => void;
}) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancelar}>
      <Pressable
        onPress={onCancelar}
        style={{ flex: 1, backgroundColor: 'rgba(26,31,28,0.45)', justifyContent: 'center', padding: 28 }}
      >
        <Pressable
          onPress={() => {}}
          style={{ backgroundColor: C.white, borderRadius: 20, padding: 20, gap: 14 }}
        >
          <T size={18} weight={800} lh={1.3}>
            {titulo}
          </T>
          {texto ? (
            <T size={14} color={C.muted} lh={1.45}>
              {texto}
            </T>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10, marginTop: 4 }}>
            <Btn label={cancelar} variant="outline" h={46} r={12} size={15} flex={1} onPress={onCancelar} />
            <Btn
              label={confirmar}
              variant={peligro ? 'danger' : 'primary'}
              h={46}
              r={12}
              size={15}
              flex={1}
              onPress={onConfirmar}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
