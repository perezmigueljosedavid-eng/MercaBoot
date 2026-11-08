import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { nombreCategoria } from '../../data/contenido';
import { precioBase } from '../../ia/comparar';
import {
  buscarNegocios,
  buscarProductos,
  insigniasDeTiendas,
  ordenarEncontrados,
  OrdenProductos,
  tiendasSegun,
  useNegociosOrdenados,
} from '../../lib/usarDatos';
import { etiquetaDistancia } from '../../lib/geo';
import { useUbicacion } from '../../lib/ubicacion';
import { useStore } from '../../store';
import { textoPrecio } from '../../ui/bits';
import { Icon } from '../../ui/Icon';
import { Badge, Chip, Screen, Tag } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { NegocioCard } from '../../ui/NegocioCard';
import { textoEstrellas } from '../../ui/Reputacion';
import { T } from '../../ui/T';
import { C, FONT } from '../../ui/theme';

const ORDENES: { id: OrdenProductos; label: string }[] = [
  { id: 'cerca', label: 'Más cerca' },
  { id: 'precio', label: 'Más barato' },
  { id: 'estrellas', label: 'Mejor calificadas' },
];

const NOTA_ORDEN: Record<OrdenProductos, string> = {
  cerca: 'De la tienda más cercana a la más lejana.',
  precio: 'Del precio más bajo al más alto, comparando solo la misma medida (kilo con kilo, pieza con pieza).',
  estrellas: 'Por estrellas de los clientes. Las tiendas sin reseñas también aparecen.',
};

export default function Buscar() {
  const params = useLocalSearchParams<{ q?: string }>();
  const { s, favoritos } = useStore();
  const { coords } = useUbicacion();
  const negocios = useNegociosOrdenados();
  const [q, setQ] = useState(params.q ?? '');
  const [disponible, setDisponible] = useState(false);
  const [domicilio, setDomicilio] = useState(false);
  const [orden, setOrden] = useState<OrdenProductos>('cerca');

  // Si llegas desde el buscador del inicio con un texto nuevo, se pone en el campo.
  const [qAnterior, setQAnterior] = useState(params.q);
  if (params.q !== qAnterior) {
    setQAnterior(params.q);
    if (typeof params.q === 'string') setQ(params.q);
  }

  const consulta = q.trim();

  const productos = useMemo(() => {
    let lista = buscarProductos(consulta, s.productos, s.negocios, coords, s.resenas);
    if (disponible) lista = lista.filter((r) => r.p.disponible);
    if (domicilio) lista = lista.filter((r) => r.n.aDomicilio);
    return ordenarEncontrados(lista, orden);
  }, [consulta, s.productos, s.negocios, s.resenas, coords, disponible, domicilio, orden]);

  // El más barato solo se marca cuando hay con qué compararlo: mismo tipo de medida y al menos dos tiendas distintas
  const masBaratos = useMemo(() => {
    const res = new Set<string>();
    const cmp = productos
      .filter((r) => r.p.disponible)
      .map((r) => ({ id: r.p.id, negocio: r.n.id, pb: precioBase(r.p.precio, r.p.unidad) }))
      .filter((x): x is { id: string; negocio: string; pb: NonNullable<typeof x.pb> } => !!x.pb);
    const porBase = new Map<string, typeof cmp>();
    for (const x of cmp) porBase.set(x.pb.base, [...(porBase.get(x.pb.base) ?? []), x]);
    for (const grupo of porBase.values()) {
      if (new Set(grupo.map((g) => g.negocio)).size < 2) continue;
      const min = Math.min(...grupo.map((g) => g.pb.valor));
      const max = Math.max(...grupo.map((g) => g.pb.valor));
      if (max - min < 0.005) continue;
      grupo.filter((g) => g.pb.valor - min < 0.005).forEach((g) => res.add(g.id));
    }
    return res;
  }, [productos]);

  const tiendas = useMemo(() => {
    let lista = consulta ? buscarNegocios(consulta, negocios) : negocios;
    if (domicilio) lista = lista.filter((d) => d.n.aDomicilio);
    if (disponible) lista = lista.filter((d) => d.disponibles > 0);
    return tiendasSegun(lista, orden === 'estrellas' ? 'estrellas' : 'cerca');
  }, [consulta, negocios, domicilio, disponible, orden]);
  const insignias = useMemo(() => insigniasDeTiendas(tiendas), [tiendas]);

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

      <View style={{ gap: 8 }}>
        <T size={12} weight={700} color={C.muted}>
          Ordenar por
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {ORDENES.map((o) => (
            <Chip key={o.id} label={o.label} h={38} px={14} size={13} tone="green" active={orden === o.id} onPress={() => setOrden(o.id)} />
          ))}
        </View>
        <T size={12} lh={1.4} color={C.muted}>
          {NOTA_ORDEN[orden]}
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
          <Chip label="Disponible ahora" h={38} px={14} size={13} active={disponible} onPress={() => setDisponible((v) => !v)} />
          <Chip label="A domicilio" h={38} px={14} size={13} active={domicilio} onPress={() => setDomicilio((v) => !v)} />
        </View>
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
                  ? 'Ninguna tienda tiene publicado eso por ahora. Prueba con otra palabra o pregúntale a una tienda por chat.'
                  : 'Las tiendas todavía no han publicado productos. En cuanto lo hagan, los verás aquí.'}
              </T>
            ) : (
              productos.map(({ p, n, dist, rep }) => (
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
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                      <T size={12} weight={rep.promedio != null ? 700 : 500} color={rep.promedio != null ? C.amberText : C.muted}>
                        {textoEstrellas(rep.promedio, rep.total)}
                      </T>
                      {n.aDomicilio ? (
                        <Tag bg={C.greenTint} fg={C.greenDark}>
                          A domicilio
                        </Tag>
                      ) : null}
                      {masBaratos.has(p.id) ? (
                        <Tag bg={C.green} fg={C.white}>
                          Más económico
                        </Tag>
                      ) : null}
                    </View>
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
        {consulta ? `Negocios para “${consulta}”` : orden === 'estrellas' ? 'Todos los negocios, de mejor a menor calificación' : 'Todos los negocios, del más cercano al más lejano'}
      </T>
      <View style={{ gap: 12 }}>
        {tiendas.length === 0 ? (
          <T size={14} color={C.muted}>
            No encontramos negocios con esos datos.
          </T>
        ) : (
          tiendas.map((d) => <NegocioCard key={d.n.id} d={d} favorito={favoritos.includes(d.n.id)} insignias={insignias.get(d.n.id)} />)
        )}
      </View>
    </Screen>
  );
}
