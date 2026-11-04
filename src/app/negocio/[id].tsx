import React, { useMemo } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nombreCategoria } from '../../data/contenido';
import { abrirMapas, abrirTelefono, distanciaA, etiquetaDistancia } from '../../lib/geo';
import { useUbicacion } from '../../lib/ubicacion';
import { useStore } from '../../store';
import { haceCuanto, textoPrecio } from '../../ui/bits';
import { Icon, IconName } from '../../ui/Icon';
import { Badge, BackBtn, Btn, Card, Group, OpenDot, Screen, Tag } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { T } from '../../ui/T';
import { C } from '../../ui/theme';

function Dato({ icono, texto }: { icono: IconName; texto: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 8 }}>
      <View style={{ marginTop: 1 }}>
        <Icon name={icono} size={16} color={C.muted} />
      </View>
      <T size={14} lh={1.35} color={C.greyText} style={{ flex: 1 }}>
        {texto}
      </T>
    </View>
  );
}

export default function Negocio() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { s, cuenta, favoritos, toggleFavorito, cambiarModo } = useStore();
  const insets = useSafeAreaInsets();
  const { coords } = useUbicacion();

  const n = s.negocios.find((x) => x.id === id);
  const productos = useMemo(() => s.productos.filter((p) => p.negocioId === id), [s.productos, id]);

  if (!n) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          Este negocio ya no está disponible.
        </T>
      </Screen>
    );
  }

  const reclamado = !!n.duenoId;
  const esMio = !!cuenta && n.duenoId === cuenta.id;
  // Marcar favorito es cosa de cliente, y nadie lo hace con su propio negocio.
  const esCliente = cuenta?.rol === 'cliente' && !esMio;
  const frecuente = favoritos.includes(n.id);
  const disponibles = productos.filter((p) => p.disponible);
  const agotados = productos.filter((p) => !p.disponible);
  const ultima = productos.reduce((m, p) => Math.max(m, p.actualizado), 0);
  const dist = etiquetaDistancia(distanciaA(n, coords));

  const fila = (p: (typeof productos)[number]) => (
    <View key={p.id} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14 }}>
      <View style={{ flex: 1, gap: 3 }}>
        <T size={15} weight={600} color={p.disponible ? C.ink : C.muted}>
          {p.nombre}
        </T>
        <T size={13} color={C.muted}>
          {textoPrecio(p.precio, p.unidad)}
          {p.porEncargo ? ' · por encargo' : ''}
        </T>
        <T size={12} color={C.muted}>
          {nombreCategoria(p.categoria)}
        </T>
      </View>
      <Badge bg={p.disponible ? C.greenTint : C.redTint} fg={p.disponible ? C.greenDark : C.red}>
        {p.disponible ? (p.porEncargo ? 'Por encargo' : 'Hay') : p.porEncargo ? 'Sin pedidos' : 'Agotado'}
      </Badge>
    </View>
  );

  return (
    <Screen bottomInset contentStyle={{ paddingTop: 0, paddingBottom: 24 }}>
      {/* portada */}
      <View style={{ height: 120 + insets.top, paddingTop: insets.top + 8, paddingHorizontal: 12, backgroundColor: C.greenTint }}>
        <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.white }}>
          <BackBtn />
        </View>
      </View>

      <View style={{ gap: 14, paddingHorizontal: 20 }}>
        <View style={{ marginTop: -44, flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between' }}>
          <View style={{ borderWidth: 4, borderColor: C.bg, borderRadius: 26, backgroundColor: C.bg }}>
            <Logo uri={n.logoUri} nombre={n.nombre} size={84} r={22} />
          </View>
          {reclamado ? <OpenDot abierto={n.abierto} size={13} /> : null}
        </View>

        <View style={{ gap: 4 }}>
          <T size={24} weight={800} ls={-0.02}>
            {n.nombre}
          </T>
          <View style={{ flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <T size={14} color={C.muted}>
              {n.giro}
            </T>
            {n.aDomicilio ? (
              <Tag bg={C.greenTint} fg={C.greenDark}>
                A domicilio
              </Tag>
            ) : null}
          </View>
        </View>

        {n.descripcion ? (
          <T size={14} lh={1.45} color={C.greyText}>
            {n.descripcion}
          </T>
        ) : null}

        <View style={{ gap: 8 }}>
          <Dato icono="pin" texto={[n.direccion, dist].filter(Boolean).join(' · ') || 'Dirección sin registrar. Usa «Cómo llegar» para ver el mapa.'} />
          {n.horario ? <Dato icono="clock" texto={n.horario} /> : null}
          {n.telefono ? <Dato icono="phone" texto={n.telefono} /> : null}
          {n.aDomicilio && n.zonaEntrega ? <Dato icono="navigation" texto={`Entrega a domicilio: ${n.zonaEntrega}`} /> : null}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Btn label="Cómo llegar" h={46} r={12} size={14} flex={1} onPress={() => abrirMapas(n)} />
          {n.telefono ? (
            <Btn label="Llamar" variant="outline" h={46} r={12} size={14} flex={1} onPress={() => abrirTelefono(n.telefono as string)} />
          ) : null}
          {reclamado && esCliente ? (
            <Btn label="Chatear" variant="outline" h={46} r={12} size={14} flex={1} onPress={() => router.push(`/chat-negocio/${n.id}`)} />
          ) : null}
        </View>

        {esCliente ? (
          <Pressable
            accessibilityRole="button"
            accessibilityState={{ selected: frecuente }}
            onPress={() => toggleFavorito(n.id)}
            style={{
              height: 46,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: frecuente ? C.amber : C.input,
              backgroundColor: frecuente ? C.amberTint : C.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T size={14} weight={600} color={frecuente ? C.amberText : C.ink}>
              {frecuente ? '♥' : '♡'} Cliente frecuente
            </T>
          </Pressable>
        ) : null}

        {esMio ? (
          <Card style={{ gap: 10, padding: 16, backgroundColor: C.greenTint, borderColor: C.green }}>
            <T size={15} weight={700} color={C.greenDark}>
              Así ven tu negocio los clientes
            </T>
            <T size={13} lh={1.45} color={C.greenDark}>
              Para cambiar tus productos o tus datos, pasa a tu modo comerciante.
            </T>
            <Btn
              label="Ir a mi negocio"
              h={44}
              r={12}
              size={14}
              onPress={() => {
                if (!cambiarModo('comerciante')) router.replace('/comerciante');
              }}
            />
          </Card>
        ) : null}

        {!reclamado ? (
          <Card style={{ gap: 10, padding: 16, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={15} weight={700} color={C.amberDeep}>
              Este negocio aún no publica en Mercaboot
            </T>
            <T size={13} lh={1.45} color={C.amberDeep}>
              Está en el directorio de la comunidad para que lo encuentres, pero todavía no comparte qué productos tiene. ¿Eres el dueño? Para proteger a cada negocio, solo se reclama con el código que el equipo de Mercaboot entrega a su dueño. {cuenta ? 'Si lo tienes, reclámalo con tu misma cuenta.' : 'Si lo tienes, crea tu cuenta y reclámalo.'} Si no eres el dueño, no hace falta que toques nada.
            </T>
            {!cuenta?.negocioId ? (
              <Btn
                label="Soy el dueño, tengo mi código"
                variant="amber"
                h={44}
                r={12}
                size={14}
                onPress={() =>
                  cuenta
                    ? router.push({ pathname: '/abrir-negocio', params: { reclamar: n.id } })
                    : router.push({ pathname: '/registro', params: { rol: 'comerciante', reclamar: n.id } })
                }
              />
            ) : null}
          </Card>
        ) : null}

        <T size={18} weight={800} ls={-0.01}>
          Productos
        </T>

        {productos.length === 0 ? (
          <T size={14} lh={1.45} color={C.muted}>
            {reclamado ? 'Este negocio todavía no ha publicado sus productos.' : 'Cuando el dueño se una a Mercaboot, aquí verás qué tiene disponible cada día.'}
          </T>
        ) : (
          <View style={{ gap: 12 }}>
            {ultima ? (
              <T size={12} color={C.muted}>
                Productos actualizados {haceCuanto(ultima)}
              </T>
            ) : null}
            {disponibles.length ? <Group>{disponibles.map(fila)}</Group> : null}
            {agotados.length ? (
              <>
                <T size={13} weight={700} color={C.muted}>
                  Agotados por ahora
                </T>
                <Group>{agotados.map(fila)}</Group>
              </>
            ) : null}
          </View>
        )}
      </View>
    </Screen>
  );
}
