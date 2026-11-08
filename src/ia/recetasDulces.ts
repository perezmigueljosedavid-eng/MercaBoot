import { R, Receta } from './recetaUtil';

/** Recetas dulces, postres, desayunos dulces y bebidas. */
export const RECETAS_DULCES: Receta[] = [
  R('chocolate-pan-yema', 'Chocolate caliente con pan de yema', 'DM', 'dne', 15, 3, 'oaxaca caliente muertos reyes', [
    ['chocolate', '3 tablillas de chocolate de mesa', 'p'],
    ['leche|agua', '1 litro de leche o de agua', 'p'],
    ['pan_yema|pan_dulce', 'pan de yema o pan dulce para mojar', 'p'],
    ['canela', 'un trozo de canela', 'o'],
    ['azucar|piloncillo', 'azúcar al gusto', 'o'],
  ], [
    'Calienta la leche (o el agua) con la canela a fuego medio, sin dejar que hierva.',
    'Agrega el chocolate en trozos y mueve con un molinillo o batidor hasta que se disuelva y haga espuma (unos 5 minutos).',
    'Sirve caliente, con el pan para mojar.',
  ], 'Con agua en lugar de leche queda el chocolate de agua tradicional de Oaxaca.'),

  R('hotcakes-miel-platano', 'Hot cakes con miel y plátano', 'D', 'dp', 25, 3, 'nino', [
    ['hotcakes|harina', 'mezcla para hot cakes (1 1/2 tazas)', 'p'],
    ['huevo', '1 huevo', 'o'],
    ['leche', '1 taza de leche', 'o'],
    ['miel|cajeta|mermelada', 'miel, cajeta o mermelada', 'p'],
    ['platano|fruta|manzana', 'plátano o fruta en rebanadas', 'o'],
    ['mantequilla', 'un poco de mantequilla', 'o'],
  ], [
    'Mezcla la harina con el huevo y la leche (o agua, según indique el paquete) hasta que quede sin grumos.',
    'Calienta un sartén con un poco de mantequilla y vierte media taza de mezcla por hot cake.',
    'Voltea cuando salgan burbujas (unos 2 minutos) y dora 1 minuto del otro lado.',
    'Sirve con miel o cajeta y rebanadas de plátano.',
  ]),

  R('platano-macho-frito', 'Plátano macho frito con crema y leche condensada', 'D', 'pcn', 20, 3, 'oaxaca', [
    ['platano_macho', '3 plátanos machos bien maduros (manchados)', 'p'],
    ['aceite|mantequilla', 'aceite o mantequilla para freír', 'o'],
    ['crema', '1/2 taza de crema', 'o'],
    ['leche_condensada|azucar|miel', 'leche condensada, azúcar o miel', 'o'],
    ['queso', 'queso fresco desmoronado (opcional)', 'o'],
  ], [
    'Pela los plátanos y córtalos en rodajas largas, en diagonal.',
    'Fríelos en aceite o mantequilla a fuego medio de 2 a 3 minutos por lado, hasta que doren.',
    'Escurre en papel y sirve con crema y un hilo de leche condensada.',
  ], 'Entre más manchada la cáscara, más dulce queda.'),

  R('licuado-platano', 'Licuado de plátano', 'D', 'dep', 5, 2, 'rapido nino', [
    ['platano', '2 plátanos', 'p'],
    ['leche', '2 tazas de leche fría', 'p'],
    ['avena', '2 cucharadas de avena', 'o'],
    ['miel|azucar|leche_condensada', 'miel o azúcar al gusto', 'o'],
    ['canela', 'una pizca de canela', 'o'],
  ], [
    'Pon todo en la licuadora.',
    'Licúa 1 minuto, hasta que quede suave. Sirve de inmediato.',
  ]),

  R('arroz-con-leche', 'Arroz con leche', 'D', 'p', 50, 6, 'economico madre', [
    ['arroz', '1 taza de arroz', 'p'],
    ['leche', '1 litro de leche', 'p'],
    ['azucar|piloncillo', '1/2 taza de azúcar', 'p'],
    ['canela', '1 raja de canela', 'p'],
    ['pasas', 'un puño de pasas', 'o'],
    ['vainilla|leche_condensada', 'vainilla o leche condensada', 'o'],
  ], [
    'Hierve el arroz en 2 tazas de agua con la canela, 10 minutos, hasta que absorba casi toda el agua.',
    'Agrega la leche y cocina a fuego bajo 30 minutos, moviendo seguido para que no se pegue.',
    'Añade el azúcar (y las pasas) y cocina 5 minutos más, hasta que espese.',
    'Sirve tibio o frío; espolvorea canela.',
  ], 'Al enfriarse espesa más: si lo quieres cremoso, déjalo un poco aguado al apagar.'),

  R('calabaza-tacha', 'Calabaza en tacha', 'D', 'p', 75, 6, 'tradicional muertos', [
    ['calabaza', '1 kg de calabaza de Castilla en trozos', 'p'],
    ['piloncillo', '3 conos de piloncillo', 'p'],
    ['canela', '2 rajas de canela', 'p'],
    ['naranja|cana', 'naranja o un trozo de caña', 'o'],
  ], [
    'Disuelve el piloncillo en 2 tazas de agua con la canela y unas rebanadas de naranja a fuego medio.',
    'Agrega la calabaza con todo y cáscara (por la parte de la carne hacia arriba).',
    'Tapa y cocina a fuego bajo de 45 a 60 minutos, bañando con el jarabe, hasta que la calabaza esté suave y el almíbar espese.',
    'Sirve tibia, con un poco de su miel.',
  ]),

  R('camotes-piloncillo', 'Camotes en dulce', 'D', 'pn', 45, 4, 'economico muertos', [
    ['camote', '4 camotes grandes', 'p'],
    ['piloncillo|azucar', '2 conos de piloncillo', 'p'],
    ['canela', '1 raja de canela', 'o'],
    ['naranja', 'jugo de una naranja', 'o'],
  ], [
    'Lava los camotes y córtalos en trozos gruesos.',
    'Pon el piloncillo con 2 tazas de agua, la canela y el jugo de naranja; hierve hasta disolver.',
    'Agrega el camote, tapa y cocina a fuego bajo de 25 a 30 minutos, hasta que esté suave y el jarabe espese.',
  ]),

  R('atole-masa', 'Atole de masa con canela', 'D', 'den', 25, 4, 'oaxaca caliente economico muertos guadalupe', [
    ['masa', '1/2 taza de masa de maíz', 'p'],
    ['piloncillo|azucar', 'piloncillo o azúcar al gusto', 'p'],
    ['canela', '1 raja de canela', 'p'],
    ['leche|agua', '1 litro de agua o de leche', 'p'],
    ['chocolate', 'una tablilla de chocolate (para champurrado)', 'o'],
  ], [
    'Disuelve la masa en 1 taza de agua fría y cuélala para quitar grumos.',
    'Hierve el resto del agua o leche con la canela y el piloncillo.',
    'Agrega la masa disuelta sin dejar de mover y cocina de 10 a 12 minutos, hasta que espese.',
    'Para champurrado, agrega el chocolate y bate con molinillo.',
  ]),

  R('agua-jamaica', 'Agua de jamaica', 'AD', 'e', 20, 6, 'economico', [
    ['jamaica', '1 taza de flor de jamaica', 'p'],
    ['azucar|piloncillo', '1/2 taza de azúcar', 'p'],
    ['limon', 'jugo de un limón', 'o'],
    ['canela', 'una raja de canela', 'o'],
  ], [
    'Hierve la jamaica en 2 tazas de agua por 10 minutos (con la canela si quieres).',
    'Cuela sobre una jarra y agrega el azúcar, mezclando hasta disolver.',
    'Completa con 1.5 litros de agua fría y hielo. Prueba y ajusta el dulce.',
  ]),

  R('cafe-de-olla', 'Café de olla', 'DM', 'den', 20, 4, 'caliente', [
    ['cafe', '4 cucharadas de café molido', 'p'],
    ['piloncillo|azucar', '1 cono de piloncillo', 'p'],
    ['canela', '1 raja de canela', 'p'],
    ['especias', '2 clavos de olor (opcional)', 'o'],
  ], [
    'Hierve 1 litro de agua con el piloncillo, la canela y los clavos hasta que el piloncillo se disuelva.',
    'Apaga, agrega el café, tapa y deja reposar 5 minutos.',
    'Cuela y sirve bien caliente.',
  ]),

  R('limonada', 'Limonada', 'AD', 'e', 10, 4, 'rapido economico', [
    ['limon', '8 limones', 'p'],
    ['azucar|miel', '1/2 taza de azúcar', 'p'],
    ['agua', '1 litro de agua fría', 'p'],
  ], [
    'Exprime los limones y cuela el jugo (sin apretar la cáscara, para que no amargue).',
    'Disuelve el azúcar en un poco de agua tibia.',
    'Mezcla todo en una jarra con el resto del agua fría y hielo.',
  ], 'Con agua mineral queda una limonada con burbujas.'),

  R('agua-fruta', 'Agua fresca de fruta', 'D', 'e', 10, 5, 'rapido', [
    ['melon|pina|mango|papaya|naranja|fruta|platano', '3 tazas de fruta picada (melón, piña, mango, papaya…)', 'p'],
    ['azucar|miel', 'azúcar al gusto', 'o'],
    ['limon', 'unas gotas de limón', 'o'],
    ['agua', '1 litro de agua', 'p'],
  ], [
    'Licúa la fruta con 2 tazas de agua hasta que quede suave.',
    'Cuela si quieres un agua más ligera y pasa a una jarra.',
    'Agrega el resto del agua, el azúcar y el limón; sirve con hielo.',
  ]),

  R('fruta-chile-limon', 'Fruta con chile, limón y sal', 'DPA', 'bp', 10, 3, 'rapido', [
    ['jicama|mango|melon|pina|papaya|fruta|pepino|naranja', 'jícama, mango, melón, piña o pepino', 'p'],
    ['chile_polvo|chamoy|salsa', 'chile en polvo con limón o chamoy', 'p'],
    ['limon', 'jugo de limón', 'p'],
  ], [
    'Pela y corta la fruta en tiras o cubos.',
    'Agrega jugo de limón y una pizca de sal.',
    'Espolvorea el chile en polvo (o baña con chamoy) y mezcla. Sirve frío.',
  ]),

  R('mangonada', 'Mangonada con chamoy', 'DPA', 'ep', 10, 2, 'rapido', [
    ['mango', '2 mangos maduros', 'p'],
    ['chamoy', '3 cucharadas de chamoy', 'p'],
    ['chile_polvo', 'chile en polvo con limón', 'p'],
    ['limon', 'jugo de limón', 'o'],
    ['helado|agua', 'nieve de mango o hielo', 'o'],
  ], [
    'Licúa el mango con el hielo o la nieve hasta que quede espeso.',
    'Unta chamoy en las paredes del vaso y espolvorea chile en polvo.',
    'Sirve la mezcla, agrega más chamoy encima y un poco de limón.',
  ]),

  R('queso-con-ate', 'Queso con ate o mermelada', 'DS', 'bp', 5, 2, 'rapido', [
    ['queso|requeson|queso_crema', 'queso fresco, requesón o queso crema', 'p'],
    ['mermelada', 'ate o mermelada', 'p'],
    ['galleta|pan', 'galletas o pan para acompañar', 'o'],
  ], [
    'Corta el queso en rebanadas.',
    'Pon encima una cucharada de ate o mermelada.',
    'Sirve con galletas o pan.',
  ]),

  R('avena-platano', 'Avena caliente con plátano y canela', 'D', 'd', 15, 2, 'economico caliente', [
    ['avena', '1 taza de avena', 'p'],
    ['leche|agua', '2 tazas de leche o agua', 'p'],
    ['platano|manzana|fruta', '1 plátano en rodajas', 'o'],
    ['canela', 'canela en polvo', 'o'],
    ['miel|azucar|piloncillo', 'miel o azúcar', 'o'],
    ['pasas', 'pasas', 'o'],
  ], [
    'Calienta la leche (o el agua) con una raja de canela.',
    'Agrega la avena y cocina a fuego bajo 5 minutos, moviendo, hasta que espese.',
    'Sirve con plátano, miel y canela.',
  ]),

  R('yogurt-fruta', 'Yogurt con fruta y miel', 'DA', 'db', 5, 2, 'rapido clases', [
    ['yogurt', '2 tazas de yogurt natural', 'p'],
    ['fruta|platano|mango|manzana|papaya|melon|pina|naranja', 'fruta picada', 'p'],
    ['miel', 'miel', 'o'],
    ['avena|cacahuate', 'avena o nueces', 'o'],
  ], [
    'Sirve el yogurt en vasos o tazones.',
    'Agrega la fruta picada y un hilo de miel.',
    'Termina con avena o nueces para dar crujiente.',
  ]),

  R('pan-frances', 'Pan francés (torrejas)', 'D', 'dp', 20, 3, 'economico semana-santa', [
    ['bolillo|pan_caja|pan', '6 rebanadas de pan (mejor si tiene un día)', 'p'],
    ['huevo', '2 huevos', 'p'],
    ['leche', '1/2 taza de leche', 'p'],
    ['azucar|piloncillo|miel', 'azúcar o miel', 'p'],
    ['canela', 'canela en polvo', 'o'],
    ['mantequilla|aceite', 'mantequilla para dorar', 'o'],
  ], [
    'Bate los huevos con la leche y una cucharada de azúcar.',
    'Remoja las rebanadas de pan por ambos lados, sin dejar que se deshagan.',
    'Dóralas en un sartén con mantequilla, 2 minutos por lado.',
    'Sirve con azúcar y canela, o con miel.',
  ]),

  R('crepas-cajeta', 'Crepas con cajeta o mermelada', 'D', 'dp', 35, 4, 'amor', [
    ['harina', '1 taza de harina de trigo', 'p'],
    ['huevo', '2 huevos', 'p'],
    ['leche', '1 1/2 tazas de leche', 'p'],
    ['cajeta|mermelada|leche_condensada|chocolate', 'cajeta, mermelada o chocolate', 'p'],
    ['mantequilla', 'un poco de mantequilla', 'o'],
    ['fruta|platano|manzana', 'fruta para decorar', 'o'],
  ], [
    'Licúa la harina, los huevos, la leche y una pizca de sal hasta que no queden grumos; deja reposar 10 minutos.',
    'Engrasa un sartén con mantequilla y vierte una cucharada grande de masa, extendiendo en círculo.',
    'Cuando se despegue de las orillas (1 minuto), voltea 30 segundos.',
    'Rellena con cajeta o mermelada, dobla en cuatro y sirve.',
  ]),

  R('carlota-limon', 'Carlota de limón', 'DA', 'p', 40, 8, 'refrigerar madre fiesta', [
    ['galleta', '2 paquetes de galletas María', 'p'],
    ['leche_condensada', '1 lata de leche condensada', 'p'],
    ['leche', '1 lata de leche evaporada (o 1 taza de leche)', 'p'],
    ['crema|queso_crema', '1 taza de crema o queso crema', 'p'],
    ['limon', 'jugo de 6 limones', 'p'],
  ], [
    'Licúa la leche condensada, la leche, la crema y el jugo de limón hasta que espese ligeramente.',
    'En un molde, haz una capa de galletas y cúbrela con la mezcla; repite hasta terminar con mezcla.',
    'Refrigera mínimo 4 horas. Decora con galleta molida o ralladura de limón.',
  ], 'Exprime el limón al final: si lo mezclas antes se amarga.'),
];
