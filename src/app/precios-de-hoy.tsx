import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { CategoriaProducto, Producto } from '../data/tipos';
import { useBoti } from '../lib/boti';
import { DESDE_CUANTOS, filtrarProductos, POR_PAGINA } from '../lib/listaProductos';
import { ajustarPorcentaje, cambiosDeEdiciones, leerPrecio, precioParaCampo, type EdicionDeProducto } from '../lib/precios';
import { guardarCopiaSiFalta, leerCopiaDeHoy, type CopiaDePrecios } from '../lib/preciosAyer';
import { useStore } from '../store';
import { BuscadorProductos, VerMas } from '../ui/BuscadorProductos';
import { FotoProducto } from '../ui/FotoProducto';
import { Icon } from '../ui/Icon';
import { BackBtn, Btn, Card, Chip, Group, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C, FONT } from '../ui/theme';

type Vista = 'todos' | 'sinPrecio' | 'agotados' | 'cambiados';

const PORCENTAJES = [-10, -5, 5, 10, 15, 20];

/**
 * Precios de hoy: todos los productos en una lista para cambiar precios, marcar lo que se acabó y subir o bajar precios
 * por porcentaje, sin abrir producto por producto. Nada se guarda hasta tocar «Guardar cambios» (y se manda por tandas).
 */
export default function PreciosDeHoy() {
  const { sinPrecio } = useLocalSearchParams<{ sinPrecio?: string }>();
  const { s, negocio, actualizarProductosLote } = useStore();
  const insets = useSafeAreaInsets();
  const { decir } = useBoti();
  const [q, setQ] = useState('');
  const [categoria, setCategoria] = useState<CategoriaProducto | null>(null);
  const [vista, setVista] = useState<Vista>(sinPrecio === '1' ? 'sinPrecio' : 'todos');
  const [limite, setLimite] = useState(POR_PAGINA);
  const [ediciones, setEdiciones] = useState<Record<string, EdicionDeProducto>>({});
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');
  const [error, setError] = useState('');
  const [copia, setCopia] = useState<CopiaDePrecios | null>(null);
  const [herramientas, setHerramientas] = useState(false);

  const negocioId = negocio?.id;
  useEffect(() => {
    if (!negocioId) return;
    let vivo = true;
    leerCopiaDeHoy(negocioId).then((c) => {
      if (vivo) setCopia(c);
    });
    return () => {
      vivo = false;
    };
  }, [negocioId]);

  const propios = useMemo(() => s.productos.filter((p) => negocioId && p.negocioId === negocioId), [s.productos, negocioId]);
  const { cambios, malEscritos } = useMemo(() => cambiosDeEdiciones(propios, ediciones), [propios, ediciones]);
  const idsCambiados = useMemo(() => new Set(cambios.map((c) => c.id)), [cambios]);
  const idsMalos = useMemo(() => new Set(malEscritos.map((p) => p.id)), [malEscritos]);

  const efectivoDisponible = (p: Producto) => ediciones[p.id]?.disponible ?? p.disponible;
  const textoPrecio = (p: Producto) => ediciones[p.id]?.precio ?? precioParaCampo(p.precio);

  const lista = useMemo(() => {
    const base = filtrarProductos(propios, q, categoria);
    switch (vista) {
      case 'sinPrecio':
        return base.filter((p) => (leerPrecio(ediciones[p.id]?.precio ?? precioParaCampo(p.precio)) ?? null) === null);
      case 'agotados':
        return base.filter((p) => !(ediciones[p.id]?.disponible ?? p.disponible));
      case 'cambiados':
        return base.filter((p) => idsCambiados.has(p.id) || idsMalos.has(p.id));
      default:
        return base;
    }
  }, [propios, q, categoria, vista, ediciones, idsCambiados, idsMalos]);

  if (!negocio) {
    return (
      <Screen contentStyle={{ padding: 20, gap: 12 }}>
        <BackBtn />
        <T size={16} weight={700}>
          Esta pantalla es para cuentas con negocio.
        </T>
      </Screen>
    );
  }

  const sinPrecioN = propios.filter((p) => (leerPrecio(textoPrecio(p)) ?? null) === null).length;
  const agotadosN = propios.filter((p) => !efectivoDisponible(p)).length;
  const visibles = lista.slice(0, limite);
  const restantes = lista.length - visibles.length;
  const hayCambios = cambios.length > 0;

  const cambiarVista = (v: Vista) => {
    setVista(v);
    setLimite(POR_PAGINA);
  };

  /** Guarda en el borrador solo lo que de verdad es distinto a lo que ya tiene el producto. */
  const ponerBorrador = (p: Producto, cambio: EdicionDeProducto) => {
    setMensaje('');
    setError('');
    setEdiciones((e) => {
      const nuevo: EdicionDeProducto = { ...e[p.id], ...cambio };
      if (nuevo.precio !== undefined && nuevo.precio.trim() === precioParaCampo(p.precio)) delete nuevo.precio;
      if (nuevo.disponible !== undefined && nuevo.disponible === p.disponible) delete nuevo.disponible;
      const sig = { ...e };
      if (nuevo.precio === undefined && nuevo.disponible === undefined) delete sig[p.id];
      else sig[p.id] = nuevo;
      return sig;
    });
  };

  const porcentaje = (pct: number) => {
    let n = 0;
    setEdiciones((e) => {
      const sig = { ...e };
      for (const p of lista) {
        const actual = leerPrecio(e[p.id]?.precio ?? precioParaCampo(p.precio));
        if (actual == null || actual <= 0) continue;
        const nuevo = ajustarPorcentaje(actual, pct);
        const base = precioParaCampo(p.precio);
        const texto = precioParaCampo(nuevo);
        const previo: EdicionDeProducto = { ...sig[p.id] };
        if (texto === base) delete previo.precio;
        else previo.precio = texto;
        if (previo.precio === undefined && previo.disponible === undefined) delete sig[p.id];
        else sig[p.id] = previo;
        n += 1;
      }
      return sig;
    });
    setError('');
    setMensaje(n > 0 ? `Se ${pct > 0 ? 'subió' : 'bajó'} ${Math.abs(pct)} % a ${n} ${n === 1 ? 'producto' : 'productos'} de la lista. Revisa y toca «Guardar cambios».` : 'Ningún producto de la lista tiene precio para cambiar.');
  };

  const marcarTodos = (hay: boolean) => {
    setEdiciones((e) => {
      const sig = { ...e };
      for (const p of lista) {
        const previo: EdicionDeProducto = { ...sig[p.id] };
        if (hay === p.disponible) delete previo.disponible;
        else previo.disponible = hay;
        if (previo.precio === undefined && previo.disponible === undefined) delete sig[p.id];
        else sig[p.id] = previo;
      }
      return sig;
    });
    setError('');
    setMensaje(`${lista.length} ${lista.length === 1 ? 'producto marcado' : 'productos marcados'} como ${hay ? 'disponibles' : 'agotados'}. Revisa y toca «Guardar cambios».`);
  };

  const volverAAyer = () => {
    if (!copia) return;
    const sig: Record<string, EdicionDeProducto> = {};
    let n = 0;
    for (const p of propios) {
      const antes = copia.productos[p.id];
      if (!antes) continue;
      const e: EdicionDeProducto = {};
      if ((antes.p ?? null) !== (p.precio ?? null)) e.precio = precioParaCampo(antes.p);
      if (antes.d !== p.disponible) e.disponible = antes.d;
      if (e.precio !== undefined || e.disponible !== undefined) {
        sig[p.id] = e;
        n += 1;
      }
    }
    setEdiciones(sig);
    setError('');
    setMensaje(n > 0 ? `Se regresaron ${n} ${n === 1 ? 'producto' : 'productos'} a como estaban antes de tus cambios de hoy. Revisa y toca «Guardar cambios».` : 'Todo está igual que antes de tus cambios de hoy.');
  };

  async function guardar() {
    if (guardando || !hayCambios) return;
    if (malEscritos.length > 0) {
      setError(`Hay ${malEscritos.length} ${malEscritos.length === 1 ? 'precio mal escrito' : 'precios mal escritos'} (marcados en rojo). Usa solo números, por ejemplo 45 o 12.50.`);
      setVista('cambiados');
      setLimite(POR_PAGINA);
      return;
    }
    setGuardando(true);
    setError('');
    setMensaje('');
    // Antes del primer cambio del día se guarda cómo estaba todo, para poder volver
    await guardarCopiaSiFalta(negocio!.id, propios);
    const r = await actualizarProductosLote(cambios);
    setGuardando(false);
    if ('error' in r) {
      setError(r.error);
      return;
    }
    setEdiciones({});
    setCopia(await leerCopiaDeHoy(negocio!.id));
    setMensaje(`Listo: se guardaron los cambios de ${cambios.length} ${cambios.length === 1 ? 'producto' : 'productos'}. Tus clientes ya los ven.`);
    decir('¡Precios al día! Tus clientes ya ven los cambios.', { pose: 'palma', emocion: 'celebra', ms: 4000 });
  }

  const fila = (p: Producto) => {
    const hay = efectivoDisponible(p);
    const cambiado = idsCambiados.has(p.id);
    const malo = idsMalos.has(p.id);
    return (
      <View
        key={p.id}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10, paddingLeft: 12, paddingRight: 10, backgroundColor: cambiado ? C.greenTint : C.white }}
      >
        <FotoProducto producto={p} size={40} r={10} />
        <View style={{ flex: 1, minWidth: 0, gap: 1 }}>
          <T size={14} weight={600} color={hay ? C.ink : C.muted} numberOfLines={2}>
            {p.nombre}
          </T>
          <T size={12} color={C.muted} numberOfLines={1}>
            {p.unidad}
          </T>
        </View>
        <View
          style={{
            width: 92,
            height: 42,
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 10,
            borderRadius: 11,
            borderWidth: malo ? 2 : 1,
            borderColor: malo ? C.red : cambiado ? C.green : C.input,
            backgroundColor: C.white,
          }}
        >
          <T size={14} color={C.muted}>
            $
          </T>
          <TextInput
            value={textoPrecio(p)}
            onChangeText={(t) => ponerBorrador(p, { precio: t })}
            placeholder="—"
            placeholderTextColor={C.placeholder}
            keyboardType="decimal-pad"
            selectTextOnFocus
            accessibilityLabel={`Precio de ${p.nombre}`}
            style={{ flex: 1, minWidth: 0, fontFamily: FONT[600], fontSize: 15, color: C.ink, padding: 0, paddingLeft: 3 }}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${p.nombre}: ${hay ? 'hay' : 'agotado'}. Tocar para cambiar`}
          onPress={() => ponerBorrador(p, { disponible: !hay })}
          style={{ width: 74, height: 42, borderRadius: 11, backgroundColor: hay ? C.greenTint : C.redTint, alignItems: 'center', justifyContent: 'center' }}
        >
          <T size={12} weight={700} color={hay ? C.greenDark : C.red}>
            {hay ? 'Hay' : 'Agotado'}
          </T>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ paddingBottom: 190 + insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 16 }}>
          <BackBtn />
          <T size={18} weight={700}>
            Precios de hoy
          </T>
        </View>

        <View style={{ gap: 14, paddingTop: 4, paddingHorizontal: 20 }}>
          {propios.length === 0 ? (
            <Card style={{ gap: 8, padding: 18 }}>
              <T size={16} weight={700}>
                Todavía no tienes productos
              </T>
              <T size={14} lh={1.45} color={C.muted}>
                Primero agrega productos con el «Catálogo Mercaboot» o con el botón «Agregar» de Mis productos. Aquí podrás cambiar todos los precios de golpe.
              </T>
            </Card>
          ) : (
            <>
              <T size={14} lh={1.5} color={C.greyText}>
                Escribe el precio de cada producto y toca «Hay» o «Agotado». Nada se guarda hasta que toques «Guardar cambios» abajo.
              </T>

              {propios.length > DESDE_CUANTOS ? (
                <BuscadorProductos
                  productos={propios}
                  busqueda={q}
                  onBusqueda={(t) => {
                    setQ(t);
                    setLimite(POR_PAGINA);
                  }}
                  categoria={categoria}
                  onCategoria={(c) => {
                    setCategoria(c);
                    setLimite(POR_PAGINA);
                  }}
                  placeholder="Buscar un producto"
                />
              ) : null}

              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Chip label="Todos" h={38} px={14} size={13} active={vista === 'todos'} onPress={() => cambiarVista('todos')} />
                <Chip label={`Sin precio (${sinPrecioN})`} h={38} px={14} size={13} active={vista === 'sinPrecio'} onPress={() => cambiarVista('sinPrecio')} />
                <Chip label={`Agotados (${agotadosN})`} h={38} px={14} size={13} active={vista === 'agotados'} onPress={() => cambiarVista('agotados')} />
                <Chip label={`Cambiados (${cambios.length + malEscritos.length})`} h={38} px={14} size={13} active={vista === 'cambiados'} onPress={() => cambiarVista('cambiados')} />
              </View>

              <Card r={16} style={{ overflow: 'hidden' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityState={{ expanded: herramientas }}
                  onPress={() => setHerramientas((v) => !v)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14 }}
                >
                  <Icon name="tag" size={18} color={C.green} />
                  <View style={{ flex: 1 }}>
                    <T size={14} weight={700}>
                      Cambiar muchos a la vez
                    </T>
                    <T size={12} color={C.muted}>
                      Subir o bajar precios por porcentaje, marcar todo como agotado…
                    </T>
                  </View>
                  <View style={{ transform: [{ rotate: herramientas ? '180deg' : '0deg' }] }}>
                    <Icon name="down" size={18} color={C.muted} />
                  </View>
                </Pressable>
                {herramientas ? (
                  <View style={{ gap: 12, padding: 14, paddingTop: 4, borderTopWidth: 1, borderTopColor: C.line }}>
                    <T size={12} lh={1.4} color={C.muted}>
                      Se aplica a los {lista.length} {lista.length === 1 ? 'producto' : 'productos'} de la lista que ves ahora (con la búsqueda y el filtro que tengas).
                    </T>
                    <T size={13} weight={700}>
                      Subir o bajar precios
                    </T>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                      {PORCENTAJES.map((pct) => (
                        <Chip key={pct} label={`${pct > 0 ? '+' : '−'}${Math.abs(pct)} %`} h={38} px={14} size={13} onPress={() => porcentaje(pct)} />
                      ))}
                    </View>
                    <T size={13} weight={700}>
                      Hay o se acabó
                    </T>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      <Btn label="Marcar todo agotado" variant="outline" h={42} r={12} size={13} flex={1} onPress={() => marcarTodos(false)} />
                      <Btn label="Marcar todo disponible" variant="outline" h={42} r={12} size={13} flex={1} onPress={() => marcarTodos(true)} />
                    </View>
                    <T size={13} weight={700}>
                      Me equivoqué
                    </T>
                    <Btn label="Volver a los precios de ayer" variant="outline" h={42} r={12} size={13} disabled={!copia} onPress={volverAAyer} />
                    <T size={12} lh={1.4} color={C.muted}>
                      {copia
                        ? 'Regresa precios y «hay / agotado» a como estaban antes de tus cambios de hoy hechos desde esta pantalla.'
                        : 'Se activa después de tu primer cambio guardado del día. La copia queda solo en este teléfono.'}
                    </T>
                  </View>
                ) : null}
              </Card>

              {mensaje ? (
                <View accessibilityRole="alert" style={{ padding: 12, borderRadius: 12, backgroundColor: C.greenTint }}>
                  <T size={13} weight={600} lh={1.4} color={C.greenDark}>
                    {mensaje}
                  </T>
                </View>
              ) : null}

              {lista.length === 0 ? (
                <T size={14} lh={1.45} color={C.muted}>
                  {vista === 'sinPrecio'
                    ? '¡Todos tus productos ya tienen precio!'
                    : vista === 'cambiados'
                      ? 'Todavía no has cambiado nada.'
                      : vista === 'agotados'
                        ? 'No tienes productos agotados.'
                        : 'No hay productos con ese filtro.'}
                </T>
              ) : (
                <Group>{visibles.map(fila)}</Group>
              )}
              {restantes > 0 ? <VerMas restantes={restantes} onPress={() => setLimite((l) => l + POR_PAGINA)} /> : null}
            </>
          )}
        </View>
      </Screen>

      {propios.length > 0 ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 + insets.bottom, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}>
          {error ? (
            <T size={13} weight={600} lh={1.4} color={C.red} accessibilityRole="alert">
              {error}
            </T>
          ) : null}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {hayCambios ? <Btn label="Descartar" variant="outline" h={52} flex={1} onPress={() => setEdiciones({})} disabled={guardando} /> : null}
            <Btn
              label={guardando ? 'Guardando…' : hayCambios ? `Guardar ${cambios.length} ${cambios.length === 1 ? 'cambio' : 'cambios'}` : 'Sin cambios'}
              h={52}
              flex={hayCambios ? 2 : 1}
              disabled={!hayCambios || guardando}
              onPress={guardar}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
