import type { EmocionBoti, PoseBoti } from '../ui/Boti';

/**
 * Lo que Boti dice y cómo se ve en cada pantalla. La clave es la dirección sin «index» ni números
 * (por ejemplo «cliente/buscar»). Si una pantalla no está aquí, usa los consejos de «general».
 */
interface Pantalla {
  pose: PoseBoti;
  consejos: string[];
  /** Otras poses que Boti toma un rato cuando lleva tiempo en esta pantalla (cambia de objeto, de sombrero…). */
  alternas?: PoseBoti[];
}

export const CONSEJOS: Record<string, Pantalla> = {
  general: {
    pose: 'saludo',
    alternas: ['palma', 'pensando', 'aplauso', 'lupa'],
    consejos: ['¡Hola! Soy Boti. Tócame cuando quieras una pista.', 'Puedes arrastrarme para que no estorbe. Si prefieres, me quitas desde Perfil.', '¿Me haces cosquillas? Tócame otra vez.'],
  },
  cliente: {
    pose: 'cocina',
    alternas: ['lupa', 'pensando', 'saludo', 'aplauso'],
    consejos: ['¿Qué se te antoja hoy? Pídeme ideas y te digo dónde conseguir lo que necesitas.', 'Las tiendas con el punto verde están abiertas ahora.', 'Toca el corazón de una tienda para guardarla en tus favoritos.'],
  },
  'cliente/buscar': {
    pose: 'lupa',
    alternas: ['pensando', 'cocina', 'saludo'],
    consejos: ['Escribe lo que buscas: no importan las mayúsculas ni los acentos.', 'Puedes ordenar por más cerca, más barato o mejor calificadas.', 'Si no encuentro algo, prueba con otra palabra: «pollo», «tortillas», «quesillo»…'],
  },
  'cliente/pedidos': {
    pose: 'caja',
    alternas: ['aplauso', 'saludo', 'pensando'],
    consejos: ['Aquí ves en qué va cada pedido. Cuando esté listo, pasa por él.', 'Si pagas por transferencia, avísale al negocio con «Ya pagué».'],
  },
  'cliente/chats': {
    pose: 'saludo',
    alternas: ['pensando', 'aplauso'],
    consejos: ['Pregúntale al negocio lo que necesites: si tiene algo, a qué hora cierra…', 'Un número rojo quiere decir que tienes mensajes sin leer.'],
  },
  'cliente/favoritos': {
    pose: 'saludo',
    alternas: ['aplauso', 'cocina'],
    consejos: ['Aquí están las tiendas que guardaste, con su último aviso.', 'Los negocios donde eres cliente frecuente te dan un trato especial.'],
  },
  'cliente/perfil': {
    pose: 'saludo',
    alternas: ['palma', 'pensando'],
    consejos: ['Aquí cambias tus datos y tu ubicación.', 'Más abajo puedes decidir si me quedo contigo, si hago sonidos o si me voy a dormir.'],
  },
  negocio: {
    pose: 'lupa',
    alternas: ['cocina', 'pensando', 'aplauso'],
    consejos: ['Toca un producto para ver su foto, su descripción y sus características.', 'Agrega al carrito lo que necesites: los productos se te apartan un rato.', 'Con «Cómo llegar» te llevo hasta la tienda.'],
  },
  carrito: {
    pose: 'caja',
    alternas: ['aplauso', 'pensando'],
    consejos: ['Revisa tu pedido y elige si pasas por él o te lo llevan.', 'Un pedido es de un solo negocio.'],
  },
  'ideas-ia': {
    pose: 'cocina',
    alternas: ['pensando', 'lupa', 'aplauso'],
    consejos: ['Dime qué se te antoja, como «algo con pollo» o «algo dulce».', 'Te digo qué tiendas tienen hoy los ingredientes.'],
  },
  novedades: {
    pose: 'megafono',
    alternas: ['aplauso', 'saludo'],
    consejos: ['Aquí están los avisos de hoy: promociones, regalos y lo que ya no hay.'],
  },
  comerciante: {
    pose: 'palma',
    alternas: ['megafono', 'aplauso', 'cocina'],
    consejos: ['Mantén tu negocio en «Abierto» mientras atiendes: tus vecinos lo ven al instante.', 'Con 3 productos publicados, tus vecinos ya te encuentran al buscar.', '¿Se acabó algo? Publica «Ya no hay…» desde aquí.'],
  },
  'comerciante/productos': {
    pose: 'palma',
    alternas: ['cocina', 'pensando', 'aplauso'],
    consejos: ['Toca el estado de un producto para marcar si hay o ya se acabó.', 'Una foto y una descripción ayudan a que más clientes lo pidan.', 'Si llevas la cuenta de existencias, yo marco «agotado» cuando llegan a 0.'],
  },
  'comerciante/avisos': {
    pose: 'megafono',
    alternas: ['palma', 'aplauso'],
    consejos: ['Publica una promoción o un regalo y tus clientes lo ven al momento.', 'Los avisos de «Ya no hay…» cambian solitos el producto a agotado.'],
  },
  'comerciante/pedidos': {
    pose: 'caja',
    alternas: ['saludo', 'aplauso', 'pensando'],
    consejos: ['Acepta o rechaza los pedidos nuevos. Si no respondes a tiempo, se liberan solos.', 'Cuando lo tengas listo, márcalo para avisar al cliente.'],
  },
  'comerciante/chats': {
    pose: 'saludo',
    alternas: ['pensando', 'aplauso'],
    consejos: ['Contesta rápido: las respuestas rápidas te ahorran escribir.'],
  },
  'comerciante/perfil': {
    pose: 'saludo',
    alternas: ['palma', 'pensando'],
    consejos: ['Aquí editas tu negocio: logo, horario, ubicación y datos de transferencia.', 'Más abajo decides si me quedo contigo, si hago sonidos o si me voy a dormir.'],
  },
  clientes: {
    pose: 'fiesta',
    alternas: ['aplauso', 'saludo'],
    consejos: ['Un cliente frecuente vuelve más. Dale un descuento, un regalo o un cupón.'],
  },
  'mis-resenas': {
    pose: 'saludo',
    alternas: ['pensando', 'aplauso'],
    consejos: ['Tu opinión ayuda a los vecinos a elegir. Puedes editarla cuando quieras.'],
  },
};

/** Lo que Boti dice cuando siente algo por sí mismo (solo las emociones que merecen una frase; las demás solo se actúan). */
export const FRASES_EMOCION: Partial<Record<EmocionBoti, string[]>> = {
  enojado: ['¡Oye! Más despacio, que me mareas.', '¡Grrr! ¡Ya, ya! Me estás haciendo cosquillas fuerte.'],
  triste: ['Qué tristeza… Aquí sigo contigo.', 'Snif… ¿me das un abracito virtual?'],
  bostezo: ['¡Aaaah! Me dio sueñito.', 'Uff, ya casi me duermo…'],
  sorpresa: ['¡Ay! ¿Eso qué fue?', '¡Oh! ¡No me lo esperaba!'],
  enamorado: ['¡Qué lindo que estés aquí!', 'Me encanta ayudarte con tu mandado.'],
  celebra: ['¡Fiesta! ¡Hay que celebrar!', '¡Lo logramos! ¡Confeti para todos!'],
  baila: ['¡A bailar un ratito!'],
  gira: ['¡Mírame, doy la vuelta!'],
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
