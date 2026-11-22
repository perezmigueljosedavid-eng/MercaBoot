import React from 'react';
import { Image, View } from 'react-native';
import { emojiDeProducto } from '../data/emojis';
import type { CategoriaProducto, Producto } from '../data/tipos';
import { useFotoProducto } from '../lib/fotos';
import { T } from './T';
import { C } from './theme';

type DeProducto = Pick<Producto, 'id' | 'nombre' | 'categoria' | 'ingrediente' | 'tieneFoto' | 'fotoHuella'>;

const FRESCOS: CategoriaProducto[] = ['carne', 'ave', 'pescado', 'lacteo', 'masa', 'pan', 'preparado'];
const VERDES: CategoriaProducto[] = ['verdura', 'fruta'];

/** Color suave de fondo según el tipo de producto. */
function fondoDe(c: CategoriaProducto): string {
  if (VERDES.includes(c)) return C.greenTint;
  if (FRESCOS.includes(c)) return C.amberTint;
  return C.grey;
}

/**
 * La foto de un producto o, si no tiene (o mientras llega), un dibujito de lo que es sobre un color suave.
 * `size`: cuadrado de ese tamaño. `ancho`: ocupa todo el ancho con proporción de foto grande (detalle del producto).
 */
export function FotoProducto({ producto, size = 52, r = 12, ancho = false }: { producto: DeProducto; size?: number; r?: number; ancho?: boolean }) {
  const uri = useFotoProducto(producto);
  const forma = ancho ? { width: '100%' as const, aspectRatio: 1.6, borderRadius: 18 } : { width: size, height: size, borderRadius: r };
  if (uri) {
    return (
      <Image
        source={{ uri }}
        accessibilityLabel={`Foto de ${producto.nombre}`}
        resizeMode="cover"
        style={[forma, { backgroundColor: C.bg, flexShrink: 0 }]}
      />
    );
  }
  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[forma, { backgroundColor: fondoDe(producto.categoria), alignItems: 'center', justifyContent: 'center', flexShrink: 0 }]}
    >
      <T size={ancho ? 64 : Math.round(size * 0.5)}>{emojiDeProducto(producto.nombre, producto.categoria, producto.ingrediente)}</T>
    </View>
  );
}
