import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AccessibilityInfo, Animated, Easing, Platform, Pressable, StyleSheet, View } from 'react-native';
import Svg, { Circle, ClipPath, Defs, Ellipse, G, Path, Rect } from 'react-native-svg';
import { useBoti, type SonidoBoti } from '../lib/boti';

/**
 * Boti, la bolsa del mandado que guía al usuario y es la mascota de Mercaboot: una bolsa verde con asas,
 * franja ámbar cosida, mejillas y patitas (diseño aprobado en el boceto «Boti: poses y accesorios»).
 *
 * Se dibuja por capas para poder moverlas: las asas, el cuerpo, los brazos, los ojos y los accesorios son
 * capas aparte. Respira, parpadea, mira de lado, saluda, mueve sombreros y confeti, y reacciona cuando lo tocan.
 * Todo se apaga cuando la persona desactiva a Boti o tiene activado «reducir movimiento» en su teléfono.
 */
export type PoseBoti = 'saludo' | 'lupa' | 'cocina' | 'caja' | 'palma' | 'megafono' | 'fiesta' | 'dormido' | 'pensando' | 'aplauso';

/** Lo que siente o hace Boti por un momento, encima de su pose: cada una trae su cara, sus brazos, su movimiento y su sonido. */
export type EmocionBoti = 'alegre' | 'brinco' | 'enojado' | 'triste' | 'bostezo' | 'sorpresa' | 'enamorado' | 'celebra' | 'baila' | 'gira';
/** Una emoción pedida desde fuera; el «id» distinto hace que se actúe otra vez aunque sea la misma. */
export interface DisparoEmocion {
  tipo: EmocionBoti;
  id: number;
}

/** El sonido de cada objeto que trae puesto. */
const SONIDO_POSE: Record<PoseBoti, SonidoBoti> = {
  saludo: 'hola',
  lupa: 'lupa',
  cocina: 'gorro',
  caja: 'caja',
  palma: 'sombrero',
  megafono: 'megafono',
  fiesta: 'cornetita',
  dormido: 'dormir',
  pensando: 'pensando',
  aplauso: 'aplauso',
};
const SONIDO_EMO: Record<EmocionBoti, SonidoBoti> = {
  alegre: 'alegre',
  brinco: 'brinco',
  enojado: 'enojo',
  triste: 'triste',
  bostezo: 'bostezo',
  sorpresa: 'sorpresa',
  enamorado: 'enamorado',
  celebra: 'confeti',
  baila: 'baila',
  gira: 'giro',
};

let contador = 0;
const VB = '-20 -24 160 160';
/** Un punto del dibujo (de -20 a 140) como porcentaje del cuadro, para fijar el centro de giro. */
const pct = (v: number, desde: number) => `${(((v - desde) / 160) * 100).toFixed(2)}%`;
const origen = (x: number, y: number) => `${pct(x, -20)} ${pct(y, -24)}`;
const nativo = Platform.OS !== 'web';

type Ojos = 'abiertos' | 'lupa' | 'felices' | 'dormido' | 'cerrados' | 'corazones';
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
  pensando: { brazos: { izq: 'M20 70 L6 84', der: 'M100 74 L82 83' }, ojos: 'abiertos' },
  aplauso: { brazos: { izq: 'M20 76 L44 90', der: 'M100 76 L76 90' }, ojos: 'felices' },
};

interface ConfigEmo {
  /** Cuánto dura, en milisegundos. */
  ms: number;
  brazos: Brazos;
  ojos: Ojos;
  /** Los brazos se quedan quietos (enojo, tristeza…) en vez de seguir el vaivén de su pose. */
  quietos: boolean;
}
const EMO: Record<EmocionBoti, ConfigEmo> = {
  alegre: { ms: 1700, brazos: { izq: 'M20 66 L6 50', der: 'M100 66 L114 50' }, ojos: 'felices', quietos: false },
  brinco: { ms: 1500, brazos: { izq: 'M20 66 L4 52', der: 'M100 66 L116 52' }, ojos: 'abiertos', quietos: false },
  enojado: { ms: 2400, brazos: { izq: 'M20 78 L36 90', der: 'M100 78 L84 90' }, ojos: 'abiertos', quietos: true },
  triste: { ms: 3200, brazos: { izq: 'M20 80 L12 98', der: 'M100 80 L108 98' }, ojos: 'abiertos', quietos: true },
  bostezo: { ms: 2700, brazos: { izq: 'M20 70 L4 54', der: 'M100 72 L80 79' }, ojos: 'cerrados', quietos: true },
  sorpresa: { ms: 1600, brazos: { izq: 'M20 66 L6 54', der: 'M100 66 L114 54' }, ojos: 'abiertos', quietos: true },
  enamorado: { ms: 2500, brazos: { izq: 'M20 74 L40 84', der: 'M100 74 L80 84' }, ojos: 'corazones', quietos: true },
  celebra: { ms: 2900, brazos: { izq: 'M20 66 L4 44', der: 'M100 66 L116 44' }, ojos: 'felices', quietos: false },
  baila: { ms: 2900, brazos: { izq: 'M20 66 L6 50', der: 'M100 70 L114 84' }, ojos: 'felices', quietos: false },
  gira: { ms: 1100, brazos: BRAZOS_NORMALES, ojos: 'abiertos', quietos: true },
};
let idLocal = 0;

/** Corre una animación en bucle; devuelve cómo pararla. */
function bucle(anim: Animated.CompositeAnimation) {
  const l = Animated.loop(anim);
  l.start();
  return () => l.stop();
}

const t = (v: Animated.Value, a: number, ms: number, easing = Easing.inOut(Easing.sin), delay = 0) =>
  Animated.timing(v, { toValue: a, duration: ms, easing, delay, useNativeDriver: nativo });

/** Qué hace Boti en cada toque, en orden: «null» es la reacción de su objeto (con corazones); lo demás son emociones. */
const BARAJA: (EmocionBoti | null)[] = [null, 'alegre', null, 'brinco', null, 'enamorado', null, 'baila', 'sorpresa', null, 'gira', null, 'celebra', null, 'bostezo'];

interface ValoresEmo {
  salto: Animated.Value;
  aplasta: Animated.Value;
  ladea: Animated.Value;
  sacude: Animated.Value;
  giroY: Animated.Value;
  estira: Animated.Value;
  emoA: Animated.Value;
  emoB: Animated.Value;
}

/** El movimiento de cada emoción: saltos, temblores, vueltas, bostezos… */
function animacionEmo(tipo: EmocionBoti, v: ValoresEmo): Animated.CompositeAnimation {
  const seq = Animated.sequence;
  const par = Animated.parallel;
  const sube = Easing.out(Easing.quad);
  const baja = Easing.in(Easing.quad);
  const brinca = (n: number) =>
    seq(Array.from({ length: n }, () => seq([t(v.aplasta, 1, 90), par([t(v.aplasta, 0, 110), t(v.salto, 1, 200, sube)]), t(v.salto, 0, 210, baja)])));
  const agita = (val: Animated.Value, veces: number, ms: number) => seq([...Array.from({ length: veces * 2 }, (_, i) => t(val, i % 2 ? -1 : 1, ms)), t(val, 0, ms)]);
  const mece = (val: Animated.Value, veces: number, ms: number, amp: number) => seq([...Array.from({ length: veces * 2 }, (_, i) => t(val, i % 2 ? -amp : amp, ms)), t(val, 0, ms)]);
  switch (tipo) {
    case 'brinco':
      return brinca(3);
    case 'alegre':
      return par([brinca(2), agita(v.emoA, 3, 190), agita(v.emoB, 3, 190)]);
    case 'celebra':
      return par([brinca(3), agita(v.emoA, 5, 170), agita(v.emoB, 5, 170)]);
    case 'enojado':
      return par([mece(v.sacude, 12, 55, 1), seq([t(v.aplasta, 0.7, 160), Animated.delay(1700), t(v.aplasta, 0, 300)])]);
    case 'triste':
      return par([seq([t(v.estira, -1, 600), Animated.delay(1900), t(v.estira, 0, 600)]), seq([t(v.ladea, -0.35, 800), Animated.delay(1600), t(v.ladea, 0, 600)])]);
    case 'bostezo':
      return par([seq([t(v.estira, 1, 900), Animated.delay(900), t(v.estira, 0, 700)]), seq([Animated.delay(300), agita(v.emoA, 1, 450)])]);
    case 'sorpresa':
      return par([seq([t(v.aplasta, 1, 70), par([t(v.aplasta, 0, 90), t(v.salto, 1, 140, sube)]), t(v.salto, 0, 170, baja)]), mece(v.sacude, 2, 60, 1)]);
    case 'enamorado':
      return seq([t(v.ladea, 0.5, 500), t(v.ladea, -0.5, 700), t(v.ladea, 0.5, 700), t(v.ladea, 0, 400)]);
    case 'baila':
      return par([mece(v.ladea, 4, 300, 0.7), agita(v.emoA, 4, 300), agita(v.emoB, 4, 300), seq([Animated.delay(150), brinca(4)])]);
    case 'gira':
      return par([t(v.giroY, 1, 1000, Easing.inOut(Easing.cubic)), seq([t(v.salto, 1, 350, sube), t(v.salto, 0, 400, baja)])]);
  }
}

export function Boti({
  pose = 'saludo',
  size = 110,
  claro = false,
  animado = true,
  interactivo = true,
  onPress,
  emocion = null,
  alEmocionar,
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
  /** Una emoción pedida desde fuera (el compañero flotante la recibe de la app). */
  emocion?: DisparoEmocion | null;
  /** Avisa cuando Boti decide solo hacer una emoción al ser tocado, para que el globo diga algo acorde. */
  alEmocionar?: (e: EmocionBoti) => void;
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
  const ladea = useState(() => new Animated.Value(0))[0]; // inclinación de todo el cuerpo
  const sacude = useState(() => new Animated.Value(0))[0]; // temblor de lado a lado
  const giroY = useState(() => new Animated.Value(0))[0]; // vuelta completa
  const estira = useState(() => new Animated.Value(0))[0]; // -1 encogido · 1 estirado
  const emoA = useState(() => new Animated.Value(0))[0]; // brazo izquierdo durante una emoción
  const emoB = useState(() => new Animated.Value(0))[0]; // brazo derecho durante una emoción
  const emoV = useState(() => new Animated.Value(0))[0]; // 0→1 durante toda la emoción (lágrima, vapor, signo…)
  const entrada = useState(() => new Animated.Value(1))[0]; // el objeto llega al cambiar de pose
  const hopAcc = useState(() => new Animated.Value(0))[0]; // brinquito del gorro, la lupa o el megáfono
  const [corazones, setCorazones] = useState(0);
  const [rafaga, setRafaga] = useState(0);
  const toques = useRef(0);
  const marcas = useRef<number[]>([]);

  // La emoción que Boti está actuando ahora. Las pedidas desde fuera llevan id negativo para no chocar con las de sus toques.
  const [emo, setEmo] = useState<{ tipo: EmocionBoti; id: number } | null>(null);
  const [visto, setVisto] = useState(0);
  if (emocion && emocion.id !== visto) {
    setVisto(emocion.id);
    setEmo({ tipo: emocion.tipo, id: -emocion.id });
  }
  const emoCfg = emo ? EMO[emo.tipo] : null;

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
    // El gorro da un brinquito sobre la cabeza de vez en cuando.
    const brinquito = (pausa: number) => bucle(Animated.sequence([Animated.delay(pausa), t(hopAcc, 1, 170, Easing.out(Easing.quad)), t(hopAcc, 0, 420, Easing.bounce)]));
    const palmadas = (v: Animated.Value, fase: number) =>
      bucle(Animated.sequence([Animated.delay(fase), t(v, 1, 150), t(v, -1, 150), t(v, 1, 150), t(v, -1, 150), t(v, 0, 150), Animated.delay(900)]));
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
        parar.push(sube(accesorio, 1200, 500), sube(saludo, 1600, 600), sube(brazoIzq, 1800, 300), brinquito(3200));
        break;
      case 'lupa':
        parar.push(sube(accesorio, 1100, 300), sube(brazoIzq, 1800, 500), bucle(Animated.sequence([Animated.delay(3600), t(hopAcc, 1, 260), t(hopAcc, 0, 260), t(hopAcc, 1, 260), t(hopAcc, 0, 300)])));
        break;
      case 'palma':
        parar.push(sube(accesorio, 1500, 800), sube(saludo, 1700, 600), sube(brazoIzq, 1700, 500), brinquito(4000));
        break;
      case 'pensando':
        parar.push(bucle(Animated.sequence([t(ondas, 1, 900), t(ondas, 0, 900)])), sube(brazoIzq, 2000, 500));
        break;
      case 'aplauso':
        parar.push(palmadas(saludo, 0), palmadas(brazoIzq, 0), bucle(Animated.sequence([t(ondas, 1, 150), t(ondas, 0, 150), t(ondas, 1, 150), t(ondas, 0, 150), Animated.delay(1050)])));
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
        parar.push(bucle(Animated.sequence([t(saludo, 1, 330), t(saludo, -1, 330)])), bucle(Animated.sequence([t(brazoIzq, -1, 330), t(brazoIzq, 1, 330)])), sube(accesorio, 700), brinquito(1800));
        break;
      case 'dormido':
        parar.push(bucle(Animated.sequence([t(ondas, 1, 2600, Easing.out(Easing.quad)), t(ondas, 0, 0), Animated.delay(300)])));
        break;
    }
    return () => {
      parar.forEach((p) => p());
      [saludo, brazoIzq, accesorio, ondas, hopAcc].forEach((v) => v.setValue(0));
    };
  }, [mueve, pose, saludo, brazoIzq, accesorio, ondas, hopAcc]);

  // Al cambiar de pose, el objeto nuevo llega con su propio sonido (el gorro cae, la lupa entra, el megáfono suena…).
  const poseAnterior = useRef(pose);
  useEffect(() => {
    if (poseAnterior.current === pose) return;
    poseAnterior.current = pose;
    if (reacciona) sonar(SONIDO_POSE[pose]);
    if (!mueve) return;
    entrada.setValue(0);
    Animated.spring(entrada, { toValue: 1, friction: 5, tension: 120, useNativeDriver: nativo }).start();
  }, [pose, reacciona, mueve, sonar, entrada]);

  // Cuando empieza una emoción: suena, se mueve y, al terminar, vuelve a su pose.
  const valoresEmo = useMemo(() => ({ salto, aplasta, ladea, sacude, giroY, estira, emoA, emoB }), [salto, aplasta, ladea, sacude, giroY, estira, emoA, emoB]);
  const emoId = emo?.id;
  const emoTipo = emo?.tipo;
  useEffect(() => {
    if (emoId === undefined || !emoTipo) return;
    if (reacciona) sonar(SONIDO_EMO[emoTipo]);
    const anim = mueve ? animacionEmo(emoTipo, valoresEmo) : null;
    anim?.start();
    emoV.setValue(0);
    if (mueve) Animated.timing(emoV, { toValue: 1, duration: EMO[emoTipo].ms, easing: Easing.linear, useNativeDriver: nativo }).start();
    const fin = setTimeout(() => setEmo(null), EMO[emoTipo].ms);
    return () => {
      clearTimeout(fin);
      anim?.stop();
      emoV.stopAnimation();
      emoV.setValue(0);
      Object.values(valoresEmo).forEach((v) => v.setValue(0));
    };
  }, [emoId, emoTipo, mueve, reacciona, sonar, valoresEmo, emoV]);

  // Cuando lo tocan: su objeto reacciona (el gorro brinca, suena el megáfono…) y, cada tanto, siente algo distinto.
  // Si lo tocan muchas veces seguidas, se enoja.
  const tocar = useCallback(() => {
    onPress?.();
    if (!reacciona) return;
    toques.current += 1;
    const ahora = Date.now();
    marcas.current = [...marcas.current.filter((m) => ahora - m < 4000), ahora];
    let paso: EmocionBoti | null = BARAJA[(toques.current - 1) % BARAJA.length];
    if (marcas.current.length >= 6) {
      paso = 'enojado';
      marcas.current = [];
    }
    if (dormido) paso = null;
    if (paso) {
      idLocal += 1;
      setEmo({ tipo: paso, id: idLocal });
      alEmocionar?.(paso);
      return;
    }
    setEmo(null);
    sonar(dormido ? 'dormir' : pose === 'saludo' ? (toques.current % 2 ? 'toque' : 'risa') : SONIDO_POSE[pose]);
    setCorazones((n) => n + 1);
    if (pose === 'fiesta') setRafaga((n) => n + 1);
    if (sinMovimiento) return;
    Animated.sequence([t(hopAcc, 1, 170, Easing.out(Easing.quad)), t(hopAcc, 0, 420, Easing.bounce)]).start();
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
  }, [onPress, alEmocionar, reacciona, sonar, dormido, pose, sinMovimiento, aplasta, salto, hopAcc]);

  /* ───── interpolaciones ───── */
  const giro = (v: Animated.Value, grados: number) => v.interpolate({ inputRange: [-1, 1], outputRange: [`${-grados}deg`, `${grados}deg`] });
  const respY = resp.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (dormido ? 0.018 : 0.014)] });
  const respEscala = resp.interpolate({ inputRange: [0, 1], outputRange: [1, dormido ? 1.03 : 1.015] });
  const saltoY = salto.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.16] });
  const escalaY = aplasta.interpolate({ inputRange: [0, 1], outputRange: [1, 0.88] });
  const escalaX = aplasta.interpolate({ inputRange: [0, 1], outputRange: [1, 1.08] });
  const miradaX = mirada.interpolate({ inputRange: [-1, 1], outputRange: [-size * 0.022, size * 0.022] });
  const ojoCy = emo ? 66 : (ojosY ?? 66);
  const ladeaR = ladea.interpolate({ inputRange: [-1, 1], outputRange: ['-10deg', '10deg'] });
  const sacudeX = sacude.interpolate({ inputRange: [-1, 1], outputRange: [-size * 0.025, size * 0.025] });
  const giroX = giroY.interpolate({ inputRange: [0, 0.25, 0.5, 0.75, 1], outputRange: [1, 0.04, -1, 0.04, 1] });
  const estiraY = estira.interpolate({ inputRange: [-1, 0, 1], outputRange: [0.9, 1, 1.08] });
  // El objeto llega desde arriba (gorros) o desde un lado (lupa, megáfono) al cambiar de pose.
  const entradaY = entrada.interpolate({ inputRange: [0, 1], outputRange: [-size * 0.34, 0] });
  const entradaX = entrada.interpolate({ inputRange: [0, 1], outputRange: [size * 0.3, 0] });
  const entradaOp = entrada.interpolate({ inputRange: [0, 0.35, 1], outputRange: [0, 1, 1], extrapolate: 'clamp' });
  const hopY = hopAcc.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.1] });
  const hopRot = hopAcc.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '-16deg'] });
  const hopEsc = hopAcc.interpolate({ inputRange: [0, 1], outputRange: [1, 1.22] });
  // Lo que Boti siente cambia sus brazos y su cara; si la emoción pide calma, los brazos dejan su vaivén.
  const quieto = !!emoCfg?.quietos;
  const ampIzq = quieto ? 0 : emoCfg ? 5 : pose === 'fiesta' ? 12 : pose === 'aplauso' ? 14 : 5;
  const ampDer = quieto ? 0 : emoCfg ? 5 : pose === 'saludo' ? 22 : pose === 'fiesta' ? 12 : pose === 'aplauso' ? 14 : 5;
  const brazosEf = emoCfg?.brazos ?? brazos;
  const ojosEf = emoCfg?.ojos ?? ojos;
  // Con la lupa, el megáfono o la caja en las manos, una emoción las guarda un momento.
  const sinObjeto = !!emo && (pose === 'lupa' || pose === 'megafono' || pose === 'caja' || pose === 'pensando' || pose === 'aplauso');
  const visible = emoV.interpolate({ inputRange: [0, 0.08, 0.88, 1], outputRange: [0, 1, 1, 0] });

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
      case 'pensando':
        return {
          ojos: (
            <>
              <Circle cx={49} cy={63} r={5.8} fill={tinta} />
              <Circle cx={51} cy={60.8} r={1.7} fill="#FFFFFF" />
              <Circle cx={77} cy={63} r={5.8} fill={tinta} />
              <Circle cx={79} cy={60.8} r={1.7} fill="#FFFFFF" />
            </>
          ),
          boca: <Path d="M54 80 Q60 82 67 78" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
        };
      case 'aplauso':
        return {
          ojos: <Path d="M41 68 Q46 60 51 68 M69 68 Q74 60 79 68" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
          boca: <Path d="M50 75 Q60 88 70 75 Z" fill={tinta} />,
        };
      default:
        return { ojos: ojosAbiertos(66), boca: sonrisa };
    }
  };
  const corazonPath = 'M12 21 C4 14 2 10 2 7.5 C2 4.5 4.5 3 7 3 C9 3 11 4.2 12 6 C13 4.2 15 3 17 3 C19.5 3 22 4.5 22 7.5 C22 10 20 14 12 21 Z';
  const rojo = '#E5484D';
  const arcosFelices = <Path d="M41 68 Q46 60 51 68 M69 68 Q74 60 79 68" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />;
  const caraEmo = (tipo: EmocionBoti): { ojos: React.ReactNode; boca: React.ReactNode } => {
    switch (tipo) {
      case 'alegre':
      case 'celebra':
      case 'baila':
        return { ojos: arcosFelices, boca: <Path d="M50 75 Q60 88 70 75 Z" fill={tinta} /> };
      case 'brinco':
        return { ojos: ojosAbiertos(66), boca: <Path d="M52 76 Q60 86 68 76 Z" fill={tinta} stroke={tinta} strokeWidth={2} strokeLinejoin="round" /> };
      case 'enojado':
        return {
          ojos: (
            <>
              <Circle cx={46} cy={69} r={5.2} fill={tinta} />
              <Circle cx={74} cy={69} r={5.2} fill={tinta} />
              <Path d="M36 57 L54 65 M84 57 L66 65" stroke={tinta} strokeWidth={4.4} strokeLinecap="round" />
            </>
          ),
          boca: (
            <>
              <Circle cx={35} cy={78} r={8} fill={rojo} opacity={0.4} />
              <Circle cx={85} cy={78} r={8} fill={rojo} opacity={0.4} />
              <Path d="M52 83 Q60 75 68 83" stroke={tinta} strokeWidth={3.8} fill="none" strokeLinecap="round" />
            </>
          ),
        };
      case 'triste':
        return {
          ojos: (
            <>
              <Circle cx={46} cy={68} r={6.4} fill={tinta} />
              <Circle cx={48.2} cy={65.6} r={2.2} fill="#FFFFFF" />
              <Circle cx={44} cy={70.5} r={1.1} fill="#FFFFFF" />
              <Circle cx={74} cy={68} r={6.4} fill={tinta} />
              <Circle cx={76.2} cy={65.6} r={2.2} fill="#FFFFFF" />
              <Circle cx={72} cy={70.5} r={1.1} fill="#FFFFFF" />
              <Path d="M37 62 L53 56 M83 62 L67 56" stroke={tinta} strokeWidth={3.4} strokeLinecap="round" />
            </>
          ),
          boca: <Path d="M52 85 Q60 77 68 85" stroke={tinta} strokeWidth={3.6} fill="none" strokeLinecap="round" />,
        };
      case 'bostezo':
        return {
          ojos: <Path d="M40 66 Q46 72 52 66 M68 66 Q74 72 80 66" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
          boca: <Ellipse cx={60} cy={80} rx={7.5} ry={9} fill={tinta} />,
        };
      case 'sorpresa':
        return {
          ojos: (
            <>
              <Circle cx={46} cy={66} r={7.4} fill={tinta} />
              <Circle cx={48.4} cy={63.4} r={2.3} fill="#FFFFFF" />
              <Circle cx={74} cy={66} r={7.4} fill={tinta} />
              <Circle cx={76.4} cy={63.4} r={2.3} fill="#FFFFFF" />
              <Path d="M38 53 Q46 47 54 53 M66 53 Q74 47 82 53" stroke={tinta} strokeWidth={3.2} fill="none" strokeLinecap="round" />
            </>
          ),
          boca: <Ellipse cx={60} cy={82} rx={4.6} ry={6.6} fill={tinta} />,
        };
      case 'enamorado':
        return {
          ojos: (
            <>
              <G transform={`translate(38.4 58.4) scale(0.68)`}>
                <Path d={corazonPath} fill="#F47C8C" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
              </G>
              <G transform={`translate(65.6 58.4) scale(0.68)`}>
                <Path d={corazonPath} fill="#F47C8C" stroke={tinta} strokeWidth={1.6} strokeLinejoin="round" />
              </G>
            </>
          ),
          boca: <Path d="M51 76 Q60 87 69 76" stroke={tinta} strokeWidth={3.5} fill="none" strokeLinecap="round" />,
        };
      case 'gira':
        return { ojos: ojosAbiertos(66), boca: <Ellipse cx={60} cy={79} rx={5.4} ry={4.4} fill={tinta} /> };
    }
  };
  const cara = emo ? caraEmo(emo.tipo) : rostros();

  /* ───── accesorios ───── */
  const accDetras =
    pose === 'caja' && !emo ? (
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
      accEstilo = { opacity: entradaOp, transform: [{ translateY: entradaY }, { translateY: hopY }, { rotate: giro(accesorio, 3.5) }] };
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
      accEstilo = { opacity: entradaOp, transform: [{ translateY: entradaY }, { translateY: hopY }, { rotate: giro(accesorio, 4) }] };
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
      accEstilo = { opacity: entradaOp, transform: [{ translateX: entradaX }, { rotate: giro(accesorio, 6) }, { rotate: hopRot }] };
      break;
    case 'megafono':
      accFrente = (
        <>
          <Path d="M106 58 L132 44 V84 L106 72 Z" fill={ambar} stroke={trazo} strokeWidth={4} strokeLinejoin="round" />
        </>
      );
      accOrigen = origen(106, 66);
      accEstilo = { opacity: entradaOp, transform: [{ translateX: entradaX }, { rotate: giro(accesorio, 4) }, { scale: accesorio.interpolate({ inputRange: [-1, 0, 1], outputRange: [1, 1, 1.05] }) }, { scale: hopEsc }] };
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
      accEstilo = { opacity: entradaOp, transform: [{ translateY: entradaY }, { translateY: hopY }, { rotate: giro(accesorio, 6) }] };
      break;
  }
  if (sinObjeto) accFrente = null;
  // La caja sube y baja un poquito, como si respirara con Boti, y brinca al tocarla.
  const cajaEstilo = {
    opacity: entradaOp,
    transform: [{ translateY: entradaY }, { translateY: accesorio.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.012] }) }, { translateY: hopY }],
  };

  /** Cosas que aparecen alrededor de Boti según lo que siente. */
  const extrasEmo = (tipo: EmocionBoti): React.ReactNode => {
    const baja = emoV.interpolate({ inputRange: [0, 1], outputRange: [0, size * 0.17] });
    const sube = emoV.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.14] });
    switch (tipo) {
      case 'enojado':
        return (
          <>
            {capaAnim(
              <>
                <Circle cx={12} cy={50} r={5} fill="#FFFFFF" stroke={trazo} strokeWidth={2.4} />
                <Circle cx={5} cy={42} r={3.4} fill="#FFFFFF" stroke={trazo} strokeWidth={2.4} />
                <Circle cx={108} cy={50} r={5} fill="#FFFFFF" stroke={trazo} strokeWidth={2.4} />
                <Circle cx={115} cy={42} r={3.4} fill="#FFFFFF" stroke={trazo} strokeWidth={2.4} />
              </>,
              { opacity: visible, transform: [{ translateY: sube }] },
            )}
            {capaAnim(<Path d="M84 22 Q91 22 91 29 M98 22 Q91 22 91 29 M84 36 Q91 36 91 29 M98 36 Q91 36 91 29" stroke={rojo} strokeWidth={3.4} fill="none" strokeLinecap="round" />, {
              opacity: visible,
              transformOrigin: origen(91, 29),
              transform: [{ scale: emoV.interpolate({ inputRange: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 1], outputRange: [0.5, 1.3, 0.95, 1.25, 0.95, 1.25, 0.95, 1] }) }],
            })}
          </>
        );
      case 'triste': {
        const gota = (x: number) => <Path d={`M${x} 73 Q${x - 4} 80 ${x} 83 Q${x + 4} 80 ${x} 73 Z`} fill="#7CC4F2" stroke="#4A9BD0" strokeWidth={1.4} strokeLinejoin="round" />;
        return capaAnim(
          <>
            {gota(40)}
            {gota(80)}
          </>,
          { opacity: emoV.interpolate({ inputRange: [0, 0.1, 0.75, 1], outputRange: [0, 1, 1, 0] }), transform: [{ translateY: baja }] },
        );
      }
      case 'sorpresa':
        return capaAnim(<Path d="M104 14 V36 M104 46 V48" stroke="#E8863A" strokeWidth={7} fill="none" strokeLinecap="round" />, {
          opacity: visible,
          transformOrigin: origen(104, 30),
          transform: [{ scale: emoV.interpolate({ inputRange: [0, 0.1, 0.2, 1], outputRange: [0, 1.3, 1, 1] }) }],
        });
      case 'alegre':
      case 'celebra': {
        const estrella = (x: number, y: number, k: number) => <Path d={`M${x} ${y - 9 * k} L${x + 2.6 * k} ${y - 2.6 * k} L${x + 9 * k} ${y} L${x + 2.6 * k} ${y + 2.6 * k} L${x} ${y + 9 * k} L${x - 2.6 * k} ${y + 2.6 * k} L${x - 9 * k} ${y} L${x - 2.6 * k} ${y - 2.6 * k} Z`} fill={ambar} stroke={trazo} strokeWidth={1.6} strokeLinejoin="round" />;
        return capaAnim(
          <>
            {estrella(6, 22, 1)}
            {estrella(114, 14, 1.2)}
            {estrella(120, 52, 0.8)}
          </>,
          { opacity: emoV.interpolate({ inputRange: [0, 0.1, 0.35, 0.5, 0.65, 0.9, 1], outputRange: [0, 1, 0.4, 1, 0.4, 1, 0] }), transform: [{ translateY: sube }] },
        );
      }
      case 'baila': {
        const nota = (x: number) => (
          <>
            <Path d={`M${x + 5} 40 V16 L${x + 17} 12 V34`} stroke={trazo} strokeWidth={3.4} fill="none" strokeLinecap="round" strokeLinejoin="round" />
            <Circle cx={x} cy={41} r={5.6} fill={trazo} />
            <Circle cx={x + 12} cy={35} r={5.6} fill={trazo} />
          </>
        );
        return (
          <>
            {capaAnim(nota(-14), {
              opacity: emoV.interpolate({ inputRange: [0, 0.08, 0.5, 0.6], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }),
              transform: [{ translateY: emoV.interpolate({ inputRange: [0, 0.6], outputRange: [size * 0.1, -size * 0.12], extrapolate: 'clamp' }) }, { rotate: giro(ladea, 20) }],
            })}
            {capaAnim(nota(120), {
              opacity: emoV.interpolate({ inputRange: [0.3, 0.38, 0.85, 0.95], outputRange: [0, 1, 1, 0], extrapolate: 'clamp' }),
              transform: [{ translateY: emoV.interpolate({ inputRange: [0.3, 0.95], outputRange: [size * 0.1, -size * 0.12], extrapolate: 'clamp' }) }],
            })}
          </>
        );
      }
      default:
        return null;
    }
  };

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
          transform: [
            { translateY: saltoY },
            { translateY: mueve ? respY : 0 },
            { translateX: sacudeX },
            { rotate: ladeaR },
            { scaleX: giroX },
            { scaleX: escalaX },
            { scaleY: escalaY },
            { scaleY: estiraY },
            { scale: mueve ? respEscala : 1 },
          ],
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
        {accDetras ? capaAnim(accDetras, cajaEstilo) : null}

        {/* brazos: giran desde el hombro */}
        {capaAnim(brazo(brazosEf.izq), { transform: [{ rotate: giro(brazoIzq, ampIzq) }, { rotate: giro(emoA, 16) }], transformOrigin: hombro(brazosEf.izq) })}
        {capaAnim(brazo(brazosEf.der), { transform: [{ rotate: giro(saludo, ampDer) }, { rotate: giro(emoB, 16) }], transformOrigin: hombro(brazosEf.der) })}

        {/* cara: parpadea y mira de lado */}
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            ojosEf === 'abiertos' || ojosEf === 'lupa' ? { transform: [{ translateX: miradaX }, { scaleY: parpadeo }], transformOrigin: origen(60, ojoCy) } : null,
          ]}
        >
          {capa(cara.ojos)}
        </Animated.View>
        <Animated.View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            emo?.tipo === 'bostezo' && mueve
              ? { transform: [{ scaleY: emoV.interpolate({ inputRange: [0, 0.12, 0.7, 1], outputRange: [0.25, 1, 1, 0.25] }) }], transformOrigin: origen(60, 78) }
              : null,
          ]}
        >
          {capa(cara.boca)}
        </Animated.View>

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

        {/* «?» cuando piensa y rayitas cuando aplaude */}
        {pose === 'pensando' && !emo
          ? capaAnim(
              <Path d="M102 26 Q102 12 114 12 Q126 12 126 23 Q126 30 115 34 V40 M115 49 V50" stroke={verdeAcc} strokeWidth={5} fill="none" strokeLinecap="round" />,
              { transform: [{ translateY: ondas.interpolate({ inputRange: [0, 1], outputRange: [0, -size * 0.035] }) }] },
            )
          : null}
        {pose === 'aplauso' && !emo
          ? capaAnim(<Path d="M46 80 L40 70 M60 76 V64 M74 80 L80 70" stroke={ambar} strokeWidth={5} strokeLinecap="round" />, { opacity: mueve ? ondas : 1 })
          : null}

        {/* lo que acompaña a cada emoción: vapor, lágrimas, signos, brillos y notas */}
        {emo && mueve ? extrasEmo(emo.tipo) : null}
      </Animated.View>

      {/* confeti de la fiesta */}
      {pose === 'fiesta' && mueve && !emo ? <Confeti size={size} colores={[ambar, cuerpo, '#FFFFFF', '#F9A98A']} /> : null}

      {/* ráfaga de confeti al celebrar */}
      {emo?.tipo === 'celebra' && mueve ? <ConfetiRafaga key={`c${emo.id}`} size={size} /> : null}
      {rafaga > 0 && mueve ? <ConfetiRafaga key={`r${rafaga}`} size={size} /> : null}

      {/* corazoncitos al tocarlo, y muchos más cuando se enamora */}
      {corazones > 0 ? <Corazones key={corazones} size={size} n={3} /> : null}
      {emo?.tipo === 'enamorado' && mueve ? <Corazones key={`e${emo.id}`} size={size} n={7} /> : null}
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

/** Corazoncitos que suben y se desvanecen. */
function Corazones({ size, n }: { size: number; n: number }) {
  const hs = useMemo(() => Array.from({ length: n }, () => new Animated.Value(0)), [n]);
  useEffect(() => {
    Animated.parallel(hs.map((v, i) => Animated.sequence([Animated.delay(i * 110), Animated.timing(v, { toValue: 1, duration: 900 + (i % 3) * 120, easing: Easing.out(Easing.quad), useNativeDriver: nativo })]))).start();
  }, [hs]);
  const lado = Math.max(10, size * 0.14);
  const pos = hs.map((_, i) => (n === 3 ? [0.18, 0.46, 0.7][i] : 0.05 + (i / (n - 1)) * 0.78));
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {hs.map((v, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: pos[i] * size,
            top: size * (n === 3 ? 0.12 : 0.18 - (i % 2) * 0.1),
            opacity: v.interpolate({ inputRange: [0, 0.15, 0.7, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateY: v.interpolate({ inputRange: [0, 1], outputRange: [0, -size * (0.28 + i * 0.05)] }) },
              { scale: v.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.4, 1.1, 0.9] }) },
            ],
          }}
        >
          <Svg width={lado} height={lado} viewBox="0 0 24 24">
            <Path d="M12 21 C4 14 2 10 2 7.5 C2 4.5 4.5 3 7 3 C9 3 11 4.2 12 6 C13 4.2 15 3 17 3 C19.5 3 22 4.5 22 7.5 C22 10 20 14 12 21 Z" fill={i % 3 === 1 ? '#F2B33D' : '#F47C8C'} />
          </Svg>
        </Animated.View>
      ))}
    </View>
  );
}

/** Una explosión de papelitos que sale de la cabeza de Boti, sube y cae. */
function ConfetiRafaga({ size }: { size: number }) {
  const v = useState(() => new Animated.Value(0))[0];
  const colores = ['#F2B33D', '#2E9B63', '#FFFFFF', '#F9A98A', '#F47C8C', '#7CC4F2'];
  const piezas = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => {
        const ang = ((-160 + ((i * 47) % 140)) * Math.PI) / 180;
        const fuerza = 0.45 + ((i * 29) % 10) / 12;
        return {
          dx: Math.cos(ang) * fuerza * size * 1.15,
          dy: Math.sin(ang) * fuerza * size * 1.1,
          color: colores[i % colores.length],
          redondo: i % 3 === 0,
          giros: (i % 2 ? 1 : -1) * (360 + ((i * 31) % 4) * 180),
        };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [size],
  );
  useEffect(() => {
    const a = Animated.timing(v, { toValue: 1, duration: 1900, easing: Easing.out(Easing.sin), useNativeDriver: nativo });
    a.start();
    return () => a.stop();
  }, [v]);
  const lado = Math.max(5, size * 0.055);
  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {piezas.map((p, i) => (
        <Animated.View
          key={i}
          style={{
            position: 'absolute',
            left: size * 0.5,
            top: size * 0.22,
            width: lado,
            height: p.redondo ? lado : lado * 1.6,
            borderRadius: p.redondo ? lado : 1,
            backgroundColor: p.color,
            opacity: v.interpolate({ inputRange: [0, 0.04, 0.8, 1], outputRange: [0, 1, 1, 0] }),
            transform: [
              { translateX: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, p.dx, p.dx * 1.35] }) },
              { translateY: v.interpolate({ inputRange: [0, 0.4, 1], outputRange: [0, p.dy, size * 0.8] }) },
              { rotate: v.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${p.giros}deg`] }) },
            ],
          }}
        />
      ))}
    </View>
  );
}
