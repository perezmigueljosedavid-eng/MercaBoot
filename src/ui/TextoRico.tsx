import React from 'react';
import { T } from './T';
import { C } from './theme';

/** Texto con **negrita** (así escribe el asistente). */
export function TextoRico({
  texto,
  size = 15,
  color = C.ink,
  lh = 1.45,
}: {
  texto: string;
  size?: number;
  color?: string;
  lh?: number;
}) {
  const partes = texto.split(/(\*\*[^*]+\*\*)/g).filter((p) => p !== '');
  return (
    <T size={size} lh={lh} color={color}>
      {partes.map((p, i) =>
        p.startsWith('**') && p.endsWith('**') && p.length > 4 ? (
          <T key={i} size={size} weight={700} color={color}>
            {p.slice(2, -2)}
          </T>
        ) : (
          p
        ),
      )}
    </T>
  );
}
