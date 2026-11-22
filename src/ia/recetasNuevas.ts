import { R, Receta } from './recetaUtil';

/**
 * Recetas que se agregaron en la versión 2 para que el asistente responda cuando la persona escribe el nombre de un platillo
 * («galletas», «pastel», «lasaña», «pizza», «tamales», «pan de muerto»…): horneados, antojitos, sopas, platos fuertes,
 * salsas y bebidas. Los ingredientes se ligan a los productos que suben los negocios.
 *
 * Todas las recetas con carne, pollo, pescado o huevo dicen cómo saber que ya están bien cocidas.
 * Autor: José David Pérez Miguel
 */
export const RECETAS_NUEVAS: Receta[] = [
  /* ───────── galletas, pasteles y postres de horno ───────── */

  R('galletas-mantequilla', 'Galletas de mantequilla', 'D', 'bp', 35, 24, 'horno', [
    ['mantequilla', '200 g de mantequilla suave', 'p'],
    ['azucar', '1/2 taza de azúcar', 'p'],
    ['harina', '300 g de harina de trigo (unas 2 1/2 tazas)', 'p'],
    ['huevo', '1 yema de huevo', 'p'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
    ['sal', 'una pizca de sal', 'o'],
  ], [
    'Calienta el horno a 180 °C. Cubre una charola con papel encerado o engrásala ligeramente.',
    'Bate la mantequilla con el azúcar hasta que quede cremosa y clarita, unos 3 minutos.',
    'Agrega la yema, la vainilla y la sal y mezcla bien.',
    'Añade la harina poco a poco y amasa lo mínimo, solo hasta que se junte. Si queda muy blanda, refrigérala 20 minutos.',
    'Forma bolitas, aplástalas un poco o estira la masa y corta con un cortador. Ponlas separadas en la charola.',
    'Hornea de 12 a 15 minutos, hasta que los bordes estén dorados. Déjalas enfriar en la charola 5 minutos antes de moverlas: al enfriarse se endurecen.',
  ], 'Guárdalas en un frasco o bote bien cerrado: duran una semana.'),

  R('galletas-avena', 'Galletas de avena con pasas', 'D', 'bpd', 35, 20, 'horno economico', [
    ['avena', '2 tazas de avena en hojuelas', 'p'],
    ['mantequilla', '100 g de mantequilla', 'p'],
    ['azucar', '1/2 taza de azúcar (mejor morena)', 'p'],
    ['huevo', '1 huevo', 'p'],
    ['harina', '1/2 taza de harina', 'p'],
    ['polvo_hornear', '1/2 cucharadita de polvo para hornear', 'o'],
    ['pasas', '1/2 taza de pasas', 'o'],
    ['canela', '1 cucharadita de canela molida', 'o'],
  ], [
    'Calienta el horno a 180 °C y engrasa una charola.',
    'Bate la mantequilla con el azúcar hasta que esté cremosa; agrega el huevo y mezcla.',
    'Revuelve aparte la harina, el polvo para hornear, la canela y la avena, y agrégalos a la mezcla de mantequilla. Incorpora las pasas.',
    'Con una cuchara forma montoncitos, ponlos separados y aplástalos con el dorso de la cuchara.',
    'Hornea de 12 a 14 minutos hasta que doren. Déjalas enfriar antes de despegarlas.',
  ], 'Con plátano machacado en lugar de la mitad de la mantequilla quedan más suaves.'),

  R('galletas-chispas', 'Galletas con chispas de chocolate', 'D', 'bp', 35, 24, 'horno nino', [
    ['mantequilla', '150 g de mantequilla suave', 'p'],
    ['azucar', '3/4 de taza de azúcar', 'p'],
    ['huevo', '1 huevo', 'p'],
    ['harina', '2 tazas de harina', 'p'],
    ['chocolate', '1 taza de chispas o trozos de chocolate', 'p'],
    ['polvo_hornear', '1/2 cucharadita de polvo para hornear', 'o'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
  ], [
    'Calienta el horno a 180 °C y cubre una charola con papel o engrásala.',
    'Bate la mantequilla con el azúcar hasta que esté cremosa. Agrega el huevo y la vainilla.',
    'Mezcla la harina con el polvo para hornear y agrégala sin batir de más. Incorpora las chispas de chocolate.',
    'Pon cucharadas de masa en la charola con espacio entre ellas: se extienden al hornearse.',
    'Hornea de 10 a 12 minutos; deben verse doradas por fuera y un poco suaves al centro. Se endurecen al enfriarse.',
  ]),

  R('pastel-vainilla', 'Pastel de vainilla', 'D', 'p', 70, 10, 'horno fiesta', [
    ['harina', '2 tazas de harina', 'p'],
    ['azucar', '1 1/2 tazas de azúcar', 'p'],
    ['mantequilla', '1/2 taza de mantequilla suave', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['leche', '1 taza de leche', 'p'],
    ['polvo_hornear', '2 cucharaditas de polvo para hornear', 'p'],
    ['vainilla', '1 cucharada de vainilla', 'o'],
    ['azucar', '2 tazas de azúcar glass para el betún', 'o'],
  ], [
    'Calienta el horno a 180 °C. Engrasa y enharina un molde redondo de 22 cm.',
    'Bate la mantequilla con el azúcar hasta que esté cremosa. Agrega los huevos de uno en uno y la vainilla.',
    'Mezcla la harina con el polvo para hornear. Agrégala a la mezcla alternando con la leche, empezando y terminando con la harina.',
    'Vierte en el molde y hornea de 35 a 40 minutos, hasta que un palillo salga limpio del centro.',
    'Deja enfriar 10 minutos, desmolda y espera a que enfríe por completo antes de decorar.',
    'Para el betún bate 100 g de mantequilla con el azúcar glass y 2 cucharadas de leche; cubre el pastel ya frío.',
  ], 'Si no tienes horno, se puede hacer en una olla grande tapada a fuego muy bajo, con una rejilla al fondo, unos 50 minutos.'),

  R('pastel-chocolate', 'Pastel de chocolate', 'DM', 'p', 70, 10, 'horno fiesta', [
    ['harina', '2 tazas de harina', 'p'],
    ['azucar', '1 1/2 tazas de azúcar', 'p'],
    ['chocolate', '3/4 de taza de cocoa o chocolate en polvo', 'p'],
    ['huevo', '2 huevos', 'p'],
    ['leche', '1 taza de leche', 'p'],
    ['aceite', '1/2 taza de aceite', 'p'],
    ['polvo_hornear', '2 cucharaditas de polvo para hornear', 'p'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
    ['chocolate', '200 g de chocolate de barra para la cobertura', 'o'],
    ['crema', '1 taza de crema para la cobertura', 'o'],
  ], [
    'Calienta el horno a 180 °C. Engrasa y enharina un molde redondo de 22 cm.',
    'Mezcla en un tazón la harina, el azúcar, la cocoa y el polvo para hornear.',
    'En otro tazón bate los huevos con la leche, el aceite y la vainilla. Une las dos mezclas hasta que no queden grumos.',
    'Vierte en el molde y hornea de 35 a 40 minutos, hasta que un palillo salga limpio.',
    'Para la cobertura calienta la crema sin que hierva, apágala, agrega el chocolate picado y revuelve hasta que brille.',
    'Deja enfriar el pastel, desmolda y báñalo con la cobertura.',
  ], 'Una cucharada de café fuerte en la masa hace que el chocolate sepa más intenso.'),

  R('pastel-tres-leches', 'Pastel de tres leches', 'D', 'p', 90, 12, 'horno refrigerar fiesta', [
    ['huevo', '5 huevos', 'p'],
    ['azucar', '1 taza de azúcar', 'p'],
    ['harina', '1 taza de harina', 'p'],
    ['polvo_hornear', '1 cucharadita de polvo para hornear', 'p'],
    ['leche_condensada', '1 lata de leche condensada', 'p'],
    ['leche_evaporada', '1 lata de leche evaporada', 'p'],
    ['leche|crema', '1 taza de leche o de crema', 'p'],
    ['crema', '1 taza de crema para batir para cubrir', 'o'],
    ['canela', 'canela molida para decorar', 'o'],
    ['fruta', 'fresas o fruta para decorar', 'o'],
  ], [
    'Calienta el horno a 180 °C y engrasa un molde rectangular.',
    'Separa las yemas de las claras. Bate las claras a punto de nieve y agrega poco a poco 1/2 taza de azúcar.',
    'Bate las yemas con el resto del azúcar hasta que esponjen. Mezcla con las claras con movimientos suaves y agrega la harina con el polvo para hornear.',
    'Vierte en el molde y hornea de 30 a 35 minutos, hasta que un palillo salga limpio. Deja enfriar.',
    'Mezcla las tres leches. Pica el pastel con un tenedor por toda la superficie y báñalo poco a poco con la mezcla.',
    'Refrigera mínimo 4 horas. Cubre con la crema batida y decora con canela o fruta antes de servir.',
  ], 'Guárdalo siempre en el refrigerador y consúmelo en 3 días.'),

  R('brownies', 'Brownies de chocolate', 'DM', 'p', 45, 12, 'horno', [
    ['chocolate', '150 g de chocolate amargo o semiamargo', 'p'],
    ['mantequilla', '100 g de mantequilla', 'p'],
    ['azucar', '1 taza de azúcar', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['harina', '1/2 taza de harina', 'p'],
    ['cacahuate', '1/2 taza de nueces picadas', 'o'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
  ], [
    'Calienta el horno a 180 °C y engrasa un molde cuadrado de 20 cm.',
    'Derrite el chocolate con la mantequilla a baño María o en el microondas, en intervalos de 30 segundos, revolviendo.',
    'Retira del calor y mezcla con el azúcar. Agrega los huevos uno a uno y la vainilla.',
    'Incorpora la harina con movimientos suaves y, si quieres, las nueces.',
    'Vierte en el molde y hornea de 22 a 25 minutos: el centro debe quedar húmedo pero ya cuajado.',
    'Deja enfriar por completo antes de cortar en cuadros: así se cortan limpios.',
  ]),

  R('pay-limon', 'Pay de limón (sin horno)', 'DA', 'p', 40, 8, 'refrigerar fiesta madre', [
    ['galleta', '1 paquete de galletas Marías (unas 30)', 'p'],
    ['mantequilla', '80 g de mantequilla derretida', 'p'],
    ['leche_condensada', '1 lata de leche condensada', 'p'],
    ['limon', '1/2 taza de jugo de limón (unos 6 limones)', 'p'],
    ['crema', '1 taza de crema para batir o crema espesa', 'p'],
  ], [
    'Muele las galletas hasta hacerlas polvo y mézclalas con la mantequilla derretida.',
    'Presiona la mezcla en el fondo y los lados de un molde de 22 cm. Refrigera 15 minutos.',
    'Bate la crema con la leche condensada y agrega el jugo de limón poco a poco: se espesa solo.',
    'Vierte el relleno sobre la base y alisa.',
    'Refrigera mínimo 4 horas antes de servir. Adorna con ralladura de limón.',
  ], 'Se conserva refrigerado hasta 3 días.'),

  R('panque-vainilla', 'Panqué de vainilla', 'D', 'dp', 60, 8, 'horno economico', [
    ['harina', '2 tazas de harina', 'p'],
    ['azucar', '1 taza de azúcar', 'p'],
    ['mantequilla', '1/2 taza de mantequilla', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['leche', '1/2 taza de leche', 'p'],
    ['polvo_hornear', '2 cucharaditas de polvo para hornear', 'p'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
    ['naranja', 'ralladura de 1 naranja', 'o'],
  ], [
    'Calienta el horno a 180 °C y engrasa un molde para panqué.',
    'Bate la mantequilla con el azúcar hasta que quede cremosa. Agrega los huevos de uno en uno, la vainilla y la ralladura.',
    'Agrega la harina con el polvo para hornear alternando con la leche.',
    'Vierte en el molde y hornea de 40 a 45 minutos, hasta que un palillo salga limpio.',
    'Deja enfriar 10 minutos antes de desmoldar.',
  ]),

  R('pan-muerto', 'Pan de muerto', 'D', 'dp', 150, 8, 'muertos horno tradicional', [
    ['harina', '500 g de harina (unas 4 tazas)', 'p'],
    ['levadura', '10 g de levadura seca', 'p'],
    ['azucar', '1/2 taza de azúcar, más un poco para espolvorear', 'p'],
    ['mantequilla', '100 g de mantequilla suave, más un poco para barnizar', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['naranja', 'ralladura y 1/4 de taza de jugo de naranja', 'p'],
    ['leche', '1/4 de taza de leche tibia', 'p'],
    ['especias', '1 cucharadita de anís', 'o'],
    ['sal', 'una pizca de sal', 'o'],
  ], [
    'Disuelve la levadura en la leche tibia con una cucharada de azúcar y deja reposar 10 minutos hasta que haga espuma.',
    'Mezcla la harina con el resto del azúcar, la sal, el anís y la ralladura. Agrega los huevos, el jugo de naranja, la levadura y la mantequilla.',
    'Amasa de 10 a 15 minutos hasta que la masa esté suave y no se pegue. Déjala reposar tapada de 1 a 1 1/2 horas, hasta que duplique su tamaño.',
    'Forma bolas grandes y, con la masa que reservaste, haz «huesitos» y una bolita para el centro. Déjalos reposar 45 minutos más.',
    'Hornea a 180 °C de 20 a 25 minutos, hasta que estén dorados.',
    'Barniza con mantequilla derretida y espolvorea con azúcar mientras están calientes.',
  ], 'La masa debe reposar en un lugar tibio y sin corrientes de aire.'),

  R('budin-pan', 'Budín de pan', 'D', 'p', 60, 8, 'horno economico', [
    ['bolillo|pan_yema|pan_dulce|pan_caja', '4 piezas de pan del día anterior', 'p'],
    ['leche', '2 tazas de leche', 'p'],
    ['huevo', '3 huevos', 'p'],
    ['azucar', '1/2 taza de azúcar', 'p'],
    ['canela', '1 raja o 1 cucharadita de canela', 'o'],
    ['pasas', '1/2 taza de pasas', 'o'],
    ['mantequilla', 'mantequilla para engrasar', 'o'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
  ], [
    'Calienta el horno a 180 °C y engrasa un molde.',
    'Parte el pan en trozos y remójalo en la leche tibia con la canela hasta que se ablande.',
    'Bate los huevos con el azúcar y la vainilla. Mézclalos con el pan y agrega las pasas.',
    'Vierte en el molde y hornea unos 40 minutos, hasta que cuaje por completo y un palillo salga limpio.',
    'Deja enfriar antes de desmoldar. Se puede servir tibio o frío.',
  ], 'Es una buena forma de aprovechar el pan que ya se puso duro.'),

  R('bunuelos-miel', 'Buñuelos con miel de piloncillo', 'D', 'p', 70, 12, 'navidad guadalupe fiesta tradicional', [
    ['harina', '500 g de harina (unas 4 tazas)', 'p'],
    ['huevo', '2 huevos', 'p'],
    ['mantequilla|manteca', '50 g de mantequilla o manteca', 'p'],
    ['azucar', '2 cucharadas de azúcar', 'o'],
    ['aceite', 'aceite para freír', 'p'],
    ['piloncillo', '2 conos de piloncillo para la miel', 'p'],
    ['canela', '2 rajas de canela', 'p'],
    ['especias', '1 cucharadita de anís', 'o'],
  ], [
    'Mezcla la harina con el azúcar y una pizca de sal. Agrega los huevos, la mantequilla y agua tibia poco a poco hasta tener una masa suave. Déjala reposar 30 minutos tapada.',
    'Mientras tanto, hierve el piloncillo con 2 tazas de agua, la canela y el anís de 15 a 20 minutos hasta que espese un poco.',
    'Forma bolitas, estíralas muy delgadas con el rodillo en círculos.',
    'Calienta el aceite y fríe los buñuelos de uno en uno, hasta que estén dorados y crujientes. Con cuidado: el aceite caliente salpica; que lo haga una persona adulta.',
    'Escúrrelos sobre papel absorbente y sírvelos bañados con la miel tibia.',
  ]),

  R('capirotada', 'Capirotada', 'DS', 'p', 70, 8, 'semana-santa horno tradicional', [
    ['bolillo', '6 bolillos o teleras duros', 'p'],
    ['piloncillo', '2 conos de piloncillo', 'p'],
    ['canela', '2 rajas de canela', 'p'],
    ['quesillo|queso', '200 g de queso (quesillo o queso fresco)', 'p'],
    ['pasas', '1/2 taza de pasas', 'o'],
    ['cacahuate', '1/2 taza de cacahuates o nueces', 'o'],
    ['platano', '2 plátanos en rodajas', 'o'],
    ['mantequilla', 'mantequilla para engrasar', 'o'],
  ], [
    'Corta el pan en rebanadas y tuéstalo en el horno o en un comal hasta que esté dorado y duro.',
    'Hierve 3 tazas de agua con el piloncillo y la canela unos 15 minutos para hacer el almíbar.',
    'En un molde engrasado acomoda una capa de pan, báñala con almíbar y pon queso, pasas, cacahuates y plátano. Repite las capas.',
    'Termina con almíbar y queso. Tapa con papel aluminio.',
    'Hornea a 180 °C unos 25 minutos, hasta que el queso se derrita y el pan absorba el almíbar. Sírvela tibia.',
  ]),

  R('paletas-fruta', 'Paletas de fruta', 'DA', 'p', 15, 8, 'refrigerar nino economico', [
    ['fruta|mango|pina|melon|papaya|platano', '3 tazas de fruta picada (fresa, mango, piña, melón…)', 'p'],
    ['azucar', '1/2 taza de azúcar o miel al gusto', 'o'],
    ['limon', 'el jugo de 1 limón', 'o'],
    ['agua', '1 taza de agua', 'o'],
  ], [
    'Licúa la fruta con el agua, el azúcar y el limón hasta que no queden trozos grandes.',
    'Prueba y ajusta el dulce: congelada se siente menos dulce.',
    'Sirve la mezcla en moldes o vasitos y, si usas vasitos, ponles un palito cuando empiece a congelarse.',
    'Congela al menos 6 horas antes de comer.',
  ], 'Con trocitos de fruta dentro quedan más vistosas.'),

  R('gelatina-leche', 'Gelatina de leche', 'D', 'p', 25, 8, 'refrigerar fiesta nino', [
    ['leche', '1 litro de leche', 'p'],
    ['gelatina', '2 sobres de grenetina sin sabor', 'p'],
    ['azucar', '1/2 taza de azúcar', 'p'],
    ['vainilla', '1 cucharadita de vainilla', 'o'],
    ['canela', 'canela para decorar', 'o'],
  ], [
    'Hidrata la grenetina en 1/2 taza de agua fría durante 5 minutos.',
    'Calienta la leche con el azúcar hasta que suelte vapor, sin dejar que hierva.',
    'Retira del fuego, agrega la grenetina y la vainilla y revuelve hasta que se disuelva por completo.',
    'Vierte en un molde o en vasitos y deja enfriar. Refrigera mínimo 4 horas hasta que cuaje.',
  ]),

  R('nieve-limon', 'Nieve de limón sin máquina', 'DA', 'p', 15, 8, 'refrigerar fiesta nino', [
    ['leche_condensada', '1 lata de leche condensada', 'p'],
    ['leche_evaporada', '1 lata de leche evaporada', 'p'],
    ['limon', '1/2 taza de jugo de limón', 'p'],
    ['crema', '1 taza de crema para batir', 'o'],
  ], [
    'Licúa la leche condensada con la evaporada y la crema.',
    'Agrega el jugo de limón poco a poco, sin dejar de licuar.',
    'Vierte en un recipiente con tapa y congela 2 horas. Bate con un tenedor para romper los cristales.',
    'Congela otras 4 horas y sirve. Si queda muy dura, déjala 10 minutos fuera antes de servir.',
  ]),

  R('licuado-fresa', 'Licuado de fresa', 'D', 'dpe', 5, 2, 'rapido nino', [
    ['fruta', '1 taza de fresas', 'p'],
    ['leche', '2 tazas de leche', 'p'],
    ['azucar|miel', '1 o 2 cucharadas de azúcar o miel', 'o'],
  ], [
    'Lava las fresas y quítales el rabito.',
    'Licúa las fresas con la leche y el endulzante durante 1 minuto.',
    'Sirve de inmediato, con hielo si quieres.',
  ]),

  R('licuado-mango', 'Licuado de mango', 'D', 'dpe', 5, 2, 'rapido nino', [
    ['mango', '1 mango maduro', 'p'],
    ['leche', '2 tazas de leche', 'p'],
    ['miel|azucar', '1 cucharada de miel o azúcar', 'o'],
  ], [
    'Pela el mango y quita la pulpa del hueso.',
    'Licúa la pulpa con la leche y la miel hasta que quede suave.',
    'Sirve de inmediato.',
  ]),

  R('chocolate-agua', 'Chocolate de agua', 'DM', 'den', 15, 4, 'oaxaca caliente muertos reyes tradicional', [
    ['chocolate', '2 tablillas de chocolate de mesa', 'p'],
    ['agua', '1 litro de agua', 'p'],
    ['azucar', 'azúcar si hace falta', 'o'],
    ['pan_yema', 'pan de yema para acompañar', 'o'],
  ], [
    'Calienta el agua hasta que esté por hervir.',
    'Agrega el chocolate picado y revuelve hasta que se disuelva.',
    'Bate con un molinillo o un batidor hasta que haga espuma.',
    'Sirve caliente, con pan de yema.',
  ], 'Se bate justo antes de servir para que la espuma dure.'),

  R('agua-pepino-limon', 'Agua de pepino con limón', 'A', 'e', 10, 6, 'rapido economico', [
    ['pepino', '2 pepinos', 'p'],
    ['limon', '4 limones', 'p'],
    ['azucar', '1/2 taza de azúcar', 'o'],
    ['agua', '1 1/2 litros de agua', 'p'],
  ], [
    'Lava los pepinos y córtalos en trozos, con todo y cáscara si están limpios.',
    'Licúalos con el jugo de los limones y un litro de agua. Cuela.',
    'Agrega el resto del agua y el azúcar, y revuelve.',
    'Sirve bien fría, con hielo.',
  ]),

  R('te-canela', 'Té de canela', 'D', 'dn', 15, 4, 'caliente economico', [
    ['canela', '3 rajas de canela', 'p'],
    ['agua', '1 litro de agua', 'p'],
    ['azucar|miel', 'azúcar o miel al gusto', 'o'],
  ], [
    'Hierve el agua con la canela de 10 a 12 minutos a fuego bajo.',
    'Retira del fuego, deja reposar 3 minutos y endulza al gusto.',
    'Sirve caliente.',
  ]),

  /* ───────── platos fuertes y antojitos ───────── */

  R('lasana-carne', 'Lasaña de carne', 'S', 'c', 100, 8, 'horno fiesta', [
    ['pasta', '1 caja de pasta para lasaña (unas 12 láminas)', 'p'],
    ['res', '500 g de carne molida de res', 'p'],
    ['jitomate|pure_tomate', '6 jitomates o 2 tazas de puré de tomate', 'p'],
    ['cebolla', '1 cebolla', 'p'],
    ['queso', '300 g de queso que gratine (mozzarella, chihuahua o manchego)', 'p'],
    ['mantequilla', '50 g de mantequilla para la salsa blanca', 'p'],
    ['harina', '3 cucharadas de harina', 'p'],
    ['leche', '2 tazas de leche', 'p'],
    ['ajo', '2 dientes de ajo', 'o'],
  ], [
    'Cuece las láminas de pasta en agua con sal siguiendo la caja y escúrrelas. Calienta el horno a 190 °C.',
    'Sofríe la cebolla y el ajo picados. Agrega la carne y cocínala hasta que no quede nada rosado, desmenuzándola.',
    'Licúa los jitomates, agrégalos a la carne con sal y pimienta y cocina 15 minutos.',
    'Para la salsa blanca derrite la mantequilla, agrega la harina y cocina 1 minuto. Vierte la leche poco a poco sin dejar de mover hasta que espese.',
    'En un molde arma capas: salsa blanca, pasta, carne y queso. Repite y termina con salsa blanca y queso.',
    'Hornea 30 minutos, hasta que burbujee y esté dorada. Deja reposar 10 minutos antes de cortar.',
  ]),

  R('pizza-casera', 'Pizza casera', 'S', 'cn', 80, 4, 'horno nino fiesta', [
    ['harina', '3 tazas de harina', 'p'],
    ['levadura', '7 g de levadura seca', 'p'],
    ['aceite', '2 cucharadas de aceite', 'p'],
    ['pure_tomate|jitomate', '1 taza de puré de tomate o 4 jitomates', 'p'],
    ['queso', '250 g de queso que gratine (mozzarella o chihuahua)', 'p'],
    ['jamon|salchicha|champinon|chile_fresco', 'jamón, champiñones o lo que más te guste', 'o'],
    ['hierbas', 'orégano', 'o'],
  ], [
    'Mezcla la harina con la levadura y una cucharadita de sal. Agrega el aceite y 1 taza de agua tibia y amasa 10 minutos hasta que esté suave.',
    'Deja reposar tapada una hora en un lugar tibio, hasta que duplique su tamaño.',
    'Calienta el horno a 220 °C, lo más caliente que puedas. Estira la masa en una charola engrasada.',
    'Cubre con la salsa de tomate (sazonada con sal y orégano), el queso y los ingredientes.',
    'Hornea de 12 a 15 minutos, hasta que el queso burbujee y los bordes estén dorados.',
  ], 'Sin horno: cocínala en una sartén grande tapada, a fuego medio-bajo, unos 15 minutos.'),

  R('hamburguesas', 'Hamburguesas caseras', 'S', 'cn', 30, 4, 'nino', [
    ['res', '500 g de carne molida de res', 'p'],
    ['pan_caja|bolillo|pan', '4 panes para hamburguesa', 'p'],
    ['cebolla', '1/4 de cebolla picada muy fina', 'o'],
    ['lechuga', 'lechuga', 'o'],
    ['jitomate', '1 jitomate en rodajas', 'o'],
    ['queso', '4 rebanadas de queso', 'o'],
    ['aguacate', '1 aguacate', 'o'],
    ['catsup|mayonesa', 'catsup, mostaza o mayonesa', 'o'],
  ], [
    'Mezcla la carne con la cebolla, sal y pimienta. Forma 4 tortitas aplastadas.',
    'Calienta una sartén o plancha y cocina las tortitas de 4 a 5 minutos por lado, hasta que ya no estén rosadas por dentro (la carne molida debe cocerse completa).',
    'En el último minuto pon el queso encima para que se derrita.',
    'Tuesta los panes en la misma sartén.',
    'Arma con lechuga, jitomate, aguacate y tus salsas favoritas.',
  ]),

  R('hot-dogs', 'Hot dogs', 'S', 'cnb', 15, 4, 'rapido economico nino', [
    ['salchicha', '8 salchichas', 'p'],
    ['bolillo|pan_caja|pan', '4 panes para hot dog', 'p'],
    ['mayonesa', 'mayonesa', 'o'],
    ['catsup', 'catsup y mostaza', 'o'],
    ['cebolla', 'cebolla picada', 'o'],
    ['jitomate', 'jitomate picado', 'o'],
    ['tocino', '4 rebanadas de tocino', 'o'],
  ], [
    'Cuece las salchichas en agua caliente de 6 a 8 minutos o dóralas en una sartén hasta que estén calientes por todos lados.',
    'Si usas tocino, fríelo hasta que esté bien cocido y crujiente y envuelve con él las salchichas.',
    'Calienta ligeramente los panes y rellénalos con las salchichas.',
    'Agrega mayonesa, catsup, mostaza, cebolla y jitomate al gusto.',
  ]),

  R('ceviche-camaron', 'Ceviche de camarón', 'SA', 'cnb', 35, 4, 'semana-santa rapido', [
    ['camaron', '400 g de camarones', 'p'],
    ['limon', '10 limones (el jugo)', 'p'],
    ['jitomate', '3 jitomates picados', 'p'],
    ['cebolla', '1/2 cebolla picada', 'p'],
    ['cilantro', 'cilantro picado', 'p'],
    ['chile_fresco', '1 chile serrano picado', 'o'],
    ['aguacate', '1 aguacate', 'o'],
    ['tostada', 'tostadas para acompañar', 'o'],
  ], [
    'Cuece los camarones en agua hirviendo de 2 a 3 minutos, hasta que estén rosados y firmes. Escúrrelos y deja enfriar.',
    'Pícalos y mézclalos con el jugo de limón. Déjalos reposar 20 minutos en el refrigerador.',
    'Agrega el jitomate, la cebolla, el cilantro y el chile. Sazona con sal.',
    'Sirve sobre tostadas con aguacate. Consúmelo el mismo día y mantenlo frío.',
  ], 'Si lo haces con pescado crudo, usa solo pescado muy fresco y guárdalo siempre en frío; embarazadas, niños pequeños y personas con defensas bajas deben comer el pescado cocido.'),

  R('pico-gallo', 'Pico de gallo', 'SAP', 'b', 10, 4, 'rapido economico', [
    ['jitomate', '3 jitomates', 'p'],
    ['cebolla', '1/2 cebolla', 'p'],
    ['cilantro', 'cilantro al gusto', 'p'],
    ['chile_fresco', '1 o 2 chiles serranos', 'p'],
    ['limon', 'el jugo de 2 limones', 'p'],
  ], [
    'Lava y pica los jitomates, la cebolla, el cilantro y los chiles en cubitos pequeños.',
    'Mezcla todo con el jugo de limón y sal al gusto.',
    'Déjalo reposar 10 minutos y sirve con totopos, tacos o carne asada.',
  ]),

  R('tamales-mole-pollo', 'Tamales de mole con pollo', 'SDP', 'cn', 190, 12, 'oaxaca muertos candelaria navidad fiesta tradicional', [
    ['masa', '1 kg de masa para tamales', 'p'],
    ['manteca|aceite', '250 g de manteca de cerdo o aceite', 'p'],
    ['pollo', '500 g de pollo', 'p'],
    ['mole', '200 g de pasta de mole', 'p'],
    ['hoja_tamal', 'unas 20 hojas de maíz o de plátano', 'p'],
    ['caldo_polvo', 'caldo de pollo (el de cocer el pollo)', 'p'],
    ['polvo_hornear', '1 cucharadita de polvo para hornear', 'o'],
  ], [
    'Cuece el pollo con cebolla, ajo y sal de 25 a 30 minutos, hasta que esté bien cocido por dentro y sin partes rosadas. Deshébralo y guarda el caldo.',
    'Disuelve el mole en 3 tazas de caldo caliente y cocínalo 15 minutos. Mezcla con el pollo para el relleno.',
    'Remoja las hojas en agua caliente hasta que estén flexibles. Bate la manteca hasta que esté blanca y esponjosa.',
    'Agrega la masa poco a poco, alternando con 2 tazas de caldo tibio y sal, hasta que una bolita de masa flote en un vaso de agua.',
    'Extiende masa en cada hoja, pon una cucharada de relleno, dobla y cierra los tamales.',
    'Cuécelos al vapor en una olla con agua de 60 a 75 minutos, hasta que la masa se despegue sola de la hoja.',
  ], 'Si la bolita de masa no flota, bate más tiempo: así quedan esponjosos.'),

  R('tamales-rajas-queso', 'Tamales de rajas con queso', 'S', 'cn', 180, 12, 'oaxaca candelaria tradicional', [
    ['masa', '1 kg de masa para tamales', 'p'],
    ['manteca|aceite', '250 g de manteca de cerdo o aceite', 'p'],
    ['chile_fresco', '6 chiles poblanos o jalapeños en rajas', 'p'],
    ['quesillo|queso', '300 g de quesillo o queso fresco', 'p'],
    ['hoja_tamal', 'unas 20 hojas de maíz', 'p'],
    ['tomate_verde', '500 g de tomate verde para la salsa', 'o'],
    ['caldo_polvo', 'caldo de pollo', 'o'],
  ], [
    'Asa los chiles, déjalos sudar en una bolsa, pélalos y córtalos en rajas.',
    'Remoja las hojas en agua caliente hasta que estén flexibles.',
    'Bate la manteca hasta que esté esponjosa. Agrega la masa con 2 tazas de caldo tibio y sal; está lista cuando una bolita flota en agua.',
    'Extiende masa en cada hoja, pon rajas y queso, dobla y cierra.',
    'Cuece al vapor de 60 a 75 minutos, hasta que la masa se despegue de la hoja. Sirve con salsa verde.',
  ]),

  R('tamales-dulces', 'Tamales dulces de pasas', 'D', 'dn', 170, 12, 'candelaria nino', [
    ['masa', '1 kg de masa para tamales', 'p'],
    ['manteca|mantequilla', '250 g de manteca o mantequilla', 'p'],
    ['azucar', '1 taza de azúcar', 'p'],
    ['pasas', '1 taza de pasas', 'p'],
    ['hoja_tamal', 'unas 20 hojas de maíz', 'p'],
    ['canela', '1 cucharadita de canela', 'o'],
    ['leche', '1 taza de leche tibia', 'o'],
  ], [
    'Remoja las hojas en agua caliente hasta que estén flexibles.',
    'Bate la manteca con el azúcar hasta que esté esponjosa. Agrega la masa poco a poco con la leche y la canela.',
    'Incorpora las pasas. La masa está lista cuando una bolita flota en agua.',
    'Extiende en cada hoja, dobla y cierra los tamales.',
    'Cuécelos al vapor de 60 a 70 minutos, hasta que la masa se despegue sola de la hoja.',
  ]),

  R('empanadas-amarillo', 'Empanadas de amarillo con pollo', 'SP', 'cn', 60, 8, 'oaxaca tradicional', [
    ['masa', '500 g de masa de maíz', 'p'],
    ['pollo', '400 g de pollo', 'p'],
    ['mole', '150 g de mole amarillo', 'p'],
    ['hierbas', 'hojas de hierbabuena, hoja santa o epazote', 'p'],
    ['aceite|manteca', 'aceite para el comal o para freír', 'o'],
  ], [
    'Cuece el pollo con sal de 25 a 30 minutos, hasta que no quede nada rosado, y deshébralo.',
    'Disuelve el mole en 1 taza de caldo y cocínalo 10 minutos hasta que espese. Mezcla con el pollo.',
    'Haz bolitas de masa y aplástalas en la prensa o con las manos formando círculos delgados.',
    'Pon relleno y una hoja de hierba en cada círculo, dóblalo y presiona los bordes.',
    'Cocina las empanadas en un comal caliente de 3 a 4 minutos por lado, o fríelas en aceite, hasta que estén doradas y cocidas por dentro.',
  ]),

  R('empanadas-jamon-queso', 'Empanadas horneadas de jamón y queso', 'S', 'cnb', 55, 10, 'horno nino fiesta', [
    ['harina', '3 tazas de harina', 'p'],
    ['mantequilla', '150 g de mantequilla fría', 'p'],
    ['huevo', '1 huevo para barnizar', 'p'],
    ['jamon', '200 g de jamón picado', 'p'],
    ['queso', '200 g de queso rallado', 'p'],
  ], [
    'Mezcla la harina con una pizca de sal y la mantequilla fría en trocitos hasta que parezca arena. Agrega 1/2 taza de agua fría y junta la masa. Refrigérala 20 minutos.',
    'Calienta el horno a 190 °C. Estira la masa delgada y corta círculos.',
    'Pon jamón y queso en cada círculo, dobla y sella los bordes con un tenedor.',
    'Barniza con el huevo batido y hornea de 22 a 25 minutos, hasta que estén doradas.',
  ]),

  R('pasta-alfredo', 'Pasta Alfredo', 'S', 'cn', 25, 4, 'rapido', [
    ['pasta', '400 g de pasta (fettuccine o espagueti)', 'p'],
    ['crema', '1 taza de crema para cocinar', 'p'],
    ['mantequilla', '50 g de mantequilla', 'p'],
    ['queso', '1/2 taza de queso parmesano o queso rallado', 'p'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['pollo', 'tiras de pollo bien cocidas', 'o'],
  ], [
    'Cuece la pasta en agua con sal de 9 a 10 minutos, hasta que esté al dente. Guarda 1/2 taza del agua de cocción y escurre.',
    'Derrite la mantequilla en una sartén y acitrona el ajo picado 1 minuto.',
    'Agrega la crema y deja que hierva suave 3 minutos. Añade el queso y revuelve hasta que se derrita.',
    'Mezcla la pasta con la salsa. Si está muy espesa, agrega un poco del agua de cocción.',
    'Sazona con pimienta y sirve de inmediato.',
  ]),

  R('sopa-lentejas', 'Sopa de lentejas', 'S', 'cn', 60, 5, 'economico caliente', [
    ['lenteja', '1 1/2 tazas de lentejas', 'p'],
    ['zanahoria', '2 zanahorias en cubos', 'p'],
    ['cebolla', '1/2 cebolla', 'p'],
    ['jitomate', '2 jitomates', 'p'],
    ['papa', '1 papa en cubos', 'o'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['tocino|chorizo', '2 rebanadas de tocino o un poco de chorizo', 'o'],
    ['hierbas', '1 hoja de laurel', 'o'],
  ], [
    'Lava las lentejas y quita las que estén feas. No hace falta remojarlas.',
    'Licúa el jitomate con la cebolla y el ajo. Fríe esa salsa en una olla con un poco de aceite 5 minutos.',
    'Agrega las lentejas, la zanahoria, la papa, el laurel y 6 tazas de agua.',
    'Cuece a fuego medio de 40 a 45 minutos, hasta que las lentejas estén suaves. Sazona con sal al final.',
  ], 'Con un chorrito de limón al servir resalta el sabor.'),

  R('sopa-tortilla', 'Sopa de tortilla', 'SP', 'cn', 45, 4, 'caliente tradicional', [
    ['tortilla', '8 tortillas en tiras', 'p'],
    ['jitomate', '4 jitomates', 'p'],
    ['cebolla', '1/4 de cebolla', 'p'],
    ['ajo', '1 diente de ajo', 'p'],
    ['chile_seco', '2 chiles pasilla', 'p'],
    ['caldo_polvo', '6 tazas de caldo de pollo', 'p'],
    ['aguacate', '1 aguacate', 'o'],
    ['queso', '1/2 taza de queso fresco', 'o'],
    ['crema', '4 cucharadas de crema', 'o'],
  ], [
    'Fríe las tiras de tortilla en aceite caliente hasta que estén doradas y crujientes. Escúrrelas sobre papel.',
    'Desvena los chiles, fríelos un momento y licúalos con el jitomate, la cebolla y el ajo.',
    'Fríe esa salsa en una olla con un poco de aceite 5 minutos. Agrega el caldo caliente y hierve 15 minutos con sal.',
    'Sirve el caldo bien caliente sobre las tiras de tortilla y agrega aguacate, queso y crema.',
  ]),

  R('tacos-pastor', 'Tacos al pastor caseros', 'SP', 'cn', 70, 4, 'padre fiesta', [
    ['cerdo', '700 g de carne de cerdo en filetes delgados', 'p'],
    ['chile_seco', '4 chiles guajillo', 'p'],
    ['especias', '1 cucharada de achiote o recado rojo', 'p'],
    ['pina', '1/2 piña en trozos', 'p'],
    ['ajo', '3 dientes de ajo', 'p'],
    ['vinagre', '2 cucharadas de vinagre', 'o'],
    ['tortilla', '16 tortillas de maíz', 'p'],
    ['cebolla', '1 cebolla picada', 'p'],
    ['cilantro', 'cilantro picado', 'p'],
    ['limon', 'limones', 'o'],
  ], [
    'Hierve los chiles guajillo 10 minutos sin semillas y licúalos con el achiote, el ajo, el vinagre, una taza de piña y sal.',
    'Baña la carne con esa pasta y déjala reposar en el refrigerador al menos 2 horas.',
    'Cocina la carne en una sartén muy caliente, por tandas, hasta que esté bien cocida y dorada, sin partes rosadas. Cocina también los trozos de piña.',
    'Pica la carne y la piña. Calienta las tortillas.',
    'Sirve en tacos con cebolla, cilantro, piña y limón.',
  ]),

  R('tacos-canasta', 'Tacos de canasta', 'S', 'cnb', 50, 6, 'economico', [
    ['tortilla', '18 tortillas chicas', 'p'],
    ['papa', '3 papas cocidas', 'p'],
    ['frijol', '1 taza de frijoles refritos', 'o'],
    ['aceite', '1/2 taza de aceite', 'p'],
    ['salsa|chile_seco', 'salsa roja o verde', 'o'],
  ], [
    'Machaca las papas cocidas con sal y, si quieres, mézclalas con frijoles refritos.',
    'Rellena cada tortilla con una cucharada y enrolla.',
    'Pasa los tacos por aceite caliente apenas unos segundos por lado, sin dorarlos.',
    'Envuélvelos en un trapo limpio dentro de una canasta o una olla tapada y déjalos sudar 30 minutos: así se suavizan.',
    'Sirve con salsa.',
  ]),

  R('pollo-naranja', 'Pollo a la naranja', 'SDA', 'c', 50, 4, '', [
    ['pollo', '800 g de pollo en piezas', 'p'],
    ['naranja', '4 naranjas (el jugo)', 'p'],
    ['ajo', '3 dientes de ajo', 'p'],
    ['miel|azucar', '2 cucharadas de miel o azúcar', 'p'],
    ['cebolla', '1/2 cebolla', 'o'],
    ['cilantro', 'cilantro picado', 'o'],
  ], [
    'Sazona el pollo con sal, pimienta y ajo picado.',
    'Dóralo en una sartén con aceite caliente por todos los lados, unos 8 minutos.',
    'Agrega la cebolla picada, el jugo de naranja y la miel.',
    'Tapa y cocina a fuego bajo de 25 a 30 minutos, hasta que el pollo esté bien cocido por dentro y sin partes rosadas, y el jugo salga claro.',
    'Destapa y deja que la salsa se reduzca 5 minutos. Sirve con arroz y cilantro.',
  ]),

  R('caldo-camaron', 'Caldo de camarón', 'SP', 'c', 45, 4, 'semana-santa caliente', [
    ['camaron', '500 g de camarones', 'p'],
    ['jitomate', '3 jitomates', 'p'],
    ['chile_seco', '3 chiles guajillo', 'p'],
    ['cebolla', '1/2 cebolla', 'p'],
    ['ajo', '2 dientes de ajo', 'p'],
    ['papa', '2 papas en cubos', 'p'],
    ['zanahoria', '2 zanahorias en rodajas', 'o'],
    ['hierbas', 'epazote o laurel', 'o'],
    ['limon', 'limones para servir', 'o'],
  ], [
    'Hierve los chiles guajillo 8 minutos sin semillas y licúalos con el jitomate, la cebolla y el ajo.',
    'Fríe esa salsa en una olla con un poco de aceite 5 minutos.',
    'Agrega 6 tazas de agua, la papa, la zanahoria, el epazote y sal. Cuece 15 minutos.',
    'Añade los camarones y cocínalos de 4 a 5 minutos, hasta que estén rosados y enrollados.',
    'Sirve caliente con limón.',
  ]),

  R('enchiladas-suizas', 'Enchiladas suizas', 'S', 'cn', 50, 4, 'horno fiesta', [
    ['tortilla', '12 tortillas de maíz', 'p'],
    ['pollo', '400 g de pollo cocido y deshebrado', 'p'],
    ['tomate_verde', '500 g de tomate verde', 'p'],
    ['crema', '1 taza de crema', 'p'],
    ['queso', '200 g de queso que gratine', 'p'],
    ['chile_fresco', '2 chiles serranos', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['cilantro', 'cilantro', 'o'],
  ], [
    'Cuece el pollo con sal 25 minutos, hasta que no quede rosado, y deshébralo.',
    'Hierve los tomates con los chiles 8 minutos. Licúalos con la cebolla, el cilantro, sal y la mitad de la crema.',
    'Calienta la salsa en una sartén 5 minutos.',
    'Pasa cada tortilla por aceite caliente 5 segundos, rellénala con pollo y enróllala.',
    'Acomódalas en un molde, báñalas con la salsa, cubre con queso y el resto de la crema. Gratina en el horno a 200 °C unos 10 minutos.',
  ]),

  R('coloradito-pollo', 'Coloradito con pollo', 'SDP', 'c', 60, 4, 'oaxaca tradicional fiesta', [
    ['pollo', '800 g de pollo en piezas', 'p'],
    ['mole', '250 g de mole coloradito', 'p'],
    ['cebolla', '1/2 cebolla', 'o'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['arroz', 'arroz para acompañar', 'o'],
    ['ajonjoli', 'ajonjolí para decorar', 'o'],
  ], [
    'Cuece el pollo con cebolla, ajo y sal de 30 a 35 minutos, hasta que esté bien cocido por dentro y sin partes rosadas. Guarda el caldo.',
    'Disuelve el mole en 3 tazas del caldo caliente y cocínalo 15 minutos, moviendo para que no se pegue.',
    'Agrega el pollo y cocina 10 minutos más en la salsa.',
    'Sirve con arroz y espolvorea ajonjolí.',
  ]),

  R('tacos-dorados-pollo', 'Tacos dorados de pollo', 'S', 'cn', 40, 4, 'economico', [
    ['tortilla', '12 tortillas', 'p'],
    ['pollo', '300 g de pollo cocido y deshebrado', 'p'],
    ['aceite', 'aceite para freír', 'p'],
    ['lechuga', 'lechuga picada', 'o'],
    ['crema', 'crema', 'o'],
    ['queso', 'queso rallado', 'o'],
    ['salsa', 'salsa', 'o'],
  ], [
    'Cuece el pollo con sal 25 minutos, hasta que no quede rosado, y deshébralo.',
    'Calienta las tortillas, rellénalas con pollo y enróllalas apretadas, cerrándolas con un palillo.',
    'Fríelas en aceite caliente hasta que estén doradas y crujientes. Escúrrelas sobre papel.',
    'Sirve con lechuga, crema, queso y salsa.',
  ]),

  R('frijoles-refritos', 'Frijoles refritos', 'S', 'cn', 20, 4, 'economico rapido', [
    ['frijol', '3 tazas de frijoles cocidos con su caldo', 'p'],
    ['manteca|aceite', '3 cucharadas de manteca o aceite', 'p'],
    ['cebolla', '1/4 de cebolla picada', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
    ['queso', 'queso para acompañar', 'o'],
  ], [
    'Calienta la manteca y acitrona la cebolla y el ajo.',
    'Agrega los frijoles con un poco de su caldo y machácalos con un machacador o con el dorso de una cuchara.',
    'Cocina a fuego medio de 8 a 10 minutos, moviendo, hasta que espesen. Ajusta de sal.',
    'Sirve con queso y tortillas calientes.',
  ]),

  R('arroz-blanco', 'Arroz blanco', 'S', 'c', 30, 4, 'economico', [
    ['arroz', '1 taza de arroz', 'p'],
    ['agua', '2 tazas de agua', 'p'],
    ['aceite', '2 cucharadas de aceite', 'p'],
    ['ajo', '1 diente de ajo', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['sal', 'sal al gusto', 'o'],
  ], [
    'Lava el arroz hasta que el agua salga casi clara y escúrrelo bien.',
    'Calienta el aceite y fríe el arroz con el ajo y la cebolla, moviendo, hasta que esté ligeramente dorado, unos 4 minutos.',
    'Agrega el agua caliente y la sal. Cuando hierva, baja el fuego al mínimo y tapa.',
    'Cocina 18 minutos sin destapar. Apaga y deja reposar tapado 5 minutos. Esponja con un tenedor.',
  ]),

  R('salsa-verde', 'Salsa verde', 'SAP', 'b', 15, 6, 'rapido economico', [
    ['tomate_verde', '500 g de tomate verde', 'p'],
    ['chile_fresco', '2 o 3 chiles serranos', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['ajo', '1 diente de ajo', 'o'],
    ['cilantro', 'un poco de cilantro', 'o'],
  ], [
    'Hierve los tomates y los chiles en agua unos 8 minutos, hasta que cambien de color.',
    'Licúa con la cebolla, el ajo, el cilantro, sal y un poco del agua de cocción.',
    'Prueba y ajusta de sal y picante. Sirve fría o tibia.',
  ]),

  R('salsa-roja', 'Salsa roja de jitomate', 'SP', 'b', 20, 6, 'rapido economico', [
    ['jitomate', '4 jitomates', 'p'],
    ['chile_fresco|chile_seco', '2 chiles serranos o de árbol', 'p'],
    ['ajo', '1 diente de ajo', 'o'],
    ['cebolla', '1/4 de cebolla', 'o'],
  ], [
    'Asa o hierve los jitomates y los chiles hasta que estén suaves y la piel se rompa.',
    'Licúalos con el ajo, la cebolla y sal al gusto.',
    'Si quieres una salsa cocida, fríela 5 minutos en una sartén con un poco de aceite.',
  ]),

  R('salsa-pasilla', 'Salsa de chile pasilla oaxaqueño', 'SP', 'bc', 25, 6, 'oaxaca tradicional', [
    ['chile_seco', '5 chiles pasilla (de preferencia oaxaqueños)', 'p'],
    ['jitomate', '2 jitomates', 'p'],
    ['ajo', '2 dientes de ajo', 'p'],
    ['cebolla', '1/4 de cebolla', 'o'],
    ['limon', 'el jugo de 1 limón', 'o'],
  ], [
    'Quita los rabitos y las semillas a los chiles y tuéstalos apenas en un comal, sin que se quemen: si se queman amargan.',
    'Remójalos 10 minutos en agua caliente.',
    'Asa los jitomates y el ajo.',
    'Licúa todo con la cebolla, sal, un poco del agua del remojo y el limón.',
  ], 'Va muy bien con tlayudas, memelas y carne asada.'),

  R('pure-papa', 'Puré de papa', 'S', 'cn', 30, 4, 'economico', [
    ['papa', '1 kg de papas', 'p'],
    ['mantequilla', '50 g de mantequilla', 'p'],
    ['leche', '1/2 taza de leche caliente', 'p'],
    ['sal', 'sal al gusto', 'o'],
  ], [
    'Pela las papas, córtalas en trozos y cuécelas en agua con sal de 15 a 20 minutos, hasta que estén muy suaves.',
    'Escúrrelas y macháchalas mientras estén calientes.',
    'Agrega la mantequilla y la leche caliente poco a poco hasta tener la textura que te guste. Ajusta la sal.',
  ]),

  R('mojarra-frita', 'Mojarra frita con ensalada', 'SA', 'c', 35, 2, 'semana-santa', [
    ['pescado', '2 mojarras limpias', 'p'],
    ['limon', '2 limones', 'p'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['harina', '3 cucharadas de harina', 'o'],
    ['aceite', 'aceite para freír', 'p'],
    ['lechuga|jitomate|cebolla', 'lechuga, jitomate y cebolla para la ensalada', 'o'],
  ], [
    'Haz cortes en los costados de las mojarras. Úntalas con ajo machacado, jugo de limón y sal y déjalas reposar 10 minutos.',
    'Pásalas ligeramente por harina.',
    'Fríelas en aceite caliente de 5 a 6 minutos por lado, hasta que estén doradas y la carne esté blanca y se desprenda fácilmente con un tenedor.',
    'Escúrrelas y sírvelas con ensalada y limón.',
  ], 'Fríe con cuidado: el aceite salpica. Que lo haga una persona adulta.'),

  R('tortas-jamon', 'Tortas de jamón y queso', 'S', 'cnb', 10, 2, 'rapido clases', [
    ['bolillo', '2 bolillos o teleras', 'p'],
    ['jamon', '150 g de jamón', 'p'],
    ['queso', '100 g de queso', 'p'],
    ['aguacate', '1/2 aguacate', 'o'],
    ['jitomate', '1 jitomate', 'o'],
    ['cebolla', 'cebolla en rodajas', 'o'],
    ['mayonesa', 'mayonesa', 'o'],
    ['frijol', 'frijoles refritos', 'o'],
  ], [
    'Abre los bolillos y, si quieres, úntales frijoles o mayonesa.',
    'Acomoda el jamón, el queso, el aguacate, el jitomate y la cebolla.',
    'Cierra y, si prefieres, caliéntalas en una sartén o plancha hasta que el pan quede crujiente y el queso se derrita.',
  ]),

  R('sandwich-jamon-queso', 'Sándwich de jamón y queso', 'S', 'dcnb', 10, 2, 'rapido economico clases', [
    ['pan_caja', '4 rebanadas de pan de caja', 'p'],
    ['jamon', '4 rebanadas de jamón', 'p'],
    ['queso', '2 rebanadas de queso', 'p'],
    ['mayonesa', 'mayonesa', 'o'],
    ['mantequilla', 'mantequilla', 'o'],
    ['lechuga|jitomate', 'lechuga o jitomate', 'o'],
  ], [
    'Unta mayonesa en el pan y arma los sándwiches con jamón, queso y verduras.',
    'Si los quieres calientes, unta mantequilla por fuera y dóralos en una sartén 2 minutos por lado.',
    'Corta en triángulos y sirve.',
  ]),

  R('pollo-horno-papas', 'Pollo al horno con papas', 'S', 'c', 100, 5, 'fiesta madre', [
    ['pollo', '1.5 kg de pollo en piezas o entero', 'p'],
    ['papa', '600 g de papas', 'p'],
    ['ajo', '4 dientes de ajo', 'p'],
    ['limon', '2 limones', 'p'],
    ['mantequilla|aceite', '3 cucharadas de mantequilla o aceite', 'p'],
    ['especias', 'pimienta, comino y orégano', 'o'],
    ['cebolla', '1 cebolla', 'o'],
  ], [
    'Mezcla el ajo machacado con el jugo de limón, la mantequilla derretida, sal y especias. Unta el pollo y déjalo reposar una hora en el refrigerador.',
    'Calienta el horno a 200 °C.',
    'Acomoda el pollo en un molde con las papas y la cebolla en trozos.',
    'Hornea tapado con aluminio 40 minutos y luego destapado 30 o 40 minutos más, hasta que la piel esté dorada y, al picar el muslo, salgan jugos claros y no queden partes rosadas.',
    'Deja reposar 10 minutos antes de servir.',
  ]),

  R('carne-asada', 'Carne asada con cebollitas', 'S', 'cn', 45, 4, 'padre fiesta', [
    ['res', '800 g de carne de res para asar', 'p'],
    ['limon', '3 limones', 'p'],
    ['cebolla', '8 cebollitas de cambray', 'p'],
    ['tortilla', 'tortillas calientes', 'p'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['aguacate|salsa', 'guacamole o salsa', 'o'],
  ], [
    'Sazona la carne con jugo de limón, ajo machacado y sal. Déjala reposar 20 minutos.',
    'Calienta muy bien un asador, plancha o sartén.',
    'Asa la carne de 3 a 5 minutos por lado, según el grosor y qué tan cocida la quieras; la carne de res en filetes puede quedar rosada por dentro, pero la carne molida o en trozos pequeños debe cocerse completa.',
    'Asa también las cebollitas con un poco de sal hasta que se doren.',
    'Deja reposar la carne 5 minutos, córtala y sirve con tortillas, cebollitas y salsa.',
  ]),

  R('pollo-crema-poblano', 'Pollo en crema de chile poblano', 'S', 'c', 55, 4, 'madre fiesta', [
    ['pollo', '800 g de pollo en piezas (pechuga o muslos)', 'p'],
    ['chile_fresco', '4 chiles poblanos', 'p'],
    ['crema', '1 taza de crema', 'p'],
    ['cebolla', '1/4 de cebolla para la salsa y un trozo para cocer el pollo', 'o'],
    ['ajo', '2 dientes de ajo', 'o'],
    ['elote', '1 taza de granos de elote', 'o'],
    ['queso', '100 g de queso para gratinar', 'o'],
  ], [
    'Cuece el pollo en agua con sal, un trozo de cebolla y un diente de ajo de 25 a 30 minutos, hasta que esté bien cocido por dentro y sin partes rosadas. Guarda 1/2 taza del caldo y desmenúzalo o córtalo en trozos.',
    'Asa los chiles poblanos directo a la flama o en un comal hasta que la piel se ponga negra; déjalos sudar 10 minutos en una bolsa, pélalos y quítales las semillas.',
    'Licúa los chiles con la crema, la cebolla, el ajo restante, sal y el caldo reservado hasta que quede una salsa suave.',
    'Calienta la salsa en una sartén a fuego bajo con el elote 5 minutos, sin que hierva fuerte para que la crema no se corte. Agrega el pollo y calienta 5 minutos más.',
    'Si quieres, cubre con queso y gratina tapado unos minutos hasta que se derrita. Sirve con arroz blanco.',
  ]),

  R('bistec-mexicana', 'Bistec a la mexicana', 'SP', 'c', 25, 4, 'economico', [
    ['res', '500 g de bistec de res delgado en tiras', 'p'],
    ['jitomate', '3 jitomates picados', 'p'],
    ['cebolla', '1/2 cebolla picada', 'p'],
    ['chile_fresco', '2 chiles serranos o jalapeños picados', 'p'],
    ['ajo', '1 diente de ajo', 'o'],
    ['aceite', '2 cucharadas de aceite', 'o'],
  ], [
    'Sazona la carne con sal, pimienta y el ajo machacado.',
    'Calienta el aceite en una sartén grande y cocina el bistec a fuego alto de 4 a 5 minutos, moviendo, hasta que ya no esté rosado y se dore.',
    'Agrega la cebolla y el chile y cocina 3 minutos. Añade el jitomate y cocina 6 u 8 minutos más, hasta que suelte su jugo y se forme una salsa.',
    'Prueba de sal y sirve caliente con arroz, frijoles y tortillas.',
  ]),

  R('carnitas-cerdo', 'Carnitas de cerdo', 'S', 'cn', 160, 8, 'fiesta padre', [
    ['cerdo', '1.5 kg de carne de cerdo (maciza o costilla) en trozos', 'p'],
    ['manteca|aceite', '250 g de manteca de cerdo o 1 taza de aceite', 'p'],
    ['naranja', '2 naranjas (el jugo)', 'p'],
    ['cebolla', '1 cebolla', 'p'],
    ['ajo', '4 dientes de ajo', 'p'],
    ['leche', '1/2 taza de leche', 'o'],
    ['hierbas', '2 hojas de laurel', 'o'],
    ['tortilla', 'tortillas para servir', 'p'],
  ], [
    'Corta la carne en trozos grandes y sazónala con sal.',
    'En una olla ancha calienta la manteca y agrega la carne, la cebolla, el ajo, el laurel, el jugo de naranja y la leche.',
    'Cocina a fuego bajo, moviendo de vez en cuando, de 2 a 2 1/2 horas, hasta que la carne esté muy suave por dentro, sin partes rosadas, y dorada por fuera.',
    'Sube el fuego los últimos 10 minutos para dorarla. Escurre la grasa.',
    'Sirve en tacos con cebolla, cilantro y salsa.',
  ]),
];
