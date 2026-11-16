import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, PanResponder, Pressable, useWindowDimensions, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSegments } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { claveDePantalla, CONSEJOS, SIN_COMPANIA } from '../data/botiConsejos';
import { useBoti } from '../lib/boti';
import { useStore } from '../store';
import { Boti, type PoseBoti } from './Boti';
import { T } from './T';
import { C } from './theme';

const TAM = 68;
const MARGEN = 8;
/** Alto de la barra de pestañas: Boti se apoya justo encima. */
const BARRA = 64;
/** Sin tocar nada durante este tiempo, Boti se queda dormido. */
const SUENO_MS = 90_000;
const CLAVE_INTRO = 'mercaboot:boti:intro:v1';

/** Dónde está Boti respecto a su esquina y hasta dónde puede llegar. */
interface Arrastre {
  x: number;
  y: number;
  minX: number;
  minY: number;
}

function ajustarLimites(a: Arrastre, ancho: number, alto: number, arriba: number, abajo: number) {
  a.minX = -(ancho - TAM - MARGEN * 2);
  a.minY = -(alto - arriba - abajo - BARRA - TAM - MARGEN * 2);
}

/** Arrastrar a Boti con el dedo; al soltarlo, se queda donde lo dejaron (sin salirse de la pantalla). */
function crearArrastre(pan: Animated.ValueXY, a: Arrastre, alSoltar: () => void) {
  return PanResponder.create({
    onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) + Math.abs(g.dy) > 8,
    onPanResponderGrant: () => {
      pan.setOffset({ x: a.x, y: a.y });
      pan.setValue({ x: 0, y: 0 });
    },
    onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
    onPanResponderRelease: (_e, g) => {
      pan.flattenOffset();
      a.x = Math.min(0, Math.max(a.minX, a.x + g.dx));
      a.y = Math.min(0, Math.max(a.minY, a.y + g.dy));
      Animated.spring(pan, { toValue: { x: a.x, y: a.y }, friction: 7, tension: 90, useNativeDriver: false }).start();
      alSoltar();
    },
  });
}

/**
 * Boti acompañando al usuario como mascota virtual: flota en una esquina, cambia de pose según la pantalla,
 * da consejos al tocarlo, se puede arrastrar a otro lugar y se duerme si nadie lo toca. Se puede ocultar
 * desde su globo o desde Perfil.
 */
export function BotiCompania() {
  const { ajustes, listo, mensaje, decir, callar, cambiar } = useBoti();
  const { cuenta, estadoRed } = useStore();
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const segmentos: string[] = useSegments();
  const clave = claveDePantalla(segmentos);
  const oculta = SIN_COMPANIA.has(segmentos[0] ?? '');
  const visible = listo && ajustes.activo && ajustes.compania && !!cuenta && !oculta;

  // «sueno» guarda en qué pantalla se quedó dormido: al cambiar de pantalla despierta solo.
  const [sueno, setSueno] = useState<string | null>(null);
  const [actividad, setActividad] = useState(0);
  const dormido = sueno === clave;
  const sinInternet = estadoRed === 'sin-internet';
  const turno = useRef<Record<string, number>>({});

  // Duerme tras un rato quieto; cualquier toque reinicia la cuenta.
  const despertar = useCallback(() => {
    setSueno(null);
    setActividad((n) => n + 1);
  }, []);
  useEffect(() => {
    if (!visible) return;
    const reloj = setTimeout(() => setSueno(clave), SUENO_MS);
    return () => clearTimeout(reloj);
  }, [visible, clave, actividad]);

  // La primera vez que se usa la app, Boti se presenta.
  useEffect(() => {
    if (!visible) return;
    let vivo = true;
    let espera: ReturnType<typeof setTimeout> | undefined;
    AsyncStorage.getItem(CLAVE_INTRO)
      .then((visto) => {
        if (!vivo || visto) return;
        espera = setTimeout(() => {
          decir('¡Hola! Soy Boti, tu compañero en Mercaboot. Tócame si quieres una pista, arrástrame si estorbo o quítame desde Perfil.', { pose: 'saludo', sonido: 'hola', ms: 9000 });
          AsyncStorage.setItem(CLAVE_INTRO, '1').catch(() => {});
        }, 1400);
      })
      .catch(() => {});
    return () => {
      vivo = false;
      if (espera) clearTimeout(espera);
    };
  }, [visible, decir]);

  // Sin internet, se duerme y avisa una vez.
  const yaAvisoRed = useRef(false);
  useEffect(() => {
    if (!visible) return;
    if (sinInternet && !yaAvisoRed.current) {
      yaAvisoRed.current = true;
      decir('Me quedé sin señal. Sigues viendo lo último que se guardó.', { pose: 'dormido', sonido: 'dormir', ms: 5000 });
    }
    if (!sinInternet) yaAvisoRed.current = false;
  }, [sinInternet, visible, decir]);

  /* ───── arrastrar ───── */
  const pan = useState(() => new Animated.ValueXY({ x: 0, y: 0 }))[0];
  const [arrastre] = useState<Arrastre>(() => ({ x: 0, y: 0, minX: 0, minY: 0 }));
  useEffect(() => {
    ajustarLimites(arrastre, width, height, insets.top, insets.bottom);
  }, [arrastre, width, height, insets.top, insets.bottom]);
  const [movimiento] = useState(() => crearArrastre(pan, arrastre, despertar));

  const pantalla = CONSEJOS[clave] ?? CONSEJOS.general;
  const darConsejo = useCallback(() => {
    despertar();
    const lista = [...pantalla.consejos, ...CONSEJOS.general.consejos.slice(2)];
    const n = turno.current[clave] ?? 0;
    turno.current[clave] = n + 1;
    // El toque ya suena dentro de Boti; aquí solo cambia el globo.
    decir(lista[n % lista.length], { pose: pantalla.pose, ms: 6500 });
  }, [clave, pantalla, decir, despertar]);

  if (!visible) return null;

  const base: PoseBoti = sinInternet || dormido ? 'dormido' : pantalla.pose;
  const pose = mensaje?.pose ?? base;
  // El globo va a la izquierda de Boti (está pegado al borde derecho).
  const globoAncho = Math.min(230, width - TAM - MARGEN * 3);

  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, top: 0, bottom: 0 }}>
      <Animated.View
        {...movimiento.panHandlers}
        style={{
          position: 'absolute',
          right: MARGEN,
          bottom: insets.bottom + BARRA + MARGEN,
          width: TAM,
          height: TAM,
          transform: pan.getTranslateTransform(),
        }}
      >
        {mensaje ? (
          <View
            accessibilityRole="alert"
            style={{
              position: 'absolute',
              right: TAM - 4,
              bottom: TAM * 0.55,
              width: globoAncho,
              backgroundColor: C.ink,
              borderRadius: 16,
              borderBottomRightRadius: 4,
              paddingTop: 10,
              paddingHorizontal: 14,
              paddingBottom: 8,
              gap: 6,
            }}
          >
            <T size={13} lh={1.4} color={C.white}>
              {mensaje.texto}
            </T>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 16 }}>
              <Pressable accessibilityRole="button" accessibilityLabel="Ocultar a Boti" hitSlop={8} onPress={() => cambiar({ compania: false })}>
                <T size={12} weight={700} color="#9BE8BE">
                  Ocultar
                </T>
              </Pressable>
              <Pressable accessibilityRole="button" accessibilityLabel="Cerrar el mensaje" hitSlop={8} onPress={callar}>
                <T size={12} weight={700} color={C.white}>
                  Entendido
                </T>
              </Pressable>
            </View>
          </View>
        ) : null}
        <Boti pose={pose} size={TAM} onPress={darConsejo} />
      </Animated.View>
    </View>
  );
}
