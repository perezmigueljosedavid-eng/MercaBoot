import { useEffect, useState } from 'react';

/**
 * La hora del teléfono, actualizada cada tanto, para que las cuentas regresivas («quedan 12 min») se muevan solas.
 * (`cadaSeg`: cada cuántos segundos se actualiza; con `activo` en false se detiene.)
 */
export function useAhora(cadaSeg = 20, activo = true): number {
  const [ahora, setAhora] = useState(() => Date.now());
  useEffect(() => {
    if (!activo) return;
    // Al activarse se pone al día enseguida (en un temporizador, no dentro del efecto) y luego cada `cadaSeg`.
    const t0 = setTimeout(() => setAhora(Date.now()), 0);
    const t = setInterval(() => setAhora(Date.now()), Math.max(1, cadaSeg) * 1000);
    return () => {
      clearTimeout(t0);
      clearInterval(t);
    };
  }, [cadaSeg, activo]);
  return ahora;
}
