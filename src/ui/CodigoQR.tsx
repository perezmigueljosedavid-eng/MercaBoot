import React, { useMemo } from 'react';
import Svg, { Path, Rect } from 'react-native-svg';
import { crearQR, trazoSvg, type NivelQR } from '../lib/qr';

/**
 * Dibuja un código QR en pantalla (negro sobre blanco, con su margen). Si el texto no cabe, no dibuja nada.
 * Autor: José David Pérez Miguel
 */
export function CodigoQR({ texto, size = 240, nivel = 'M', etiqueta }: { texto: string; size?: number; nivel?: NivelQR; etiqueta?: string }) {
  const dibujo = useMemo(() => {
    try {
      // `0.05` de solape: evita una rayita clara entre renglones cuando el tamaño en pantalla no es entero
      return trazoSvg(crearQR(texto, nivel), 4, 0.05);
    } catch {
      return null;
    }
  }, [texto, nivel]);
  if (!dibujo) return null;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${dibujo.lado} ${dibujo.lado}`} accessibilityRole="image" accessibilityLabel={etiqueta ?? 'Código QR'}>
      <Rect width={dibujo.lado} height={dibujo.lado} fill="#FFFFFF" />
      <Path d={dibujo.d} fill="#000000" />
    </Svg>
  );
}
