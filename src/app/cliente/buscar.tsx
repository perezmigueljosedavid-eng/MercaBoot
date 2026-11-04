import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { nombreCategoria } from '../../data/contenido';
import { etiquetaDistancia } from '../../lib/geo';
import { useUbicacion } from '../../lib/ubicacion';
import { buscarNegocios, buscarProductos, useNegociosOrdenados } from '../../lib/usarDatos';
import { useStore } from '../../store';
import { textoPrecio } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { Badge, Chip, Screen, Tag } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { NegocioCard } from '../../ui/NegocioCard';
import { T } from '../../ui/T';
import { C, FONT } from '../../ui/theme';

export default function Buscar() {
  const params = useLocalSearchParams<{ q?: string }>();
  const { s, favoritos } = useStore();
  const { coords } = useUbicacion();
  const negocios = useNegociosOrdenados();
  const [q, setQ] = useState(params.q ?? '');
  const [disponible, setDisponible] = useState(false);
  const [domicilio, setDomicilio] = useState(false);

  // Si llegas desde el buscador del inicio con un texto nuevo, se pone en el campo.
  const [qAnterior, setQAnterior] = useState(params.q);
  if (params.q !== qAnterior) {
    setQAnterior(params.q);
    if (typeof params.q === 'string') setQ(params.q);
  }

  const consulta = q.trim();

  const productos = useMemo(() => {
    let lista = consulta ? buscarProductos(consulta, s.productos, s.negocios, coords) : [];
    if (disponible) lista = lista.filter((r) => r.p.disponible);
    if (domicilio) lista = lista.filter((r) => r.n.aDomicilio);
    return lista;
  }, [consulta, s.productos, s.negocios, coords, disponible, domicilio]);

  const tiendas = useMemo(() => {
    let lista = consulta ? buscarNegocios(consulta, negocios) : negocios;
    if (domicilio) lista = lista.filter((d) => d.n.aDomicilio);
    if (disponible) lista = lista.filter((d) => d.disponibles > 0);
    return lista;
  }, [consulta, negocios, domicilio, disponible]);

  const hayProductosPublicados = s.productos.length > 0;

  return (
    <Screen contentStyle={{ gap: 16, paddingTop: 16, paddingHorizontal: 20, paddingBottom: 16 }}>
      <T size={24} weight={800} ls={-0.02}>
        Buscar
      </T>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 10,
          height: 50,
          paddingHorizontal: 16,
          borderRadius: 14,
          backgroundColor: C.white,
          borderWidth: 1.5,
          borderColor: C.green,
        }}
      >
        <Icon name="search" size={20} color={C.muted} />
        <TextInput
          value={q}
          onChangeText={setQ}
          placeholder="Busca un producto o negocio"
          placeholderTextColor={C.placeholder}
          accessibilityLabel="Buscar"
          returnKeyType="search"
          style={{ flex: 1, minWidth: 0, fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
        />
        {q ? (
          <Pressable accessibilityRole="button" accessibilityLabel="Borrar búsqueda" hitSlop={10} onPress={() => setQ('')}>
            <Icon name="close" size={18} color={C.muted} />
          </Pressable>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Chip label="Disponible ahora" h={38} px={14} size={13} active={disponible} onPress={() => setDisponible((v) => !v)} />
        <Chip label="A domicilio" h={38} px={14} size={13} active={domicilio} onPress={() => setDomicilio((v) => !v)} />
      </View>

      {consulta ? (
        <>
          <T size={14} color={C.muted}>
            Productos para “{consulta}”
          </T>
          <View style={{ gap: 10 }}>
            {productos.length === 0 ? (
              <T size={14} lh={1.45} color={C.muted}>
                {hayProductosPublicados
                  ? 'Ninguna tienda tiene publicado eso por ahora. Prueba con otra palabra.'
                  : 'Las tiendas todavía no han publicado productos. En cuanto lo hagan, los verás aquí.'}
              </T>
            ) : (
              productos.map(({ p, n, dist }) => (
                <Pressable
                  key={p.id}
                  accessibilityRole="button"
                  onPress={() => router.push(`/negocio/${n.id}`)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 12,
                    padding: 12,
                    borderRadius: 16,
                    backgroundColor: C.white,
                    borderWidth: 1,
                    borderColor: C.line,
                    opacity: p.disponible ? 1 : 0.75,
                  }}
                >
                  <Logo uri={n.logoUri} nombre={n.nombre} size={52} />
                  <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
                    <T size={15} weight={700} color={p.disponible ? C.ink : C.muted}>
                      {p.nombre}
                    </T>
                    <T size={13} color={C.muted} numberOfLines={2}>
                      {[n.nombre, etiquetaDistancia(dist) ?? n.direccion].filter(Boolean).join(' · ')}
                    </T>
                    <T size={13} weight={600}>
                      {textoPrecio(p.precio, p.unidad)} <T size={12} color={C.muted}>· {nombreCategoria(p.categoria)}</T>
                    </T>
                    {n.aDomicilio ? (
                      <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                        <Tag bg={C.greenTint} fg={C.greenDark}>
                          A domicilio
                        </Tag>
                      </View>
                    ) : null}
                  </View>
                  <Badge bg={p.disponible ? C.greenTint : C.redTint} fg={p.disponible ? C.greenDark : C.red}>
                    {p.disponible ? (p.porEncargo ? 'Por encargo' : 'Hay') : p.porEncargo ? 'Sin pedidos' : 'Agotado'}
                  </Badge>
                </Pressable>
              ))
            )}
          </View>
        </>
      ) : null}

      <T size={14} color={C.muted}>
        {consulta ? `Negocios para “${consulta}”` : 'Todos los negocios'}
      </T>
      <View style={{ gap: 12 }}>
        {tiendas.length === 0 ? (
          <T size={14} color={C.muted}>
            No encontramos negocios con esos datos.
          </T>
        ) : (
          tiendas.map((d) => <NegocioCard key={d.n.id} d={d} frecuente={favoritos.includes(d.n.id)} />)
        )}
      </View>
    </Screen>
  );
}
