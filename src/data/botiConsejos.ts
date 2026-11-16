import type { PoseBoti } from '../ui/Boti';

/**
 * Lo que Boti dice y cómo se ve en cada pantalla. La clave es la dirección sin «index» ni números
 * (por ejemplo «cliente/buscar»). Si una pantalla no está aquí, usa los consejos de «general».
 */
interface Pantalla {
  pose: PoseBoti;
  consejos: string[];
}

export const CONSEJOS: Record<string, Pantalla> = {
  general: {
    pose: 'saludo',
    consejos: ['¡Hola! Soy Boti. Tócame cuando quieras una pista.', 'Puedes arrastrarme para que no estorbe. Si prefieres, me quitas desde Perfil.', '¿Me haces cosquillas? Tócame otra vez.'],
  },
  cliente: {
    pose: 'cocina',
    consejos: ['¿Qué se te antoja hoy? Pídeme ideas y te digo dónde conseguir lo que necesitas.', 'Las tiendas con el punto verde están abiertas ahora.', 'Toca el corazón de una tienda para guardarla en tus favoritos.'],
  },
  'cliente/buscar': {
    pose: 'lupa',
    consejos: ['Escribe lo que buscas: no importan las mayúsculas ni los acentos.', 'Puedes ordenar por más cerca, más barato o mejor calificadas.', 'Si no encuentro algo, prueba con otra palabra: «pollo», «tortillas», «quesillo»…'],
  },
  'cliente/pedidos': {
    pose: 'caja',
    consejos: ['Aquí ves en qué va cada pedido. Cuando esté listo, pasa por él.', 'Si pagas por transferencia, avísale al negocio con «Ya pagué».'],
  },
  'cliente/chats': {
    pose: 'saludo',
    consejos: ['Pregúntale al negocio lo que necesites: si tiene algo, a qué hora cierra…', 'Un número rojo quiere decir que tienes mensajes sin leer.'],
  },
  'cliente/favoritos': {
    pose: 'saludo',
    consejos: ['Aquí están las tiendas que guardaste, con su último aviso.', 'Los negocios donde eres cliente frecuente te dan un trato especial.'],
  },
  'cliente/perfil': {
    pose: 'saludo',
    consejos: ['Aquí cambias tus datos y tu ubicación.', 'Más abajo puedes decidir si me quedo contigo, si hago sonidos o si me voy a dormir.'],
  },
  negocio: {
    pose: 'lupa',
    consejos: ['Toca un producto para ver su foto, su descripción y sus características.', 'Agrega al carrito lo que necesites: los productos se te apartan un rato.', 'Con «Cómo llegar» te llevo hasta la tienda.'],
  },
  carrito: {
    pose: 'caja',
    consejos: ['Revisa tu pedido y elige si pasas por él o te lo llevan.', 'Un pedido es de un solo negocio.'],
  },
  'ideas-ia': {
    pose: 'cocina',
    consejos: ['Dime qué se te antoja, como «algo con pollo» o «algo dulce».', 'Te digo qué tiendas tienen hoy los ingredientes.'],
  },
  novedades: {
    pose: 'megafono',
    consejos: ['Aquí están los avisos de hoy: promociones, regalos y lo que ya no hay.'],
  },
  comerciante: {
    pose: 'palma',
    consejos: ['Mantén tu negocio en «Abierto» mientras atiendes: tus vecinos lo ven al instante.', 'Con 3 productos publicados, tus vecinos ya te encuentran al buscar.', '¿Se acabó algo? Publica «Ya no hay…» desde aquí.'],
  },
  'comerciante/productos': {
    pose: 'palma',
    consejos: ['Toca el estado de un producto para marcar si hay o ya se acabó.', 'Una foto y una descripción ayudan a que más clientes lo pidan.', 'Si llevas la cuenta de existencias, yo marco «agotado» cuando llegan a 0.'],
  },
  'comerciante/avisos': {
    pose: 'megafono',
    consejos: ['Publica una promoción o un regalo y tus clientes lo ven al momento.', 'Los avisos de «Ya no hay…» cambian solitos el producto a agotado.'],
  },
  'comerciante/pedidos': {
    pose: 'caja',
    consejos: ['Acepta o rechaza los pedidos nuevos. Si no respondes a tiempo, se liberan solos.', 'Cuando lo tengas listo, márcalo para avisar al cliente.'],
  },
  'comerciante/chats': {
    pose: 'saludo',
    consejos: ['Contesta rápido: las respuestas rápidas te ahorran escribir.'],
  },
  'comerciante/perfil': {
    pose: 'saludo',
    consejos: ['Aquí editas tu negocio: logo, horario, ubicación y datos de transferencia.', 'Más abajo decides si me quedo contigo, si hago sonidos o si me voy a dormir.'],
  },
  clientes: {
    pose: 'fiesta',
    consejos: ['Un cliente frecuente vuelve más. Dale un descuento, un regalo o un cupón.'],
  },
  'mis-resenas': {
    pose: 'saludo',
    consejos: ['Tu opinión ayuda a los vecinos a elegir. Puedes editarla cuando quieras.'],
  },
};

/** Clave de una pantalla a partir de sus segmentos de dirección. */
export function claveDePantalla(segmentos: string[]): string {
  const limpios = segmentos.filter((s) => s && s !== 'index' && !s.startsWith('(') && !s.startsWith('['));
  const completa = limpios.join('/');
  if (CONSEJOS[completa]) return completa;
  if (limpios[0] && CONSEJOS[limpios[0]]) return limpios[0];
  return 'general';
}

/** Pantallas donde Boti no se pone encima: formularios, chats y la entrada (ahí ya sale grande). */
export const SIN_COMPANIA = new Set(['', 'tipo-cuenta', 'registro', 'iniciar-sesion', 'recuperar', 'restablecer', 'chat-cliente', 'chat-negocio', 'producto-form', 'editar-negocio', 'editar-perfil', 'abrir-negocio', '+not-found']);
