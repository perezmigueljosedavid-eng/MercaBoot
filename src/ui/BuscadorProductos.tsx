import React, { useMemo } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';
import type { CategoriaProducto, Producto } from '../data/tipos';
import { categoriasDe } from '../lib/listaProductos';
import { Icon } from './Icon';
import { Chip } from './kit';
import { T } from './T';
import { C, FONT } from './theme';

/** Buscador y categorías para una lista larga de productos. */
export function BuscadorProductos({
  productos,
  busqueda,
  onBusqueda,
  categoria,
  onCategoria,
  placeholder = 'Buscar un producto',
}: {
  /** Los productos de la tienda (sirven para saber qué categorías mostrar). */
  productos: Pick<Producto, 'categoria'>[];
  busqueda: string;
  onBusqueda: (t: string) => void;
  categoria: CategoriaProducto | null;
  onCategoria: (c: CategoriaProducto | null) => void;
  placeholder?: string;
}) {
  const categorias = useMemo(() => categoriasDe(productos), [productos]);
  return (
    <View style={{ gap: 10 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
        <Icon name="search" size={18} color={C.muted} />
        <TextInput
          value={busqueda}
          onChangeText={onBusqueda}
          placeholder={placeholder}
          placeholderTextColor={C.placeholder}
          accessibilityLabel={placeholder}
          autoCorrect={false}
          returnKeyType="search"
          style={{ flex: 1, minWidth: 0, fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
        />
        {busqueda ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10} onPress={() => onBusqueda('')}>
            <T size={18} color={C.muted}>
              ✕
            </T>
          </Pressable>
        ) : null}
      </View>
      {categorias.length > 1 ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingRight: 8 }}>
          <Chip label="Todas" h={36} px={14} size={13} active={categoria === null} onPress={() => onCategoria(null)} />
          {categorias.map((c) => (
            <Chip key={c.id} label={`${c.nombre} (${c.n})`} h={36} px={14} size={13} active={categoria === c.id} onPress={() => onCategoria(categoria === c.id ? null : c.id)} />
          ))}
        </ScrollView>
      ) : null}
    </View>
  );
}

/** Botón para mostrar más productos de una lista larga. */
export function VerMas({ restantes, onPress }: { restantes: number; onPress: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Ver más productos, faltan ${restantes}`}
      onPress={onPress}
      style={({ pressed }) => ({
        height: 46,
        borderRadius: 14,
        borderWidth: 1,
        borderColor: C.input,
        backgroundColor: C.white,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <T size={14} weight={700} color={C.green}>
        Ver más ({restantes})
      </T>
    </Pressable>
  );
}
