import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import * as Location from 'expo-location';
import type { Coord } from '../data/tipos';

/**
 * Ubicación del usuario para mostrar lo más cercano primero.
 * Nunca se guarda ni se envía a ningún lado: solo se usa para calcular distancias en el teléfono.
 */

export type EstadoUbicacion = 'inicio' | 'buscando' | 'lista' | 'denegada' | 'error';

interface Ctx {
  estado: EstadoUbicacion;
  coords: Coord | null;
  /** Pide permiso (si hace falta) y obtiene la posición. Devuelve true si la consiguió. */
  pedir: () => Promise<boolean>;
}

const UbicCtx = createContext<Ctx>({ estado: 'inicio', coords: null, pedir: async () => false });

export const useUbicacion = () => useContext(UbicCtx);

const conTiempo = <A,>(p: Promise<A>, ms: number) =>
  Promise.race<A>([p, new Promise<A>((_, rej) => setTimeout(() => rej(new Error('tiempo')), ms))]);

export type ResultadoPosicion = { coords: Coord } | { error: 'denegada' | 'error' };

/** Obtiene la posición actual del teléfono (pide permiso si falta). */
export async function posicionActual(): Promise<ResultadoPosicion> {
  try {
    let perm = await Location.getForegroundPermissionsAsync();
    if (perm.status !== 'granted') perm = await Location.requestForegroundPermissionsAsync();
    if (perm.status !== 'granted') return { error: 'denegada' };
    const p = await conTiempo(Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced }), 20000);
    return { coords: { lat: p.coords.latitude, lng: p.coords.longitude } };
  } catch {
    return { error: 'error' };
  }
}

export function UbicacionProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoUbicacion>('inicio');
  const [coords, setCoords] = useState<Coord | null>(null);

  const pedir = useCallback(async () => {
    setEstado('buscando');
    const r = await posicionActual();
    if ('coords' in r) {
      setCoords(r.coords);
      setEstado('lista');
      return true;
    }
    setEstado(r.error);
    return false;
  }, []);

  // Si el permiso ya estaba concedido, la ubicación se toma sin preguntar nada.
  useEffect(() => {
    let vivo = true;
    (async () => {
      try {
        const perm = await Location.getForegroundPermissionsAsync();
        if (vivo && perm.status === 'granted') await pedir();
        else if (vivo && perm.status === 'denied' && !perm.canAskAgain) setEstado('denegada');
      } catch {
        /* sin permisos disponibles: se queda en "inicio" */
      }
    })();
    return () => {
      vivo = false;
    };
  }, [pedir]);

  const value = useMemo(() => ({ estado, coords, pedir }), [estado, coords, pedir]);
  return <UbicCtx.Provider value={value}>{children}</UbicCtx.Provider>;
}
