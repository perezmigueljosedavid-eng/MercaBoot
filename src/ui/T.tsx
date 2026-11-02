import React from 'react';
import { Text, TextProps } from 'react-native';
import { C, FONT, Weight } from './theme';

type Props = TextProps & {
  size?: number;
  weight?: Weight;
  color?: string;
  /** letter-spacing en em (como en el diseño, ej. -0.02) */
  ls?: number;
  /** interlineado como múltiplo del tamaño (ej. 1.45) */
  lh?: number;
};

export function T({ size = 14, weight = 400, color = C.ink, ls = 0, lh, style, ...rest }: Props) {
  return (
    <Text
      {...rest}
      style={[
        {
          fontFamily: FONT[weight],
          fontSize: size,
          color,
          letterSpacing: ls * size,
          lineHeight: lh ? Math.round(size * lh) : undefined,
        },
        style,
      ]}
    />
  );
}
