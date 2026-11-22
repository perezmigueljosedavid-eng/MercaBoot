import React, { useMemo, useState } from 'react';
import { Pressable, TextInput, View } from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CATALOGO, productosDeSeccion, seccionesPara, TOTAL_CATALOGO, type ProductoCatalogo, type SeccionCatalogo } from '../data/catalogoBase';
import { grupoDeGiro } from '../data/giros';
import { useBoti } from '../lib/boti';
import { norm } from '../lib/texto';
import { useStore, type ProductoDeLote } from '../store';
import { Casilla } from '../ui/Casilla';
import { Confirmar } from '../ui/Dialogo';
import { Icon } from '../ui/Icon';
import { BackBtn, Btn, Card, goBack, Screen } from '../ui/kit';
import { T } from '../ui/T';
import { C, FONT } from '../ui/theme';

const MAX_PRODUCTOS = 1500;
const clave = (nombre: string) => norm(nombre).trim().replace(/\s+/g, ' ');

/**
 * Catálogo Mercaboot: el comerciante marca de una lista lo que vende y se agrega de golpe (sin escribir, sin fotos).
 * Es la forma rápida de abrir una tienda con muchos productos; después se ponen los precios en «Precios de hoy».
 */
export default function Catalogo() {
  const { s, negocio, agregarProductosLote } = useStore();
  const insets = useSafeAreaInsets();
  const { decir } = useBoti();
  const [elegidos, setElegidos] = useState<Set<string>>(new Set());
  const [abiertas, setAbiertas] = useState<Set<string> | null>(null);
  const [q, setQ] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState('');
  const [listo, setListo] = useState<{ agregados: number; repetidos: number } | null>(null);

  const grupo = grupoDeGiro(negocio?.giro);
  const { suyas, otras } = useMemo(() => seccionesPara(grupo), [grupo]);
  const propios = useMemo(() => s.productos.filter((p) => negocio && p.negocioId === negocio.id), [s.productos, negocio]);
  const yaTiene = useMemo(() => new Set(propios.map((p) => clave(p.nombre))), [propios]);

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

  const busqueda = q.trim();
  // Con una búsqueda se abren todas las secciones que tienen algo; si no, solo la primera de las del negocio
  const abiertasAhora = busqueda ? new Set(CATALOGO.map((c) => c.id)) : (abiertas ?? new Set(suyas.slice(0, 1).map((c) => c.id)));

  const itemsDe = (sec: SeccionCatalogo): ProductoCatalogo[] =>
    productosDeSeccion(sec).filter((p) => !busqueda || norm(p.nombre).includes(norm(busqueda)));

  const alternar = (p: ProductoCatalogo) => {
    const k = clave(p.nombre);
    if (yaTiene.has(k)) return;
    setError('');
    setElegidos((a) => {
      const n = new Set(a);
      if (n.has(k)) n.delete(k);
      else n.add(k);
      return n;
    });
  };

  const alternarSeccion = (sec: SeccionCatalogo) => {
    const libres = itemsDe(sec).filter((p) => !yaTiene.has(clave(p.nombre)));
    const todas = libres.length > 0 && libres.every((p) => elegidos.has(clave(p.nombre)));
    setError('');
    setElegidos((a) => {
      const n = new Set(a);
      for (const p of libres) {
        if (todas) n.delete(clave(p.nombre));
        else n.add(clave(p.nombre));
      }
      return n;
    });
  };

  const plegar = (id: string) =>
    setAbiertas((a) => {
      const n = new Set(a ?? abiertasAhora);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });

  async function agregar() {
    if (elegidos.size === 0 || guardando) return;
    if (propios.length + elegidos.size > MAX_PRODUCTOS) {
      setError(`Un negocio puede tener hasta ${MAX_PRODUCTOS.toLocaleString('es-MX')} productos. Ya tienes ${propios.length}; quita algunos de la lista.`);
      return;
    }
    const lote: ProductoDeLote[] = [];
    for (const sec of CATALOGO) {
      for (const p of productosDeSeccion(sec)) {
        if (elegidos.has(clave(p.nombre))) lote.push({ nombre: p.nombre, unidad: p.unidad, categoria: p.categoria, tipo: p.tipo });
      }
    }
    setGuardando(true);
    setError('');
    const r = await agregarProductosLote(lote);
    setGuardando(false);
    if ('error' in r) {
      setError(r.error);
      return;
    }
    setElegidos(new Set());
    decir(r.agregados > 0 ? '¡Productos agregados! Ahora ponles precio.' : 'Esos productos ya los tenías.', { pose: 'palma', emocion: r.agregados > 0 ? 'celebra' : 'alegre', ms: 4000 });
    setListo({ agregados: r.agregados, repetidos: r.repetidos });
  }

  const seccion = (sec: SeccionCatalogo) => {
    const items = itemsDe(sec);
    if (items.length === 0) return null;
    const abierta = abiertasAhora.has(sec.id);
    const libres = items.filter((p) => !yaTiene.has(clave(p.nombre)));
    const marcados = items.filter((p) => elegidos.has(clave(p.nombre))).length;
    const todas = libres.length > 0 && libres.every((p) => elegidos.has(clave(p.nombre)));
    return (
      <Card key={sec.id} r={16} style={{ padding: 0, overflow: 'hidden' }}>
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ expanded: abierta }}
          accessibilityLabel={`${sec.titulo}, ${items.length} productos${marcados ? `, ${marcados} marcados` : ''}`}
          onPress={() => plegar(sec.id)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14 }}
        >
          <T size={24}>{sec.emoji}</T>
          <View style={{ flex: 1, gap: 2 }}>
            <T size={15} weight={700}>
              {sec.titulo}
            </T>
            <T size={12} color={C.muted}>
              {marcados ? `${marcados} marcados de ${items.length}` : `${items.length} productos`}
            </T>
          </View>
          <View style={{ transform: [{ rotate: abierta ? '180deg' : '0deg' }] }}>
            <Icon name="down" size={20} color={C.muted} />
          </View>
        </Pressable>
        {abierta ? (
          <View style={{ borderTopWidth: 1, borderTopColor: C.line }}>
            {libres.length > 0 ? (
              <Pressable accessibilityRole="button" onPress={() => alternarSeccion(sec)} style={{ paddingHorizontal: 14, paddingVertical: 12 }}>
                <T size={13} weight={700} color={C.green}>
                  {todas ? 'Quitar todos los de esta lista' : 'Marcar todos los de esta lista'}
                </T>
              </Pressable>
            ) : null}
            {items.map((p) => {
              const tiene = yaTiene.has(clave(p.nombre));
              const marcado = elegidos.has(clave(p.nombre));
              return (
                <Pressable
                  key={p.nombre}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: tiene || marcado, disabled: tiene }}
                  accessibilityLabel={`${p.nombre}, ${p.unidad}${tiene ? ', ya lo tienes' : ''}`}
                  onPress={() => alternar(p)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 14, paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.line }}
                >
                  <Casilla marcada={tiene || marcado} apagada={tiene} />
                  <View style={{ flex: 1 }}>
                    <T size={14} weight={600} color={tiene ? C.muted : C.ink}>
                      {p.nombre}
                    </T>
                  </View>
                  <T size={12} color={C.muted}>
                    {tiene ? 'Ya lo tienes' : p.unidad}
                  </T>
                </Pressable>
              );
            })}
          </View>
        ) : null}
      </Card>
    );
  };

  const sinResultados = !!busqueda && CATALOGO.every((sec) => itemsDe(sec).length === 0);

  return (
    <View style={{ flex: 1 }}>
      <Screen contentStyle={{ paddingBottom: 170 + insets.bottom }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingTop: 8, paddingBottom: 8, paddingLeft: 8, paddingRight: 16 }}>
          <BackBtn />
          <T size={18} weight={700}>
            Catálogo Mercaboot
          </T>
        </View>

        <View style={{ gap: 14, paddingTop: 4, paddingHorizontal: 20 }}>
          <T size={14} lh={1.5} color={C.greyText}>
            Marca lo que vendes y se agrega de golpe: sin escribir uno por uno y sin fotos (cada producto lleva su dibujito). Después pones los precios en «Precios de hoy». Hay {TOTAL_CATALOGO} productos comunes; si falta alguno, lo agregas aparte con «Agregar».
          </T>

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, height: 48, paddingHorizontal: 16, borderRadius: 14, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
            <Icon name="search" size={18} color={C.muted} />
            <TextInput
              value={q}
              onChangeText={setQ}
              placeholder="Buscar en el catálogo (ej. tomate, refresco)"
              placeholderTextColor={C.placeholder}
              accessibilityLabel="Buscar en el catálogo"
              autoCorrect={false}
              style={{ flex: 1, minWidth: 0, fontFamily: FONT[400], fontSize: 15, color: C.ink, padding: 0 }}
            />
          </View>

          {sinResultados ? (
            <T size={14} lh={1.45} color={C.muted}>
              No hay nada con esa palabra en el catálogo. Puedes agregarlo tú con el botón «Agregar» de Mis productos.
            </T>
          ) : null}

          {suyas.length > 0 && !busqueda ? (
            <T size={13} weight={700} color={C.muted}>
              Para tu tipo de negocio
            </T>
          ) : null}
          {suyas.map(seccion)}
          {otras.length > 0 && !busqueda ? (
            <T size={13} weight={700} color={C.muted} style={{ marginTop: 6 }}>
              Otras listas
            </T>
          ) : null}
          {otras.map(seccion)}
        </View>
      </Screen>

      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, gap: 8, paddingHorizontal: 20, paddingTop: 12, paddingBottom: 16 + insets.bottom, backgroundColor: C.bg, borderTopWidth: 1, borderTopColor: C.line }}>
        {error ? (
          <T size={13} weight={600} lh={1.4} color={C.red} accessibilityRole="alert">
            {error}
          </T>
        ) : null}
        <Btn
          label={guardando ? 'Agregando…' : elegidos.size > 0 ? `Agregar ${elegidos.size} ${elegidos.size === 1 ? 'producto' : 'productos'}` : 'Marca lo que vendes'}
          h={52}
          disabled={elegidos.size === 0 || guardando}
          onPress={agregar}
        />
      </View>

      <Confirmar
        visible={listo != null}
        titulo={listo && listo.agregados > 0 ? `¡Listo! Agregamos ${listo.agregados} ${listo.agregados === 1 ? 'producto' : 'productos'}` : 'Ya tenías esos productos'}
        texto={
          listo && listo.agregados > 0
            ? `Todavía no tienen precio: ponlos en «Precios de hoy», es rápido.${listo.repetidos > 0 ? ` (${listo.repetidos} ya los tenías y no se repitieron.)` : ''}`
            : 'No se agregó nada nuevo porque ya estaban en tu lista.'
        }
        confirmar={listo && listo.agregados > 0 ? 'Poner precios' : 'Aceptar'}
        cancelar="Después"
        onCancelar={() => {
          setListo(null);
          goBack('/comerciante/productos');
        }}
        onConfirmar={() => {
          const hayNuevos = !!listo && listo.agregados > 0;
          setListo(null);
          if (hayNuevos) router.replace({ pathname: '/precios-de-hoy', params: { sinPrecio: '1' } });
          else goBack('/comerciante/productos');
        }}
      />
    </View>
  );
}
