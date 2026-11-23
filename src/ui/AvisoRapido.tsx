import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { confirmacionDeAviso, fraseDelCartel, textoDeAvisoRapido } from '../lib/avisoRapido';
import { finDelDia, useStore } from '../store';
import { T } from './T';
import { C } from './theme';

/**
 * «Aviso con un toque»: cuando el comerciante marca un producto como agotado o como disponible aparece un cartelito con el botón
 * «Avisar a mis clientes». Un toque y se publica el aviso del día («Ya hay aguacate.» / «Ya no hay aguacate por hoy.»): sale en la
 * página de su negocio y, si es «ya hay», le llega al teléfono de quien sigue la tienda o esperaba ese producto.
 * Si no toca nada, el cartelito se quita solo.
 * Autor: José David Pérez Miguel
 */

type Oferta = { id: string; nombre: string; hay: boolean; porEncargo: boolean };

export function useAvisoRapido() {
  const { setDisponible, publicarAviso, avisar } = useStore();
  const [oferta, setOferta] = useState<Oferta | null>(null);
  const [enviando, setEnviando] = useState(false);

  // Se quita solo si no lo tocan
  useEffect(() => {
    if (!oferta) return;
    const t = setTimeout(() => setOferta(null), 9000);
    return () => clearTimeout(t);
  }, [oferta]);

  /** Cambia el producto de «hay» a «agotado» (o al revés) y ofrece avisarlo. */
  const cambiar = (p: { id: string; nombre: string; disponible: boolean; porEncargo?: boolean }) => {
    setDisponible(p.id, !p.disponible);
    setOferta({ id: p.id, nombre: p.nombre, hay: !p.disponible, porEncargo: !!p.porEncargo });
  };

  const avisarAhora = async () => {
    if (!oferta || enviando) return;
    const o = oferta;
    setEnviando(true);
    const err = await publicarAviso({
      tipo: o.hay ? 'hay' : 'agotado',
      texto: textoDeAvisoRapido(o.nombre, o.hay, o.porEncargo),
      productoId: o.id,
      hasta: finDelDia(Date.now()),
    });
    setEnviando(false);
    setOferta(null);
    avisar(err ?? confirmacionDeAviso(o.nombre, o.hay));
  };

  const cartel = oferta ? (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: 14, alignItems: 'center' }}>
      <View accessibilityRole="alert" accessibilityLiveRegion="polite" style={{ width: '100%', maxWidth: 460, borderRadius: 16, padding: 14, gap: 10, backgroundColor: C.ink }}>
        <T size={14} weight={600} lh={1.4} color={C.white}>
          {fraseDelCartel(oferta.nombre, oferta.hay, oferta.porEncargo)}
        </T>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <Pressable
            accessibilityRole="button"
            onPress={() => void avisarAhora()}
            style={{ flex: 1, height: 42, borderRadius: 12, backgroundColor: C.amber, alignItems: 'center', justifyContent: 'center' }}
          >
            <T size={14} weight={800} color={C.ink}>
              {enviando ? 'Publicando…' : oferta.hay ? 'Avisar a mis clientes' : 'Avisar que se acabó'}
            </T>
          </Pressable>
          <Pressable
            accessibilityRole="button"
            onPress={() => setOferta(null)}
            style={{ height: 42, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: '#6B726D', alignItems: 'center', justifyContent: 'center' }}
          >
            <T size={14} weight={700} color={C.white}>
              Ahora no
            </T>
          </Pressable>
        </View>
      </View>
    </View>
  ) : null;

  return { cambiar, cartel };
}
