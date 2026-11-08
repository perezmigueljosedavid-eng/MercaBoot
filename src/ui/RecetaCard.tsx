import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { nombreSabor } from '../data/contenido';
import type { DondeVista, IngVista, RecetaVista, TiendaReceta } from '../ia/vista';
import { textoPrecio } from './bits';
import { Icon } from './Icon';
import { Tag } from './kit';
import { Rasgos } from './Reputacion';
import { T } from './T';
import { C } from './theme';

const ETIQUETA: Record<string, string> = {
  rapido: 'Rápida',
  economico: 'Económica',
  caliente: 'Caliente',
  oaxaca: 'De Oaxaca',
  tradicional: 'Tradicional',
};

/** Cuántas etiquetas de cada tipo caben en el encabezado sin llenarlo. */
const MAX_ETIQUETAS = 2;
const MAX_SABORES = 2;

function Marca({ estado }: { estado: IngVista['estado'] }) {
  const hay = estado === 'hay';
  const falta = estado === 'falta';
  return (
    <View
      style={{
        width: 20,
        height: 20,
        borderRadius: 10,
        marginTop: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: hay ? C.greenTint : falta ? C.amberTint : C.grey,
      }}
    >
      <Icon name={falta ? 'info' : 'check'} size={12} color={hay ? C.green : falta ? C.amberText : C.muted} stroke={2.5} />
    </View>
  );
}

function Donde({ d }: { d: DondeVista }) {
  const detalle = [d.dist ?? d.direccion, d.producto, d.precio != null ? textoPrecio(d.precio, d.unidad) : null]
    .filter(Boolean)
    .join(' · ');
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(`/negocio/${d.negocioId}`)} style={{ gap: 3 }}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 6 }}>
        <View style={{ marginTop: 2 }}>
          <Icon name="pin" size={13} color={C.green} />
        </View>
        <T size={13} lh={1.3} style={{ flex: 1 }}>
          <T size={13} weight={700} color={C.green}>
            {d.negocio}
          </T>
          {detalle ? <T size={13} color={C.muted}>{` · ${detalle}`}</T> : null}
          {d.abierto ? null : <T size={13} color={C.muted}>{' · cerrado ahora'}</T>}
        </T>
      </View>
      <View style={{ paddingLeft: 19 }}>
        <Rasgos compacto estrellas={d.estrellas} resenas={d.resenas} aDomicilio={d.aDomicilio} insignias={d.insignias} porEncargo={d.porEncargo} />
      </View>
    </Pressable>
  );
}

function Ingrediente({ i, hayProductos }: { i: IngVista; hayProductos: boolean }) {
  const nota =
    i.estado === 'casa' ? 'normalmente ya lo tienes en casa' : i.estado === 'tienes' ? 'ya lo tienes' : i.estado === 'falta' && hayProductos ? 'todavía no lo publica ninguna tienda' : '';
  return (
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Marca estado={i.estado === 'falta' && !hayProductos ? 'casa' : i.estado} />
      <View style={{ flex: 1, gap: 6, minWidth: 0 }}>
        <T size={14} lh={1.3}>
          {i.txt}
          {i.opcional ? <T size={12} color={C.muted}>{'  (opcional)'}</T> : null}
        </T>
        {nota ? (
          <T size={12} color={i.estado === 'falta' ? C.amberText : C.muted}>
            {nota}
          </T>
        ) : null}
        {i.donde.map((d, k) => (
          <Donde key={`${d.negocioId}-${k}`} d={d} />
        ))}
        {i.masTiendas ? (
          <T size={12} color={C.muted}>
            {i.masTiendas === 1 ? 'Y 1 tienda más lo tiene.' : `Y ${i.masTiendas} tiendas más lo tienen.`}
          </T>
        ) : null}
      </View>
    </View>
  );
}

/** Una tienda más que también surte la receta: se muestra completa para no dejar a nadie fuera. */
function OtraTienda({ t }: { t: TiendaReceta }) {
  const sub = [`Tiene ${t.cubre} de ${t.de}`, t.dist, t.abierto ? null : 'cerrado ahora'].filter(Boolean).join(' · ');
  return (
    <Pressable
      accessibilityRole="link"
      onPress={() => router.push(`/negocio/${t.negocioId}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}
    >
      <View style={{ flex: 1, gap: 3, minWidth: 0 }}>
        <T size={13} weight={700}>
          {t.nombre}
        </T>
        <T size={12} color={C.muted}>
          {sub}
        </T>
        <Rasgos compacto estrellas={t.estrellas} resenas={t.resenas} aDomicilio={t.aDomicilio} />
      </View>
      <Icon name="next" size={16} color={C.muted} />
    </Pressable>
  );
}

/** Receta que propone el asistente, con lo que hay en las tiendas y cómo prepararla. */
export function RecetaCard({
  receta,
  verPasos,
  hayProductos,
}: {
  receta: RecetaVista;
  verPasos: boolean;
  /** Si todavía no hay productos publicados no se marca nada como "falta". */
  hayProductos: boolean;
}) {
  const [abierta, setAbierta] = useState(verPasos);
  const mejor = receta.mejorTienda;
  const otras = mejor ? (receta.otrasTiendas ?? []) : [];

  // Qué es la receta (con carne, proteína, momento…) va primero; el sabor es un dato más, no el principal
  const rasgos = receta.etiquetas.filter((e) => ETIQUETA[e]).slice(0, MAX_ETIQUETAS);

  return (
    <View style={{ gap: 12, padding: 14, borderRadius: 16, backgroundColor: C.white, borderWidth: 1, borderColor: C.line }}>
      <View style={{ gap: 6 }}>
        <T size={17} weight={800} ls={-0.01} lh={1.25}>
          {receta.nombre}
        </T>
        <T size={12} color={C.muted}>
          {receta.min} min · {receta.por} {receta.por === 1 ? 'porción' : 'porciones'}
        </T>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
          {receta.carac.map((c) => (
            <Tag key={c} bg={C.greenTint} fg={C.greenDark}>
              {c}
            </Tag>
          ))}
          {rasgos.map((e) => (
            <Tag key={e} bg={C.grey} fg={C.greyText}>
              {ETIQUETA[e]}
            </Tag>
          ))}
          {receta.sabores.slice(0, MAX_SABORES).map((s) => (
            <Tag key={s} bg={C.amberTint} fg={C.amberText}>
              {nombreSabor(s)}
            </Tag>
          ))}
        </View>
      </View>

      <View style={{ gap: 10 }}>
        <T size={13} weight={700} color={C.muted}>
          Ingredientes
        </T>
        {receta.ing.map((i, k) => (
          <Ingrediente key={k} i={i} hayProductos={hayProductos} />
        ))}
      </View>

      {mejor ? (
        <View style={{ borderRadius: 12, backgroundColor: C.greenTint, overflow: 'hidden' }}>
          <Pressable
            accessibilityRole="link"
            onPress={() => router.push(`/negocio/${mejor.negocioId}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12 }}
          >
            <Icon name="store" size={20} color={C.green} />
            <View style={{ flex: 1, gap: 2, minWidth: 0 }}>
              <T size={11} weight={700} color={C.green} ls={0.04}>
                LA TIENDA QUE MÁS TE CONVIENE
              </T>
              <T size={14} weight={700} color={C.greenDark}>
                {receta.completa ? (mejor.cubre >= mejor.de ? 'Todo en' : 'Casi todo en') : 'Lo que hay publicado está en'} {mejor.nombre}
              </T>
              <T size={12} lh={1.35} color={C.greenDark}>
                {mejor.motivos.join(' · ')}
                {mejor.abierto ? '' : ' · cerrado ahora'}
              </T>
            </View>
            <Icon name="next" size={18} color={C.green} />
          </Pressable>
          {otras.length ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: 6, backgroundColor: C.grey }}>
              <T size={12} weight={700} color={C.muted} style={{ paddingTop: 10 }}>
                También los puedes conseguir en
              </T>
              {otras.map((t, k) => (
                <View key={t.negocioId} style={{ borderTopWidth: k ? 1 : 0, borderTopColor: C.line }}>
                  <OtraTienda t={t} />
                </View>
              ))}
            </View>
          ) : null}
        </View>
      ) : null}

      {hayProductos && !receta.completa ? (
        <T size={12} lh={1.4} color={C.amberText}>
          Ojo: hoy no vi publicado {receta.faltan.join(', ')}. Puedes preguntar en las tiendas o buscar un sustituto.
        </T>
      ) : null}

      <Pressable
        accessibilityRole="button"
        onPress={() => setAbierta((v) => !v)}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 40 }}
      >
        <T size={14} weight={700} color={C.green}>
          {abierta ? 'Ocultar preparación' : 'Ver cómo se prepara'}
        </T>
        <View style={{ transform: [{ rotate: abierta ? '180deg' : '0deg' }] }}>
          <Icon name="down" size={18} color={C.green} />
        </View>
      </Pressable>

      {abierta ? (
        <View style={{ gap: 10 }}>
          {receta.pasos.map((p, k) => (
            <View key={k} style={{ flexDirection: 'row', gap: 10 }}>
              <View
                style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: C.green, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}
              >
                <T size={12} weight={700} color={C.white}>
                  {k + 1}
                </T>
              </View>
              <T size={14} lh={1.45} style={{ flex: 1 }}>
                {p}
              </T>
            </View>
          ))}
          {receta.tip ? (
            <View style={{ padding: 12, borderRadius: 12, backgroundColor: C.amberTint }}>
              <T size={13} lh={1.4} color={C.amberDeep}>
                <T size={13} weight={700} color={C.amberDeep}>
                  Tip:{' '}
                </T>
                {receta.tip}
              </T>
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
