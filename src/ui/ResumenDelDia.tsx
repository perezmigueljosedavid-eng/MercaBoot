import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { demandaSinAtender, productosSinRevisar } from '../ia/resumen';
import { busquedasDeLaSemana, type BusquedaFrecuente } from '../lib/busquedas';
import { useAhora } from '../lib/usarAhora';
import { useStore } from '../store';
import { Boti } from './Boti';
import { Card } from './kit';
import { T } from './T';
import { C } from './theme';

function Fila({ icono, texto, accion, onPress, onAccion }: { icono: string; texto: string; accion?: string; onPress?: () => void; onAccion?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      onPress={onAccion ?? onPress}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 4 }}
    >
      <T size={18}>{icono}</T>
      <T size={14} lh={1.35} style={{ flex: 1 }}>
        {texto}
      </T>
      {accion ? (
        <View style={{ height: 32, paddingHorizontal: 12, borderRadius: 16, backgroundColor: C.greenTint, alignItems: 'center', justifyContent: 'center' }}>
          <T size={12.5} weight={700} color={C.greenDark}>
            {accion}
          </T>
        </View>
      ) : (
        <T size={20} color={C.muted}>
          ›
        </T>
      )}
    </Pressable>
  );
}

/**
 * «Resumen del día» en el inicio del comerciante: lo que hoy conviene atender (chats sin leer, productos sin revisar) y lo que sus
 * vecinos buscaron esta semana y ninguna tienda tenía. Si todo está al día, lo dice. No se muestra mientras no haya productos.
 * Autor: José David Pérez Miguel
 */
export function ResumenDelDia() {
  const { s, negocio, chatsSinLeer, setDisponible } = useStore();
  const ahora = useAhora(300);
  const [busquedas, setBusquedas] = useState<BusquedaFrecuente[]>([]);
  const negocioId = negocio?.id;

  useEffect(() => {
    if (!negocioId) return;
    let vivo = true;
    void busquedasDeLaSemana().then((l) => {
      if (vivo) setBusquedas(l);
    });
    return () => {
      vivo = false;
    };
  }, [negocioId]);

  const demanda = useMemo(() => (negocioId ? demandaSinAtender(busquedas, s.productos, negocioId) : []), [busquedas, s.productos, negocioId]);
  const sinRevisar = useMemo(() => (negocioId ? productosSinRevisar(s.productos, negocioId, ahora) : 0), [s.productos, negocioId, ahora]);
  const tieneProductos = useMemo(() => !!negocioId && s.productos.some((p) => p.negocioId === negocioId), [s.productos, negocioId]);

  if (!negocioId || !tieneProductos) return null;
  const todoAlDia = chatsSinLeer === 0 && sinRevisar === 0 && demanda.length === 0;

  return (
    <Card style={{ gap: 10, padding: 16 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Boti pose="palma" size={44} />
        <T size={16} weight={800} style={{ flex: 1 }}>
          Resumen del día
        </T>
      </View>

      {chatsSinLeer > 0 ? (
        <Fila icono="💬" texto={chatsSinLeer === 1 ? 'Tienes 1 chat sin leer. Contestar rápido ayuda a vender.' : `Tienes ${chatsSinLeer} chats sin leer. Contestar rápido ayuda a vender.`} onPress={() => router.navigate('/comerciante/chats')} />
      ) : null}

      {sinRevisar > 0 ? (
        <Fila
          icono="🏷️"
          texto={sinRevisar === 1 ? '1 producto lleva más de una semana sin revisarse. ¿Sigue habiendo y al mismo precio?' : `${sinRevisar} productos llevan más de una semana sin revisarse. ¿Siguen habiendo y a los mismos precios?`}
          onPress={() => router.push('/precios-de-hoy')}
        />
      ) : null}

      {demanda.map((d) =>
        d.mio ? (
          <Fila
            key={d.termino}
            icono="🔎"
            texto={`Buscaron «${d.termino}» ${d.veces} ${d.veces === 1 ? 'vez' : 'veces'} esta semana y tu «${d.mio.nombre}» está agotado.`}
            accion="Ya hay"
            onAccion={() => setDisponible(d.mio?.id ?? '', true)}
          />
        ) : (
          <Fila
            key={d.termino}
            icono="🔎"
            texto={`Buscaron «${d.termino}» ${d.veces} ${d.veces === 1 ? 'vez' : 'veces'} esta semana y ninguna tienda lo tiene.`}
            accion="Agregar"
            onAccion={() => router.push({ pathname: '/producto-form', params: { nombre: d.termino } })}
          />
        ),
      )}

      {todoAlDia ? (
        <T size={14} lh={1.4} color={C.muted}>
          Todo al día por ahora: sin chats pendientes y con tus productos revisados. Si alguien busca algo que tú vendes, Boti te lo dice aquí.
        </T>
      ) : null}
    </Card>
  );
}
