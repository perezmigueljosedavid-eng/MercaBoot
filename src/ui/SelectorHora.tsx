import React, { useEffect, useMemo, useRef } from 'react';
import { Pressable, ScrollView, ScrollViewInstance } from 'react-native';
import { horaAMinutos, horaBonita, minutosAHora } from '../lib/horario';
import { Hoja } from './Hoja';
import { Icon } from './Icon';
import { T } from './T';
import { C } from './theme';

const ALTO_FILA = 50;

/** Cómo se lee una hora en la lista: «8:00 AM», y para las horas que confunden, una ayuda («12:00 PM · mediodía»). */
function etiqueta(h: string): string {
  const m = horaAMinutos(h);
  if (m === 0) return '12:00 AM · medianoche (empieza el día)';
  if (m === 720) return '12:00 PM · mediodía';
  if (m === 1440) return 'Medianoche (termina el día)';
  return horaBonita(h);
}

/**
 * Lista de horas de 15 en 15 minutos para elegir cuándo abres o cierras. Sube desde abajo y se coloca sola en la hora que
 * ya estaba elegida. Para «cierra» se agrega «Medianoche», y las horas de madrugada (1:00 AM…) sirven para cerrar después
 * de la medianoche.
 * Autor: José David Pérez Miguel
 */
export function SelectorHora({
  visible,
  titulo,
  valor,
  incluirMedianoche = false,
  onElegir,
  onCerrar,
}: {
  visible: boolean;
  titulo: string;
  /** Hora elegida ahora, «HH:MM». */
  valor: string;
  /** Agrega «24:00» al final (solo tiene sentido para la hora de cerrar). */
  incluirMedianoche?: boolean;
  onElegir: (hora: string) => void;
  onCerrar: () => void;
}) {
  const horas = useMemo(() => {
    const l: string[] = [];
    for (let m = 0; m < 1440; m += 15) l.push(minutosAHora(m));
    if (incluirMedianoche) l.push('24:00');
    return l;
  }, [incluirMedianoche]);

  const lista = useRef<ScrollViewInstance>(null);
  useEffect(() => {
    if (!visible) return;
    const i = Math.max(0, horas.indexOf(valor));
    // Se deja un par de filas arriba para que se vea que hay más
    const t = setTimeout(() => lista.current?.scrollTo({ y: Math.max(0, (i - 2) * ALTO_FILA), animated: false }), 60);
    return () => clearTimeout(t);
  }, [visible, valor, horas]);

  return (
    <Hoja visible={visible} titulo={titulo} onCerrar={onCerrar}>
      <ScrollView ref={lista} style={{ flexGrow: 0 }} showsVerticalScrollIndicator keyboardShouldPersistTaps="handled">
        {horas.map((h) => {
          const elegida = h === valor;
          return (
            <Pressable
              key={h}
              accessibilityRole="button"
              accessibilityState={{ selected: elegida }}
              accessibilityLabel={etiqueta(h)}
              onPress={() => onElegir(h)}
              style={({ pressed }) => ({
                height: ALTO_FILA,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: 22,
                backgroundColor: elegida ? C.greenTint : pressed ? C.grey : C.white,
              })}
            >
              <T size={16} weight={elegida ? 800 : 500} color={elegida ? C.greenDark : C.ink}>
                {etiqueta(h)}
              </T>
              {elegida ? <Icon name="check" size={18} color={C.green} stroke={3} /> : null}
            </Pressable>
          );
        })}
      </ScrollView>
    </Hoja>
  );
}
