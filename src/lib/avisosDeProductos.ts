import { alertaCoincide } from '../ia/alertas';
import { avisarAlOtro, avisosDisponibles } from './avisosTelefono';
import { busquedasDeLaSemana } from './busquedas';

/**
 * «Ya hay aguacate»: cuando una tienda marca un producto como disponible (o agrega uno nuevo), la base de datos busca a quienes
 * pidieron «avísame cuando haya…» y les manda el aviso al teléfono. Aquí se decide de qué productos se le avisa a la base de datos.
 *
 * Si son pocos (hasta 6), de todos. Si son muchos (una lista de precios o un catálogo que se acaba de cargar), solo de los que la gente
 * ya buscó y nadie tenía esta semana: así una tienda con 500 productos no dispara 500 revisiones.
 * Nunca falla ni se espera.
 * Autor: José David Pérez Miguel
 */

const MAXIMO = 6;

export function avisarDeProductos(productos: { id: string; nombre: string }[]): void {
  if (!productos.length || !avisosDisponibles()) return;
  if (productos.length <= MAXIMO) {
    for (const p of productos) avisarAlOtro('producto', p.id);
    return;
  }
  void (async () => {
    try {
      const pedidos = (await busquedasDeLaSemana()).map((b) => b.termino);
      if (!pedidos.length) return;
      const elegidos = productos.filter((p) => pedidos.some((t) => alertaCoincide(p.nombre, t))).slice(0, MAXIMO);
      for (const p of elegidos) avisarAlOtro('producto', p.id);
    } catch {
      // sin avisos esta vez
    }
  })();
}
