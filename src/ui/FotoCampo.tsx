import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { elegirImagen } from '../lib/imagenes';
import { Icon } from './Icon';
import { Logo } from './Logo';
import { T } from './T';
import { C } from './theme';

/** Elegir o quitar una foto (logo del negocio o foto de perfil). */
export function FotoCampo({
  uri,
  nombre,
  onChange,
  titulo = 'Logo',
  redondo = false,
  size = 84,
}: {
  uri?: string;
  nombre: string;
  onChange: (uri: string | undefined) => void;
  titulo?: string;
  redondo?: boolean;
  size?: number;
}) {
  const [error, setError] = useState('');
  const [cargando, setCargando] = useState(false);

  async function elegir() {
    setError('');
    setCargando(true);
    try {
      const nueva = await elegirImagen();
      if (nueva) onChange(nueva);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cargar esa foto.');
    } finally {
      setCargando(false);
    }
  }

  return (
    <View style={{ gap: 8 }}>
      <T size={14} weight={600}>
        {titulo}
      </T>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
        <Logo uri={uri} nombre={nombre || '?'} size={size} redondo={redondo} />
        <View style={{ flex: 1, gap: 8, alignItems: 'flex-start' }}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={uri ? `Cambiar ${titulo.toLowerCase()}` : `Subir ${titulo.toLowerCase()}`}
            onPress={elegir}
            disabled={cargando}
            style={({ pressed }) => ({
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              height: 42,
              paddingHorizontal: 14,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: C.input,
              backgroundColor: C.white,
              opacity: pressed || cargando ? 0.7 : 1,
            })}
          >
            <Icon name="image" size={18} color={C.green} />
            <T size={14} weight={700} color={C.green}>
              {cargando ? 'Cargando…' : uri ? 'Cambiar foto' : 'Subir foto'}
            </T>
          </Pressable>
          {uri ? (
            <Pressable accessibilityRole="button" onPress={() => onChange(undefined)} hitSlop={8}>
              <T size={13} weight={600} color={C.red}>
                Quitar foto
              </T>
            </Pressable>
          ) : (
            <T size={12} color={C.muted}>
              Sin foto se mostrarán las iniciales.
            </T>
          )}
        </View>
      </View>
      {error ? (
        <T size={13} color={C.red}>
          {error}
        </T>
      ) : null}
    </View>
  );
}
