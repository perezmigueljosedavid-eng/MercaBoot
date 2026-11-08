import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { chipDeGiro } from '../../data/contenido';
import { insigniasDeTiendas, tiendasSegun, useNegociosOrdenados, VISTAS_TIENDAS, VistaTiendas } from '../../lib/usarDatos';
import { avisosVigentes, useStore } from '../../store';
import { LoMasBarato } from '../../ui/Baratas';
import { AvisoFila } from '../../ui/bits';
import { FiestaCerca } from '../../ui/FiestaCerca';
import { Icon } from '../../ui/Icon';
import { Chip, Group, Screen, SectionTitle } from '../../ui/kit';
import { NegocioCard } from '../../ui/NegocioCard';
import { T } from '../../ui/T';
import { C, FONT } from '../../ui/theme';
import { UbicacionBanner } from '../../ui/UbicacionBanner';

export default function HomeCliente() {
  const { s, cuenta, favoritos } = useStore();
  const lista = useNegociosOrdenados();
  const [cat, setCat] = useState('Todos');
  const [vista, setVista] = useState<VistaTiendas>('cerca');
  const [busqueda, setBusqueda] = useState('');
  const [antojo, setAntojo] = useState('');

  const categorias = useMemo(() => ['Todos', ...Array.from(new Set(lista.map((d) => chipDeGiro(d.n.giro))))], [lista]);
  const categoria = categorias.includes(cat) ? cat : 'Todos';
  const negocios = useMemo(
    () => tiendasSegun(lista.filter((d) => categoria === 'Todos' || chipDeGiro(d.n.giro) === categoria), vista),
    [lista, categoria, vista],
  );
  // En qué destaca cada tienda frente a las que se están viendo (más cercana, mejor calificada…)
  const insignias = useMemo(() => insigniasDeTiendas(negocios), [negocios]);
  const notaVista = VISTAS_TIENDAS.find((v) => v.id === vista)?.nota;

  const avisos = useMemo(() => avisosVigentes(s.avisos), [s.avisos]);
  const nombreDe = (id: string) => s.negocios.find((n) => n.id === id)?.nombre ?? 'Negocio';
  const nombre = cuenta?.nombre.split(' ')[0] ?? '';

  return (
    <Screen contentStyle={{ gap: 22, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 24 }}>
      {/* saludo */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <View style={{ gap: 2, flex: 1 }}>
          <T size={14} color={C.muted}>
            Hola, {nombre}
          </T>
          <T size={24} weight={800} ls={-0.02}>
            ¿Qué buscas hoy?
          </T>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Avisos y novedades"
          onPress={() => router.push('/novedades')}
          style={{
            width: 44,
            height: 44,
            borderRadius: 22,
            borderWidth: 1,
            borderColor: C.line,
            backgroundColor: C.white,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Icon name="bell" size={20} color={C.ink} />
          {avisos.length ? (
            <View
              style={{ position: 'absolute', top: 9, right: 10, width: 9, height: 9, borderRadius: 5, backgroundColor: C.amber, borderWidth: 1.5, borderColor: C.white }}
            />
          ) : null}
        </Pressable>
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

      {/* tarjeta de IA */}
      <View style={{ gap: 14, padding: 20, borderRadius: 20, backgroundColor: C.green }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="sparkles" size={20} color={C.green} />
          </View>
          <T size={18} weight={700} color={C.white}>
            ¿Qué se te antoja?
          </T>
        </View>
        <T size={14} lh={1.45} color={C.white}>
          Dinos tu antojo y te damos ideas de recetas con lo que hay hoy en las tiendas de tu comunidad, y te decimos dónde conseguirlo.
        </T>
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            gap: 8,
            height: 48,
            paddingLeft: 14,
            paddingRight: 6,
            borderRadius: 12,
            backgroundColor: C.white,
          }}
        >
          <TextInput
            value={antojo}
            onChangeText={setAntojo}
            placeholder="Ej. algo dulce"
            placeholderTextColor={C.placeholder}
            accessibilityLabel="Tu antojo"
            onSubmitEditing={() => router.push({ pathname: '/ideas-ia', params: { antojo, t: String(Date.now()) } })}
            style={{ flex: 1, minWidth: 0, fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
          />
          <Pressable
            accessibilityRole="button"
            onPress={() => router.push({ pathname: '/ideas-ia', params: { antojo, t: String(Date.now()) } })}
            style={{ height: 36, paddingHorizontal: 14, borderRadius: 9, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' }}
          >
            <T size={14} weight={700}>
              Pedir ideas
            </T>
          </Pressable>
        </View>
      </View>

      {/* fiesta que se acerca */}
      <FiestaCerca />

      {/* lo más barato */}
      <LoMasBarato />

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
          negocios.map((d) => <NegocioCard key={d.n.id} d={d} favorito={favoritos.includes(d.n.id)} insignias={insignias.get(d.n.id)} />)
        )}
      </View>

      {/* avisos */}
      <View style={{ gap: 12 }}>
        <SectionTitle title="Avisos de hoy" link={avisos.length ? 'Ver todos' : undefined} onLink={() => router.push('/novedades')} />
        {avisos.length ? (
          <Group>
            {avisos.slice(0, 3).map((a) => (
              <AvisoFila key={a.id} a={{ ...a, negocio: nombreDe(a.negocioId) }} />
            ))}
          </Group>
        ) : (
          <T size={14} lh={1.45} color={C.muted}>
            Todavía no hay avisos. Cuando las tiendas publiquen promociones, regalos o lo que hay hoy, aparecerán aquí.
          </T>
        )}
      </View>
    </Screen>
  );
}
