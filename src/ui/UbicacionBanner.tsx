import React from 'react';
import { Pressable, View } from 'react-native';
import { useUbicacion } from '../lib/ubicacion';
import { useStore } from '../store';
import { Icon } from './Icon';
import { Btn } from './kit';
import { T } from './T';
import { C } from './theme';

/** Invita a activar la ubicación para ordenar todo por cercanía. Se hace chica cuando ya está activa. */
export function UbicacionBanner() {
  const { estado, pedir } = useUbicacion();
  const { avisar } = useStore();

  if (estado === 'lista') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Icon name="pin" size={16} color={C.green} />
        <T size={13} weight={600} color={C.greenDark} style={{ flex: 1 }}>
          Ubicación activada: lo más cercano aparece primero
        </T>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Actualizar mi ubicación"
          hitSlop={8}
          onPress={async () => {
            const ok = await pedir();
            avisar(ok ? 'Listo: tu ubicación está actualizada.' : 'No pudimos encontrar tu ubicación. Revisa que el permiso de ubicación esté activado.');
          }}
        >
          <T size={13} weight={700} color={C.green}>
            Actualizar
          </T>
        </Pressable>
      </View>
    );
  }

  const buscando = estado === 'buscando';
  const problema = estado === 'denegada' || estado === 'error';
  const titulo = buscando
    ? 'Buscando tu ubicación…'
    : estado === 'denegada'
      ? 'Falta el permiso de ubicación'
      : estado === 'error'
        ? 'No pudimos encontrar tu ubicación'
        : 'Encuentra lo más cercano a ti';
  const texto =
    estado === 'denegada'
      ? 'Actívalo en los ajustes del teléfono (Mercaboot → Ubicación) y vuelve a intentarlo. Mientras tanto verás los negocios sin distancia.'
      : estado === 'error'
        ? 'Revisa que el GPS esté prendido y que tengas señal. Puedes intentarlo de nuevo.'
        : 'Activa tu ubicación para ver primero las tiendas más cercanas y a cuántos minutos queda cada una. Solo se usa en tu teléfono.';

  return (
    <View
      style={{
        gap: 12,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: problema ? C.amber : C.line,
        backgroundColor: problema ? C.amberTint : C.white,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Icon name="locate" size={22} color={problema ? C.amberText : C.green} />
        <T size={15} weight={700} style={{ flex: 1 }}>
          {titulo}
        </T>
      </View>
      <T size={13} lh={1.45} color={C.muted}>
        {texto}
      </T>
      {!buscando ? (
        <Btn
          label={problema ? 'Intentar de nuevo' : 'Activar mi ubicación'}
          h={44}
          r={12}
          size={14}
          weight={600}
          onPress={() => pedir()}
        />
      ) : null}
    </View>
  );
}
