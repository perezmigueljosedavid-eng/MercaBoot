import React, { useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { nombreCategoria } from '../../data/contenido';
import { norm } from '../../lib/texto';
import { useStore } from '../../store';
import { haceCuanto, textoPrecio } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { Card, Chip, Group, Screen } from '../../ui/kit';
import { T } from '../../ui/T';
import { C, FONT } from '../../ui/theme';

type Filtro = 'todos' | 'hay' | 'agotado';

export default function MisProductos() {
  const { s, negocio, setDisponible } = useStore();
  const [q, setQ] = useState('');
  const [filtro, setFiltro] = useState<Filtro>('todos');
  if (!negocio) return null;

  const propios = s.productos.filter((p) => p.negocioId === negocio.id);
  const lista = propios
    .filter((p) => (filtro === 'todos' ? true : filtro === 'hay' ? p.disponible : !p.disponible))
    .filter((p) => !q.trim() || norm(p.nombre).includes(norm(q.trim())))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const hay = propios.filter((p) => p.disponible).length;
  const agotados = propios.length - hay;

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ flex: 1, gap: 2 }}>
          <T size={24} weight={800} ls={-0.02}>
            Mis productos
          </T>
          <T size={13} color={C.muted}>
            {propios.length
              ? `${hay} ${hay === 1 ? 'disponible' : 'disponibles'} · ${agotados} ${agotados === 1 ? 'agotado' : 'agotados'}`
              : 'Escribe tú mismo lo que vendes'}
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          onPress={() => router.push('/producto-form')}
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Icon name="plus" size={18} color={C.white} />
          <T size={14} weight={700} color={C.white}>
            Agregar
          </T>
        </Pressable>
      </View>

      {propios.length > 4 ? (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
          <Icon name="search" size={18} color={C.muted} />
          <TextInput
            value={q}
            onChangeText={setQ}
            placeholder="Buscar en mis productos"
            placeholderTextColor={C.placeholder}
            accessibilityLabel="Buscar en mis productos"
            style={{ flex: 1, minWidth: 0, fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
          />
        </View>
      ) : null}

      {propios.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          <Chip label="Todos" h={38} px={14} size={13} active={filtro === 'todos'} onPress={() => setFiltro('todos')} />
          <Chip label="Disponibles" h={38} px={14} size={13} active={filtro === 'hay'} onPress={() => setFiltro('hay')} />
          <Chip label="Agotados" h={38} px={14} size={13} active={filtro === 'agotado'} onPress={() => setFiltro('agotado')} />
        </View>
      ) : null}

      {propios.length === 0 ? (
        <Card style={{ gap: 8, padding: 20 }}>
          <T size={16} weight={700}>
            Aún no has publicado productos
          </T>
          <T size={14} lh={1.45} color={C.muted}>
            No hay lista fija: escribe el nombre de cada cosa que vendes (por ejemplo «Quesillo», «Fresas con crema», «Pastel de tres leches» o «Comida corrida»), pon el precio y cómo se vende (kilo, vaso, rebanada, porción…) y marca si hay o ya se acabó. Los clientes lo verán al momento.
          </T>
        </Card>
      ) : lista.length === 0 ? (
        <T size={14} color={C.muted}>
          No hay productos con ese filtro.
        </T>
      ) : (
        <Group>
          {lista.map((p) => (
            <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, paddingLeft: 14, paddingRight: 12 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Editar ${p.nombre}`}
                onPress={() => router.push({ pathname: '/producto-form', params: { id: p.id } })}
                style={{ flex: 1, gap: 2 }}
              >
                <T size={15} weight={600} color={p.disponible ? C.ink : C.muted}>
                  {p.nombre}
                </T>
                <T size={13} color={C.muted}>
                  {textoPrecio(p.precio, p.unidad)}
                  {p.porEncargo ? ' · por encargo' : ''}
                </T>
                <T size={12} color={C.muted} numberOfLines={1}>
                  {nombreCategoria(p.categoria)} · {haceCuanto(p.actualizado)}
                </T>
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`${p.nombre}: ${p.disponible ? 'Disponible' : 'Agotado'}. Tocar para cambiar`}
                onPress={() => setDisponible(p.id, !p.disponible)}
                style={{ height: 36, paddingHorizontal: 12, borderRadius: 18, backgroundColor: p.disponible ? C.greenTint : C.redTint, alignItems: 'center', justifyContent: 'center' }}
              >
                <T size={12} weight={700} color={p.disponible ? C.greenDark : C.red}>
                  {p.disponible ? (p.porEncargo ? 'Acepto pedidos' : 'Disponible') : p.porEncargo ? 'Sin pedidos' : 'Agotado'}
                </T>
              </Pressable>
            </View>
          ))}
        </Group>
      )}
    </Screen>
  );
}
