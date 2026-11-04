import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { nombreCategoria } from '../../data/contenido';
import { abrirMapas, abrirTelefono, distanciaA, etiquetaDistancia } from '../../lib/geo';
import { useUbicacion } from '../../lib/ubicacion';
import { cantidadTexto, dinero, disponibleParaPedir, minutosEnPalabras, pasoCantidad, sePuedePedir } from '../../lib/pedidos';
import { OTRO_NEGOCIO, useStore } from '../../store';
import { haceCuanto, textoPrecio } from '../../ui/bits';
import { Confirmar } from '../../ui/Dialogo';
import { Icon, IconName } from '../../ui/Icon';
import { Badge, BackBtn, Btn, Card, Group, OpenDot, Screen, Tag } from '../../ui/kit';
import { Logo } from '../../ui/Logo';
import { Stepper } from '../../ui/pedidos';
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
  const { s, cuenta, favoritos, toggleFavorito, cambiarModo, carrito, agregarAlCarrito, ponerCantidad } = useStore();
  const insets = useSafeAreaInsets();
  const { coords } = useUbicacion();
  const [cambio, setCambio] = useState<string | null>(null);
  const [mensaje, setMensaje] = useState('');

  // El aviso se quita solo.
  useEffect(() => {
    if (!mensaje) return;
    const t = setTimeout(() => setMensaje(''), 4500);
    return () => clearTimeout(t);
  }, [mensaje]);

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
  const favorito = favoritos.includes(n.id);
  const miTrato = cuenta ? s.frecuentes.find((f) => f.negocioId === n.id && f.clienteId === cuenta.id) : undefined;
  // Se puede apartar si es un negocio con dueño que recibe pedidos y quien mira es un cliente (no el dueño).
  const recibePedidos = reclamado && n.aceptaPedidos;
  const puedePedir = esCliente && recibePedidos;
  const enCarrito = (productoId: string) => (carrito?.negocio.id === n.id ? (carrito.lineas.find((l) => l.producto.id === productoId)?.cantidad ?? 0) : 0);
  const agregar = (productoId: string) => {
    const r = agregarAlCarrito(productoId);
    if (r === OTRO_NEGOCIO) setCambio(productoId);
    else if (r) setMensaje(r);
  };
  const disponibles = productos.filter((p) => p.disponible);
  const agotados = productos.filter((p) => !p.disponible);
  const ultima = productos.reduce((m, p) => Math.max(m, p.actualizado), 0);
  const dist = etiquetaDistancia(distanciaA(n, coords));

  const fila = (p: (typeof productos)[number]) => {
    const libre = p.cantidad == null ? null : Math.max(0, p.cantidad - p.apartado);
    const todoApartado = p.disponible && libre === 0;
    const cant = enCarrito(p.id);
    const tope = disponibleParaPedir(p);
    return (
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
            {p.disponible && libre != null && libre > 0 ? ` · Quedan ${cantidadTexto(libre)}` : ''}
            {todoApartado ? ' · Todo apartado por ahora' : ''}
          </T>
        </View>
        <View style={{ alignItems: 'flex-end', gap: 8 }}>
          <Badge bg={todoApartado ? C.amberTint : p.disponible ? C.greenTint : C.redTint} fg={todoApartado ? C.amberText : p.disponible ? C.greenDark : C.red}>
            {todoApartado ? 'Apartado' : p.disponible ? (p.porEncargo ? 'Por encargo' : 'Hay') : p.porEncargo ? 'Sin pedidos' : 'Agotado'}
          </Badge>
          {puedePedir && sePuedePedir(p) ? (
            cant > 0 ? (
              <Stepper
                chico
                cantidad={cant}
                etiqueta={p.nombre}
                masDeshabilitado={cant >= tope}
                onMenos={() => {
                  const r = ponerCantidad(p.id, cant - pasoCantidad(p.unidad));
                  if (r) setMensaje(r);
                }}
                onMas={() => agregar(p.id)}
              />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={`Agregar ${p.nombre} al carrito`}
                onPress={() => agregar(p.id)}
                style={{ height: 36, paddingHorizontal: 14, borderRadius: 18, backgroundColor: C.green, flexDirection: 'row', alignItems: 'center', gap: 6 }}
              >
                <Icon name="plus" size={15} color={C.white} />
                <T size={13} weight={700} color={C.white}>
                  Agregar
                </T>
              </Pressable>
            )
          ) : null}
        </View>
      </View>
    );
  };

  const barra = carrito && esCliente;

  return (
    <View style={{ flex: 1 }}>
    <Screen bottomInset contentStyle={{ paddingTop: 0, paddingBottom: barra ? 100 : 24 }}>
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
            accessibilityState={{ selected: favorito }}
            onPress={() => toggleFavorito(n.id)}
            style={{
              height: 46,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: favorito ? C.amber : C.input,
              backgroundColor: favorito ? C.amberTint : C.white,
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <T size={14} weight={600} color={favorito ? C.amberText : C.ink}>
              {favorito ? '♥ En tus favoritos' : '♡ Guardar en favoritos'}
            </T>
          </Pressable>
        ) : null}

        {miTrato ? (
          <Card style={{ gap: 4, padding: 14, backgroundColor: C.amberTint, borderColor: C.amber }}>
            <T size={15} weight={700} color={C.amberDeep}>
              ⭐ Eres cliente frecuente de este negocio
            </T>
            <T size={13} lh={1.4} color={C.amberDeep}>
              {[miTrato.descuentoPct > 0 ? `${miTrato.descuentoPct}% de descuento en tus pedidos` : '', miTrato.beneficio ?? ''].filter(Boolean).join(' · ')}
            </T>
          </Card>
        ) : null}

        {esCliente && reclamado ? (
          <Card style={{ gap: 4, padding: 14, backgroundColor: recibePedidos ? C.greenTint : C.grey, borderColor: recibePedidos ? C.green : C.line }}>
            <T size={14} weight={700} color={recibePedidos ? C.greenDark : C.greyText}>
              {recibePedidos ? '🛒 Aparta tu pedido desde aquí' : 'Por ahora no recibe pedidos en la app'}
            </T>
            <T size={13} lh={1.4} color={recibePedidos ? C.greenDark : C.greyText}>
              {recibePedidos
                ? `Agrega productos y aparta. Se te guarda ${minutosEnPalabras(n.apartadoMin)} mientras el negocio lo acepta y lo prepara. Pagas ${n.aceptaTransferencia ? 'en persona o por transferencia' : 'en persona'}${n.aDomicilio ? ' y puedes pedirlo a domicilio' : ''}.${n.abierto ? '' : ' Ahora está cerrado: espera a que abra.'}`
                : 'Puedes escribirle por el chat para preguntar o ponerte de acuerdo.'}
            </T>
          </Card>
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

    {barra ? (
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 12, gap: 8 }}>
        {mensaje ? (
          <View accessibilityRole="alert" style={{ borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.ink }}>
            <T size={13} weight={600} lh={1.4} color={C.white}>
              {mensaje}
            </T>
          </View>
        ) : null}
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Ver mi carrito"
          onPress={() => router.push('/carrito')}
          style={{ height: 56, borderRadius: 16, backgroundColor: C.green, paddingHorizontal: 18, flexDirection: 'row', alignItems: 'center', gap: 10 }}
        >
          <Icon name="cart" size={22} color={C.white} />
          <View style={{ flex: 1 }}>
            <T size={15} weight={700} color={C.white} numberOfLines={1}>
              Ver carrito · {carrito.cuantos} {carrito.cuantos === 1 ? 'producto' : 'productos'}
            </T>
            {carrito.negocio.id !== n.id ? (
              <T size={11} color="#CFE6D9" numberOfLines={1}>
                de {carrito.negocio.nombre}
              </T>
            ) : null}
          </View>
          <T size={16} weight={800} color={C.white}>
            {dinero(carrito.subtotal)}
          </T>
        </Pressable>
      </View>
    ) : mensaje ? (
      <View pointerEvents="none" style={{ position: 'absolute', left: 16, right: 16, bottom: insets.bottom + 16 }}>
        <View accessibilityRole="alert" style={{ borderRadius: 14, paddingVertical: 10, paddingHorizontal: 14, backgroundColor: C.ink }}>
          <T size={13} weight={600} lh={1.4} color={C.white}>
            {mensaje}
          </T>
        </View>
      </View>
    ) : null}

    <Confirmar
      visible={cambio != null}
      titulo="¿Empezar un carrito nuevo?"
      texto={`Tu carrito tiene productos de «${carrito?.negocio.nombre ?? 'otro negocio'}». Un pedido es de un solo negocio. ¿Quieres vaciarlo y agregar este producto de «${n.nombre}»?`}
      confirmar="Sí, cambiar"
      onCancelar={() => setCambio(null)}
      onConfirmar={() => {
        const id = cambio;
        setCambio(null);
        if (id) {
          const r = agregarAlCarrito(id, undefined, true);
          if (r) setMensaje(r);
        }
      }}
    />
    </View>
  );
}
