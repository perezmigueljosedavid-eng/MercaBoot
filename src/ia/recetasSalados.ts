import { R, Receta } from './recetaUtil';

/** Recetas saladas. Los ingredientes se buscan entre los productos que suben los negocios. */
export const RECETAS_SALADAS: Receta[] = [
  R('tostadas-pollo', 'Tostadas de pollo', 'S', 'cn', 25, 4, 'economico independencia fiesta', [
    ['pollo', '300 g de pechuga o pierna de pollo', 'p'],
    ['tostada', '8 tostadas', 'p'],
    ['lechuga', '1/4 de lechuga o col picada', 'o'],
    ['crema', '1/2 taza de crema', 'o'],
    ['queso|quesillo', 'queso fresco desmoronado', 'o'],
    ['jitomate|aguacate', '1 jitomate o 1 aguacate en rebanadas', 'o'],
    ['salsa|chile_fresco', 'salsa al gusto', 'o'],
  ], [
    'Cuece el pollo en agua con sal, un trozo de cebolla y ajo durante 20 minutos, hasta que ya no esté rosado por dentro. Déjalo enfriar y deshébralo.',
    'Unta cada tostada con un poco de crema.',
    'Pon encima el pollo, la lechuga, el jitomate o aguacate y el queso.',
    'Termina con salsa al gusto y sirve de inmediato para que la tostada no se ablande.',
  ]),

  R('quesadillas-quesillo', 'Quesadillas de quesillo', 'S', 'dcnb', 10, 3, 'economico oaxaca nino clases', [
    ['tortilla', '6 tortillas de maíz', 'p'],
    ['quesillo|queso', '200 g de quesillo deshebrado', 'p'],
    ['salsa|chile_fresco', 'salsa o rajas de chile', 'o'],
  ], [
    'Calienta un comal o sartén a fuego medio.',
    'Pon una tortilla, agrega el quesillo en una mitad y dóblala.',
    'Dora 2 minutos por lado, hasta que el queso se derrita.',
    'Sirve calientes, con salsa.',
  ], 'Si las tortillas están duras, caliéntalas 20 segundos antes para que no se rompan al doblarlas.'),

  R('tlayuda-tasajo', 'Tlayuda con frijol, quesillo y tasajo', 'SP', 'cn', 25, 2, 'oaxaca padre fiesta', [
    ['tlayuda', '2 tlayudas', 'p'],
    ['frijol', '1 taza de frijoles cocidos y molidos', 'p'],
    ['quesillo|queso', '200 g de quesillo', 'p'],
    ['tasajo|chorizo|cerdo', '250 g de tasajo, cecina o chorizo', 'p'],
    ['manteca|aceite', 'asiento o manteca para untar', 'o'],
    ['aguacate', '1 aguacate', 'o'],
    ['jitomate|lechuga', 'jitomate o lechuga', 'o'],
    ['salsa|chile_fresco', 'salsa al gusto', 'o'],
  ], [
    'Dora la carne (tasajo, cecina o chorizo) en un sartén sin mucho aceite, hasta que esté bien cocida.',
    'Unta la tlayuda con asiento o manteca y luego con una capa de frijoles molidos.',
    'Reparte el quesillo deshebrado y la carne encima.',
    'Calienta en un comal o sartén grande, tapada y a fuego medio, de 5 a 7 minutos, hasta que el quesillo se derrita y la orilla quede crujiente.',
    'Agrega aguacate, jitomate y salsa, y dobla por la mitad.',
  ]),

  R('memelas-frijol', 'Memelas con frijol y quesillo', 'S', 'dn', 15, 3, 'economico oaxaca', [
    ['memela|masa', '6 memelas (o 400 g de masa para formarlas)', 'p'],
    ['frijol', '1 taza de frijoles molidos', 'p'],
    ['quesillo|queso', '150 g de quesillo', 'p'],
    ['manteca|aceite', 'manteca o asiento', 'o'],
    ['salsa|chile_fresco', 'salsa al gusto', 'o'],
  ], [
    'Si usas masa, forma óvalos gruesos de 1 cm y cuécelos en un comal caliente 3 minutos por lado.',
    'Unta con manteca y cubre con una capa de frijol caliente.',
    'Agrega el quesillo y deja 1 minuto para que se derrita.',
    'Sirve con salsa.',
  ]),

  R('huevos-mexicana', 'Huevos a la mexicana', 'SP', 'd', 15, 2, 'economico', [
    ['huevo', '4 huevos', 'p'],
    ['jitomate', '2 jitomates picados', 'p'],
    ['cebolla', '1/4 de cebolla picada', 'p'],
    ['chile_fresco', '1 chile serrano o jalapeño picado', 'p'],
    ['aceite', 'un poco de aceite', 'o'],
  ], [
    'Sofríe en aceite la cebolla y el chile durante 2 minutos.',
    'Agrega el jitomate y cocina 3 minutos, hasta que suelte su jugo.',
    'Bate los huevos con sal, viértelos y revuelve despacio hasta que cuajen.',
    'Sirve con tortillas calientes y frijoles.',
  ]),

  R('huevos-chorizo', 'Huevos con chorizo', 'SP', 'd', 12, 2, 'economico', [
    ['huevo', '4 huevos', 'p'],
    ['chorizo', '100 g de chorizo', 'p'],
    ['tortilla', 'tortillas calientes', 'o'],
    ['frijol', 'frijoles', 'o'],
  ], [
    'Quita la tripa al chorizo y fríelo deshaciéndolo en un sartén unos 4 minutos; suelta su propia grasa.',
    'Agrega los huevos batidos y revuelve hasta que cuajen.',
    'Sirve con tortillas calientes.',
  ]),

  R('chilaquiles-verdes', 'Chilaquiles verdes', 'SAP', 'dc', 25, 3, '', [
    ['tostada|tortilla', '10 tostadas o tortillas cortadas y fritas', 'p'],
    ['tomate_verde', '6 tomates verdes', 'p'],
    ['chile_fresco', '2 chiles serranos', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['cilantro', 'un poco de cilantro', 'o'],
    ['crema', 'crema para servir', 'o'],
    ['queso|quesillo', 'queso fresco desmoronado', 'o'],
    ['pollo', 'pollo deshebrado', 'o'],
  ], [
    'Hierve los tomates y los chiles 8 minutos y licúalos con la cebolla, el cilantro y sal.',
    'Sofríe la salsa en un sartén unos 5 minutos.',
    'Agrega las tostadas y mueve 1 minuto, para que se bañen sin deshacerse.',
    'Sirve de inmediato con crema, queso y pollo.',
  ]),

  R('enfrijoladas', 'Enfrijoladas', 'S', 'dn', 20, 3, 'economico', [
    ['tortilla', '8 tortillas de maíz', 'p'],
    ['frijol', '2 tazas de frijoles cocidos con su caldo', 'p'],
    ['queso|quesillo', '150 g de queso', 'p'],
    ['crema', 'crema para servir', 'o'],
    ['cebolla', 'cebolla picada', 'o'],
  ], [
    'Licúa los frijoles con un poco de su caldo y caliéntalos 5 minutos en un sartén, hasta que espesen.',
    'Pasa cada tortilla por un poco de aceite caliente, 5 segundos por lado.',
    'Báñalas en el frijol, rellénalas con queso y dóblalas.',
    'Sirve con crema y cebolla picada.',
  ]),

  R('entomatadas', 'Entomatadas', 'S', 'cn', 30, 3, '', [
    ['tortilla', '9 tortillas de maíz', 'p'],
    ['jitomate', '4 jitomates', 'p'],
    ['queso|quesillo', '200 g de queso', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
    ['crema', 'crema para servir', 'o'],
  ], [
    'Cuece los jitomates y licúalos con la cebolla, el ajo y sal.',
    'Fríe la salsa unos 8 minutos, hasta que espese un poco.',
    'Pasa las tortillas por la salsa caliente, rellénalas con queso y dóblalas.',
    'Báñalas con más salsa y sirve con crema.',
  ]),

  R('caldo-pollo', 'Caldo de pollo con verduras', 'S', 'cn', 55, 4, 'caliente', [
    ['pollo', '4 piezas de pollo (pierna y muslo)', 'p'],
    ['zanahoria', '2 zanahorias', 'p'],
    ['papa', '2 papas', 'p'],
    ['calabacita|chayote', '2 calabacitas o chayotes', 'p'],
    ['cebolla', '1/2 cebolla', 'o'],
    ['cilantro|hierbas', 'cilantro o hierbabuena', 'o'],
    ['limon', 'limones para servir', 'o'],
  ], [
    'Hierve 2 litros de agua con el pollo, la cebolla y sal; retira la espuma.',
    'A los 20 minutos agrega la zanahoria y la papa en trozos.',
    'Diez minutos después agrega las calabacitas y cocina otros 10 minutos, hasta que todo esté suave.',
    'Sirve con cilantro, limón y tortillas calientes.',
  ]),

  R('sopa-pasta', 'Sopa de pasta', 'S', 'c', 20, 4, 'economico caliente', [
    ['pasta', '200 g de pasta para sopa', 'p'],
    ['jitomate|pure_tomate', '3 jitomates licuados', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
    ['caldo_polvo|pollo', 'caldo de pollo', 'o'],
    ['crema|queso', 'crema o queso para servir', 'o'],
  ], [
    'Dora la pasta en un poco de aceite hasta que tome color.',
    'Licúa el jitomate con la cebolla y el ajo, agrégalo y deja que se reduzca un poco.',
    'Añade 3 tazas de agua o caldo y sal; cocina tapada 12 minutos.',
    'Sirve caliente, con crema o queso.',
  ]),

  R('arroz-rojo', 'Arroz rojo', 'S', 'c', 30, 4, 'economico', [
    ['arroz', '1 taza de arroz', 'p'],
    ['jitomate|pure_tomate', '2 jitomates', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
    ['zanahoria|ejote', 'zanahoria y chícharos', 'o'],
  ], [
    'Enjuaga el arroz y fríelo en aceite hasta que se vea opaco.',
    'Licúa el jitomate con la cebolla y el ajo, agrégalo y fríe 3 minutos.',
    'Añade 2 tazas de agua o caldo y sal; al hervir baja el fuego, tapa y cocina 18 minutos sin destapar.',
    'Deja reposar 5 minutos y esponja con un tenedor.',
  ]),

  R('frijoles-olla', 'Frijoles de la olla', 'S', 'cn', 120, 6, 'economico', [
    ['frijol', '500 g de frijol', 'p'],
    ['cebolla', '1/2 cebolla', 'o'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['hierbas', 'una rama de epazote', 'o'],
  ], [
    'Lava el frijol y retira piedritas o granos feos.',
    'Cúbrelo con 2.5 litros de agua con la cebolla y el ajo; cuece a fuego bajo de 1.5 a 2 horas (en olla exprés, unos 40 minutos), sin dejar que se seque.',
    'Cuando esté suave, agrega sal y el epazote, y deja 10 minutos más.',
  ], 'No le pongas sal al inicio: el frijol tarda más en ablandar.'),

  R('bistec-encebollado', 'Bistec encebollado', 'S', 'c', 25, 3, '', [
    ['res', '500 g de bistec', 'p'],
    ['cebolla', '1 cebolla en pluma', 'p'],
    ['jitomate', '2 jitomates', 'o'],
    ['chile_fresco', '1 chile serrano', 'o'],
    ['aceite', 'un poco de aceite', 'o'],
  ], [
    'Sazona el bistec con sal y pimienta.',
    'Séllalo en un sartén muy caliente con un poco de aceite, 2 minutos por lado; retíralo.',
    'En el mismo sartén sofríe la cebolla, el jitomate y el chile unos 5 minutos.',
    'Regresa la carne y cocina 5 minutos más. Sirve con arroz o tortillas.',
  ]),

  R('tacos-bistec', 'Tacos de bistec', 'S', 'cn', 20, 4, 'rapido', [
    ['res', '400 g de bistec en tiras', 'p'],
    ['tortilla', '12 tortillas de maíz', 'p'],
    ['cebolla|cilantro', 'cebolla y cilantro picados', 'p'],
    ['limon', '2 limones', 'p'],
    ['salsa|chile_fresco', 'salsa al gusto', 'o'],
  ], [
    'Corta la carne en tiras finas y sazona con sal.',
    'Dórala en un sartén bien caliente de 6 a 8 minutos, moviendo.',
    'Calienta las tortillas y arma los tacos.',
    'Sirve con cebolla, cilantro, limón y salsa.',
  ]),

  R('tasajo-guacamole', 'Tasajo o cecina con guacamole', 'SA', 'cn', 20, 3, 'oaxaca padre', [
    ['tasajo', '400 g de tasajo o cecina', 'p'],
    ['aguacate', '2 aguacates', 'p'],
    ['limon', '1 limón', 'p'],
    ['tortilla', '8 tortillas de maíz', 'p'],
    ['cebolla|cilantro', 'cebolla y cilantro picados', 'o'],
    ['chile_fresco', 'chile picado', 'o'],
  ], [
    'Dora el tasajo en un comal o sartén caliente, 3 minutos por lado.',
    'Machaca los aguacates con limón, sal, cebolla y cilantro picados.',
    'Sirve la carne con el guacamole y tortillas calientes.',
  ]),

  R('chuletas-salsa-verde', 'Chuletas de cerdo en salsa verde', 'SA', 'c', 40, 4, 'padre', [
    ['cerdo', '6 chuletas de cerdo', 'p'],
    ['tomate_verde', '8 tomates verdes', 'p'],
    ['chile_fresco', '2 chiles serranos', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
    ['cilantro', 'un poco de cilantro', 'o'],
  ], [
    'Cuece los tomates y los chiles 8 minutos; licúalos con la cebolla, el ajo, el cilantro y sal.',
    'Sazona las chuletas y dóralas en un sartén 4 minutos por lado.',
    'Vierte la salsa, tapa y cocina a fuego bajo 20 minutos, hasta que la carne esté bien cocida y suave.',
    'Sirve con arroz y tortillas.',
  ]),

  R('pollo-mole', 'Pollo con mole', 'SDP', 'c', 50, 4, 'oaxaca muertos madre fiesta', [
    ['pollo', '4 piezas de pollo', 'p'],
    ['mole', '200 g de pasta de mole', 'p'],
    ['arroz', 'arroz blanco para acompañar', 'o'],
    ['tortilla', 'tortillas calientes', 'o'],
    ['ajonjoli', 'ajonjolí para decorar', 'o'],
  ], [
    'Cuece el pollo con cebolla, ajo y sal durante 30 minutos; guarda el caldo.',
    'Disuelve el mole en 3 tazas del caldo caliente, moviendo hasta que no queden grumos.',
    'Hierve el mole a fuego bajo 15 minutos, moviendo seguido, hasta que espese.',
    'Agrega el pollo y calienta 5 minutos. Sirve con arroz, tortillas y ajonjolí.',
  ]),

  R('milanesas', 'Milanesas con ensalada', 'S', 'c', 30, 3, '', [
    ['res|pollo', '500 g de milanesas de res o pollo', 'p'],
    ['huevo', '2 huevos', 'p'],
    ['pan_molido|harina', 'pan molido o harina', 'p'],
    ['aceite', 'aceite para freír', 'o'],
    ['lechuga|jitomate|aguacate', 'lechuga, jitomate o aguacate para la ensalada', 'o'],
    ['limon', 'limón', 'o'],
  ], [
    'Bate los huevos con sal.',
    'Pasa cada milanesa por el huevo y luego por el pan molido, presionando para que se pegue.',
    'Fríelas en aceite caliente 3 o 4 minutos por lado, hasta que doren y estén bien cocidas.',
    'Escurre en papel y sirve con ensalada y limón.',
  ]),

  R('tortas-quesillo-aguacate', 'Tortas de quesillo y aguacate', 'S', 'cnb', 10, 2, 'rapido economico clases', [
    ['bolillo', '2 bolillos o teleras', 'p'],
    ['quesillo|queso|jamon', '100 g de quesillo, queso o jamón', 'p'],
    ['aguacate', '1 aguacate', 'p'],
    ['jitomate', '1 jitomate', 'o'],
    ['frijol', 'frijoles refritos', 'o'],
    ['salsa|chile_fresco', 'salsa al gusto', 'o'],
  ], [
    'Abre los bolillos y tuéstalos por dentro 1 minuto en un sartén.',
    'Unta los frijoles y el aguacate machacado.',
    'Agrega el queso o jamón, el jitomate y la salsa.',
    'Cierra y sirve.',
  ]),

  R('molletes', 'Molletes', 'S', 'dn', 15, 3, 'economico rapido clases', [
    ['bolillo|pan_caja', '3 bolillos partidos por la mitad', 'p'],
    ['frijol', '1 taza de frijoles refritos', 'p'],
    ['quesillo|queso', '150 g de queso', 'p'],
    ['jitomate|cebolla|chile_fresco', 'jitomate, cebolla y chile para el pico de gallo', 'o'],
  ], [
    'Tuesta el pan en un sartén o en el horno.',
    'Unta los frijoles y cubre con el queso.',
    'Gratina en el horno, o tapados en un sartén, hasta que el queso se derrita (unos 5 minutos).',
    'Sirve con pico de gallo.',
  ]),

  R('caldo-res', 'Caldo de res con verduras', 'S', 'c', 100, 5, 'caliente', [
    ['res', '600 g de carne de res para caldo (costilla o retazo)', 'p'],
    ['papa', '2 papas', 'p'],
    ['zanahoria', '2 zanahorias', 'p'],
    ['calabacita|chayote', '2 calabacitas', 'p'],
    ['elote', '2 elotes en trozos', 'o'],
    ['cebolla', '1/2 cebolla', 'o'],
    ['cilantro', 'cilantro', 'o'],
    ['limon', 'limones para servir', 'o'],
  ], [
    'Cubre la carne con 3 litros de agua con cebolla, ajo y sal; hierve de 60 a 70 minutos, quitando la espuma.',
    'Agrega la zanahoria, el elote y la papa, y cocina 15 minutos.',
    'Añade las calabacitas y cocina 10 minutos más.',
    'Sirve con cilantro y limón.',
  ]),

  R('pescado-ajo-limon', 'Pescado a la plancha con ajo y limón', 'SA', 'c', 20, 2, 'semana-santa', [
    ['pescado', '2 filetes de pescado o 2 mojarras limpias', 'p'],
    ['ajo', '4 dientes de ajo', 'p'],
    ['limon', '2 limones', 'p'],
    ['mantequilla|aceite', 'mantequilla o aceite', 'o'],
    ['lechuga|jitomate', 'ensalada para acompañar', 'o'],
  ], [
    'Sazona el pescado con sal, pimienta y jugo de limón; déjalo reposar 10 minutos.',
    'Dora los ajos en láminas con mantequilla y retíralos.',
    'Cocina el pescado de 4 a 5 minutos por lado, hasta que se separe fácilmente con un tenedor.',
    'Sirve con los ajos dorados y más limón.',
  ]),

  R('camarones-ajillo', 'Camarones al ajillo', 'SP', 'cn', 15, 2, 'rapido amor semana-santa', [
    ['camaron', '300 g de camarón limpio', 'p'],
    ['ajo', '5 dientes de ajo', 'p'],
    ['chile_seco', '2 chiles guajillo en aros', 'o'],
    ['mantequilla|aceite', 'mantequilla o aceite', 'o'],
    ['limon', 'limón', 'o'],
  ], [
    'Calienta mantequilla o aceite y dora el ajo y el chile 1 minuto.',
    'Agrega los camarones con sal y cocina de 2 a 3 minutos por lado, hasta que se vean rosados y firmes.',
    'Exprime limón y sirve con arroz o tortillas.',
  ]),

  R('tostadas-atun', 'Tostadas de atún', 'SA', 'cn', 10, 3, 'rapido economico semana-santa', [
    ['atun', '1 lata grande de atún', 'p'],
    ['tostada', '6 tostadas', 'p'],
    ['jitomate', '1 jitomate', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['limon', '2 limones', 'p'],
    ['aguacate', '1 aguacate', 'o'],
    ['salsa|chile_fresco|mayonesa', 'salsa o mayonesa al gusto', 'o'],
  ], [
    'Escurre el atún y mézclalo con el jitomate y la cebolla picados, jugo de limón y sal.',
    'Sirve sobre las tostadas.',
    'Agrega aguacate y salsa al gusto.',
  ]),

  R('ensalada-nopales', 'Ensalada de nopales', 'SA', 'cb', 25, 4, 'economico semana-santa', [
    ['nopal', '4 nopales limpios', 'p'],
    ['jitomate', '2 jitomates', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['cilantro', 'cilantro', 'o'],
    ['limon', '2 limones', 'p'],
    ['queso', 'queso fresco desmoronado', 'o'],
  ], [
    'Corta los nopales en cubos y cuécelos 10 minutos con sal; escúrrelos y enjuágalos para quitar la baba.',
    'Mézclalos con el jitomate, la cebolla y el cilantro picados.',
    'Agrega limón, sal y el queso desmoronado.',
  ]),

  R('calabacitas-elote', 'Calabacitas con elote y queso', 'S', 'c', 25, 4, 'economico', [
    ['calabacita', '4 calabacitas en cubos', 'p'],
    ['elote', '2 elotes desgranados', 'p'],
    ['jitomate', '2 jitomates', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['queso|quesillo', '100 g de queso', 'p'],
    ['crema', 'crema para servir', 'o'],
  ], [
    'Sofríe la cebolla en un poco de aceite.',
    'Agrega el jitomate y cocina 3 minutos.',
    'Añade la calabacita y el elote con sal; tapa y cocina 12 minutos a fuego bajo, moviendo de vez en cuando.',
    'Agrega el queso y tapa hasta que se derrita.',
  ]),

  R('quesadillas-flor-calabaza', 'Quesadillas de flor de calabaza', 'S', 'cn', 20, 3, 'oaxaca', [
    ['tortilla|masa', '8 tortillas de maíz', 'p'],
    ['flor_calabaza', '1 manojo de flores de calabaza', 'p'],
    ['quesillo|queso', '200 g de quesillo', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['hierbas', 'epazote', 'o'],
    ['chile_fresco', '1 chile picado', 'o'],
  ], [
    'Limpia las flores y pícalas.',
    'Sofríe la cebolla (y el chile) 2 minutos, agrega la flor con sal y cocina 5 minutos.',
    'Rellena las tortillas con quesillo y la flor.',
    'Dóralas en el comal 2 minutos por lado.',
  ]),

  R('guacamole-totopos', 'Guacamole con totopos', 'SAP', 'b', 10, 4, 'rapido independencia fiesta', [
    ['aguacate', '3 aguacates maduros', 'p'],
    ['tostada', 'totopos o tostadas', 'p'],
    ['limon', '1 limón', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['cilantro', 'cilantro', 'o'],
    ['chile_fresco', 'chile serrano', 'o'],
  ], [
    'Machaca los aguacates con un tenedor, dejando trocitos.',
    'Agrega la cebolla, el cilantro y el chile picados, el jugo de limón y sal.',
    'Sirve de inmediato con los totopos.',
  ]),

  R('papas-chorizo', 'Papas con chorizo', 'SP', 'cn', 25, 3, 'economico', [
    ['papa', '4 papas en cubos', 'p'],
    ['chorizo', '150 g de chorizo', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['tortilla', 'tortillas para hacer tacos', 'o'],
  ], [
    'Cuece las papas 8 minutos en agua con sal y escúrrelas.',
    'Fríe el chorizo hasta que suelte su grasa (unos 4 minutos).',
    'Agrega la papa y la cebolla y dora 8 minutos.',
    'Sirve en tacos.',
  ]),

  R('tinga-pollo', 'Tinga de pollo', 'SP', 'cn', 40, 4, '', [
    ['pollo', '400 g de pechuga de pollo', 'p'],
    ['jitomate', '3 jitomates', 'p'],
    ['cebolla', '1 cebolla', 'p'],
    ['chipotle', '2 chiles chipotle en adobo', 'p'],
    ['tostada|tortilla', 'tostadas o tortillas', 'p'],
    ['crema', 'crema', 'o'],
    ['lechuga', 'lechuga', 'o'],
  ], [
    'Cuece y deshebra el pollo.',
    'Licúa el jitomate con un cuarto de la cebolla y los chipotles. Sofríe el resto de la cebolla en pluma, agrega la salsa y cocina 8 minutos.',
    'Añade el pollo y cocina 10 minutos más.',
    'Sirve sobre tostadas con crema y lechuga.',
  ]),

  R('tacos-dorados-papa', 'Tacos dorados de papa', 'S', 'cn', 30, 4, 'economico', [
    ['tortilla', '12 tortillas de maíz', 'p'],
    ['papa', '4 papas cocidas', 'p'],
    ['aceite', 'aceite para freír', 'o'],
    ['queso', 'queso fresco', 'o'],
    ['crema', 'crema', 'o'],
    ['lechuga', 'lechuga', 'o'],
  ], [
    'Machaca las papas cocidas con sal y pimienta.',
    'Rellena las tortillas calientes y enróllalas.',
    'Fríelas en aceite caliente hasta que doren.',
    'Escurre y sirve con lechuga, crema y queso.',
  ]),

  R('sopes-frijol-queso', 'Sopes de frijol con queso', 'S', 'cn', 40, 4, 'economico', [
    ['sope|masa', '8 sopes (o 400 g de masa para formarlos)', 'p'],
    ['frijol', '1 taza de frijoles molidos', 'p'],
    ['queso|quesillo', '150 g de queso', 'p'],
    ['lechuga', 'lechuga picada', 'o'],
    ['crema', 'crema', 'o'],
    ['salsa|chile_fresco', 'salsa', 'o'],
  ], [
    'Si usas masa, forma discos de 8 cm con la orilla levantada y cuécelos en comal 3 minutos por lado.',
    'Unta manteca o aceite y los frijoles calientes.',
    'Agrega lechuga, queso, crema y salsa.',
  ]),

  R('chicharron-salsa-verde', 'Chicharrón en salsa verde', 'SAP', 'c', 25, 3, 'economico', [
    ['chicharron', '250 g de chicharrón', 'p'],
    ['tomate_verde', '6 tomates verdes', 'p'],
    ['chile_fresco', '2 chiles serranos', 'p'],
    ['tortilla', 'tortillas calientes', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['cilantro', 'cilantro', 'o'],
  ], [
    'Hierve los tomates y los chiles; licúalos con la cebolla, el cilantro y sal.',
    'Sofríe la salsa 5 minutos y agrega un poco de agua si espesa mucho.',
    'Añade el chicharrón en trozos y hierve 8 minutos.',
    'Sirve en tacos.',
  ]),

  R('esquites', 'Esquites', 'SAP', 'b', 20, 4, 'economico independencia', [
    ['elote', '4 elotes desgranados', 'p'],
    ['mayonesa', '3 cucharadas de mayonesa', 'p'],
    ['queso', '1/2 taza de queso desmoronado', 'p'],
    ['limon', 'limón', 'p'],
    ['chile_polvo|salsa', 'chile en polvo o salsa', 'o'],
    ['hierbas', 'una rama de epazote', 'o'],
  ], [
    'Hierve los granos de elote 12 minutos con sal (y el epazote).',
    'Sirve en vasos con un poco de su caldo.',
    'Agrega mayonesa, queso, jugo de limón y chile al gusto.',
  ]),

  R('elote-cocido', 'Elote cocido con mayonesa, queso y chile', 'SAP', 'b', 25, 4, 'economico independencia', [
    ['elote', '4 elotes', 'p'],
    ['mayonesa', 'mayonesa', 'p'],
    ['queso', 'queso fresco desmoronado', 'p'],
    ['limon', 'limón', 'o'],
    ['chile_polvo|salsa', 'chile en polvo o salsa', 'o'],
  ], [
    'Hierve los elotes de 20 a 25 minutos con sal.',
    'Unta mayonesa, espolvorea el queso y el chile, y agrega limón.',
  ]),
];
