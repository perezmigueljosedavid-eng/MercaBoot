import React from 'react';
import { Image, View } from 'react-native';
import { T } from './T';
import { C } from './theme';

const PALETA = [
  { bg: C.greenTint, fg: C.green },
  { bg: C.amberTint, fg: C.amberText },
  { bg: C.grey, fg: C.greyText },
];

const PEQUENAS = new Set(['de', 'del', 'la', 'las', 'el', 'los', 'y', 'e', 'en', 'con', 'a']);

export function iniciales(nombre: string): string {
  const palabras = nombre
    .trim()
    .split(/\s+/)
    .filter((p) => p && !PEQUENAS.has(p.toLowerCase()));
  if (!palabras.length) return '?';
  const letras = palabras.slice(0, 2).map((p) => p.charAt(0).toUpperCase());
  return letras.join('');
}

const hash = (t: string) => [...t].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);

/** Logo o foto de perfil. Si no hay imagen, muestra las iniciales sobre un color suave. */
export function Logo({
  uri,
  nombre,
  size = 56,
  r,
  redondo = false,
}: {
  uri?: string;
  nombre: string;
  size?: number;
  r?: number;
  redondo?: boolean;
}) {
  const radio = redondo ? size / 2 : (r ?? Math.round(size * 0.22));
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={`Logo de ${nombre}`}
        style={{ width: size, height: size, borderRadius: radio, backgroundColor: C.grey, flexShrink: 0 }}
      />
    );
  }
  const t = PALETA[hash(nombre) % PALETA.length];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radio,
        backgroundColor: t.bg,
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <T size={Math.round(size * 0.34)} weight={800} color={t.fg}>
        {iniciales(nombre)}
      </T>
    </View>
  );
}
