import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useBoti } from '../lib/boti';

/**
 * Boti, la bolsa del mandado que guía al usuario y es la mascota de Mercaboot: una bolsa verde con asas,
 * franja ámbar cosida, mejillas y patitas (diseño aprobado en el boceto «Boti: poses y accesorios»).
 *
 * Se dibuja por capas para poder moverlas: las asas, el cuerpo, los brazos, los ojos y los accesorios son
 * capas aparte. Respira, parpadea, mira de lado, saluda, mueve sombreros y confeti, y reacciona cuando lo tocan.
 * Todo se apaga cuando la persona desactiva a Boti o tiene activado «reducir movimiento» en su teléfono.
 */
export type PoseBoti = 'saludo' | 'lupa' | 'cocina' | 'caja' | 'palma' | 'megafono' | 'fiesta' | 'dormido';

let contador = 0;
const VB = '-20 -24 160 160';
/** Un punto del dibujo (de -20 a 140) como porcentaje del cuadro, para fijar el centro de giro. */
const pct = (v: number, desde: number) => `${(((v - desde) / 160) * 100).toFixed(2)}%`;
const origen = (x: number, y: number) => `${pct(x, -20)} ${pct(y, -24)}`;
const nativo = Platform.OS !== 'web';

type Ojos = 'abiertos' | 'lupa' | 'felices' | 'dormido';
interface Brazos {
  izq: string;
  der: string;
}
interface Config {
  brazos: Brazos;
  ojos: Ojos;
  ojosY?: number;
}

const BRAZOS_NORMALES: Brazos = { izq: 'M20 70 L6 84', der: 'M100 70 L114 84' };
const CONFIG: Record<PoseBoti, Config> = {
  saludo: { brazos: BRAZOS_NORMALES, ojos: 'abiertos' },
  lupa: { brazos: { izq: 'M20 70 L6 80', der: 'M100 72 L112 62' }, ojos: 'lupa' },
  cocina: { brazos: BRAZOS_NORMALES, ojos: 'abiertos' },
  caja: { brazos: { izq: 'M20 78 L38 96', der: 'M100 78 L82 96' }, ojos: 'abiertos', ojosY: 62 },
  palma: { brazos: { izq: 'M20 70 L4 62', der: 'M100 70 L116 62' }, ojos: 'abiertos' },
  megafono: { brazos: { izq: 'M20 70 L6 80', der: 'M100 72 L110 66' }, ojos: 'abiertos' },
  fiesta: { brazos: { izq: 'M20 66 L4 46', der: 'M100 66 L116 46' }, ojos: 'felices' },
  dormido: { brazos: { izq: 'M20 78 L10 92', der: 'M100 78 L110 92' }, ojos: 'dormido' },
};

/** Corre una animación en bucle; devuelve cómo pararla. */
function bucle(anim: Animated.CompositeAnimation) {
  const l = Animated.loop(anim);
  l.start();
  return () => l.stop();
}

const t = (v: Animated.Value, a: number, ms: number, easing = Easing.inOut(Easing.sin), delay = 0) =>
  Animated.timing(v, { toValue: a, duration: ms, easing, delay, useNativeDriver: nativo });

export function Boti({
  pose = 'saludo',
  size = 110,
  claro = false,
  animado = true,
  interactivo = true,
  onPress,
}: {
  pose?: PoseBoti;
  size?: number;
  /** En fondo verde el cuerpo es más claro y el trazo más oscuro para que contraste. */
  claro?: boolean;
  /** Pedirle que se quede quieto (el interruptor general de Boti y «reducir movimiento» también lo detienen). */
  animado?: boolean;
  /** Si reacciona (salta, hace corazoncitos y suena) cuando lo tocan. */
  interactivo?: boolean;
  onPress?: () => void;
}) {
  const { ajustes, sonar } = useBoti();
  const [sinMovimiento, setSinMovimiento] = useState(false);
  useEffect(() => {
    let vivo = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((r) => vivo && setSinMovimiento(!!r))
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);
  const mueve = animado && ajustes.activo && !sinMovimiento;
  const reacciona = interactivo && ajustes.activo;

  const trazo = claro ? '#0E3B21' : '#14532D';
  const cuerpo = claro ? '#3FB778' : '#2E9B63';
  const brillo = claro ? '#9BE8BE' : '#7FD6A5';
  const tinta = '#14301F';
  const ambar = '#F2B33D';
  const hilo = '#FFF3D6';
  const verdeAcc = '#1F7A4D';
  const clipId = useMemo(() => `boti-clip-${++contador}`, []);
  const { brazos, ojos, ojosY } = CONFIG[pose];
  const dormido = pose === 'dormido';

  /* ───── valores animados ───── */
  const resp = useState(() => new Animated.Value(0))[0]; // respiración 0↔1
  const parpadeo = useState(() => new Animated.Value(1))[0]; // escala vertical de los ojos
  const mirada = useState(() => new Animated.Value(0))[0]; // -1 izquierda · 1 derecha
  const asas = useState(() => new Animated.Value(0))[0]; // balanceo de las asas
  const saludo = useState(() => new Animated.Value(0))[0]; // brazo derecho
  const brazoIzq = useState(() => new Animated.Value(0))[0];
  const accesorio = useState(() => new Animated.Value(0))[0]; // sombrero, lupa, caja, megáfono
  const ondas = useState(() => new Animated.Value(0))[0]; // ondas del megáfono, zetas de dormir
  const salto = useState(() => new Animated.Value(0))[0]; // 0 en el suelo → 1 arriba
  const aplasta = useState(() => new Animated.Value(0))[0]; // 0 normal → 1 aplastado
  const [corazones, setCorazones] = useState(0);
  const toques = useRef(0);

  // Respirar y balancear las asas.
  useEffect(() => {
    if (!mueve) return;
    const ms = dormido ? 2300 : 1300;
    const parar = [
      bucle(Animated.sequence([t(resp, 1, ms), t(resp, 0, ms)])),
      bucle(Animated.sequence([t(asas, 1, 1700), t(asas, -1, 1700), t(asas, 0, 900), Animated.delay(1400)])),
    ];
    return () => parar.forEach((p) => p());
  }, [mueve, dormido, resp, asas]);

  // Parpadear a ratos y mirar de lado.
  useEffect(() => {
    if (!mueve || ojos === 'felices' || ojos === 'dormido') return;
    let vivo = true;
    let reloj: ReturnType<typeof setTimeout>;
    const siguiente = () => {
      reloj = setTimeout(() => {
        if (!vivo) return;
        const guino = Math.random() < 0.25;
        const lado = Math.random() < 0.5 ? -1 : 1;
        const pasos = [t(parpadeo, 0.08, 80), t(parpadeo, 1, 110)];
        if (guino) pasos.push(Animated.delay(90), t(parpadeo, 0.08, 80), t(parpadeo, 1, 110));
        Animated.parallel([
          Animated.sequence(pasos),
          Animated.sequence([t(mirada, lado, 260), Animated.delay(700), t(mirada, 0, 260)]),
        ]).start(siguiente);
      }, 2200 + Math.random() * 2600);
    };
    siguiente();
    return () => {
      vivo = false;
      clearTimeout(reloj);
      parpadeo.setValue(1);
      mirada.setValue(0);
    };
  }, [mueve, ojos, parpadeo, mirada]);

  // Movimientos propios de cada pose.
  useEffect(() => {
    if (!mueve) return;
    const parar: (() => void)[] = [];
    const sube = (v: Animated.Value, ms: number, pausa = 0) => bucle(Animated.sequence([t(v, 1, ms), t(v, -1, ms), t(v, 0, ms * 0.6), Animated.delay(pausa)]));
    switch (pose) {
      case 'saludo':
        // La mano derecha saluda tres veces y descansa.
        parar.push(
          bucle(
            Animated.sequence([
              t(saludo, 1, 260),
              t(saludo, -1, 260),
              t(saludo, 1, 260),
              t(saludo, -1, 260),
              t(saludo, 1, 260),
              t(saludo, 0, 300),
              Animated.delay(2600),
            ]),
          ),
          sube(brazoIzq, 1500, 800),
        );
        break;
      case 'cocina':
        parar.push(sube(accesorio, 1200, 500), sube(saludo, 1600, 600), sube(brazoIzq, 1800, 300));
        break;
      case 'lupa':
        parar.push(sube(accesorio, 1100, 300), sube(brazoIzq, 1800, 500));
        break;
      case 'palma':
        parar.push(sube(accesorio, 1500, 800), sube(saludo, 1700, 600), sube(brazoIzq, 1700, 500));
        break;
      case 'caja':
        parar.push(bucle(Animated.sequence([t(accesorio, 1, 600), t(accesorio, 0, 600), Animated.delay(900)])));
        break;
      case 'megafono':
        parar.push(
          bucle(Animated.sequence([t(accesorio, 1, 160), t(accesorio, -1, 160), t(accesorio, 1, 160), t(accesorio, 0, 160), Animated.delay(1700)])),
          bucle(Animated.sequence([t(ondas, 1, 700, Easing.out(Easing.quad)), t(ondas, 0, 0), Animated.delay(250)])),
          sube(brazoIzq, 1800, 500),
        );
        break;
      case 'fiesta':
        // Los brazos suben y bajan celebrando y el gorrito rebota.
        parar.push(bucle(Animated.sequence([t(saludo, 1, 330), t(saludo, -1, 330)])), bucle(Animated.sequence([t(brazoIzq, -1, 330), t(brazoIzq, 1, 330)])), sube(accesorio, 700));
        break;
      case 'dormido':
        parar.push(bucle(Animated.sequence([t(ondas, 1, 2600, Easing.out(Easing.quad)), t(ondas, 0, 0), Animated.delay(300)])));
        break;
    }
    return () => {
      parar.forEach((p) => p());
      [saludo, brazoIzq, accesorio, ondas].forEach((v) => v.setValue(0));
    };
  }, [mueve, pose, saludo, brazoIzq, accesorio, ondas]);

  // Cuando lo tocan: se aplasta, salta, aterriza y suelta corazoncitos.
  const tocar = useCallback(() => {
    onPress?.();
    if (!reacciona) return;
    toques.current += 1;
    sonar(dormido ? 'dormir' : toques.current % 3 === 0 ? 'risa' : 'toque');
    setCorazones((n) => n + 1);
    if (sinMovimiento) return;
    Animated.sequence([
      Animated.timing(aplasta, { toValue: 1, duration: 80, useNativeDriver: nativo }),
      Animated.parallel([
        Animated.timing(aplasta, { toValue: 0, duration: 120, useNativeDriver: nativo }),
        Animated.timing(salto, { toValue: 1, duration: 170, easing: Easing.out(Easing.quad), useNativeDriver: nativo }),
      ]),
      Animated.timing(salto, { toValue: 0, duration: 190, easing: Easing.in(Easing.quad), useNativeDriver: nativo }),
      Animated.timing(aplasta, { toValue: 1, duration: 70, useNativeDriver: nativo }),
      Animated.spring(aplasta, { toValue: 0, friction: 4, tension: 160, useNativeDriver: nativo }),
    ]).start();
  }, [onPress, reacciona, sonar, dormido, sinMovimiento, aplasta, salto]);

  /* ───── interpolaciones ───── */
  const giro = (v: Animated.Value, grados: number) => v.interpolate({ inputRange: [-1, 1], outputRange: [`${-grados}deg`, `${grados}deg`] });
  const respY = resp.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (dormido ? 0.018 : 0.014)] });
  const respEscala = resp.interpolate({ inputRange: [0, 1], outputRange: [1, dormido ? 1.03 : 1.015] });
  const saltoY = salto.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.16] });
  const escalaY = aplasta.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });
  const escalaX = aplasta.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const miradaX = mirada.interpolate({ inputRange: [-1, 1], outputRange: [-size * 0.022, size * 0.022] });
  const ojoCy = ojosY ?? 66;

  const capa = (children: React.ReactNode) => (
    <Svg width={size} height={size} viewBox={VB} style={StyleSheet.absoluteFill}>
      {children}
    </Svg>
  );
  const brazo = (d: string) => <Path d={d} stroke={trazo} strokeWidth={7} strokeLinecap="round" fill="none" />;
  const hombro = (d: string) => {
    const m = /^M(\d+(?:\.\d+)?) (\d+(?:\.\d+)?)/.exec(d);
    return m ? origen(Number(m[1]), Number(m[2])) : '50% 50%';
  };
  const capaAnim = (children: React.ReactNode, estilo: object) => (
    <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, estilo]}>
      {capa(children)}
    </Animated.View>
  );

  /* ───── ojos y boca de cada pose ───── */
  const ojosAbiertos = (cy: number) => (
    <>
      <Circle cx={46} cy={cy} r={5.8} fill={tinta} />
      <Circle cx={47.8} cy={cy - 2} r={1.7} fill="#FFFFFF" />
      <Circle cx={74} cy={cy} r={5.8} fill={tinta} />
      <Circle cx={75.8} cy={cy - 2} r={1.7} fill="#FFFFFF" />
    </>
  );
  const sonrisa = <Path d="M51 76 Q60 86 69 76" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  const rostros = (): { ojos: React.ReactNode; boca: React.ReactNode } => {
    switch (pose) {
      case 'lupa':
        return {
          ojos: (
            <>
              <Circle cx={46} cy={66} r={5} fill={tinta} />
              <Circle cx={47.6} cy={64.2} r={1.5} fill="#FFFFFF" />
              <Circle cx={76} cy={64} r={7} fill={tinta} />
              <Circle cx={78} cy={61.8} r={1.9} fill="#FFFFFF" />
            </>
          ),
          boca: <Path d="M54 78 Q60 82 66 78" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
        };
      case 'cocina':
        return { ojos: ojosAbiertos(66), boca: <Path d="M52 76 Q60 86 68 76 Z" fill={tinta} stroke={tinta} strokeWidth={2} strokeLinejoin="round" /> };
      case 'caja':
        return { ojos: ojosAbiertos(62), boca: <Path d="M52 71 Q60 79 68 71" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" /> };
      case 'megafono':
        return { ojos: ojosAbiertos(66), boca: <Ellipse cx={60} cy={79} rx={6} ry={5} fill={tinta} /> };
      case 'fiesta':
        return {
          ojos: <Path d="M41 68 Q46 60 51 68 M69 68 Q74 60 79 68" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
          boca: <Path d="M50 75 Q60 88 70 75 Z" fill={tinta} />,
        };
      case 'dormido':
        return {
          ojos: <Path d="M40 66 Q46 72 52 66 M68 66 Q74 72 80 66" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
          boca: <Circle cx={60} cy={79} r={3.5} fill={tinta} />,
        };
      default:
        return { ojos: ojosAbiertos(66), boca: sonrisa };
    }
  };
  const cara = rostros();

  /* ───── accesorios ───── */
  const accDetras =
    pose === 'caja' ? (
      <>
        <Rect x={38} y={84} width={44} height={34} rx={5} fill="#E8C48A" stroke={trazo} strokeWidth={4} />
        <Path d="M60 84 V100" stroke={trazo} strokeWidth={4} />
      </>
    ) : null;

  let accFrente: React.ReactNode = null;
  let accOrigen = '50% 50%';
  let accEstilo: object = {};
  switch (pose) {
    case 'cocina':
      accFrente = (
        <>
          <Path d="M34 30 C22 28 22 8 38 10 C40 -6 62 -8 62 6 C70 -6 92 0 84 14 C98 14 98 30 86 30 Z" fill="#FFFFFF" stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Rect x={34} y={28} width={52} height={12} rx={4} fill="#FFFFFF" stroke={trazo} strokeWidth={4} />
        </>
      );
      accOrigen = origen(60, 40);
      accEstilo = { transform: [{ rotate: giro(accesorio, 3.5) }] };
      break;
    case 'palma':
      accFrente = (
        <>
          <Ellipse cx={60} cy={34} rx={56} ry={10} fill={ambar} stroke={trazo} strokeWidth={4} />
          <Path d="M36 32 C36 6 84 6 84 32 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Path d="M37 27 H83" stroke={verdeAcc} strokeWidth={5} />
        </>
      );
      accOrigen = origen(60, 36);
      accEstilo = { transform: [{ rotate: giro(accesorio, 4) }] };
      break;
    case 'lupa':
      accFrente = (
        <>
          <Circle cx={122} cy={46} r={14} fill="#FCEFD6" stroke={trazo} strokeWidth={5} />
          <Path d="M113 57 L104 70" stroke={trazo} strokeWidth={6} strokeLinecap="round" />
          <Path d="M115 40 Q118 36 123 36" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" fill="none" />
        </>
      );
      accOrigen = origen(100, 72);
      accEstilo = { transform: [{ rotate: giro(accesorio, 6) }] };
      break;
    case 'megafono':
      accFrente = (
        <>
          <Path d="M106 58 L132 44 V84 L106 72 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
        </>
      );
      accOrigen = origen(106, 66);
      accEstilo = { transform: [{ rotate: giro(accesorio, 4) }, { scale: accesorio.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 1, 1.05] }) }] };
      break;
    case 'fiesta':
      accFrente = (
        <>
          <Path d="M60 -18 L42 34 H78 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
          <Path d="M52 8 L68 4 M48 20 L72 14" stroke="#FFFFFF" strokeWidth={3} strokeLinecap="round" opacity={0.85} />
          <Circle cx={60} cy={-18} r={6} fill="#FFFFFF" stroke={trazo} strokeWidth={4} />
        </>
      );
      accOrigen = origen(60, 34);
      accEstilo = { transform: [{ rotate: giro(accesorio, 6) }] };
      break;
  }
  // La caja sube y baja un poquito, como si respirara con Boti.
  const cajaEstilo = { transform: [{ translateY: accesorio.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.012] }) }] };

  /* ───── dibujo ───── */
  return (
    <Pressable
      accessibilityRole={reacciona ? 'button' : 'image'}
      accessibilityLabel={reacciona ? 'Boti, la mascota de Mercaboot. Tócalo para jugar.' : 'Boti, la mascota de Mercaboot'}
      disabled={!reacciona && !onPress}
      onPress={tocar}
      style={{ width: size, height: size }}
    >
      <Animated.View
        style={{
          width: size,
          height: size,
          transform: [{ translateY: saltoY }, { translateY: mueve ? respY : 0 }, { scaleX: escalaX }, { scaleY: escalaY }, { scale: mueve ? respEscala : 1 }],
          transformOrigin: origen(60, 112),
        }}
      >
        {/* asas (se balancean) */}
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, { transform: [{ rotate: giro(asas, 1.6) }], transformOrigin: origen(60, 42) }]}>
          {capa(
            <>
              <Path d="M38 42 C38 12 58 12 58 42" fill="none" stroke={trazo} strokeWidth={8} strokeLinecap="round" />
              <Path d="M62 42 C62 12 82 12 82 42" fill="none" stroke={trazo} strokeWidth={8} strokeLinecap="round" />
              <Path d="M42 38 C42 20 50 17 54 22" fill="none" stroke={brillo} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
              <Path d="M66 38 C66 20 74 17 78 22" fill="none" stroke={brillo} strokeWidth={2.4} strokeLinecap="round" opacity={0.8} />
            </>,
          )}
        </Animated.View>

        {/* cuerpo: patitas, bolsa, franja cosida y mejillas */}
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {capa(
            <>
              <Defs>
                <ClipPath id={clipId}>
                  <Rect x={20} y={36} width={80} height={76} rx={24} />
                </ClipPath>
              </Defs>
              <Ellipse cx={44} cy={114} rx={11} ry={6} fill={trazo} />
              <Ellipse cx={76} cy={114} rx={11} ry={6} fill={trazo} />
              <Rect x={20} y={36} width={80} height={76} rx={24} fill={cuerpo} />
              <G clipPath={`url(#${clipId})`}>
                <Rect x={20} y={86} width={80} height={14} fill={ambar} />
                <Path d="M20 88.2 H100 M20 97.8 H100" stroke={hilo} strokeWidth={1.3} strokeDasharray="3 2.6" strokeLinecap="round" opacity={0.9} />
              </G>
              <Rect x={20} y={36} width={80} height={76} rx={24} fill="none" stroke={trazo} strokeWidth={4} />
              <Circle cx={35} cy={78} r={7} fill="#F9A98A" opacity={0.75} />
              <Circle cx={85} cy={78} r={7} fill="#F9A98A" opacity={0.75} />
              <Circle cx={35} cy={78} r={4} fill="#FBC4A8" opacity={0.8} />
              <Circle cx={85} cy={78} r={4} fill="#FBC4A8" opacity={0.8} />
            </>,
          )}
        </View>

        {/* accesorio que va detrás de los brazos (la caja) */}
        {accDetras ? capaAnim(accDetras, mueve ? cajaEstilo : {}) : null}

        {/* brazos: giran desde el hombro */}
        {capaAnim(brazo(brazos.izq), { transform: [{ rotate: giro(brazoIzq, pose === 'fiesta' ? 12 : 5) }], transformOrigin: hombro(brazos.izq) })}
        {capaAnim(brazo(brazos.der), { transform: [{ rotate: giro(saludo, pose === 'saludo' ? 22 : pose === 'fiesta' ? 12 : 5) }], transformOrigin: hombro(brazos.der) })}

        {/* cara: parpadea y mira de lado */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            ojos === 'abiertos' || ojos === 'lupa' ? { transform: [{ translateX: miradaX }, { scaleY: parpadeo }], transformOrigin: origen(60, ojoCy) } : null,
          ]}
        >
          {capa(cara.ojos)}
        </Animated.View>
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          {capa(cara.boca)}
        </View>

        {/* sombrero, lupa, megáfono… */}
        {accFrente ? capaAnim(accFrente, { ...accEstilo, transformOrigin: accOrigen }) : null}

        {/* ondas del megáfono */}
        {pose === 'megafono' ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: ondas.interpolate({ inputRange: [0, 0.2, 1], outputRange: [0, 1, 0] }),
                transform: [{ translateX: ondas.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.05] }) }],
              },
            ]}
          >
            {capa(<Path d="M140 54 L148 50 M140 64 H150 M140 74 L148 78" stroke={verdeAcc} strokeWidth={4} strokeLinecap="round" />)}
          </Animated.View>
        ) : null}

        {/* zetas que suben cuando duerme */}
        {pose === 'dormido' ? (
          <Animated.View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                opacity: mueve ? ondas.interpolate({ inputRange: [0, 0.15, 0.8, 1], outputRange: [0, 1, 0.9, 0] }) : 1,
                transform: [{ translateY: ondas.interpolate({ inputRange: [0, 1], outputRange: [size * 0.06, -size * 0.1] }) }],
              },
            ]}
          >
            {capa(<Path d="M104 26 H116 L104 40 H116 M122 2 H132 L122 14 H132" stroke={verdeAcc} strokeWidth={4} fill="none" strokeLinecap="round" strokeLinejoin="round" />)}
          </Animated.View>
        ) : null}
      </Animated.View>

      {/* confeti de la fiesta */}
      {pose === 'fiesta' && mueve ? <Confeti size={size} colores={[ambar, cuerpo, '#FFFFFF', '#F9A98A']} /> : null}

      {/* corazoncitos al tocarlo */}
      {corazones > 0 ? <Corazones key={corazones} size={size} /> : null}
    </Pressable>
  );
}

/** Papelitos de colores que caen alrededor de Boti. */
function Confeti({ size, colores }: { size: number; colores: string[] }) {
  const piezas = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => ({
        x: -0.1 + (i / 9) * 1.1 + ((i * 37) % 7) * 0.01,
        color: colores[i % colores.length],
        ms: 2200 + ((i * 53) % 5) * 330,
        retraso: (i * 290) % 2400,
        redondo: i % 3 === 0,
        v: new Animated.Value(0),
      })),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => {
    const parar = piezas.map((p) => bucle(Animated.sequence([Animated.delay(p.retraso), Animated.timing(p.v, { toValue: 1, duration: p.ms, easing: Easing.linear, useNativeDriver: nativo }), Animated.timing(p.v, { toValue: 0, duration: 0, useNativeDriver: nativo })])));
    return () => parar.forEach((p) => p());
  }, [piezas]);
  const lado = Math.max(4, size * 0.04);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {piezas.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: p.x * size,
            top: -size * 0.05,
            width: lado,
            height: p.redondo ? lado : lado * 1.6,
            borderRadius: p.redondo ? lado : 1,
            backgroundColor: p.color,
            opacity: p.v.interpolate({ inputRange: [0, 0.1, 0.85, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: p.v.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.95] }) },
              { translateX: p.v.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0, size * 0.04, -size * 0.03] }) },
              { rotate: p.v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${i % 2 ? 540 : -540}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}

/** Tres corazoncitos que suben y se desvanecen. */
function Corazones({ size }: { size: number }) {
  const hs = useMemo(() => [new Animated.Value(0), new Animated.Value(0), new Animated.Value(0)], []);
  useEffect(() => {
    Animated.parallel(hs.map((v, i) => Animated.sequence([Animated.delay(i * 110), Animated.timing(v, { toValue: 1, duration: 900, easing: Easing.out(Easing.quad), useNativeDriver: nativo })]))).start();
  }, [hs]);
  const lado = Math.max(10, size * 0.14);
  const pos = [0.18, 0.46, 0.7];
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {hs.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: pos[i] * size,
            top: size * 0.12,
            opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (0.28 + i * 0.05)] }) },
              { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.9] }) },
            ],
          }}
        >
          <Svg width={lado} height={lado} viewBox="0 0 24 24">
            <Path d="M12 21 C4 14 2 10 2 7.5 C2 4.5 4.5 3 7 3 C9 3 11 4.2 12 6 C13 4.2 15 3 17 3 C19.5 3 22 4.5 22 7.5 C22 10 20 14 12 21 Z" fill={i === 1 ? '#F2B33D' : '#F47C8C'} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}
