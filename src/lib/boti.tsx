import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import type { DisparoEmocion, EmocionBoti, PoseBoti } from '../ui/Boti';

/**
 * Boti, la mascota de Mercaboot: sus ajustes (se guardan en el teléfono), sus sonidos suaves y los mensajes
 * que dice. Cada persona decide si Boti está activo, si la acompaña en pantalla y si hace sonidos.
 */

export interface AjustesBoti {
  /** Interruptor general: apagado, Boti no se mueve, no suena, no habla ni acompaña (los dibujos quedan quietos). */
  activo: boolean;
  /** Boti flotando en la pantalla como compañero. */
  compania: boolean;
  /** Sonidos muy suaves al tocarlo y al avisar algo. */
  sonidos: boolean;
}

export type SonidoBoti =
  | 'toque'
  | 'risa'
  | 'hola'
  | 'confeti'
  | 'dormir'
  | 'aviso'
  // uno por cada objeto que Boti trae puesto
  | 'lupa'
  | 'gorro'
  | 'sombrero'
  | 'caja'
  | 'megafono'
  | 'cornetita'
  | 'pensando'
  | 'aplauso'
  // uno por cada emoción
  | 'brinco'
  | 'alegre'
  | 'enojo'
  | 'triste'
  | 'bostezo'
  | 'sorpresa'
  | 'enamorado'
  | 'baila'
  | 'giro';

/** Los sonidos van guardados dentro de la app (assets/sonidos); cada uno se carga la primera vez que suena. */
const ARCHIVOS: Record<SonidoBoti, number> = {
  toque: require('../../assets/sonidos/toque.wav'),
  risa: require('../../assets/sonidos/risa.wav'),
  hola: require('../../assets/sonidos/hola.wav'),
  confeti: require('../../assets/sonidos/confeti.wav'),
  dormir: require('../../assets/sonidos/dormir.wav'),
  aviso: require('../../assets/sonidos/aviso.wav'),
  lupa: require('../../assets/sonidos/lupa.wav'),
  gorro: require('../../assets/sonidos/gorro.wav'),
  sombrero: require('../../assets/sonidos/sombrero.wav'),
  caja: require('../../assets/sonidos/caja.wav'),
  megafono: require('../../assets/sonidos/megafono.wav'),
  cornetita: require('../../assets/sonidos/cornetita.wav'),
  pensando: require('../../assets/sonidos/pensando.wav'),
  aplauso: require('../../assets/sonidos/aplauso.wav'),
  brinco: require('../../assets/sonidos/brinco.wav'),
  alegre: require('../../assets/sonidos/alegre.wav'),
  enojo: require('../../assets/sonidos/enojo.wav'),
  triste: require('../../assets/sonidos/triste.wav'),
  bostezo: require('../../assets/sonidos/bostezo.wav'),
  sorpresa: require('../../assets/sonidos/sorpresa.wav'),
  enamorado: require('../../assets/sonidos/enamorado.wav'),
  baila: require('../../assets/sonidos/baila.wav'),
  giro: require('../../assets/sonidos/giro.wav'),
};

export interface MensajeBoti {
  id: number;
  texto: string;
  pose: PoseBoti;
  /** Cuánto se queda el globo en pantalla, en milisegundos. */
  ms: number;
}

interface OpcionesDecir {
  pose?: PoseBoti;
  sonido?: SonidoBoti;
  /** Una emoción que Boti hace mientras lo dice (trae su propio sonido). */
  emocion?: EmocionBoti;
  /** Cuánto se queda el globo en pantalla, en milisegundos. */
  ms?: number;
}

interface CtxBoti {
  ajustes: AjustesBoti;
  listo: boolean;
  cambiar: (parcial: Partial<AjustesBoti>) => void;
  sonar: (s: SonidoBoti) => void;
  mensaje: MensajeBoti | null;
  decir: (texto: string, op?: OpcionesDecir) => void;
  callar: () => void;
  /** La última emoción que se le pidió a Boti (el compañero flotante la actúa una vez). */
  emocion: DisparoEmocion | null;
  emocionar: (tipo: EmocionBoti) => void;
}

const POR_DEFECTO: AjustesBoti = { activo: true, compania: true, sonidos: true };
const CLAVE = 'mercaboot:boti:v1';
/** Muy bajito a propósito: Boti es un compañero, no una alarma. */
const VOLUMEN = 0.3;

const sinProveedor: CtxBoti = {
  ajustes: POR_DEFECTO,
  listo: true,
  cambiar: () => {},
  sonar: () => {},
  mensaje: null,
  decir: () => {},
  callar: () => {},
  emocion: null,
  emocionar: () => {},
};

const Contexto = createContext<CtxBoti>(sinProveedor);

/** Un id distinto para cada mensaje, para que el globo se vuelva a mostrar aunque el texto se repita. */
let ultimoId = 0;

/** Los reproductores ya creados, por nombre. Se crean al primer uso para no gastar memoria de más. */
const jugadores = new Map<SonidoBoti, AudioPlayer>();
/** Cuándo sonó cada uno por última vez, para que no se encimen si lo tocan muy rápido. */
const ultimaVez = new Map<SonidoBoti, number>();

/** Reproduce un sonido desde el principio y bajito. */
function reproducir(nombre: SonidoBoti) {
  const ahora = Date.now();
  if (ahora - (ultimaVez.get(nombre) ?? 0) < 90) return;
  ultimaVez.set(nombre, ahora);
  let j = jugadores.get(nombre);
  if (!j) {
    j = createAudioPlayer(ARCHIVOS[nombre]);
    jugadores.set(nombre, j);
  }
  j.volume = VOLUMEN;
  void j.seekTo(0);
  j.play();
}

function soltarSonidos() {
  jugadores.forEach((j) => {
    try {
      j.remove();
    } catch {
      // ya estaba liberado
    }
  });
  jugadores.clear();
}

export const useBoti = () => useContext(Contexto);

export function BotiProvider({ children }: { children: React.ReactNode }) {
  const [ajustes, setAjustes] = useState<AjustesBoti>(POR_DEFECTO);
  const [listo, setListo] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeBoti | null>(null);

  const [emocion, setEmocion] = useState<DisparoEmocion | null>(null);

  // Cargar lo que la persona eligió la última vez.
  useEffect(() => {
    let vivo = true;
    AsyncStorage.getItem(CLAVE)
      .then((t) => {
        if (!vivo || !t) return;
        const v = JSON.parse(t) as Partial<AjustesBoti>;
        setAjustes({
          activo: typeof v.activo === 'boolean' ? v.activo : POR_DEFECTO.activo,
          compania: typeof v.compania === 'boolean' ? v.compania : POR_DEFECTO.compania,
          sonidos: typeof v.sonidos === 'boolean' ? v.sonidos : POR_DEFECTO.sonidos,
        });
      })
      .catch(() => {})
      .finally(() => {
        if (vivo) setListo(true);
      });
    // Si el teléfono está en silencio, Boti también; y no interrumpe la música de nadie.
    setAudioModeAsync({ playsInSilentMode: false, interruptionMode: 'mixWithOthers' }).catch(() => {});
    return () => {
      vivo = false;
      soltarSonidos();
    };
  }, []);

  const cambiar = useCallback((parcial: Partial<AjustesBoti>) => {
    setAjustes((previos) => {
      const nuevos = { ...previos, ...parcial };
      AsyncStorage.setItem(CLAVE, JSON.stringify(nuevos)).catch(() => {});
      return nuevos;
    });
  }, []);

  const sonar = useCallback(
    (s: SonidoBoti) => {
      if (!ajustes.activo || !ajustes.sonidos) return;
      try {
        reproducir(s);
      } catch {
        // En la web el navegador no deja sonar antes del primer toque; no pasa nada.
      }
    },
    [ajustes.activo, ajustes.sonidos],
  );

  const callar = useCallback(() => setMensaje(null), []);

  const decir = useCallback(
    (texto: string, op?: OpcionesDecir) => {
      if (!ajustes.activo || !ajustes.compania) return;
      ultimoId += 1;
      setMensaje({ id: ultimoId, texto, pose: op?.pose ?? 'saludo', ms: op?.ms ?? 6000 });
      if (op?.emocion) setEmocion({ tipo: op.emocion, id: ultimoId });
      else if (op?.sonido) sonar(op.sonido);
    },
    [ajustes.activo, ajustes.compania, sonar],
  );

  const emocionar = useCallback(
    (tipo: EmocionBoti) => {
      if (!ajustes.activo || !ajustes.compania) return;
      ultimoId += 1;
      setEmocion({ tipo, id: ultimoId });
    },
    [ajustes.activo, ajustes.compania],
  );

  // El globo se quita solo después de un rato.
  useEffect(() => {
    if (!mensaje) return;
    const reloj = setTimeout(() => setMensaje(null), mensaje.ms);
    return () => clearTimeout(reloj);
  }, [mensaje]);

  // Una emoción pedida solo vale un momento: así no se repite si la pantalla de Boti se vuelve a armar.
  useEffect(() => {
    if (!emocion) return;
    const reloj = setTimeout(() => setEmocion(null), 2500);
    return () => clearTimeout(reloj);
  }, [emocion]);

  // Si se apaga a Boti, el globo no se muestra.
  const visible = ajustes.activo && ajustes.compania ? mensaje : null;

  const valor = useMemo<CtxBoti>(
    () => ({ ajustes, listo, cambiar, sonar, mensaje: visible, decir, callar, emocion, emocionar }),
    [ajustes, listo, cambiar, sonar, visible, decir, callar, emocion, emocionar],
  );
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
