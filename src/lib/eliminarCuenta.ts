import type { EstadoPedido } from '../data/tipos';

/**
 * «Eliminar mi cuenta»: las reglas y los textos de la pantalla, sin nada de pantalla ni de nube, para poder probarlos solos.
 * El borrado de verdad lo hace la función «borrar_mi_cuenta» de la base de datos (supabase/actualizacion-v2-cuenta.sql); aquí
 * solo se avisa con claridad qué va a pasar y se evita que se toque por error.
 * Autor: José David Pérez Miguel
 */

/** La palabra que hay que escribir para confirmar (la base de datos pide exactamente la misma). */
export const PALABRA_DE_CONFIRMACION = 'ELIMINAR';

/** ¿Lo escrito confirma? Igual que en la base de datos: no importan los espacios alrededor, pero sí las mayúsculas. */
export function confirmacionValida(texto: string): boolean {
  return texto.trim() === PALABRA_DE_CONFIRMACION;
}

/** Pedidos que otra persona todavía espera: la base de datos no deja borrar la cuenta mientras haya alguno. */
const EN_CURSO: ReadonlySet<EstadoPedido> = new Set<EstadoPedido>(['pendiente', 'aceptado', 'listo']);

interface PedidoMinimo {
  estado: EstadoPedido;
  clienteId: string;
  negocioId: string;
}

/**
 * Cuántos pedidos en curso tiene la persona: los que hizo como cliente y los de su negocio (si lo tiene).
 * Es un aviso para la pantalla; la base de datos es la que decide de verdad.
 */
export function pedidosEnCurso(pedidos: readonly PedidoMinimo[], cuentaId: string, negocioId?: string | null): number {
  return pedidos.filter((p) => EN_CURSO.has(p.estado) && (p.clienteId === cuentaId || (!!negocioId && p.negocioId === negocioId))).length;
}

export interface DatosDeNegocio {
  /** ¿La cuenta administra un negocio? */
  tiene: boolean;
  /** ¿Es una tienda que Mercaboot ya tenía en su lista (y la persona reclamó)? */
  delDirectorio: boolean;
}

/** Lo que se borra para siempre, según la cuenta. */
export function loQueSeBorra(n: DatosDeNegocio): string[] {
  const lista = [
    'Tu perfil: nombre, correo, teléfono y foto. Esta cuenta ya no se podrá recuperar.',
    'Tus favoritos, tus reseñas y tus pedidos.',
    'Tus chats y los mensajes que mandaste (la otra persona también deja de verlos).',
    'Las personas que bloqueaste y los avisos al teléfono.',
  ];
  if (n.tiene) {
    lista.push(
      n.delDirectorio
        ? 'Lo que pusiste en tu negocio (productos, avisos, pedidos, chats y datos de pago). La tienda vuelve a la lista de Mercaboot, sin dueño y con sus datos de antes, para que su verdadero dueño la reclame.'
        : 'Tu negocio completo: productos, avisos, pedidos, chats, clientes frecuentes y datos de pago. Tus clientes dejan de verlo.',
    );
  }
  return lista;
}

/** Lo que, por seguridad, puede quedarse (siempre sin tu nombre ni tu cuenta). */
export const LO_QUE_SE_QUEDA: readonly string[] = [
  'Un reporte que alguien hizo sobre algo que escribiste, para cuidar a la comunidad. Queda sin tu nombre.',
  'Un registro de seguridad que solo dice «qué pasó y cuándo», sin cuenta ni nombres.',
  'Los códigos de barras que ayudaste a juntar, sin tu nombre (sirven a otros comerciantes).',
];

/** Qué hacer si lo que se quiere es otra cosa. */
export function otraOpcion(tieneNegocio: boolean): string {
  return tieneNegocio
    ? 'Si solo quieres descansar, basta con «Cerrar sesión». Si solo quieres dejar de vender, usa «Dejar de ser comerciante»: tu cuenta sigue como cliente.'
    : 'Si solo quieres descansar, basta con «Cerrar sesión»: tu cuenta se queda como está.';
}

/** El texto del aviso de pedidos en curso. */
export function textoPedidosEnCurso(n: number, esDueno: boolean): string {
  const cuantos = n === 1 ? 'Tienes 1 pedido en curso' : `Tienes ${n} pedidos en curso`;
  return `${cuantos}. Termínalos o cancélalos antes de eliminar tu cuenta${esDueno ? ' (también cuentan los de tu negocio)' : ''}.`;
}

/** Cuando la base de datos todavía no tiene la función (el servidor no se ha actualizado). */
export const ELIMINAR_NO_DISPONIBLE = 'Eliminar la cuenta todavía no está disponible. Inténtalo más tarde.';
