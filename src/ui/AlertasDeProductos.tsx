import { useEffect, useMemo, useRef, useState } from 'react';
import { alertasCumplidas } from '../ia/alertas';
import { alertasEnMemoria, cargarAlertas, quitarAlerta, suscribirAlertas } from '../lib/alertas';
import { useBoti } from '../lib/boti';
import { useStore } from '../store';

/**
 * «Avísame cuando haya aguacate», con la app abierta: cuando una tienda ya tiene lo que la persona estaba esperando,
 * Boti se lo dice (con un botón para ir a la tienda) y deja de esperarlo. Con la app cerrada lo hace el aviso al teléfono.
 * No dibuja nada. Solo revisa cuando hay algo que esperar, así no gasta nada en quien no usa los avisos de productos.
 * Autor: José David Pérez Miguel
 */
export function AlertasDeProductos() {
  const { s, cuenta, avisar } = useStore();
  const { ajustes, decir, emocionar } = useBoti();
  const uid = cuenta?.id ?? null;
  const esCliente = cuenta?.rol === 'cliente';
  const [esperadas, setEsperadas] = useState<string[]>(alertasEnMemoria);
  const yaDichas = useRef(new Set<string>());

  // Se lee lo que la persona espera y se queda escuchando cuando cambia (Boti lo agrega o lo quita).
  useEffect(() => {
    if (!uid || !esCliente) return;
    const dejar = suscribirAlertas(() => setEsperadas(alertasEnMemoria()));
    void cargarAlertas();
    return dejar;
  }, [uid, esCliente]);

  const cumplidas = useMemo(
    () => (esCliente && esperadas.length ? alertasCumplidas(s.productos, esperadas) : []),
    [esCliente, esperadas, s.productos],
  );

  useEffect(() => {
    if (!cumplidas.length) return;
    const nombreDe = (negocioId: string) => s.negocios.find((n) => n.id === negocioId)?.nombre;
    for (const c of cumplidas) {
      if (yaDichas.current.has(c.termino)) continue;
      yaDichas.current.add(c.termino);
      const tiendas = [...new Set(c.productos.map((p) => p.negocioId))];
      const primera = tiendas[0];
      const dondeEsta = tiendas.length === 1 ? (nombreDe(primera) ?? 'una tienda') : `${tiendas.length} tiendas`;
      const texto = `¡Ya hay ${c.termino}! Lo tiene${tiendas.length === 1 ? '' : 'n'} ${dondeEsta}.`;
      if (ajustes.activo && ajustes.compania) {
        decir(texto, { pose: 'aplauso', emocion: 'celebra', ms: 9000, accion: { texto: tiendas.length === 1 ? 'Ver tienda' : 'Ver dónde hay', ruta: tiendas.length === 1 ? `/negocio/${primera}` : `/cliente/buscar?q=${encodeURIComponent(c.termino)}` } });
      } else {
        avisar(texto);
        emocionar('celebra');
      }
      void quitarAlerta(c.termino);
    }
  }, [cumplidas, s.negocios, ajustes.activo, ajustes.compania, decir, avisar, emocionar]);

  // Al cerrar sesión se olvida lo dicho: la persona siguiente empieza de cero.
  useEffect(() => {
    if (!uid) yaDichas.current = new Set();
  }, [uid]);

  return null;
}
