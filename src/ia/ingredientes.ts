import type { CategoriaProducto, Etiqueta, Producto, Sabor, TipoProducto } from '../data/tipos';
import { grupoDeGiro, vendePreparado } from '../data/giros';
import { perfilDe } from './perfil';
import { encontrarFrase, tokens } from './texto';

/**
 * Diccionario de ingredientes y productos de la región.
 * Con él, Mercaboot entiende qué es cada producto que sube un comerciante (su categoría, su sabor
 * y qué ingrediente de receta cubre) sin que el comerciante tenga que clasificarlo.
 *
 * Sabores: D dulce · S salado · P picante · A ácido · M amargo
 * Banderas: c = básico de casa · l = listo para comer o beber · x = no se recomienda
 *           p = platillo: solo sirve para entender productos de los comerciantes, no para buscar ingredientes en un mensaje
 */
type Fila = [id: string, nombre: string, cat: CategoriaProducto, sab: string, sinonimos: string, banderas?: string];

const TABLA: Fila[] = [
  // ── aves, carnes y pescado
  ['pollo', 'pollo', 'ave', 'S', 'pollo|pechuga|pierna|muslo|pierna y muslo|alas|alitas|pollo entero|pollo en piezas|cadera de pollo|milanesa de pollo|filete de pollo|menudencia'],
  ['res', 'carne de res', 'carne', 'S', 'res|carne de res|carne|bistec|bisteck|bistek|filete de res|carne molida|molida|arrachera|costilla de res|falda|retazo|aguja|picana|milanesa|diezmillo|suadero|carne para asar|carne asada|costilla|costillas'],
  ['cerdo', 'carne de cerdo', 'carne', 'S', 'cerdo|carne de cerdo|puerco|carne de puerco|chuleta|chuletas|costilla de cerdo|pierna de cerdo|espaldilla|lomo de cerdo|maciza|pata de cerdo'],
  ['tasajo', 'tasajo o cecina', 'carne', 'SP', 'tasajo|cecina|cecina enchilada|tasajo enchilado|carne enchilada'],
  ['chorizo', 'chorizo', 'carne', 'SP', 'chorizo|longaniza|chorizo rojo|chorizo oaxaqueno'],
  ['jamon', 'jamón', 'carne', 'S', 'jamon|jamon de pavo|pierna ahumada|pavo'],
  ['salchicha', 'salchicha', 'carne', 'S', 'salchicha|salchichas|hot dog|hotdog'],
  ['tocino', 'tocino', 'carne', 'S', 'tocino|tocineta|bacon'],
  ['chicharron', 'chicharrón', 'carne', 'S', 'chicharron|chicharrones|cuero de cerdo', 'l'],
  ['pescado', 'pescado', 'pescado', 'S', 'pescado|mojarra|huachinango|tilapia|bagre|robalo|filete de pescado|lisa'],
  ['camaron', 'camarón', 'pescado', 'S', 'camaron|camarones|langostino|langostinos'],
  ['atun', 'atún o sardina en lata', 'pescado', 'S', 'atun|sardina|sardinas|atun en lata|lata de atun'],
  ['huevo', 'huevo', 'lacteo', 'S', 'huevo|huevos|blanquillo|blanquillos|cartera de huevo|kilo de huevo'],

  // ── lácteos
  ['quesillo', 'quesillo', 'lacteo', 'S', 'quesillo|queso oaxaca|queso de hebra|queso oaxaqueno|bola de quesillo|quesillo de oaxaca'],
  ['queso', 'queso', 'lacteo', 'S', 'queso|queso fresco|queso panela|panela|queso ranchero|cotija|queso cotija|queso seco|queso anejo|queso de rancho|queso rallado|queso manchego|manchego|queso amarillo|queso chihuahua'],
  ['crema', 'crema', 'lacteo', '', 'crema|crema natural|crema acida|crema para batir|crema fresca|crema de rancho'],
  ['leche', 'leche', 'lacteo', '', 'leche|leche entera|leche deslactosada|leche de vaca|leche fresca|leche light|leche pasteurizada'],
  ['leche_condensada', 'leche condensada', 'despensa', 'D', 'leche condensada|lechera'],
  ['mantequilla', 'mantequilla', 'lacteo', '', 'mantequilla|margarina|barra de mantequilla'],
  ['requeson', 'requesón', 'lacteo', 'S', 'requeson'],
  ['yogurt', 'yogurt', 'lacteo', 'DA', 'yogurt|yogur|yoghurt|yogurt natural|yogurt griego', 'l'],
  ['nata', 'nata', 'lacteo', 'D', 'nata|nata de leche'],
  ['queso_crema', 'queso crema', 'lacteo', 'S', 'queso crema|philadelphia|queso para untar'],

  // ── masa y tortillas
  ['tortilla', 'tortillas de maíz', 'masa', 'S', 'tortilla|tortillas|tortilla de maiz|tortillas de maiz|tortillas de comal|tortilla azul|kilo de tortilla'],
  ['tortilla_harina', 'tortillas de harina', 'masa', 'S', 'tortilla de harina|tortillas de harina|tortillas de trigo|burritas'],
  ['tostada', 'tostadas', 'masa', 'S', 'tostada|tostadas|totopo|totopos|tortilla frita|tostadas horneadas|tostadas de maiz'],
  ['tlayuda', 'tlayudas', 'masa', 'S', 'tlayuda|tlayudas|tlayuda grande|tlayuda mediana|tlayuda horneada'],
  ['memela', 'memelas', 'masa', 'S', 'memela|memelas|tetela|tetelas|empanada de maiz'],
  ['sope', 'sopes', 'masa', 'S', 'sope|sopes|huarache|huaraches|picada|picadas'],
  ['masa', 'masa de maíz', 'masa', 'S', 'masa|masa de maiz|masa para tortillas|masa para tamales|masa de nixtamal|nixtamal|masa preparada|kilo de masa|masa para tlayudas'],

  // ── pan
  ['pan_yema', 'pan de yema', 'pan', 'D', 'pan de yema|pan de yemas|pan de huevo|pan oaxaqueno|pan de fiesta', 'l'],
  ['pan_dulce', 'pan dulce', 'pan', 'D', 'pan dulce|pan de dulce|concha|conchas|pan de muerto|dona|donas|rosca|cuernito|cuernitos|oreja|orejas|mantecada|mantecadas|polvoron|polvorones|bisquet|campechana|marquesote|marquesotes|pan de nata|pan de feria', 'l'],
  ['bolillo', 'bolillo', 'pan', 'S', 'bolillo|bolillos|telera|teleras|birote|pambazo|pambazos|cemita|cemitas|pan salado|baguette|pan para tortas'],
  ['pan_caja', 'pan de caja', 'pan', '', 'pan de caja|pan bimbo|pan molde|pan integral|pan tostado|pan de sandwich'],
  ['pan', 'pan', 'pan', '', 'pan|pan blanco', 'l'],

  // ── verduras
  ['jitomate', 'jitomate', 'verdura', 'SA', 'jitomate|jitomates|tomate|tomate rojo|tomate saladet|tomate bola|tomate guaje'],
  ['tomate_verde', 'tomate verde', 'verdura', 'A', 'tomate verde|tomatillo|tomate de cascara|miltomate|tomates verdes'],
  ['cebolla', 'cebolla', 'verdura', 'S', 'cebolla|cebollas|cebolla blanca|cebolla morada|cebolla de rabo|cebollita|cebollitas|cebollin|cebolla cambray'],
  ['ajo', 'ajo', 'verdura', 'S', 'ajo|ajos|cabeza de ajo|cabezas de ajo|diente de ajo'],
  ['cilantro', 'cilantro', 'verdura', 'S', 'cilantro|perejil|manojo de cilantro'],
  ['hierbas', 'hierbas de olor (epazote, hierbabuena…)', 'verdura', 'S', 'epazote|hierbabuena|hierba buena|menta|hierba santa|hoja santa|laurel|tomillo|romero|oregano|hierbas|hierbas de olor|hoja de aguacate'],
  ['limon', 'limón', 'fruta', 'A', 'limon|limones|limon verde|limon con semilla|limon sin semilla|limon real'],
  ['aguacate', 'aguacate', 'verdura', 'S', 'aguacate|aguacates|aguacate hass|aguacate criollo'],
  ['lechuga', 'lechuga o col', 'verdura', 'S', 'lechuga|lechugas|lechuga romana|lechuga orejona|col|repollo|col morada|ensalada'],
  ['papa', 'papa', 'verdura', 'S', 'papa|papas|patata|patatas|papa blanca|papa cambray|papa alfa'],
  ['zanahoria', 'zanahoria', 'verdura', 'S', 'zanahoria|zanahorias'],
  ['calabacita', 'calabacita', 'verdura', 'S', 'calabacita|calabacitas|calabaza tierna|calabaza italiana|calabacin|calabacitas criollas'],
  ['calabaza', 'calabaza de Castilla', 'verdura', 'D', 'calabaza|calabaza de castilla|calabaza de dulce|calabaza de tacha|calabaza grande|calabaza de olla|rebanada de calabaza'],
  ['elote', 'elote', 'verdura', 'S', 'elote|elotes|maiz tierno|mazorca|mazorcas|granos de elote'],
  ['nopal', 'nopales', 'verdura', 'S', 'nopal|nopales|nopalitos|penca'],
  ['chayote', 'chayote', 'verdura', 'S', 'chayote|chayotes'],
  ['ejote', 'ejotes o chícharos', 'verdura', 'S', 'ejote|ejotes|chicharo|chicharos|vainitas'],
  ['pepino', 'pepino', 'verdura', 'S', 'pepino|pepinos'],
  ['flor_calabaza', 'flor de calabaza', 'verdura', 'S', 'flor de calabaza|flores de calabaza|flor de calabacita'],
  ['verdolaga', 'verdolagas o quelites', 'verdura', 'S', 'verdolaga|verdolagas|quelite|quelites|huauzontle|huauzontles|acelga|espinaca|espinacas|hierbamora'],
  ['champinon', 'champiñones', 'verdura', 'S', 'champinon|champinones|hongos|hongo|setas'],
  ['brocoli', 'brócoli o coliflor', 'verdura', 'S', 'brocoli|coliflor'],
  ['camote', 'camote', 'verdura', 'D', 'camote|camotes|batata'],
  ['chile_fresco', 'chile fresco', 'verdura', 'P', 'chile|chiles|chile verde|jalapeno|chile jalapeno|serrano|chile serrano|chile de agua|chile poblano|poblano|habanero|chile habanero|chile manzano|chile guero|guero|chile fresco|chilacas|morron|pimiento|pimiento morron'],

  // ── frutas
  ['platano', 'plátano', 'fruta', 'D', 'platano|platanos|banana|bananas|platano tabasco|platano dominico|platano roatan', 'l'],
  ['platano_macho', 'plátano macho', 'fruta', 'D', 'platano macho|platanos machos|macho|platano para freir'],
  ['manzana', 'manzana', 'fruta', 'D', 'manzana|manzanas|manzana roja|manzana verde', 'l'],
  ['naranja', 'naranja o mandarina', 'fruta', 'DA', 'naranja|naranjas|mandarina|mandarinas|toronja|toronjas|naranja agria|lima|limas', 'l'],
  ['pina', 'piña', 'fruta', 'DA', 'pina|pinas', 'l'],
  ['mango', 'mango', 'fruta', 'D', 'mango|mangos|mango petacon|mango ataulfo|mango manila', 'l'],
  ['papaya', 'papaya', 'fruta', 'D', 'papaya|papayas', 'l'],
  ['melon', 'melón o sandía', 'fruta', 'D', 'melon|melones|sandia|sandias|cantaloupe', 'l'],
  ['fruta', 'fruta de temporada', 'fruta', 'D', 'fruta|frutas|fruta de temporada|fruta picada|durazno|duraznos|pera|peras|uva|uvas|fresa|fresas|ciruela|ciruelas|zapote|mamey|nance|nances|tuna|tunas|granada|guayaba|guayabas|tejocote|tejocotes|kiwi|cereza|cerezas', 'l'],
  ['jicama', 'jícama', 'fruta', 'D', 'jicama|jicamas', 'l'],
  ['coco', 'coco', 'fruta', 'D', 'coco|cocos|coco rallado'],
  ['cana', 'caña de azúcar', 'fruta', 'D', 'cana|canas|cana de azucar', 'l'],

  // ── despensa
  ['arroz', 'arroz', 'despensa', '', 'arroz|arroz blanco|arroz morelos|arroz para horchata'],
  ['frijol', 'frijol', 'despensa', 'S', 'frijol|frijoles|frijol negro|frijol bayo|frijol de olla|frijol en grano|frijoles refritos|frijolitos|frijol colorado|ayocote|ayocotes'],
  ['lenteja', 'lentejas o garbanzos', 'despensa', 'S', 'lenteja|lentejas|garbanzo|garbanzos|haba|habas|alubia|alubias'],
  ['maiz_pozolero', 'maíz pozolero', 'despensa', 'S', 'maiz pozolero|maiz para pozole|cacahuazintle|maiz cacahuazintle|maiz precocido|maiz blanco para pozole'],
  ['pasta', 'pasta para sopa', 'despensa', 'S', 'pasta|sopa de pasta|sopa|espagueti|spaghetti|fideo|fideos|codito|coditos|macarron|tallarin|pluma|codos|letras|estrellitas|conchitas'],
  ['avena', 'avena', 'despensa', '', 'avena|hojuelas de avena|avena en hojuelas|avena molida|quaker'],
  ['harina', 'harina de trigo', 'despensa', '', 'harina|harina de trigo|harina preparada'],
  ['hotcakes', 'mezcla para hot cakes', 'despensa', 'D', 'harina para hot cakes|harina para hotcakes|mezcla para hot cakes|mezcla para hotcakes|hot cakes|hotcakes|pancakes|hot cake'],
  ['pan_molido', 'pan molido', 'despensa', '', 'pan molido|pan rallado|empanizador'],
  ['azucar', 'azúcar', 'despensa', 'D', 'azucar|azucar morena|azucar glass|azucar mascabado|azucar refinada|bolsa de azucar'],
  ['piloncillo', 'piloncillo', 'despensa', 'D', 'piloncillo|piloncillos|panocha|cono de piloncillo'],
  ['canela', 'canela', 'despensa', 'D', 'canela|canela en raja|canela molida|raja de canela|rajas de canela|canela en polvo'],
  ['chocolate', 'chocolate de mesa', 'despensa', 'DM', 'chocolate|chocolate de agua|chocolate de mesa|chocolate abuelita|abuelita|chocolate de leche|tablilla|tablillas|chocolate oaxaqueno|chocolate en barra|cocoa|cacao|cacao en polvo|chocolate en polvo|ibarra|chocolate amargo|nutella'],
  ['miel', 'miel', 'despensa', 'D', 'miel|miel de abeja|miel de maiz|miel de agave|jarabe|maple'],
  ['cajeta', 'cajeta', 'despensa', 'D', 'cajeta|dulce de leche|cajeta quemada', 'l'],
  ['mermelada', 'mermelada', 'despensa', 'D', 'mermelada|mermeladas|jalea|ate|ates|ate de membrillo', 'l'],
  ['cacahuate', 'cacahuates y semillas', 'despensa', 'S', 'cacahuate|cacahuates|cacahuate japones|garapinados|cacahuates garapinados|nuez|nueces|almendra|almendras|pistache|pistaches|semillas|pepitas|pepita|semilla de calabaza', 'l'],
  ['pasas', 'pasas', 'despensa', 'D', 'pasas|pasa|uvas pasas|ciruelas pasas|frutos secos'],
  ['ajonjoli', 'ajonjolí', 'despensa', 'S', 'ajonjoli|sesamo'],
  ['galleta', 'galletas', 'dulce', 'D', 'galleta|galletas|galleta maria|galletas marias|marias|galletas de animalitos|animalitos|galletas saladas|saladitas|habaneras|marinela', 'l'],
  ['gelatina', 'gelatina', 'dulce', 'D', 'gelatina|gelatinas|grenetina|gelatina en polvo|gelatina de leche', 'l'],
  ['flan', 'flan', 'dulce', 'D', 'flan|flanes|flan napolitano|mezcla para flan|polvo para flan', 'l'],
  ['dulce', 'dulces y golosinas', 'dulce', 'D', 'dulce|dulces|paleta|paletas|chicle|chicles|gomita|gomitas|caramelo|caramelos|bombon|bombones|malvavisco|oblea|obleas|alegria|alegrias|amaranto|palanqueta|palanquetas|golosinas|chocolatina|chocolatinas|mazapan|cocada|cocadas|jamoncillo|nicuatole|nicuatoles|dulces tipicos|dulce regional|turron|merengue|merengues|bolsa de dulces', 'l'],
  ['helado', 'helado o nieve', 'dulce', 'D', 'helado|helados|nieve|nieves|paleta de hielo|paleta helada|boli|bolis|raspado|raspados|nieve de limon|nieve de fresa|nieve de mango|nieve de coco|nieve de vainilla|nieve de chocolate|nieve de tuna|nieve de leche|nieve de garrafa|nieve de guanabana|nieve de pina|paleta de limon|paleta de fresa|paleta de mango|paleta de coco|paleta de agua|paleta de crema|raspado de limon|raspado de tamarindo|raspado de fresa|raspado de mango|helado de vainilla|helado de chocolate|helado de fresa', 'l'],
  ['aceite', 'aceite', 'despensa', '', 'aceite|aceite vegetal|aceite de oliva|aceite de cocina|aceite comestible|aceite de maiz|nutrioli', 'c'],
  ['manteca', 'manteca o asiento', 'despensa', 'S', 'manteca|manteca de cerdo|manteca vegetal|asiento|asiento de chicharron'],
  ['sal', 'sal', 'despensa', 'S', 'sal|sal de grano|sal de mesa|sal molida|sal gruesa', 'c'],
  ['especias', 'pimienta y especias', 'despensa', 'S', 'pimienta|pimienta negra|pimienta molida|especias|especia|comino|clavo|clavos|anis|achiote|recado|recado rojo', 'c'],
  ['caldo_polvo', 'consomé o caldo en polvo', 'despensa', 'S', 'consome|caldo de pollo en polvo|caldo en polvo|knorr|maggi|sazonador|cubito|cubitos|caldo concentrado', 'c'],
  ['mayonesa', 'mayonesa', 'despensa', 'S', 'mayonesa|mayonesas|hellmans|hellmann'],
  ['salsa', 'salsa picante', 'despensa', 'PS', 'salsa|salsas|salsa picante|salsa roja|salsa verde|salsa botanera|valentina|salsa macha|salsa de chile|salsa negra|chiles en vinagre|chiles en escabeche|jalapenos en vinagre|encurtidos'],
  ['chile_polvo', 'chile en polvo con limón', 'despensa', 'PA', 'tajin|chile en polvo|chile piquin|polvo de chile|miguelito|limon y sal'],
  ['chamoy', 'chamoy', 'despensa', 'DPA', 'chamoy|chamoy liquido|salsa de chamoy|pulparindo'],
  ['chile_seco', 'chile seco (guajillo, pasilla…)', 'despensa', 'P', 'guajillo|chile guajillo|pasilla|chile pasilla|ancho|chile ancho|costeno|chile costeno|chile seco|chiles secos|morita|chile morita|chile de arbol|cascabel|chilhuacle|chilhuacles|chilcostle|pasilla oaxaquena|chile amarillo'],
  ['chipotle', 'chipotle', 'despensa', 'P', 'chipotle|chipotles|chiles chipotle|chipotle en adobo|chile chipotle|adobo|lata de chipotle'],
  ['mole', 'mole', 'despensa', 'SDP', 'mole|mole negro|mole rojo|mole coloradito|coloradito|mole verde|mole amarillo|pasta de mole|mole en pasta|mole poblano|mole almendrado|manchamanteles|chichilo|mole de olla|dona maria'],
  ['pure_tomate', 'puré de tomate', 'despensa', 'S', 'pure de tomate|pure|salsa de tomate|jugo de tomate|tomate en lata|salsa de jitomate'],
  ['jamaica', 'flor de jamaica', 'despensa', 'A', 'jamaica|flor de jamaica'],
  ['tamarindo', 'tamarindo', 'despensa', 'DA', 'tamarindo|tamarindos|pulpa de tamarindo|tamarindo en bola'],
  ['cafe', 'café', 'bebida', 'M', 'cafe|cafe molido|cafe soluble|nescafe|cafe de grano|cafe de olla|capuchino|americano|espresso|cafe americano|cafe con leche|latte|moka'],
  ['vainilla', 'vainilla', 'despensa', 'D', 'vainilla|esencia de vainilla|extracto de vainilla', 'c'],

  // ── bebidas
  ['refresco', 'refresco o jugo', 'bebida', 'D', 'refresco|refrescos|coca|coca cola|pepsi|sidral|fanta|sprite|jarritos|soda|boing|jugo|jugos|jumex|nectar|del valle|jugo de naranja|jugo natural|jugo de manzana|jugo de pina', 'l'],
  ['agua_fresca', 'agua fresca o atole', 'bebida', 'D', 'agua fresca|aguas frescas|agua de jamaica|agua de horchata|horchata|agua de tamarindo|licuado|licuados|tejate|tepache|atole|champurrado|chocolate caliente|agua de sabor|limonada|naranjada|jugo verde|jugo de zanahoria|te de manzanilla|te de canela|ponche|malteada|malteadas', 'l'],
  ['agua', 'agua', 'bebida', '', 'agua|agua embotellada|garrafon|agua purificada|agua natural|botella de agua|hielo', 'c'],
  ['alcohol', 'bebidas alcohólicas', 'bebida', '', 'cerveza|cervezas|mezcal|mezcales|tequila|vino|licor|aguardiente|brandy|ron|whisky|pulque|chela|chelas|caguama|caguamas|destilado', 'x'],

  // ── comida preparada
  ['tamal', 'tamales', 'preparado', 'S', 'tamal|tamales|tamal oaxaqueno|tamal de mole|tamal de frijol|tamal de amarillo|tamal de rajas|tamal de elote|tamal de chepil|chepil|tamalitos|tamalito|tamales oaxaquenos', 'l'],
  ['tamal_dulce', 'tamales dulces', 'preparado', 'D', 'tamal de dulce|tamales de dulce|tamal dulce|tamales dulces|tamal de pina|tamal de fresa', 'l'],
  ['antojito', 'antojitos', 'preparado', 'S', 'tacos|taco|tacos al pastor|al pastor|tacos de canasta|tacos dorados|flautas|taquitos|quesadilla|quesadillas|empanada|empanadas|empanada de amarillo|empanadas de amarillo|empanadas de quesillo|gordita|gorditas|garnacha|garnachas|memela preparada|tlayuda preparada|tlayuda con tasajo|tlayuda con cecina|tlayuda con chorizo|tlayuda sencilla|torta|tortas|hamburguesa|hamburguesas|elote preparado|elote asado|esquites|esquite|tostadas de tinga|tostadas de pollo|tostadas de pata|chilaquiles|enchiladas|enfrijoladas|entomatadas|enmoladas|molotes|molote|nachos|pizza|pizzas|sandwich', 'l'],
  ['comida_hecha', 'comida lista', 'preparado', 'S', 'caldo|caldo de res|caldo de gallina|barbacoa|carnitas|pozole|menudo|birria|mole con pollo|mole negro con pollo|mole rojo con pollo|coloradito con pollo|estofado|amarillo con pollo|segueza|chileatole|sopa de guias|comida corrida|comida casera|comida del dia|menu del dia|platillo|platillos|guisado|guisados|cazuela|cocido|arroz con pollo|pescado frito|mojarra frita|pollo asado|pollo rostizado|pollo frito|alitas picantes|parrillada|cecina asada|tasajo asado|chorizo asado|cochinita|pancita|mixiote|mixiotes|cabrito|borrego', 'l'],

  // ── platillos (solo para entender lo que venden fondas, pastelerías, puestos…)
  ['postre', 'pasteles y postres', 'dulce', 'D', 'pastel|pasteles|pastelillo|pastelillos|cupcake|cupcakes|brownie|brownies|rebanada de pastel|pastel de chocolate|pastel de vainilla|pastel de fresa|pastel de zanahoria|pastel de elote|pastel de tres leches|pastel tres leches|tres leches|tiramisu|panque|panques|bizcocho|bizcochos|mil hojas|selva negra|pay|pays|pay de queso|pay de limon|pay de manzana|pay de nuez|cheesecake|churros|churro|crepa|crepas|waffle|waffles|donas rellenas|donuts|capirotada|bunuelos|bunuelo|arroz con leche|natilla|natillas|budin|trufas|trufa|mousse|postre|postres|postrecito|postres caseros', 'lp'],
  ['fruta_preparada', 'fruta preparada', 'dulce', 'D', 'fresas con crema|fresa con crema|fresas con chocolate|fresas con lechera|fresas con nata|fresas con yogurt|duraznos con crema|durazno con crema|platanos con crema|fruta con crema|manzana con crema|ensalada de manzana|ensalada de frutas|coctel de frutas|copa de fruta|vasito de fruta|vaso de fruta|fruta picada|fruta con yogurt|fruta con chile|mangonada|chamoyada|mango con chile|pepino con chile|jicama con chile|fruta con chamoy|frutas con chile', 'lp'],
  ['desayuno', 'desayunos', 'preparado', 'S', 'desayuno|desayunos|desayuno completo|desayuno americano|desayuno mexicano|huevos al gusto|huevos a la mexicana|huevos rancheros|huevos revueltos|huevos divorciados|huevos con jamon|huevos con chorizo|huevos con frijoles|huevo con nopales|huevo con jamon|huevos con salchicha|huevos con tocino|huevos estrellados|huevos fritos|omelette|omelet|machaca|molletes|mollete|panqueques|yogurt con granola|torta de huevo|pan con chocolate', 'lp'],
  ['guisado', 'guisados y platos fuertes', 'preparado', 'S', 'guisado|guisados|comida corrida|menu del dia|comida del dia|platillo del dia|plato del dia|plato fuerte|bistec a la mexicana|milanesa de pollo|milanesa de res|pollo en salsa|pollo en salsa verde|pollo en salsa roja|pollo a la mexicana|pollo al horno|pollo con papas|pollo empanizado|pollo a la parrilla|pollo al carbon|pollo a las brasas|medio pollo|cuarto de pollo|costillas en salsa|costillas de cerdo|costillitas|chuleta de cerdo|chuletas asadas|picadillo|albondigas|albondigas en caldillo|carne en su jugo|arrachera asada|alambre|alambres|pescado empanizado|pescado a la plancha|camarones empanizados|camarones al ajillo|camarones a la diabla|ceviche|coctel de camaron|caldo de camaron|lasana|lasagna|rajas con crema|chiles rellenos|chile relleno|chiles en nogada|nopales asados|nopales con huevo|ensalada de nopales|sopa de verduras|sopa de fideo|sopa de arroz|sopa de tortilla|crema de elote|crema de champinones|crema de calabaza|consome de pollo|frijoles charros|frijoles refritos|arroz rojo|arroz blanco', 'lp'],
];

export interface Ingrediente {
  id: string;
  nombre: string;
  cat: CategoriaProducto;
  sabores: Sabor[];
  casa: boolean;
  listo: boolean;
  evitar: boolean;
  /** Platillo: se usa para entender productos, no para buscar ingredientes en un mensaje. */
  platillo: boolean;
  /** Frases del diccionario, ya en palabras. */
  frases: string[][];
}

const LETRA_SABOR: Record<string, Sabor> = { D: 'dulce', S: 'salado', P: 'picante', A: 'acido', M: 'amargo' };

export const INGREDIENTES: Record<string, Ingrediente> = {};
const ORDEN: string[] = [];

for (const [id, nombre, cat, sab, sin, banderas = ''] of TABLA) {
  INGREDIENTES[id] = {
    id,
    nombre,
    cat,
    sabores: sab.split('').map((l) => LETRA_SABOR[l]),
    casa: banderas.includes('c'),
    listo: banderas.includes('l'),
    evitar: banderas.includes('x'),
    platillo: banderas.includes('p'),
    frases: sin.split('|').map((f) => tokens(f)),
  };
  ORDEN.push(id);
}

export const nombreIngrediente = (id: string) => INGREDIENTES[id]?.nombre ?? id;

export interface Clasificacion {
  ingrediente?: string;
  categoria: CategoriaProducto;
  sabores: Sabor[];
  listo: boolean;
  evitar: boolean;
  /** Para cocinar o ya preparado. */
  tipo: TipoProducto;
  /** Todo lo que se entiende del producto: sabor, momento, qué lleva y si se sirve caliente. */
  etiquetas: Etiqueta[];
}

interface Coincidencia {
  id: string;
  puntos: number;
  frase: string;
  /** Posición en el texto (en palabras) y cuántas palabras ocupa. */
  desde: number;
  largo: number;
}

/** Todas las coincidencias de un texto, de mayor a menor puntaje. */
function coincidencias(texto: string[]): Coincidencia[] {
  const res: Coincidencia[] = [];
  for (const id of ORDEN) {
    let mejor: Coincidencia | null = null;
    for (const f of INGREDIENTES[id].frases) {
      const m = encontrarFrase(texto, f);
      if (!m) continue;
      const letras = f.reduce((a, p) => a + p.length, 0);
      const puntos = f.length * 100 + letras + m.calidad;
      if (!mejor || puntos > mejor.puntos) mejor = { id, puntos, frase: f.join(' '), desde: m.desde, largo: f.length };
    }
    if (mejor) res.push(mejor);
  }
  return res.sort((a, b) => b.puntos - a.puntos);
}

/**
 * Entiende qué es un producto a partir de su nombre ("Pechuga de pollo", "Fresas con crema"…).
 * Con el giro del negocio decide si es algo para cocinar o ya preparado: en una fonda o pastelería casi todo está listo para comerse.
 */
export function clasificar(nombre: string, giro?: string, forzarTipo?: TipoProducto): Clasificacion {
  const todas = coincidencias(tokens(nombre));
  // En una carnicería, verdulería o tortillería "chuletas de cerdo" es carne para cocinar, no un platillo
  const crudo = !!giro && !forzarTipo && grupoDeGiro(giro) === 'frescos';
  const c = (crudo ? todas.find((x) => !INGREDIENTES[x.id].platillo && INGREDIENTES[x.id].cat !== 'preparado') : undefined) ?? todas[0];
  const ing = c ? INGREDIENTES[c.id] : undefined;
  const tipo: TipoProducto =
    forzarTipo ?? (ing?.platillo || ing?.cat === 'preparado' || vendePreparado(giro) ? 'preparado' : 'ingrediente');
  const sabores = ing?.sabores ?? [];
  const etiquetas = perfilDe(nombre, { cat: ing?.cat ?? (tipo === 'preparado' ? 'preparado' : 'otro'), sabores, id: ing?.id }, tipo, giro);
  let categoria: CategoriaProducto = ing?.cat ?? (tipo === 'preparado' ? 'preparado' : 'otro');
  // Un platillo ya hecho se agrupa como comida, postre o bebida aunque lleve ingredientes de otra categoría (tlayuda, papas a la francesa…).
  if (tipo === 'preparado' && !['dulce', 'bebida', 'pan', 'preparado'].includes(categoria)) {
    categoria = etiquetas.includes('bebida') && !etiquetas.includes('comida') ? 'bebida' : etiquetas.includes('postre') ? 'dulce' : 'preparado';
  }
  return {
    ingrediente: ing && !ing.platillo ? ing.id : undefined,
    categoria,
    sabores,
    listo: ing?.listo ?? false,
    evitar: ing?.evitar ?? false,
    tipo,
    etiquetas,
  };
}

/**
 * Tipo y características de un producto ya guardado. Los productos que no traen tipo ni etiquetas
 * (los que el comerciante no corrigió) se deducen del nombre y del giro del negocio.
 */
export function perfilDeProducto(
  p: Pick<Producto, 'nombre' | 'tipo' | 'etiquetas'>,
  giro?: string,
  /** Si ya se clasificó el nombre, se reutiliza para no repetir el trabajo. */
  ya?: Clasificacion,
): { tipo: TipoProducto; etiquetas: Etiqueta[]; c: Clasificacion } {
  const c = ya ?? clasificar(p.nombre, giro, p.tipo);
  if (p.etiquetas?.length) return { tipo: c.tipo, etiquetas: p.etiquetas, c };
  return { tipo: c.tipo, etiquetas: c.etiquetas, c };
}

/** Palabras que describen sabor o momento y no deben leerse como ingrediente ("algo dulce"). */
const NO_INGREDIENTE = new Set(['dulce', 'dulces', 'sopa', 'carne', 'pan', 'ensalada', 'agua', 'fruta', 'frutas', 'salsa', 'salsas']);

/** Ingredientes que una persona menciona en un mensaje ("con pollo y quesillo"). */
export function ingredientesEnTexto(texto: string): string[] {
  const t = tokens(texto);
  const vistos: string[] = [];
  const usadas = new Set<number>();
  for (const c of coincidencias(t)) {
    if (INGREDIENTES[c.id].platillo) continue;
    const posiciones = Array.from({ length: c.largo }, (_, i) => c.desde + i);
    if (posiciones.every((p) => usadas.has(p))) continue;
    posiciones.forEach((p) => usadas.add(p));
    if (NO_INGREDIENTE.has(c.frase)) continue;
    if (INGREDIENTES[c.id].evitar || INGREDIENTES[c.id].casa) continue;
    vistos.push(c.id);
  }
  return vistos;
}
