import type { TipoAviso } from './tipos';
import { GrupoGiro, grupoDeGiro } from './giros';

/**
 * Festividades en las que un negocio puede acercarse a su gente: fechas del año, ideas para cada tipo de negocio
 * y mensajes listos para publicar. Es código puro (sin pantallas) porque también lo usa el asistente.
 */

export interface IdeaFiesta {
  /** Para qué tipos de negocio sirve; vacío = para todos. */
  para: GrupoGiro[];
  titulo: string;
  /** Mensaje listo para publicar como aviso; el comerciante lo puede cambiar. */
  mensaje: string;
  tipo: TipoAviso;
}

export interface Festividad {
  id: string;
  nombre: string;
  /** Nombre corto para botones. */
  corto: string;
  /** Cuándo cae este año: día de inicio y cuántos días dura, o null si el negocio elige la fecha. */
  fecha: ((anio: number) => Date) | null;
  /** Días que dura (1 = solo ese día). */
  dias: number;
  /** Cuántos días antes conviene empezar a avisar. */
  antes: number;
  /** Cómo se escribe la fecha para el comerciante. */
  cuando: string;
  /** Etiqueta con la que se marcan las recetas de esta fecha. */
  tag: string;
  /** Palabras con las que un cliente la menciona al asistente (sin acentos, separadas por |). */
  palabras: string;
  /** Una frase que explica por qué importa. */
  motivo: string;
  /** Regalos o detalles baratos que se acostumbran. */
  regalos: string[];
  ideas: IdeaFiesta[];
}

/* ───────── fechas ───────── */

const dia = (anio: number, mes: number, d: number) => new Date(anio, mes - 1, d);

/** n-ésimo día de la semana (0 = domingo) de un mes. */
function nEsimo(anio: number, mes: number, semana: number, n: number): Date {
  const primero = new Date(anio, mes - 1, 1).getDay();
  const delta = (semana - primero + 7) % 7;
  return new Date(anio, mes - 1, 1 + delta + (n - 1) * 7);
}

/** Domingo de Pascua (calendario gregoriano). */
export function pascua(anio: number): Date {
  const a = anio % 19;
  const b = Math.floor(anio / 100);
  const c = anio % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const mes = Math.floor((h + l - 7 * m + 114) / 31);
  const d2 = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(anio, mes - 1, d2);
}

/** Lunes que sigue al 16 de julio (Guelaguetza). */
function lunesDelCerro(anio: number): Date {
  const base = new Date(anio, 6, 16);
  const delta = (1 - base.getDay() + 7) % 7 || 7;
  return new Date(anio, 6, 16 + delta);
}

const TODOS: GrupoGiro[] = [];
const FRESCOS: GrupoGiro[] = ['frescos'];
const COMIDA: GrupoGiro[] = ['preparados'];
const DULCE: GrupoGiro[] = ['postres', 'bebidas'];

/* ───────── catálogo ───────── */

export const FESTIVIDADES: Festividad[] = [
  {
    id: 'reyes',
    nombre: 'Día de Reyes Magos',
    corto: 'Reyes Magos',
    fecha: (a) => dia(a, 1, 6),
    dias: 1,
    antes: 10,
    cuando: '6 de enero',
    tag: 'reyes',
    palabras: 'reyes|reyes magos|rosca|rosca de reyes|6 de enero|dia de reyes',
    motivo: 'Todas las familias parten la rosca y toman chocolate caliente.',
    regalos: ['Una vela', 'Un muñequito para la rosca', 'Bolsa de mandado'],
    ideas: [
      { para: ['postres'], titulo: 'La rosca con sorpresa', tipo: 'promo', mensaje: 'Esta semana de Reyes apartamos tu rosca. Cada una lleva su muñequito y, si la apartas con tiempo, te regalamos el chocolate para acompañarla.' },
      { para: DULCE, titulo: 'Chocolate para la rosca', tipo: 'promo', mensaje: 'Para el 6 de enero: chocolate caliente bien espumoso para llevar. Trae tu jarra y te regalamos un pan de yema.' },
      { para: FRESCOS, titulo: 'Todo para el chocolate', tipo: 'general', mensaje: 'Ya tenemos leche, canela, azúcar y todo lo que necesitas para el chocolate de Reyes. Pasa temprano y te lo despachamos rápido.' },
      { para: TODOS, titulo: 'Regalito de Reyes', tipo: 'regalo', mensaje: 'Del 5 al 6 de enero, a quien nos visite le damos un detallito de Reyes: una sorpresa para los niños de la casa.' },
    ],
  },
  {
    id: 'candelaria',
    nombre: 'Día de la Candelaria',
    corto: 'La Candelaria',
    fecha: (a) => dia(a, 2, 2),
    dias: 1,
    antes: 7,
    cuando: '2 de febrero',
    tag: 'candelaria',
    palabras: 'candelaria|dia de la candelaria|tamales de la candelaria|2 de febrero',
    motivo: 'A quien le salió el muñeco en la rosca le toca invitar los tamales.',
    regalos: ['Un atole de cortesía', 'Hojas de tamal', 'Bolsa de mandado'],
    ideas: [
      { para: COMIDA, titulo: 'Tamales por docena', tipo: 'promo', mensaje: 'Para la Candelaria: tamales por encargo, por docena, con atole de regalo. Apártalos con un día de anticipación.' },
      { para: FRESCOS, titulo: 'Todo para tus tamales', tipo: 'general', mensaje: 'Masa, manteca, hojas, pollo y chiles para los tamales de la Candelaria. Pregunta por tu paquete completo.' },
      { para: DULCE, titulo: 'Atole de acompañamiento', tipo: 'promo', mensaje: 'Atole de masa, champurrado o de arroz para acompañar los tamales. Lleva tu jarra y te la llenamos.' },
    ],
  },
  {
    id: 'amor',
    nombre: 'Día del Amor y la Amistad',
    corto: 'Amor y Amistad',
    fecha: (a) => dia(a, 2, 14),
    dias: 1,
    antes: 14,
    cuando: '14 de febrero',
    tag: 'amor',
    palabras: 'amor y amistad|amor y la amistad|dia del amor|dia de la amistad|san valentin|14 de febrero|dia de los enamorados|enamorados|mi novia|mi novio|mi pareja|romantico|romantica|cena romantica|cita',
    motivo: 'Es el día de decir "te quiero" a la pareja, a los amigos y a la familia.',
    regalos: ['Una flor', 'Un dulce', 'Tarjetita escrita a mano'],
    ideas: [
      { para: DULCE, titulo: 'Fresas con crema para dos', tipo: 'promo', mensaje: 'El 14 de febrero, dos vasos de fresas con crema por el precio de uno y medio. Ven con tu persona favorita.' },
      { para: ['postres'], titulo: 'Pastelito del cariño', tipo: 'promo', mensaje: 'Pasteles y gelatinas en corazón con tu dedicatoria. Encárgalos con 2 días de anticipación y escribimos lo que quieras.' },
      { para: COMIDA, titulo: 'Cena para dos', tipo: 'promo', mensaje: 'Menú de Amor y Amistad: dos platillos, dos aguas frescas y postre compartido a precio especial. Reserva tu mesa.' },
      { para: FRESCOS, titulo: 'Detalle para amigos', tipo: 'regalo', mensaje: 'Por Amor y Amistad regalamos un detalle a quien venga acompañado: aquí también valoramos la amistad de nuestros clientes.' },
      { para: TODOS, titulo: 'Gracias por quedarte', tipo: 'general', mensaje: 'Hoy es Día del Amor y la Amistad y queremos darte las gracias por ser parte de nuestro negocio. Pasa por un detalle.' },
    ],
  },
  {
    id: 'semana-santa',
    nombre: 'Semana Santa',
    corto: 'Semana Santa',
    fecha: (a) => {
      const p = pascua(a);
      return new Date(p.getFullYear(), p.getMonth(), p.getDate() - 3);
    },
    dias: 3,
    antes: 14,
    cuando: 'Jueves a sábado santo (cambia cada año)',
    tag: 'semana-santa',
    palabras: 'semana santa|viernes santo|cuaresma|vigilia|capirotada',
    motivo: 'Se come pescado y mariscos, capirotada y torrejas.',
    regalos: ['Un limón', 'Tostadas', 'Bolsa de mandado'],
    ideas: [
      { para: FRESCOS, titulo: 'Pescado y mariscos de Semana Santa', tipo: 'promo', mensaje: 'Para la vigilia: pescado fresco, camarón y mariscos. Aparta el tuyo desde el lunes y te lo dejamos limpio.' },
      { para: COMIDA, titulo: 'Menú de vigilia', tipo: 'promo', mensaje: 'Esta Semana Santa tenemos platillos sin carne: caldo de pescado, tostadas de atún y empanadas de queso.' },
      { para: DULCE, titulo: 'Capirotada y torrejas', tipo: 'promo', mensaje: 'Capirotada y torrejas de Semana Santa, por porción o por charola. Encárgalas con tiempo.' },
    ],
  },
  {
    id: 'nino',
    nombre: 'Día del Niño',
    corto: 'Día del Niño',
    fecha: (a) => dia(a, 4, 30),
    dias: 1,
    antes: 10,
    cuando: '30 de abril',
    tag: 'nino',
    palabras: 'dia del nino|dia de los ninos|30 de abril|para los ninos|para mis hijos|para los pequenos|infantil',
    motivo: 'Es el día de consentir a los más pequeños de la casa.',
    regalos: ['Un dulce', 'Una calcomanía', 'Un globo'],
    ideas: [
      { para: DULCE, titulo: 'Vaso para los pequeños', tipo: 'promo', mensaje: 'El 30 de abril, a los niños les regalamos una bola extra en su nieve o un dulce con su compra.' },
      { para: COMIDA, titulo: 'Combo infantil', tipo: 'promo', mensaje: 'Combo del Día del Niño: tacos chiquitos, agua fresca y una sorpresa para los pequeños.' },
      { para: FRESCOS, titulo: 'Un dulce para los chiquitos', tipo: 'regalo', mensaje: 'Por el Día del Niño, a cada niño que nos visite con su mamá o papá le damos un dulce. ¡Tráelos!' },
      { para: ['otros'], titulo: 'Útiles y juegos', tipo: 'promo', mensaje: 'Descuento en juegos, colores y papelería por el Día del Niño. Escoge su regalo con nosotros.' },
    ],
  },
  {
    id: 'madre',
    nombre: 'Día de las Madres',
    corto: 'Día de las Madres',
    fecha: (a) => dia(a, 5, 10),
    dias: 1,
    antes: 14,
    cuando: '10 de mayo',
    tag: 'madre',
    palabras: 'dia de las madres|dia de la madre|dia de la mama|dia de las mamas|10 de mayo|mi mama|mi mami|mi madre|para mi mama|mamita',
    motivo: 'Uno de los días con más comida y regalos del año: la familia se reúne a celebrar a mamá.',
    regalos: ['Una flor', 'Una bolsa de mandado bordada', 'Un trasto', 'Una tarjeta'],
    ideas: [
      { para: FRESCOS, titulo: 'Para la comida de mamá', tipo: 'promo', mensaje: 'Para consentir a mamá este 10 de mayo: pollo, carne y todo para su mole o su platillo favorito. Aparta tu pedido desde hoy.' },
      { para: COMIDA, titulo: 'Mesa para la familia', tipo: 'promo', mensaje: 'Reserva tu comida del 10 de mayo: platillos para compartir en familia y una rosa de regalo para cada mamá.' },
      { para: ['postres'], titulo: 'Pastel con dedicatoria', tipo: 'promo', mensaje: 'Pasteles para mamá con dedicatoria incluida. Encárgalo antes del 8 de mayo y te regalamos las velitas.' },
      { para: DULCE, titulo: 'Un detalle por cada mamá', tipo: 'regalo', mensaje: 'El 10 de mayo, a todas las mamás que nos visiten les regalamos un detalle. ¡Gracias por todo lo que hacen!' },
      { para: TODOS, titulo: 'Gracias, mamá', tipo: 'general', mensaje: 'Feliz Día de las Madres. Hoy las mamás tienen un detallito de nuestra parte en la tienda.' },
    ],
  },
  {
    id: 'padre',
    nombre: 'Día del Padre',
    corto: 'Día del Padre',
    fecha: (a) => nEsimo(a, 6, 0, 3),
    dias: 1,
    antes: 10,
    cuando: 'Tercer domingo de junio',
    tag: 'padre',
    palabras: 'dia del padre|dia de los padres|dia del papa|dia de los papas|mi papa|mi papi|mi padre|para mi papa|tercer domingo de junio',
    motivo: 'Una comida en familia con carne, tlayudas o una buena botana.',
    regalos: ['Un refresco', 'Un calendario', 'Una bolsa de mandado'],
    ideas: [
      { para: FRESCOS, titulo: 'Carne para el asador', tipo: 'promo', mensaje: 'Para el Día del Padre: tasajo, cecina, chorizo y carne para asar, con tortillas de regalo en compras de más de $300.' },
      { para: COMIDA, titulo: 'Comida de papá', tipo: 'promo', mensaje: 'Domingo de Día del Padre: platillo fuerte, agua fresca y postre. Reserva y papá recibe un detalle.' },
      { para: DULCE, titulo: 'Un fresco para papá', tipo: 'regalo', mensaje: 'Este domingo, a los papás les regalamos un vaso de agua fresca. Ven a celebrarlos.' },
      { para: TODOS, titulo: 'Felicidades, papá', tipo: 'general', mensaje: 'Feliz Día del Padre. Les deseamos un domingo en familia y los esperamos con un detalle para ellos.' },
    ],
  },
  {
    id: 'guelaguetza',
    nombre: 'Guelaguetza',
    corto: 'Guelaguetza',
    fecha: lunesDelCerro,
    dias: 1,
    antes: 10,
    cuando: 'Lunes después del 16 de julio (Lunes del Cerro)',
    tag: 'oaxaca',
    palabras: 'guelaguetza|lunes del cerro|fiesta de oaxaca',
    motivo: 'Oaxaca celebra sus tradiciones y llegan visitantes buscando sabor local.',
    regalos: ['Una mini bolsa con un dulce típico', 'Un tejate de cortesía'],
    ideas: [
      { para: COMIDA, titulo: 'Sabor oaxaqueño', tipo: 'promo', mensaje: 'En Guelaguetza, nuestro menú oaxaqueño: tlayudas, tamales de mole y tejate. Ven a probar lo nuestro.' },
      { para: DULCE, titulo: 'Tejate y nieves de la región', tipo: 'promo', mensaje: 'Nieves de tuna y de leche quemada, tejate bien frío. Para refrescarte en las fiestas de julio.' },
      { para: FRESCOS, titulo: 'Para tu comida oaxaqueña', tipo: 'general', mensaje: 'Quesillo, tasajo, chorizo y tlayudas: todo lo que necesitas para armar tu comida en casa estas fiestas.' },
    ],
  },
  {
    id: 'regreso-clases',
    nombre: 'Regreso a clases',
    corto: 'Regreso a clases',
    fecha: (a) => dia(a, 8, 24),
    dias: 7,
    antes: 7,
    cuando: 'Última semana de agosto (revisa el calendario escolar)',
    tag: 'clases',
    palabras: 'regreso a clases|lonche|lonches|almuerzo escolar|para la escuela',
    motivo: 'Las familias buscan almuerzos económicos y útiles escolares.',
    regalos: ['Un dulce para el recreo', 'Un cuaderno chico', 'Un lápiz'],
    ideas: [
      { para: FRESCOS, titulo: 'Lonches para la escuela', tipo: 'promo', mensaje: 'Regreso a clases: pan, jamón, queso y fruta para el lonche. Lleva todo y arma el almuerzo de la semana.' },
      { para: COMIDA, titulo: 'Almuerzo escolar', tipo: 'promo', mensaje: 'Paquete escolar: torta, agua fresca y fruta a precio especial para los chiquitos que vuelven a clases.' },
      { para: ['otros'], titulo: 'Útiles a precio amigo', tipo: 'promo', mensaje: 'Regreso a clases: cuadernos, colores y mochila con descuento. Pregunta por el paquete escolar.' },
      { para: TODOS, titulo: 'Un detalle por regreso a clases', tipo: 'regalo', mensaje: 'A los niños que pasen por aquí en su primer día de clases les damos un detallito para empezar con ganas.' },
    ],
  },
  {
    id: 'independencia',
    nombre: 'Fiestas Patrias (Independencia)',
    corto: 'Independencia',
    fecha: (a) => dia(a, 9, 15),
    dias: 2,
    antes: 14,
    cuando: '15 y 16 de septiembre',
    tag: 'independencia',
    palabras: 'independencia|fiestas patrias|patrias|15 de septiembre|16 de septiembre|el grito|septiembre',
    motivo: 'El grito se celebra con pozole, antojitos y mucha fiesta.',
    regalos: ['Una banderita', 'Un silbato', 'Una bolsa de mandado tricolor'],
    ideas: [
      { para: COMIDA, titulo: 'Pozole y antojitos', tipo: 'promo', mensaje: 'Noche del Grito: pozole por litro, tostadas y esquites. Encarga el tuyo y te lo dejamos caliente.' },
      { para: FRESCOS, titulo: 'Para tu cena mexicana', tipo: 'promo', mensaje: 'Todo para tu pozole y tus antojitos del 15 de septiembre: cerdo, pollo, lechuga, rábano y tostadas.' },
      { para: DULCE, titulo: 'Colores de México', tipo: 'promo', mensaje: 'Aguas verde, blanca y roja, y nieves tricolor para la fiesta. Pregunta por el paquete para tu reunión.' },
      { para: TODOS, titulo: 'Detalle patrio', tipo: 'regalo', mensaje: '¡Viva México! Del 14 al 16 de septiembre te regalamos una banderita con tu compra.' },
    ],
  },
  {
    id: 'muertos',
    nombre: 'Día de Muertos',
    corto: 'Día de Muertos',
    fecha: (a) => dia(a, 11, 1),
    dias: 2,
    antes: 21,
    cuando: '1 y 2 de noviembre',
    tag: 'muertos',
    palabras: 'dia de muertos|muertos|todos santos|ofrenda|altar|pan de muerto|difuntos|calaverita|1 de noviembre|2 de noviembre',
    motivo: 'La ofrenda se llena de lo que más le gustaba a quienes ya no están: pan, chocolate, mole y flores.',
    regalos: ['Una vela', 'Un pan de yema', 'Una calaverita escrita', 'Flor de cempasúchil'],
    ideas: [
      { para: ['postres'], titulo: 'Pan de muerto y de yema', tipo: 'promo', mensaje: 'Ya llegó el pan de muerto y el pan de yema para tu ofrenda. Apártalo y llévate una vela de regalo.' },
      { para: FRESCOS, titulo: 'Todo para la ofrenda', tipo: 'promo', mensaje: 'Para la ofrenda de Muertos: chocolate, mole, pollo, frutas de temporada, piloncillo y calabaza para la tacha. Pasa por tu lista.' },
      { para: COMIDA, titulo: 'Mole y tamales de ofrenda', tipo: 'promo', mensaje: 'Tamales y mole para el altar de tus seres queridos. Encarga por docena o por porción.' },
      { para: DULCE, titulo: 'Atole y chocolate de ofrenda', tipo: 'promo', mensaje: 'Atole de masa y chocolate caliente para acompañar el pan. Trae tu jarra y te la llenamos.' },
      { para: TODOS, titulo: 'Calaverita para nuestros clientes', tipo: 'regalo', mensaje: 'Esta vez en lugar de un descuento escribimos una calaverita para cada cliente. Pasa por la tuya.' },
    ],
  },
  {
    id: 'guadalupe',
    nombre: 'Día de la Virgen de Guadalupe',
    corto: 'Virgen de Guadalupe',
    fecha: (a) => dia(a, 12, 12),
    dias: 1,
    antes: 7,
    cuando: '12 de diciembre',
    tag: 'guadalupe',
    palabras: 'virgen de guadalupe|12 de diciembre|guadalupana|peregrinos|buenuelos',
    motivo: 'Hay peregrinaciones, antojitos y buñuelos en cada esquina.',
    regalos: ['Una veladora', 'Un buñuelo', 'Un vaso de atole'],
    ideas: [
      { para: COMIDA, titulo: 'Antojitos guadalupanos', tipo: 'promo', mensaje: 'El 12 de diciembre tenemos pozole, tamales y buñuelos. Pasa a desayunar antes de la fiesta.' },
      { para: DULCE, titulo: 'Atole y buñuelos', tipo: 'promo', mensaje: 'Buñuelos con miel y atole calientito para el frío de diciembre. Ven por el tuyo.' },
      { para: TODOS, titulo: 'Un vaso de atole', tipo: 'regalo', mensaje: 'A quienes pasen en peregrinación les regalamos un vaso de atole caliente. ¡Que la Virgen los acompañe!' },
    ],
  },
  {
    id: 'posadas',
    nombre: 'Posadas',
    corto: 'Posadas',
    fecha: (a) => dia(a, 12, 16),
    dias: 9,
    antes: 7,
    cuando: 'Del 16 al 24 de diciembre',
    tag: 'navidad',
    palabras: 'posada|posadas|pinata|colacion|colaciones',
    motivo: 'Cada noche hay una posada con ponche, tamales y piñata.',
    regalos: ['Colación', 'Un aguinaldo con dulces', 'Un trasto'],
    ideas: [
      { para: DULCE, titulo: 'Ponche para tu posada', tipo: 'promo', mensaje: 'Ponche de frutas por litro para tu posada. Encarga el tuyo y te lo llevamos calientito.' },
      { para: FRESCOS, titulo: 'Bolo de la posada', tipo: 'regalo', mensaje: 'En compras de más de $300, te regalamos una bolsa de colación para tu posada.' },
      { para: COMIDA, titulo: 'Tamales para la posada', tipo: 'promo', mensaje: 'Tamales por docena para tu posada con atole incluido. Apártalos con 2 días de anticipación.' },
      { para: TODOS, titulo: 'Aguinaldo de la casa', tipo: 'regalo', mensaje: 'Durante las posadas, cada cliente se lleva un aguinaldito con dulces. ¡Gracias por acompañarnos todo el año!' },
    ],
  },
  {
    id: 'navidad',
    nombre: 'Navidad',
    corto: 'Navidad',
    fecha: (a) => dia(a, 12, 24),
    dias: 2,
    antes: 21,
    cuando: '24 y 25 de diciembre',
    tag: 'navidad',
    palabras: 'navidad|nochebuena|cena navidena|24 de diciembre|25 de diciembre|navideno|navidena',
    motivo: 'La cena de Nochebuena y el cariño de diciembre: los clientes esperan un detalle de su tienda.',
    regalos: ['Trastes', 'Cubetas', 'Bolsas de mandado', 'Calendario'],
    ideas: [
      { para: TODOS, titulo: 'Regalos de diciembre', tipo: 'regalo', mensaje: 'El 24 de diciembre regalamos trastes, cubetas y bolsas de mandado a quien nos compre. ¡Gracias por un año más!' },
      { para: FRESCOS, titulo: 'Todo para la cena de Nochebuena', tipo: 'promo', mensaje: 'Pavo, lomo, bacalao, manzanas y todo para la cena navideña. Aparta tu pedido desde el 15 de diciembre.' },
      { para: COMIDA, titulo: 'Cena para llevar', tipo: 'promo', mensaje: 'Cena de Nochebuena lista: platillo principal, guarnición y postre por porciones. Reserva tu pedido.' },
      { para: DULCE, titulo: 'Postres de Navidad', tipo: 'promo', mensaje: 'Ponche, buñuelos y postres navideños para cerrar la noche. Encárgalos antes del 22 de diciembre.' },
      { para: ['otros'], titulo: 'Regalos para toda la familia', tipo: 'promo', mensaje: 'Paquetes de regalo y envoltura gratis por Navidad. Elige algo con nosotros.' },
    ],
  },
  {
    id: 'anio-nuevo',
    nombre: 'Año Nuevo',
    corto: 'Año Nuevo',
    fecha: (a) => dia(a, 12, 31),
    dias: 2,
    antes: 7,
    cuando: '31 de diciembre y 1 de enero',
    tag: 'navidad',
    palabras: 'ano nuevo|fin de ano|31 de diciembre|1 de enero|recalentado',
    motivo: 'Se despide el año con una cena, uvas y buenos deseos.',
    regalos: ['Uvas', 'Calendario nuevo', 'Un detalle de buenos deseos'],
    ideas: [
      { para: FRESCOS, titulo: 'Uvas y lo de la cena', tipo: 'promo', mensaje: 'Para la cena de fin de año: uvas, frutas, lomo y todo lo que falte. Abrimos hasta tarde el 31.' },
      { para: TODOS, titulo: 'Calendario para el año nuevo', tipo: 'regalo', mensaje: 'Estrena año con nosotros: te regalamos un calendario por tu compra. ¡Feliz Año Nuevo!' },
      { para: COMIDA, titulo: 'Recalentado del 1 de enero', tipo: 'promo', mensaje: 'Si te quedó sin cocinar el 31, el 1 de enero tenemos caldo para curar el desvelo.' },
    ],
  },
  {
    id: 'fiesta-pueblo',
    nombre: 'Fiesta del pueblo',
    corto: 'Fiesta del pueblo',
    fecha: null,
    dias: 1,
    antes: 7,
    cuando: 'Tú eliges la fecha',
    tag: 'fiesta',
    palabras: 'fiesta del pueblo|fiesta patronal|mayordomia|convivio|una reunion|una fiesta|cumpleanos|boda|bautizo|xv anos|quinceanera|graduacion',
    motivo: 'La fiesta del pueblo y las celebraciones familiares mueven a toda la comunidad.',
    regalos: ['Un detalle con el nombre de la tienda', 'Servilletas', 'Un vaso de agua fresca'],
    ideas: [
      { para: FRESCOS, titulo: 'Pedidos para fiestas', tipo: 'promo', mensaje: 'Si tienes una fiesta, bautizo o boda, aparta tu pedido con tiempo y te damos precio por mayoreo.' },
      { para: COMIDA, titulo: 'Comida por encargo', tipo: 'promo', mensaje: 'Hacemos comida para tu fiesta por charolas o por litros. Pregunta por el menú y reserva con anticipación.' },
      { para: DULCE, titulo: 'Pasteles y mesa de dulces', tipo: 'promo', mensaje: 'Pasteles, gelatinas y aguas frescas para tu festejo. Encarga con 3 días de anticipación.' },
      { para: TODOS, titulo: 'Felicitamos al pueblo', tipo: 'general', mensaje: 'Felices fiestas a toda nuestra comunidad. Gracias por hacer de este pueblo un lugar tan bonito.' },
    ],
  },
  {
    id: 'aniversario',
    nombre: 'Aniversario de tu negocio',
    corto: 'Aniversario',
    fecha: null,
    dias: 1,
    antes: 7,
    cuando: 'Tú eliges la fecha',
    tag: 'aniversario',
    palabras: 'aniversario del negocio|aniversario de la tienda',
    motivo: 'Cumplir años es la mejor ocasión para dar las gracias a quienes te eligen cada día.',
    regalos: ['Un pilón extra', 'Un dulce', 'Un calendario'],
    ideas: [
      { para: TODOS, titulo: 'Gracias por un año más', tipo: 'regalo', mensaje: 'Hoy cumplimos años y el regalo es para ti: lleva tu pilón extra con cualquier compra. ¡Gracias por elegirnos!' },
      { para: TODOS, titulo: 'Rifa de aniversario', tipo: 'promo', mensaje: 'Por nuestro aniversario rifamos una canasta de productos. Pide tu boleto con tu compra.' },
    ],
  },
  {
    id: 'todo-el-ano',
    nombre: 'Para cualquier día',
    corto: 'Cualquier día',
    fecha: null,
    dias: 1,
    antes: 0,
    cuando: 'Cuando quieras',
    tag: 'todo',
    palabras: 'pilon|nana|cliente frecuente',
    motivo: 'Los clientes recuerdan los pequeños detalles de todos los días.',
    regalos: ['Un pilón', 'Una tarjeta de cliente frecuente', 'Un dulce', 'Una bolsa de mandado'],
    ideas: [
      { para: TODOS, titulo: 'El pilón de la casa', tipo: 'regalo', mensaje: 'Esta semana, con cada compra te damos tu pilón: un detalle extra como en los viejos tiempos. ¡Gracias por venir!' },
      { para: TODOS, titulo: 'Cliente frecuente', tipo: 'promo', mensaje: 'Pide tu tarjeta de cliente frecuente: a la décima compra, la siguiente es un regalo de nuestra parte.' },
      { para: TODOS, titulo: 'Cumpleaños de clientes', tipo: 'regalo', mensaje: 'Si hoy es tu cumpleaños, avísanos y te llevas un detalle de regalo. ¡Felicidades!' },
      { para: FRESCOS, titulo: 'Sorpresa del día', tipo: 'promo', mensaje: 'Cada tarde ponemos un producto del día con precio especial. Pregunta cuál es hoy.' },
      { para: DULCE, titulo: 'Mañana dulce', tipo: 'promo', mensaje: 'De lunes a viernes antes de las 10 de la mañana, el segundo café o atole va con descuento.' },
    ],
  },
];

export const festividad = (id?: string) => FESTIVIDADES.find((f) => f.id === id);

/* ───────── cálculos con fechas ───────── */

const inicioDia = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
const MS_DIA = 24 * 3600 * 1000;

export interface Ocurrencia {
  f: Festividad;
  /** Primer día de la fiesta. */
  inicio: Date;
  /** Último día de la fiesta (a las 23:59). */
  fin: Date;
  /** Desde cuándo conviene avisar. */
  avisarDesde: Date;
  /** Días que faltan para que empiece (0 = hoy o ya empezó). */
  faltan: number;
  /** Ya empezó y no ha terminado. */
  enCurso: boolean;
}

/** La próxima vez que ocurre (o la que está ocurriendo). Null si la fecha la elige el negocio. */
export function proxima(f: Festividad, ahora = new Date()): Ocurrencia | null {
  if (!f.fecha) return null;
  const hoy = inicioDia(ahora);
  for (const anio of [ahora.getFullYear() - 1, ahora.getFullYear(), ahora.getFullYear() + 1]) {
    const inicio = f.fecha(anio);
    const finMs = inicioDia(inicio) + f.dias * MS_DIA - 1;
    if (finMs < hoy) continue;
    const ini = inicioDia(inicio);
    return {
      f,
      inicio,
      fin: new Date(finMs),
      avisarDesde: new Date(ini - f.antes * MS_DIA),
      faltan: Math.max(0, Math.round((ini - hoy) / MS_DIA)),
      enCurso: ini <= hoy,
    };
  }
  return null;
}

/** Festividades con fecha, de la más cercana a la más lejana. */
export function proximas(ahora = new Date()): Ocurrencia[] {
  return FESTIVIDADES.map((f) => proxima(f, ahora))
    .filter((o): o is Ocurrencia => !!o)
    .sort((a, b) => a.inicio.getTime() - b.inicio.getTime());
}

/** Las que ya conviene anunciar hoy (dentro de su tiempo de anticipación o en curso). */
export function enTemporada(ahora = new Date()): Ocurrencia[] {
  const hoy = inicioDia(ahora);
  return proximas(ahora).filter((o) => hoy >= inicioDia(o.avisarDesde));
}

/** "hoy", "mañana", "en 12 días" */
export function textoFaltan(o: Ocurrencia): string {
  if (o.enCurso) return 'en curso';
  if (o.faltan === 0) return 'hoy';
  if (o.faltan === 1) return 'mañana';
  if (o.faltan < 14) return `en ${o.faltan} días`;
  if (o.faltan < 60) return `en ${Math.round(o.faltan / 7)} semanas`;
  return `en ${Math.round(o.faltan / 30)} meses`;
}

/** Ideas de una festividad que le sirven a este tipo de negocio (primero las específicas). */
export function ideasPara(f: Festividad, giro?: string): IdeaFiesta[] {
  const g = grupoDeGiro(giro);
  const propias = f.ideas.filter((i) => i.para.length && i.para.includes(g));
  const generales = f.ideas.filter((i) => !i.para.length);
  return [...propias, ...generales];
}

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
export const fechaLarga = (d: Date) => `${d.getDate()} de ${MESES[d.getMonth()]}`;

/** Fecha de inicio y fin de una festividad con texto para el comerciante, p. ej. "1 y 2 de noviembre". */
export function textoFecha(o: Ocurrencia): string {
  const a = o.inicio;
  const b = new Date(o.fin);
  if (o.f.dias <= 1) return fechaLarga(a);
  if (a.getMonth() === b.getMonth()) return `${a.getDate()} al ${b.getDate()} de ${MESES[a.getMonth()]}`;
  return `${fechaLarga(a)} al ${fechaLarga(b)}`;
}

/* ───────── para el asistente ───────── */

/** Palabras sueltas de cada festividad ya separadas en frases, listas para comparar con lo que escribe una persona. */
export const FESTIVIDADES_ASISTENTE = FESTIVIDADES.filter((f) => f.id !== 'todo-el-ano' && f.id !== 'aniversario');
