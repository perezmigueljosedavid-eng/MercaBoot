import { R, Receta } from './recetaUtil';

/**
 * Más ideas para cada antojo de la comunidad: desayunos con proteína, platos fuertes,
 * platillos solo de verduras, botanas, bebidas, postres y platillos de fiesta.
 * Los ingredientes se buscan entre los productos que suben los negocios.
 */
export const RECETAS_EXTRA: Receta[] = [
  /* ───────── desayunos ───────── */

  R('huevos-rancheros', 'Huevos rancheros', 'SP', 'd', 20, 2, 'economico', [
    ['huevo', '4 huevos', 'p'],
    ['tortilla', '4 tortillas de maíz', 'p'],
    ['jitomate|tomate_verde', '3 jitomates o tomates verdes para la salsa', 'p'],
    ['chile_fresco', '1 o 2 chiles serranos', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['frijol', 'frijoles refritos para acompañar', 'o'],
  ], [
    'Licúa los jitomates con el chile, la cebolla y una pizca de sal. Cuécela en una sartén con un poco de aceite durante 8 minutos.',
    'En otra sartén calienta un poco de aceite y dora ligeramente las tortillas, sin que queden duras.',
    'Fríe los huevos al gusto: con la yema suave o bien cocida.',
    'Pon cada huevo sobre una tortilla, báñalo con la salsa caliente y acompaña con frijoles.',
  ]),

  R('nopales-huevo', 'Huevos con nopales', 'S', 'dc', 20, 2, 'economico', [
    ['huevo', '4 huevos', 'p'],
    ['nopal', '2 tazas de nopales picados y cocidos', 'p'],
    ['cebolla', '1/4 de cebolla picada', 'o'],
    ['jitomate', '1 jitomate picado', 'o'],
    ['tortilla', 'tortillas calientes', 'o'],
  ], [
    'Si los nopales están crudos, cuécelos 10 minutos en agua con sal y escúrrelos bien para quitarles la baba.',
    'Sofríe la cebolla y el jitomate en una sartén con aceite 3 minutos.',
    'Agrega los nopales y deja que se doren un par de minutos.',
    'Bate los huevos con sal, viértelos y revuelve hasta que cuajen. Sirve con tortillas calientes.',
  ]),

  R('omelette-verduras', 'Omelette de verduras y queso', 'S', 'dn', 15, 1, 'rapido', [
    ['huevo', '3 huevos', 'p'],
    ['champinon|calabacita|jitomate|cebolla|chile_fresco', '1/2 taza de verduras picadas (hongos, calabacita, jitomate…)', 'p'],
    ['queso|quesillo', '3 cucharadas de queso', 'o'],
  ], [
    'Sofríe las verduras en una sartén con un poco de aceite o mantequilla durante 4 minutos y pásalas a un plato.',
    'Bate los huevos con sal y viértelos en la misma sartén a fuego medio-bajo.',
    'Cuando casi estén cuajados, pon las verduras y el queso en una mitad.',
    'Dobla el omelette, déjalo 1 minuto más para que el queso se derrita y sírvelo.',
  ]),

  R('huevos-jamon', 'Huevos revueltos con jamón', 'S', 'd', 10, 2, 'economico', [
    ['huevo', '4 huevos', 'p'],
    ['jamon', '100 g de jamón picado', 'p'],
    ['tortilla|bolillo', 'tortillas o pan', 'o'],
  ], [
    'Dora el jamón picado en una sartén con un poco de aceite 2 minutos.',
    'Bate los huevos con una pizca de sal y agrégalos.',
    'Revuelve a fuego bajo hasta que cuajen, sin dejar que se resequen.',
    'Sirve de inmediato con tortillas o pan.',
  ]),

  R('chilaquiles-pollo', 'Chilaquiles rojos con pollo', 'SP', 'dc', 30, 3, '', [
    ['tortilla|tostada', '10 tortillas cortadas en triángulos y fritas, o totopos', 'p'],
    ['jitomate|tomate_verde', '4 jitomates (o tomates verdes) para la salsa', 'p'],
    ['pollo', '1 pechuga cocida y deshebrada', 'p'],
    ['chile_fresco|chile_seco', 'chile al gusto', 'o'],
    ['crema', 'crema', 'o'],
    ['queso', 'queso fresco desmoronado', 'o'],
    ['cebolla', 'cebolla en aros', 'o'],
  ], [
    'Cuece el pollo en agua con sal 20 minutos, hasta que no quede rosado. Deshébralo.',
    'Licúa los jitomates con el chile, un trozo de cebolla y sal. Fríe la salsa 8 minutos en una cazuela con un poco de aceite.',
    'Agrega los totopos y mueve 1 o 2 minutos, hasta que se bañen pero sigan con algo de textura.',
    'Sirve con el pollo, crema, queso y cebolla.',
  ], 'Para que no se deshagan, agrega los totopos hasta el último momento y sirve en seguida.'),

  R('torta-huevo', 'Torta de huevo con frijol', 'S', 'dn', 15, 2, 'economico clases', [
    ['bolillo', '2 bolillos', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['frijol', 'frijoles refritos', 'o'],
    ['aguacate', '1/2 aguacate', 'o'],
    ['jamon', 'jamón', 'o'],
  ], [
    'Bate los huevos con sal y prepáralos revueltos o en tortilla delgada en una sartén con aceite.',
    'Abre los bolillos y calienta un poco el interior en el comal.',
    'Unta frijoles en la base, agrega el huevo (y el jamón si quieres) y las rebanadas de aguacate.',
    'Cierra la torta y sírvela caliente.',
  ]),

  R('licuado-avena', 'Licuado de avena con plátano', 'D', 'de', 5, 2, 'economico clases', [
    ['avena', '4 cucharadas de avena', 'p'],
    ['platano', '1 plátano maduro', 'p'],
    ['leche', '2 tazas de leche', 'p'],
    ['miel|azucar', '1 cucharada de miel o azúcar', 'o'],
    ['canela', 'una pizca de canela', 'o'],
  ], [
    'Pon todos los ingredientes en la licuadora.',
    'Licúa 1 minuto, hasta que quede suave.',
    'Sirve de inmediato, con un poco de canela encima.',
  ], 'Es un desayuno que llena: la avena le da energía para toda la mañana.'),

  /* ───────── platos fuertes ───────── */

  R('pollo-arroz', 'Arroz con pollo', 'S', 'c', 45, 4, 'economico', [
    ['pollo', '4 piezas de pollo (pierna y muslo)', 'p'],
    ['arroz', '1 taza de arroz', 'p'],
    ['jitomate', '2 jitomates', 'o'],
    ['zanahoria', '1 zanahoria en cubitos', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
  ], [
    'Sazona el pollo con sal y dóralo en una olla con un poco de aceite, 3 minutos por lado. Retíralo.',
    'En la misma olla sofríe el arroz hasta que se vea transparente. Agrega el jitomate, la cebolla y el ajo licuados.',
    'Pon el pollo encima, la zanahoria y 2 tazas de agua o caldo caliente. Tapa y cocina a fuego bajo 25 minutos.',
    'Verifica que el pollo esté bien cocido por dentro y que el arroz esté suave. Deja reposar 5 minutos antes de servir.',
  ]),

  R('pollo-salsa-verde', 'Pollo en salsa verde', 'SAP', 'c', 40, 4, '', [
    ['pollo', '4 piezas de pollo o 2 pechugas', 'p'],
    ['tomate_verde', '8 tomates verdes', 'p'],
    ['chile_fresco', '2 chiles serranos', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['cilantro', 'un puño de cilantro', 'o'],
    ['arroz', 'arroz para acompañar', 'o'],
  ], [
    'Cuece el pollo en agua con sal y un trozo de cebolla 25 minutos, hasta que no quede rosado. Guarda una taza del caldo.',
    'Hierve los tomates y los chiles 5 minutos. Licúalos con la cebolla, el cilantro y un poco del caldo.',
    'Fríe la salsa en una cazuela con un poco de aceite 5 minutos. Agrega el pollo y deja hervir 8 minutos más.',
    'Sirve con arroz y tortillas calientes.',
  ]),

  R('pollo-sarten-limon', 'Pollo dorado con ajo y limón', 'SA', 'c', 35, 3, '', [
    ['pollo', '4 piernas o muslos de pollo', 'p'],
    ['limon', 'el jugo de 2 limones', 'p'],
    ['ajo', '3 dientes de ajo picados', 'p'],
    ['papa', '2 papas', 'o'],
    ['hierbas', 'orégano o tomillo', 'o'],
  ], [
    'Marina el pollo con el jugo de limón, el ajo, sal y las hierbas durante 15 minutos.',
    'Dóralo en una sartén grande con un poco de aceite, 5 minutos por lado.',
    'Baja el fuego, tapa y cocina 15 minutos más, hasta que el centro ya no esté rosado y el jugo salga claro.',
    'Si quieres, acompáñalo con papas cocidas y doradas en la misma sartén.',
  ]),

  R('albondigas-chipotle', 'Albóndigas en caldillo de chipotle', 'SP', 'c', 50, 4, '', [
    ['res', '500 g de carne molida de res', 'p'],
    ['jitomate', '4 jitomates', 'p'],
    ['chipotle', '2 chiles chipotle en adobo', 'p'],
    ['huevo', '1 huevo', 'o'],
    ['arroz|pan_molido', '3 cucharadas de arroz crudo o pan molido', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
  ], [
    'Mezcla la carne con el huevo, el arroz o pan molido, sal y un poco de cebolla picada. Forma bolitas del tamaño de una nuez.',
    'Licúa los jitomates con los chiles chipotle, el ajo y la cebolla. Fríe la salsa en una olla 5 minutos.',
    'Agrega 2 tazas de agua, deja que hierva y mete las albóndigas con cuidado.',
    'Cocina tapadas a fuego bajo 30 minutos. Sirve con arroz o tortillas.',
  ], 'La carne molida debe quedar bien cocida; parte una albóndiga para revisar que no esté rosada.'),

  R('picadillo-papa', 'Picadillo de res con papa', 'S', 'cn', 35, 4, 'economico', [
    ['res', '400 g de carne molida de res', 'p'],
    ['papa', '2 papas en cubitos', 'p'],
    ['jitomate', '2 jitomates', 'p'],
    ['zanahoria', '1 zanahoria en cubitos', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['tortilla', 'tortillas o arroz', 'o'],
  ], [
    'Sofríe la cebolla y la carne molida en una sartén, deshaciéndola, hasta que ya no esté rosada.',
    'Licúa los jitomates, agrégalos con sal y cocina 5 minutos.',
    'Añade las papas y la zanahoria con 1/2 taza de agua. Tapa y cocina 15 minutos, hasta que estén suaves.',
    'Sirve en tacos, con arroz o solo, con una salsa al lado.',
  ]),

  R('enchiladas-verdes-pollo', 'Enchiladas verdes con pollo', 'SAP', 'cn', 40, 3, '', [
    ['tortilla', '9 tortillas de maíz', 'p'],
    ['pollo', '1 pechuga cocida y deshebrada', 'p'],
    ['tomate_verde', '8 tomates verdes', 'p'],
    ['chile_fresco', '2 chiles serranos', 'p'],
    ['crema', 'crema', 'o'],
    ['queso', 'queso fresco', 'o'],
    ['cebolla', 'cebolla en aros', 'o'],
  ], [
    'Cuece el pollo en agua con sal 20 minutos y deshébralo.',
    'Hierve los tomates y chiles 5 minutos y licúalos con sal. Cuece la salsa en una sartén 5 minutos.',
    'Pasa cada tortilla por aceite caliente 10 segundos, mójala en la salsa, rellénala con pollo y enróllala.',
    'Acomoda las enchiladas, báñalas con más salsa y sírvelas con crema, queso y cebolla.',
  ]),

  R('enmoladas', 'Enmoladas con pollo y queso', 'SDP', 'cn', 35, 3, 'oaxaca tradicional muertos guadalupe', [
    ['tortilla', '9 tortillas de maíz', 'p'],
    ['mole', '1/2 taza de pasta de mole', 'p'],
    ['pollo', '1 pechuga cocida y deshebrada', 'p'],
    ['queso|quesillo', 'queso para espolvorear', 'o'],
    ['cebolla', 'cebolla en aros', 'o'],
    ['ajonjoli', 'ajonjolí', 'o'],
  ], [
    'Cuece y deshebra el pollo. Guarda 2 tazas del caldo.',
    'Disuelve el mole en el caldo caliente y hiérvelo 10 minutos hasta que espese un poco.',
    'Pasa cada tortilla por aceite caliente unos segundos, báñala en el mole, rellénala con pollo y dóblala.',
    'Sirve cubiertas de mole con queso, cebolla y ajonjolí.',
  ]),

  R('chiles-rellenos-quesillo', 'Chiles rellenos de quesillo', 'SP', 'c', 50, 3, 'oaxaca tradicional', [
    ['chile_fresco', '6 chiles poblanos o de agua asados y pelados', 'p'],
    ['quesillo', '250 g de quesillo', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['harina', '3 cucharadas de harina', 'o'],
    ['jitomate', '4 jitomates para el caldillo', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
  ], [
    'Haz un corte a lo largo de cada chile, quítales las semillas y rellénalos con quesillo. Ciérralos con un palillo.',
    'Bate las claras a punto de turrón e incorpora las yemas. Pasa los chiles por harina y luego por el huevo.',
    'Fríelos en aceite caliente hasta que estén dorados y escúrrelos sobre papel.',
    'Licúa los jitomates con la cebolla y sal, cuece el caldillo 10 minutos y sirve los chiles en él.',
  ], 'Puedes sustituir el quesillo por queso fresco si quieres un relleno más ligero.'),

  R('costillas-salsa-roja', 'Costillas de cerdo en salsa roja', 'SP', 'c', 70, 4, '', [
    ['cerdo', '700 g de costilla de cerdo', 'p'],
    ['chile_seco', '4 chiles guajillo', 'p'],
    ['jitomate', '2 jitomates', 'p'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['papa', '2 papas', 'o'],
  ], [
    'Cuece las costillas en agua con sal, cebolla y ajo 40 minutos, hasta que la carne esté suave.',
    'Desvena los chiles, hiérvelos 5 minutos y licúalos con los jitomates y un poco del caldo.',
    'Cuela la salsa y fríela en una cazuela 5 minutos. Agrega las costillas (y las papas cocidas si quieres).',
    'Deja hervir a fuego bajo 10 minutos y sirve con tortillas.',
  ]),

  R('pescado-empanizado', 'Pescado empanizado con ensalada', 'S', 'c', 25, 3, 'semana-santa', [
    ['pescado', '3 filetes de pescado', 'p'],
    ['huevo', '1 huevo', 'p'],
    ['pan_molido|harina', '1/2 taza de pan molido o harina', 'p'],
    ['limon', 'limón', 'o'],
    ['lechuga', 'lechuga', 'o'],
    ['jitomate', 'jitomate', 'o'],
  ], [
    'Seca los filetes con papel, sazona con sal y unas gotas de limón.',
    'Pásalos por huevo batido y luego por el pan molido.',
    'Fríelos en aceite caliente 3 minutos por lado, hasta que estén dorados y el pescado se desmenuce fácil.',
    'Escúrrelos y sírvelos con ensalada de lechuga y jitomate.',
  ]),

  R('pozole-rojo', 'Pozole rojo', 'SP', 'c', 120, 6, 'caliente tradicional independencia navidad fiesta guadalupe', [
    ['maiz_pozolero', '500 g de maíz pozolero', 'p'],
    ['cerdo|pollo', '600 g de carne de cerdo o pollo en trozos', 'p'],
    ['chile_seco', '5 chiles guajillo', 'p'],
    ['ajo', '3 dientes de ajo', 'o'],
    ['cebolla', '1/2 cebolla', 'o'],
    ['lechuga', 'lechuga o repollo picado para servir', 'o'],
    ['limon', 'limones', 'o'],
    ['tostada', 'tostadas', 'o'],
  ], [
    'Si el maíz no viene precocido, remójalo la noche anterior y cuécelo con ajo y cebolla hasta que "reviente" (1 hora y media aproximadamente).',
    'Agrega la carne con sal y cuécela hasta que esté muy suave: 1 hora si es cerdo, 40 minutos si es pollo.',
    'Hierve los chiles desvenados 5 minutos, licúalos con ajo y un poco de caldo, cuélalos y agrégalos a la olla. Hierve 20 minutos más.',
    'Sirve caliente con lechuga, cebolla picada, limón, orégano y tostadas.',
  ], 'Es de los platillos de fiesta que más rinde: ideal para cuando hay muchos invitados.'),

  R('frijoles-charros', 'Frijoles charros', 'SP', 'c', 40, 4, 'economico caliente', [
    ['frijol', '2 tazas de frijoles cocidos con su caldo', 'p'],
    ['tocino|chorizo|salchicha', '150 g de tocino, chorizo o salchicha picada', 'p'],
    ['jitomate', '2 jitomates picados', 'o'],
    ['cebolla', '1/4 de cebolla picada', 'o'],
    ['chile_fresco', '1 chile serrano', 'o'],
    ['cilantro', 'cilantro', 'o'],
  ], [
    'Fríe el tocino, chorizo o salchicha en una olla hasta que suelte su grasa y se dore.',
    'Agrega la cebolla, el jitomate y el chile y cocina 5 minutos.',
    'Vierte los frijoles con su caldo y deja hervir a fuego medio 15 minutos para que espese.',
    'Sirve en plato hondo con cilantro y tortillas.',
  ]),

  /* ───────── solo verduras ───────── */

  R('sopa-verduras', 'Sopa de verduras', 'S', 'cn', 30, 4, 'economico caliente', [
    ['zanahoria', '2 zanahorias', 'p'],
    ['papa', '2 papas', 'p'],
    ['calabacita|chayote|ejote', '2 calabacitas, chayotes o un puño de ejotes', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['jitomate', '1 jitomate', 'o'],
    ['cilantro', 'cilantro', 'o'],
    ['pasta', 'un puñito de fideos', 'o'],
  ], [
    'Pica todas las verduras en cubos pequeños.',
    'Licúa el jitomate con la cebolla y hiérvelo en una olla con 6 tazas de agua y sal.',
    'Agrega las verduras (y los fideos si quieres) y cocina 20 minutos a fuego medio.',
    'Sirve caliente con cilantro y limón.',
  ]),

  R('crema-calabacita', 'Crema de calabacita', 'S', 'cn', 30, 4, 'caliente', [
    ['calabacita', '4 calabacitas', 'p'],
    ['cebolla', '1/4 de cebolla', 'p'],
    ['leche|crema', '1 taza de leche o 1/2 de crema', 'p'],
    ['mantequilla', '1 cucharada de mantequilla', 'o'],
    ['queso', 'queso para gratinar', 'o'],
  ], [
    'Sofríe la cebolla en la mantequilla 3 minutos.',
    'Agrega las calabacitas en rodajas y 2 tazas de agua con sal. Cuece 15 minutos.',
    'Licúa todo con la leche o la crema hasta que quede muy suave.',
    'Regresa a la olla, calienta sin que hierva fuerte y sirve con queso encima.',
  ]),

  R('ensalada-verduras', 'Ensalada fresca de lechuga, pepino y zanahoria', 'SA', 'cb', 15, 2, 'economico', [
    ['lechuga', '1/2 lechuga', 'p'],
    ['pepino', '1 pepino', 'p'],
    ['zanahoria', '1 zanahoria rallada', 'p'],
    ['limon', 'el jugo de 1 limón', 'p'],
    ['jitomate', '1 jitomate', 'o'],
    ['aguacate', '1/2 aguacate', 'o'],
  ], [
    'Lava y desinfecta bien las verduras.',
    'Corta la lechuga, el pepino y el jitomate; ralla la zanahoria.',
    'Mézclalo todo en un plato grande, agrega el aguacate en cubos.',
    'Aderézala con el jugo de limón, sal y un chorrito de aceite.',
  ]),

  R('calabacitas-jitomate', 'Calabacitas guisadas con jitomate', 'S', 'c', 25, 4, 'economico', [
    ['calabacita', '5 calabacitas en cubos', 'p'],
    ['jitomate', '3 jitomates', 'p'],
    ['cebolla', '1/4 de cebolla', 'p'],
    ['elote', '1 elote desgranado', 'o'],
    ['queso', 'queso fresco', 'o'],
    ['tortilla', 'tortillas calientes', 'o'],
  ], [
    'Licúa los jitomates con un trozo de cebolla.',
    'Acitrona la cebolla picada en una sartén y agrega las calabacitas y el elote 5 minutos.',
    'Vierte el jitomate licuado con sal y tapa. Cocina 12 minutos a fuego medio.',
    'Sirve con queso desmoronado y tortillas.',
  ]),

  R('rajas-crema', 'Rajas con crema y elote', 'SP', 'cn', 25, 4, '', [
    ['chile_fresco', '4 chiles poblanos asados y en rajas', 'p'],
    ['crema', '1/2 taza de crema', 'p'],
    ['cebolla', '1/2 cebolla en rodajas', 'p'],
    ['elote', '1 elote desgranado', 'o'],
    ['queso', 'queso para gratinar', 'o'],
    ['tortilla', 'tortillas', 'o'],
  ], [
    'Acitrona la cebolla en una sartén con un poco de aceite.',
    'Agrega las rajas y el elote y cocina 5 minutos.',
    'Baja el fuego, vierte la crema con sal y calienta 3 minutos sin que hierva fuerte.',
    'Sirve en tacos o con arroz.',
  ]),

  R('verduras-vapor', 'Verduras al vapor con ajo y limón', 'SA', 'cn', 20, 2, 'rapido', [
    ['brocoli|zanahoria|ejote|chayote|calabacita', '3 tazas de verduras (brócoli, zanahoria, ejotes, chayote…)', 'p'],
    ['limon', 'jugo de limón', 'o'],
    ['ajo', '1 diente de ajo picado', 'o'],
  ], [
    'Corta las verduras en trozos similares para que se cuezan parejo.',
    'Cuécelas al vapor, en una vaporera o con un poco de agua en una olla tapada, 8 a 10 minutos: deben quedar suaves pero con color.',
    'Saltea el ajo 1 minuto en una sartén con un poco de aceite y báñalas.',
    'Termina con limón y sal.',
  ]),

  R('nopales-asados-queso', 'Nopales asados con queso', 'S', 'cnb', 20, 2, 'economico oaxaca', [
    ['nopal', '4 nopales limpios', 'p'],
    ['quesillo|queso', '150 g de quesillo o queso', 'p'],
    ['cebolla', 'cebolla en rodajas', 'o'],
    ['limon', 'limón', 'o'],
    ['tortilla', 'tortillas', 'o'],
  ], [
    'Sazona los nopales con sal y ásalos en un comal o sartén caliente 5 minutos por lado.',
    'Asa también unas rodajas de cebolla.',
    'Cubre los nopales con el queso, tapa 2 minutos para que se derrita.',
    'Sirve con limón y tortillas.',
  ]),

  R('sopa-flor-calabaza', 'Sopa de flor de calabaza', 'S', 'cn', 30, 4, 'oaxaca tradicional caliente', [
    ['flor_calabaza', '2 tazas de flor de calabaza limpia', 'p'],
    ['cebolla', '1/4 de cebolla', 'p'],
    ['calabacita', '2 calabacitas', 'o'],
    ['elote', '1 elote desgranado', 'o'],
    ['hierbas', 'una rama de epazote', 'o'],
    ['jitomate', '1 jitomate', 'o'],
  ], [
    'Sofríe la cebolla y el jitomate picados en una olla con un poco de aceite.',
    'Agrega la calabacita en cubitos y el elote con 5 tazas de agua y sal.',
    'Cuando hierva, añade la flor de calabaza y el epazote. Cocina 10 minutos.',
    'Sirve caliente, con tortillas recién hechas.',
  ]),

  R('pasta-verduras', 'Pasta con verduras y queso', 'S', 'cn', 25, 3, 'economico', [
    ['pasta', '250 g de pasta', 'p'],
    ['calabacita|brocoli|zanahoria|champinon', '2 tazas de verduras picadas (calabacita, brócoli, zanahoria, hongos)', 'p'],
    ['ajo', '1 diente de ajo', 'o'],
    ['queso', 'queso rallado', 'o'],
    ['crema', 'un poco de crema', 'o'],
  ], [
    'Cuece la pasta en agua hirviendo con sal según el tiempo del paquete. Escúrrela.',
    'Saltea el ajo y las verduras en una sartén con aceite 8 minutos.',
    'Mezcla la pasta con las verduras, la crema y la sal.',
    'Sirve con queso rallado encima.',
  ]),

  /* ───────── botanas ───────── */

  R('pepino-jicama', 'Pepino y jícama con limón y chile', 'AP', 'b', 10, 3, 'rapido economico', [
    ['pepino|jicama', '2 pepinos o 1 jícama en bastones', 'p'],
    ['limon', 'el jugo de 3 limones', 'p'],
    ['chile_polvo|chamoy|salsa', 'chile en polvo, chamoy o salsa', 'o'],
  ], [
    'Pela y corta el pepino y la jícama en bastones.',
    'Báñalos con el jugo de limón y una pizca de sal.',
    'Espolvorea chile en polvo o chamoy al gusto.',
    'Sírvelos fríos, recién preparados.',
  ]),

  R('nachos-queso', 'Nachos con queso', 'S', 'bn', 15, 3, 'rapido', [
    ['tostada', '1 bolsa de totopos o tostadas quebradas', 'p'],
    ['queso|quesillo', '200 g de queso rallado o quesillo', 'p'],
    ['frijol', 'frijoles refritos', 'o'],
    ['salsa|chile_fresco', 'salsa o chiles en rodajas', 'o'],
    ['aguacate', 'aguacate', 'o'],
  ], [
    'Acomoda los totopos en un plato que pueda ir al horno o en una sartén amplia.',
    'Agrega los frijoles y el queso por encima.',
    'Calienta tapado a fuego bajo (o en el horno) 5 minutos, hasta que el queso se derrita.',
    'Sirve con salsa y aguacate.',
  ]),

  R('frijoles-quesillo-totopos', 'Frijoles con quesillo y totopos', 'S', 'cnb', 15, 2, 'oaxaca economico', [
    ['frijol', '2 tazas de frijoles de la olla', 'p'],
    ['quesillo', '150 g de quesillo', 'p'],
    ['tostada|tortilla', 'totopos o tortillas doradas', 'p'],
    ['aguacate', 'aguacate', 'o'],
    ['salsa', 'salsa', 'o'],
  ], [
    'Calienta los frijoles con un poco de su caldo hasta que hiervan.',
    'Sírvelos en un plato hondo y cúbrelos con el quesillo deshebrado; tapa 1 minuto para que se derrita.',
    'Acompaña con totopos, aguacate y salsa.',
  ]),

  /* ───────── bebidas ───────── */

  R('agua-horchata', 'Agua de horchata', 'D', 'e', 30, 6, 'economico refrigerar', [
    ['arroz', '1 taza de arroz', 'p'],
    ['canela', '1 raja de canela', 'p'],
    ['azucar', '1/2 taza de azúcar', 'p'],
    ['leche', '1 taza de leche', 'o'],
  ], [
    'Remoja el arroz con la canela en 2 tazas de agua caliente durante 2 horas, o toda la noche.',
    'Licúa todo muy bien y cuela.',
    'Agrega 6 tazas de agua fría, el azúcar y la leche si quieres.',
    'Sirve muy fría, con hielo.',
  ]),

  R('agua-tamarindo', 'Agua de tamarindo', 'DA', 'e', 25, 6, 'economico refrigerar', [
    ['tamarindo', '10 vainas de tamarindo o 100 g de pulpa', 'p'],
    ['azucar|piloncillo', '1/2 taza de azúcar o piloncillo', 'p'],
  ], [
    'Hierve el tamarindo en 2 tazas de agua 15 minutos, hasta que se ablande.',
    'Retira las cáscaras, deshaz la pulpa con las manos para soltarla de las semillas y quita las semillas.',
    'Cuela, agrega el azúcar y 5 tazas de agua fría.',
    'Sirve con hielo.',
  ]),

  R('ponche-frutas', 'Ponche de frutas', 'DA', 'e', 60, 8, 'caliente tradicional navidad fiesta guadalupe', [
    ['manzana', '3 manzanas en trozos', 'p'],
    ['fruta|naranja|cana', 'guayaba, tejocote, ciruela pasa y caña picada', 'p'],
    ['canela', '2 rajas de canela', 'p'],
    ['piloncillo|azucar', '200 g de piloncillo o azúcar', 'p'],
    ['jamaica', 'un puño de jamaica', 'o'],
    ['pasas', 'pasas', 'o'],
  ], [
    'Hierve 3 litros de agua con la canela y el piloncillo hasta que se disuelva.',
    'Agrega la fruta, la caña y la jamaica.',
    'Cocina a fuego bajo 40 minutos, hasta que la fruta esté suave y el aroma llene la casa.',
    'Sirve caliente con un poco de fruta en cada vaso.',
  ], 'Es la bebida de las posadas: se hace en olla grande para compartir.'),

  /* ───────── postres ───────── */

  R('fresas-crema', 'Fresas con crema', 'D', 'pb', 10, 3, 'rapido amor nino', [
    ['fruta|platano|mango|manzana', '1/2 kg de fresas (o la fruta de temporada que prefieras)', 'p'],
    ['crema', '1 taza de crema', 'p'],
    ['leche_condensada|azucar', '4 cucharadas de leche condensada o azúcar', 'p'],
    ['galleta', 'galleta molida para decorar', 'o'],
  ], [
    'Lava las fresas con agua y desinféctalas; quítales el rabito y pártelas en trozos.',
    'Mezcla la crema con la leche condensada o el azúcar hasta que quede uniforme.',
    'Sirve las fresas en vasitos o platos y cúbrelas con la crema.',
    'Decora con galleta molida y sirve frío.',
  ]),

  R('flan-casero', 'Flan casero', 'D', 'p', 70, 8, 'refrigerar madre fiesta', [
    ['huevo', '5 huevos', 'p'],
    ['leche_condensada|azucar', '1 lata de leche condensada', 'p'],
    ['leche', '1 lata (o 1 1/2 tazas) de leche', 'p'],
    ['azucar', '1/2 taza de azúcar para el caramelo', 'p'],
  ], [
    'Derrite el azúcar en una flanera a fuego bajo hasta formar un caramelo dorado y cubre el fondo.',
    'Licúa los huevos con la leche condensada y la leche; cuela y vierte sobre el caramelo.',
    'Tapa la flanera y cuécela a baño María 50 minutos, hasta que al meter un palillo salga limpio.',
    'Deja enfriar y refrigera mínimo 4 horas antes de desmoldar.',
  ]),

  R('platanos-crema', 'Plátanos con crema, miel y canela', 'D', 'p', 10, 2, 'rapido economico', [
    ['platano', '2 plátanos maduros', 'p'],
    ['crema', '1/2 taza de crema', 'p'],
    ['miel|leche_condensada|azucar', '2 cucharadas de miel o leche condensada', 'p'],
    ['canela', 'canela en polvo', 'o'],
    ['cacahuate|pasas', 'cacahuate o pasas', 'o'],
  ], [
    'Corta los plátanos en rodajas o a lo largo.',
    'Acomódalos en un plato y báñalos con la crema y la miel.',
    'Espolvorea canela y cacahuate o pasas.',
  ]),

  R('manzanas-canela', 'Manzanas con canela en sartén', 'D', 'p', 25, 3, 'caliente economico', [
    ['manzana', '3 manzanas en gajos', 'p'],
    ['canela', '1 raja de canela', 'p'],
    ['azucar|piloncillo|miel', '3 cucharadas de azúcar, piloncillo o miel', 'p'],
    ['mantequilla', '1 cucharada de mantequilla', 'o'],
    ['pasas', 'pasas', 'o'],
  ], [
    'Derrite la mantequilla en una sartén a fuego medio.',
    'Agrega las manzanas, la canela y el azúcar con 1/4 de taza de agua.',
    'Tapa y cocina 15 minutos moviendo a ratos, hasta que estén suaves y con almíbar.',
    'Sirve tibias, solas o con un poco de crema.',
  ]),

  R('gelatina-fruta', 'Gelatina con fruta', 'DA', 'pb', 20, 6, 'refrigerar economico nino', [
    ['gelatina', '1 sobre de gelatina', 'p'],
    ['fruta|manzana|platano|naranja|mango', '1 taza de fruta picada', 'o'],
  ], [
    'Disuelve la gelatina en 1 taza de agua hirviendo, mezclando 2 minutos.',
    'Agrega 1 taza de agua fría y vierte en un molde o en vasitos.',
    'Cuando empiece a cuajar (unos 30 minutos en el refrigerador) agrega la fruta.',
    'Refrigera al menos 3 horas antes de servir.',
  ]),
];
