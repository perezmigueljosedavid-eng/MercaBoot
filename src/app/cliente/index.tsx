import React, { useMemo, useState } from 'react';
import { TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { chipDeGiro } from '../../data/contenido';
import { tiendasSegun, useNegociosOrdenados, VISTAS_TIENDAS, VistaTiendas } from '../../lib/usarDatos';
import { useStore } from '../../store';
import { Icon } from '../../ui/Icon';
import { Chip, Screen, SectionTitle } from '../../ui/kit';
import { NegocioCard } from '../../ui/NegocioCard';
import { T } from '../../ui/T';
import { UbicacionBanner } from '../../ui/UbicacionBanner';
import { C, FONT } from '../../ui/theme';

export default function HomeCliente() {
  const { cuenta, favoritos } = useStore();
  const lista = useNegociosOrdenados();
  const [cat, setCat] = useState('Todos');
  const [vista, setVista] = useState<VistaTiendas>('cerca');
  const [busqueda, setBusqueda] = useState('');

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(lista.map((d) => chipDeGiro(d.n.giro))))], [lista]);
  const categoria = categorias.includes(cat) ? cat : 'Todos';
  const negocios = useMemo(
    () => tiendasSegun(lista.filter((d) => categoria === 'Todos' || chipDeGiro(d.n.giro) === categoria), vista),
    [lista, categoria, vista],
  );
  const notaVista = VISTAS_TIENDAS.find((v) => v.id === vista)?.nota;
  const nombre = cuenta?.nombre.split(' ')[0] ?? '';

  return (
    <Screen contentStyle={{ gap: 22, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      {/* saludo */}
      <View style={{ gap: 2 }}>
        <T size={14} color={C.muted}>
          Hola, {nombre}
        </T>
        <T size={24} weight={800} ls={-0.02}>
          ¿Qué buscas hoy?
        </T>
      </View>

      {/* buscador */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 50,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: C.white,
          borderWidth: 1,
          borderColor: C.line,
        }}
      >
        <Icon name="search" size={20} color={C.muted} />
        <TextInput
          value={busqueda}
          onChangeText={setBusqueda}
          placeholder="Busca un producto o negocio"
          placeholderTextColor={C.placeholder}
          accessibilityLabel="Buscar"
          returnKeyType="search"
          onSubmitEditing={() => router.push({ pathname: '/cliente/buscar', params: { q: busqueda } })}
          style={{ flex: 1, minWidth: 0, fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
        />
      </View>

      <UbicacionBanner />

      {/* tiendas */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Tiendas para ti" />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {VISTAS_TIENDAS.map((v) => (
            <Chip key={v.id} label={v.label} h={38} px={14} size={13} tone="green" active={vista === v.id} onPress={() => setVista(v.id)} />
          ))}
        </View>
        {notaVista ? (
          <T size={12} lh={1.4} color={C.muted}>
            {notaVista}
          </T>
        ) : null}
        {categorias.length > 2 ? (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {categorias.map((c) => (
              <Chip key={c} label={c} h={34} px={12} size={12} active={categoria === c} onPress={() => setCat(c)} />
            ))}
          </View>
        ) : null}
        {negocios.length === 0 ? (
          <T size={14} lh={1.45} color={C.muted}>
            {vista === 'domicilio'
              ? 'Ninguna tienda de esta lista ofrece entrega a domicilio por ahora.'
              : vista === 'abiertas'
                ? 'Ahorita no hay tiendas abiertas en esta lista. Las tiendas que todavía no usan Mercaboot no muestran su horario.'
                : 'Aún no hay negocios en esta categoría.'}
          </T>
        ) : (
          negocios.map((d) => <NegocioCard key={d.n.id} d={d} favorito={favoritos.includes(d.n.id)} />)
        )}
      </View>
    </Screen>
  );
}
