import { R } from './recetaUtil';
import type { Receta } from './recetaUtil';

/**
 * Platillos de «algo en salsa» (pollo en salsa roja, camarones a la diabla, huevos en salsa verde…).
 *
 * En México casi todo se puede guisar en una salsa: en lugar de escribir a mano cada combinación, aquí se arman con dos piezas
 * que sí están revisadas: cómo se cuece cada alimento (con su punto de cocción y tiempos) y cómo se prepara cada salsa.
 * Solo se arman las combinaciones que de verdad se comen; las que ya existen escritas a mano (pollo en salsa verde, costillas
 * en salsa roja, chuletas en salsa verde…) no se repiten.
 *
 * Autor: José David Pérez Miguel
 */

type Ing = [ids: string, txt: string, banderas?: string];

interface Alimento {
  /** Parte del identificador: «pollo» → «pollo-roja». */
  clave: string;
  /** Cómo empieza el nombre: «Pollo», «Carne de cerdo». */
  nombre: string;
  ing: Ing;
  /** Minutos que toma cocerlo, sin contar la salsa. */
  min: number;
  /** Letras de momento del día (d c n b p e). */
  momentos: string;
  porciones: number;
  /** Pasos para cocer el alimento con la salsa ya licuada. */
  pasos: string[];
  sirve: string;
  tags: string;
}

interface Salsa {
  clave: string;
  /** Cómo termina el nombre: «en salsa roja», «a la diabla». */
  frase: string;
  ing: Ing[];
  paso: string;
  min: number;
  /** Letras de sabor (D S P A M). */
  sab: string;
  tip?: string;
}

const ALIMENTOS: Alimento[] = [
  {
    clave: 'pollo',
    nombre: 'Pollo',
    ing: ['pollo', '800 g de pollo en piezas (muslos, piernas o pechuga)', 'p'],
    min: 40,
    momentos: 'c',
    porciones: 4,
    pasos: [
      'Sazona el pollo con sal y pimienta y dóralo en una olla con un poco de aceite, unos 8 minutos, hasta que tome color por los dos lados.',
      'Vierte la salsa sobre el pollo, tapa y cocina a fuego bajo de 25 a 30 minutos, moviendo de vez en cuando. Debe quedar bien cocido por dentro, sin partes rosadas. Si la salsa se espesa de más, agrega un poco de agua.',
    ],
    sirve: 'Sirve caliente con arroz y tortillas.',
    tags: '',
  },
  {
    clave: 'res',
    nombre: 'Carne de res',
    ing: ['res', '700 g de carne de res en trozos (aguja, chambarete o falda)', 'p'],
    min: 75,
    momentos: 'c',
    porciones: 4,
    pasos: [
      'Sazona la carne con sal y pimienta y séllala en una olla con un poco de aceite, por tandas, hasta que dore por todos lados.',
      'Vierte la salsa y 1 taza de agua, tapa y cocina a fuego bajo de 50 a 60 minutos, hasta que la carne esté muy suave. Si se seca, agrega un poco de agua caliente.',
    ],
    sirve: 'Sirve caliente con arroz, frijoles y tortillas.',
    tags: '',
  },
  {
    clave: 'cerdo',
    nombre: 'Carne de cerdo',
    ing: ['cerdo', '700 g de carne de cerdo en trozos (maciza, espaldilla o chuleta)', 'p'],
    min: 55,
    momentos: 'c',
    porciones: 4,
    pasos: [
      'Sazona la carne con sal y pimienta y dórala en una olla con un poco de aceite hasta que tome color por todos lados.',
      'Vierte la salsa y 1/2 taza de agua, tapa y cocina a fuego bajo de 35 a 40 minutos, hasta que la carne esté suave y sin partes rosadas.',
    ],
    sirve: 'Sirve caliente con arroz, frijoles y tortillas.',
    tags: '',
  },
  {
    clave: 'huevo',
    nombre: 'Huevos',
    ing: ['huevo', '6 huevos', 'p'],
    min: 12,
    momentos: 'dc',
    porciones: 4,
    pasos: [
      'Calienta la salsa en una sartén amplia a fuego medio hasta que hierva suavemente; si está muy espesa, agrega 1/2 taza de agua.',
      'Con cuidado, rompe los huevos uno por uno sobre la salsa, tapa y cocina a fuego bajo de 6 a 8 minutos, hasta que la clara esté bien cuajada. Si es para niños pequeños, embarazadas o personas mayores, deja que también la yema quede firme.',
    ],
    sirve: 'Sirve con frijoles y tortillas calientes.',
    tags: 'economico',
  },
  {
    clave: 'camaron',
    nombre: 'Camarones',
    ing: ['camaron', '500 g de camarones limpios', 'p'],
    min: 10,
    momentos: 'cn',
    porciones: 4,
    pasos: [
      'Calienta la salsa en una sartén amplia a fuego medio 5 minutos.',
      'Agrega los camarones y cocínalos de 4 a 5 minutos, hasta que estén rosados y firmes. Si se cuecen de más se ponen duros.',
    ],
    sirve: 'Sirve de inmediato con arroz blanco y limón.',
    tags: '',
  },
  {
    clave: 'pescado',
    nombre: 'Pescado',
    ing: ['pescado', '4 filetes de pescado (tilapia, mojarra o huachinango)', 'p'],
    min: 15,
    momentos: 'c',
    porciones: 4,
    pasos: [
      'Sazona los filetes con sal y unas gotas de limón.',
      'Calienta la salsa en una sartén ancha con 1/2 taza de agua, acomoda los filetes encima, tapa y cocina a fuego bajo de 8 a 10 minutos, hasta que la carne esté blanca y se desprenda fácilmente con un tenedor.',
    ],
    sirve: 'Sirve con arroz blanco y limón.',
    tags: '',
  },
  {
    clave: 'nopal',
    nombre: 'Nopales',
    ing: ['nopal', '6 nopales limpios en cubos', 'p'],
    min: 20,
    momentos: 'cn',
    porciones: 4,
    pasos: [
      'Cuece los nopales en agua con sal y un trozo de cebolla de 10 a 12 minutos y escúrrelos bien: así sueltan menos baba.',
      'Agrega los nopales a la salsa y cocina a fuego medio 8 minutos más para que tomen sabor.',
    ],
    sirve: 'Sirve con frijoles, queso fresco y tortillas calientes.',
    tags: 'economico',
  },
];

const SALSAS: Salsa[] = [
  {
    clave: 'roja',
    frase: 'en salsa roja',
    ing: [
      ['jitomate', '5 jitomates', 'p'],
      ['chile_fresco|chile_seco', '2 chiles serranos o de árbol (al gusto)', 'o'],
      ['cebolla', '1/4 de cebolla'],
      ['ajo', '2 dientes de ajo'],
    ],
    paso: 'Asa o hierve los jitomates con los chiles de 8 a 10 minutos, hasta que estén suaves. Licúalos con la cebolla, el ajo y sal.',
    min: 15,
    sab: 'SP',
  },
  {
    clave: 'verde',
    frase: 'en salsa verde',
    ing: [
      ['tomate_verde', '500 g de tomate verde', 'p'],
      ['chile_fresco', '2 chiles serranos (al gusto)', 'o'],
      ['cebolla', '1/4 de cebolla'],
      ['ajo', '1 diente de ajo'],
      ['cilantro', 'un poco de cilantro', 'o'],
    ],
    paso: 'Hierve los tomates verdes con los chiles de 8 a 10 minutos, hasta que cambien de color. Licúalos con la cebolla, el ajo, el cilantro y sal.',
    min: 15,
    sab: 'SPA',
  },
  {
    clave: 'chipotle',
    frase: 'en salsa de chipotle',
    ing: [
      ['jitomate', '4 jitomates', 'p'],
      ['chipotle', '2 o 3 chiles chipotle en adobo (al gusto)', 'p'],
      ['cebolla', '1/4 de cebolla'],
      ['ajo', '2 dientes de ajo'],
    ],
    paso: 'Hierve los jitomates 8 minutos y licúalos con los chiles chipotle, la cebolla, el ajo y sal. Cuela si quieres una salsa más fina.',
    min: 15,
    sab: 'SP',
    tip: 'El chipotle pica mucho: empieza con uno y prueba la salsa antes de agregar más.',
  },
  {
    clave: 'guajillo',
    frase: 'en adobo de guajillo',
    ing: [
      ['chile_seco', '5 chiles guajillo', 'p'],
      ['jitomate', '2 jitomates'],
      ['ajo', '3 dientes de ajo'],
      ['cebolla', '1/4 de cebolla'],
      ['vinagre', '1 cucharada de vinagre', 'o'],
      ['especias', 'una pizca de comino y orégano', 'o'],
    ],
    paso: 'Quita los rabitos y las semillas de los chiles, tuéstalos apenas en un comal y hiérvelos 10 minutos. Licúalos con el jitomate, el ajo, la cebolla, el vinagre, las especias y sal.',
    min: 20,
    sab: 'SP',
    tip: 'Tuesta los chiles solo unos segundos: si se queman, la salsa amarga.',
  },
  {
    clave: 'mexicana',
    frase: 'a la mexicana',
    ing: [
      ['jitomate', '4 jitomates', 'p'],
      ['cebolla', '1/2 cebolla', 'p'],
      ['chile_fresco', '2 chiles serranos (al gusto)', 'o'],
    ],
    paso: 'Pica finamente los jitomates, la cebolla y los chiles y sofríelos 5 minutos en una sartén con un poco de aceite hasta que suelten su jugo: esa es la salsa.',
    min: 10,
    sab: 'SP',
  },
  {
    clave: 'diabla',
    frase: 'a la diabla',
    ing: [
      ['chile_seco', '6 chiles guajillo y 3 de árbol', 'p'],
      ['jitomate', '3 jitomates'],
      ['ajo', '3 dientes de ajo'],
      ['cebolla', '1/4 de cebolla'],
      ['vinagre', '1 cucharada de vinagre', 'o'],
    ],
    paso: 'Quita los rabitos y las semillas de los chiles y hiérvelos 10 minutos con los jitomates. Licúalos con el ajo, la cebolla, el vinagre y sal hasta que quede una salsa roja y espesa.',
    min: 20,
    sab: 'SP',
    tip: 'Si quieres que pique menos, usa solo guajillo y quita bien las semillas.',
  },
];

/** Qué alimento va con qué salsa. Lo que ya existe escrito a mano (pollo en salsa verde, etc.) no se repite. */
const COMBINACIONES: [alimento: string, salsas: string[]][] = [
  ['pollo', ['roja', 'chipotle', 'guajillo', 'mexicana', 'diabla']],
  ['res', ['roja', 'verde', 'chipotle', 'guajillo']],
  ['cerdo', ['roja', 'verde', 'chipotle', 'guajillo']],
  ['huevo', ['roja', 'verde', 'chipotle']],
  ['camaron', ['roja', 'verde', 'chipotle', 'diabla']],
  ['pescado', ['roja', 'verde', 'chipotle']],
  ['nopal', ['roja', 'verde', 'chipotle']],
];

function armar(a: Alimento, s: Salsa): Receta {
  const nombre = `${a.nombre} ${s.frase}`;
  return R(
    `${a.clave}-${s.clave}`,
    nombre,
    s.sab,
    a.momentos,
    a.min + s.min,
    a.porciones,
    a.tags,
    [a.ing, ...s.ing],
    [s.paso, ...a.pasos, a.sirve],
    s.tip,
  );
}

/** Platillos armados con la combinación de un alimento y una salsa. */
export function recetasCombinadas(existentes: ReadonlySet<string>): Receta[] {
  const res: Receta[] = [];
  for (const [clave, salsas] of COMBINACIONES) {
    const a = ALIMENTOS.find((x) => x.clave === clave);
    if (!a) continue;
    for (const sc of salsas) {
      const s = SALSAS.find((x) => x.clave === sc);
      if (!s) continue;
      const id = `${a.clave}-${s.clave}`;
      if (existentes.has(id)) continue;
      res.push(armar(a, s));
    }
  }
  return res;
}
