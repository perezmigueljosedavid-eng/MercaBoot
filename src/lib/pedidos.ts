import type { EstadoPedido, Pedido, Producto } from '../data/tipos';
import type { Tono } from '../ui/theme';

/**
 * Reglas y textos de los pedidos (carrito y apartado). Es código puro: no usa pantallas ni la nube.
 * Las reglas de verdad las revisa la base de datos; aquí solo se calcula lo que se muestra.
 */

/** Pedidos que todavía se están atendiendo. */
export const ESTADOS_ACTIVOS: EstadoPedido[] = ['pendiente', 'aceptado', 'listo'];
export const esActivo = (p: Pick<Pedido, 'estado'>) => ESTADOS_ACTIVOS.includes(p.estado);

/** Lo máximo que se puede pedir de un solo producto (igual que en la base de datos). */
export const MAX_POR_LINEA = 100;

/** Redondea a 2 decimales (así guarda el dinero y las cantidades la base de datos). */
export const redondear = (n: number) => Math.round((n + Number.EPSILON) * 100) / 100;

/** 1250 → «$1,250» · 1250.5 → «$1,250.50» */
export function dinero(n: number): string {
  const r = redondear(n);
  const [entero, decimales] = Math.abs(r).toFixed(2).split('.');
  const miles = entero.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return `${r < 0 ? '-' : ''}$${miles}${decimales === '00' ? '' : `.${decimales}`}`;
}

/** 2 → «2» · 1.5 → «1.5» */
export const cantidadTexto = (n: number) => String(redondear(n));

/** «2 kg», «1.5 litro», «3 pieza» */
export const cantidadConUnidad = (n: number, unidad: string) => `${cantidadTexto(n)} ${unidad}`;

/** De cuánto en cuánto sube o baja la cantidad en el carrito: kilos y litros de medio en medio; lo demás, de uno en uno. */
export function pasoCantidad(unidad: string): number {
  return /^(kg|kilo|kilos|litro|litros|l|lt)$/i.test(unidad.trim()) ? 0.5 : 1;
}

/** Cuánto se puede pedir ahora de un producto: sus existencias menos lo que otros ya apartaron. */
export function disponibleParaPedir(p: Producto): number {
  if (!p.disponible) return 0;
  if (p.cantidad == null) return MAX_POR_LINEA;
  return Math.max(0, Math.min(MAX_POR_LINEA, redondear(p.cantidad - p.apartado)));
}

/** ¿Se puede poner en el carrito? (hay, tiene precio y queda algo sin apartar) */
export const sePuedePedir = (p: Producto) => p.precio != null && disponibleParaPedir(p) > 0;

/** Importe de una línea (igual que lo calcula la base de datos). */
export const importeLinea = (precio: number, cantidad: number) => redondear(precio * cantidad);

export interface Totales {
  subtotal: number;
  descuento: number;
  total: number;
}

/** Subtotal, descuento de cliente frecuente y total. */
export function totales(lineas: { precio: number; cantidad: number }[], descuentoPct: number): Totales {
  const subtotal = redondear(lineas.reduce((s, l) => s + importeLinea(l.precio, l.cantidad), 0));
  const descuento = redondear((subtotal * descuentoPct) / 100);
  return { subtotal, descuento, total: redondear(subtotal - descuento) };
}

/** Cómo se llama el estado de un pedido, según si se recoge o va a domicilio. */
export function etiquetaEstado(p: Pick<Pedido, 'estado' | 'entrega'>): { label: string; tono: Tono } {
  const domicilio = p.entrega === 'domicilio';
  switch (p.estado) {
    case 'pendiente':
      return { label: 'Esperando respuesta', tono: 'ambar' };
    case 'aceptado':
      return { label: domicilio ? 'Aceptado' : 'Apartado', tono: 'verde' };
    case 'listo':
      return { label: domicilio ? 'En camino' : 'Listo para recoger', tono: 'verde' };
    case 'completado':
      return { label: domicilio ? 'Entregado' : 'Recogido', tono: 'gris' };
    case 'cancelado':
      return { label: 'Cancelado', tono: 'gris' };
    case 'vencido':
      return { label: 'Venció', tono: 'gris' };
    default:
      return { label: 'No se presentó', tono: 'gris' };
  }
}

/** Cómo se paga, dicho para quien lo lee (el cliente paga; el comerciante cobra). */
export function textoPago(p: Pick<Pedido, 'pago' | 'pagoEstado' | 'entrega'>, quien: 'cliente' | 'comerciante'): string {
  if (p.pago === 'en_persona') {
    const donde = p.entrega === 'domicilio' ? 'al recibir' : 'al recoger';
    return quien === 'cliente' ? `Pagas en persona, ${donde}` : `Cobras en persona, ${donde}`;
  }
  if (p.pagoEstado === 'confirmado') return 'Transferencia · pago confirmado';
  if (p.pagoEstado === 'reportado') return quien === 'cliente' ? 'Transferencia · avisaste tu pago' : 'Transferencia · el cliente avisó su pago';
  return 'Transferencia · falta pagar';
}

/** «25 min», «1 h 05 min», «2 d 3 h» */
export function tiempoRestante(venceEn: number, ahora: number): string {
  const seg = Math.ceil((venceEn - ahora) / 1000);
  if (seg <= 0) return 'venciendo…';
  const min = Math.ceil(seg / 60);
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h < 24) return m ? `${h} h ${String(m).padStart(2, '0')} min` : `${h} h`;
  const d = Math.floor(h / 24);
  return h % 24 ? `${d} d ${h % 24} h` : `${d} d`;
}

/** El tiempo que el negocio guarda un pedido, dicho en palabras: 30 → «30 minutos», 90 → «1 hora y media». */
export function minutosEnPalabras(min: number): string {
  if (min < 60) return `${min} minutos`;
  if (min === 60) return '1 hora';
  if (min % 60 === 30) return `${Math.floor(min / 60)} h 30 min`;
  if (min % 60 === 0) return `${min / 60} horas`;
  return `${Math.floor(min / 60)} h ${min % 60} min`;
}

/** Tiempos de apartado que puede elegir un negocio (minutos). */
export const OPCIONES_APARTADO = [15, 30, 60, 120, 240, 480, 1440];

const primerNombre = (n: string) => n.trim().split(/\s+/)[0] || 'Un cliente';

/**
 * Aviso corto dentro de la app cuando algo cambia en un pedido de otra persona (o `null` si no hay nada que avisar).
 * `antes` es el pedido como se tenía; `ahora`, como llegó. Sin `antes` el pedido es nuevo.
 */
export function avisoDeCambio(antes: Pedido | undefined, ahora: Pedido, quien: 'cliente' | 'comerciante'): string | null {
  if (quien === 'comerciante') {
    if (!antes) return ahora.estado === 'pendiente' ? `🛒 Pedido nuevo ${ahora.codigo} de ${primerNombre(ahora.clienteNombre)}` : null;
    if (antes.pagoEstado !== 'reportado' && ahora.pagoEstado === 'reportado') return `💸 ${primerNombre(ahora.clienteNombre)} avisó su pago (${ahora.codigo})`;
    if (antes.estado !== ahora.estado && ahora.estado === 'cancelado') return `${ahora.codigo}: ${primerNombre(ahora.clienteNombre)} canceló su pedido`;
    return null;
  }
  if (!antes) return null;
  if (antes.estado !== ahora.estado) {
    switch (ahora.estado) {
      case 'aceptado':
        return `✅ ${ahora.codigo}: el negocio aceptó tu pedido`;
      case 'listo':
        return ahora.entrega === 'domicilio' ? `🛵 ${ahora.codigo}: tu pedido va en camino` : `🛍️ ${ahora.codigo}: tu pedido ya está listo para recoger`;
      case 'cancelado':
        return `${ahora.codigo}: el negocio canceló tu pedido`;
      case 'vencido':
        return `⏰ ${ahora.codigo}: se acabó el tiempo y se liberó tu pedido`;
      default:
        return null;
    }
  }
  if (antes.pagoEstado !== 'confirmado' && ahora.pagoEstado === 'confirmado') return `✅ ${ahora.codigo}: el negocio confirmó tu pago`;
  if (antes.pagoEstado === 'reportado' && ahora.pagoEstado === 'por_pagar') return `${ahora.codigo}: el negocio no encontró tu pago, revisa el chat`;
  return null;
}
