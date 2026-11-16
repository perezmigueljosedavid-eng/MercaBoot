import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setAudioModeAsync, useAudioPlayer } from 'expo-audio';
import type { PoseBoti } from '../ui/Boti';

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

export type SonidoBoti = 'toque' | 'risa' | 'hola' | 'confeti' | 'dormir' | 'aviso';

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
};

const Contexto = createContext<CtxBoti>(sinProveedor);

/** Un id distinto para cada mensaje, para que el globo se vuelva a mostrar aunque el texto se repita. */
let ultimoId = 0;

/** Reproduce un sonido desde el principio y bajito. */
function reproducir(j: { volume: number; seekTo: (s: number) => unknown; play: () => void }) {
  j.volume = VOLUMEN;
  j.seekTo(0);
  j.play();
}

export const useBoti = () => useContext(Contexto);

export function BotiProvider({ children }: { children: React.ReactNode }) {
  const [ajustes, setAjustes] = useState<AjustesBoti>(POR_DEFECTO);
  const [listo, setListo] = useState(false);
  const [mensaje, setMensaje] = useState<MensajeBoti | null>(null);

  // Los sonidos van guardados dentro de la app (assets/sonidos). Cada uno se carga una sola vez.
  const toque = useAudioPlayer(require('../../assets/sonidos/toque.wav'));
  const risa = useAudioPlayer(require('../../assets/sonidos/risa.wav'));
  const hola = useAudioPlayer(require('../../assets/sonidos/hola.wav'));
  const confeti = useAudioPlayer(require('../../assets/sonidos/confeti.wav'));
  const dormir = useAudioPlayer(require('../../assets/sonidos/dormir.wav'));
  const aviso = useAudioPlayer(require('../../assets/sonidos/aviso.wav'));
  const jugadores = useMemo(() => ({ toque, risa, hola, confeti, dormir, aviso }), [toque, risa, hola, confeti, dormir, aviso]);

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
        reproducir(jugadores[s]);
      } catch {
        // En la web el navegador no deja sonar antes del primer toque; no pasa nada.
      }
    },
    [ajustes.activo, ajustes.sonidos, jugadores],
  );

  const callar = useCallback(() => setMensaje(null), []);

  const decir = useCallback(
    (texto: string, op?: OpcionesDecir) => {
      if (!ajustes.activo || !ajustes.compania) return;
      ultimoId += 1;
      setMensaje({ id: ultimoId, texto, pose: op?.pose ?? 'saludo', ms: op?.ms ?? 6000 });
      if (op?.sonido) sonar(op.sonido);
    },
    [ajustes.activo, ajustes.compania, sonar],
  );

  // El globo se quita solo después de un rato.
  useEffect(() => {
    if (!mensaje) return;
    const reloj = setTimeout(() => setMensaje(null), mensaje.ms);
    return () => clearTimeout(reloj);
  }, [mensaje]);

  // Si se apaga a Boti, el globo no se muestra.
  const visible = ajustes.activo && ajustes.compania ? mensaje : null;

  const valor = useMemo<CtxBoti>(() => ({ ajustes, listo, cambiar, sonar, mensaje: visible, decir, callar }), [ajustes, listo, cambiar, sonar, visible, decir, callar]);
  return <Contexto.Provider value={valor}>{children}</Contexto.Provider>;
}
