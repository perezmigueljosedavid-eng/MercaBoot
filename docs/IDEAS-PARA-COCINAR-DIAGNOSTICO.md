# «Ideas para cocinar»: diagnóstico y plan

| | |
|---|---|
| **Proyecto** | Mercaboot |
| **Autor principal** | José David Pérez Miguel |
| **Segunda autora** | Izebel Altamirano Carreño |
| **Fecha** | 21 de noviembre de 2026 |
| **Estado** | Diagnóstico terminado. El plan está por aprobar; todavía no se cambió el código. |

© 2026 José David Pérez Miguel. Todos los derechos reservados (ver [LICENSE](../LICENSE)).

Este documento explica por qué la pantalla «Ideas para cocinar» no da receta cuando el cliente escribe «galletas», «pastel», «pollo en salsa verde» o «pollo en salsa roja», y cómo se arreglaría. Forma parte de la fase 1 de la [hoja de ruta](HOJA-DE-RUTA-VERSION-2.md).

## 1. Qué es hoy

Es un motor propio (carpeta `src/ia`, unas 4,600 líneas) que corre dentro del celular: no usa internet y no cuesta nada. Conoce **95 recetas** escritas a mano (36 saladas, 20 dulces y 39 más) y solo ofrece productos que las tiendas tienen publicados como disponibles.

## 2. Cómo se probó

Se probaron 41 frases sin cambiar el código de la app, con un catálogo de prueba de 5 tiendas y 26 productos. De las 41 frases, 37 son nombres de platillos y 4 son pedidos por ingrediente o antojo. El catálogo de prueba no es la base real; sirve para ver cómo decide el motor.

## 3. Resultados

| Tipo de frase | Frases | Receta correcta | Receta parecida | Nada útil o equivocado |
|---|---|---|---|---|
| Nombres de platillos | 37 | 2 | 5 | 30 |
| Pedidos por ingrediente o antojo («qué cocino con pollo y papa», «algo dulce»…) | 4 | 4 | 0 | 0 |

Lo más importante:

- De 6 platillos que **sí están** en el recetario, solo 2 salieron bien («pozole» y «chilaquiles»). «Pollo en salsa verde», «arroz con leche», «enchiladas verdes» y «flan» no mostraron su receta.
- Con «dame la receta del pollo en salsa roja» se dio la receta de **«Pollo en salsa verde»**, que es otra.
- Con «cómo hacer un pastel» propuso una cena de enchiladas.
- «Pay de limón» y «agua de limón» mostraron milanesas y pollo dorado.
- Cuatro frases terminaron en «No estoy seguro de haberte entendido» (lasaña, ceviche, brownies y pico de gallo).

## 4. Causas

1. **Un platillo escrito suelto se trata como un producto.** El motor lo marca como «ingrediente» (función `entender()`). Si alguna tienda vende una de las palabras (pollo, arroz, limón…), responde «Sí hay… en tal tienda» y propone recetas que salen del ingrediente, en lugar de la receta pedida (función `ingrediente()` de `motor.ts`).
2. **El recetario es pequeño.** Con 95 recetas no se cubren galletas, pasteles, mole, tamales, pizza, pasta, hamburguesas, etc.
3. **La búsqueda por nombre se conforma con que coincidan casi todas las palabras** y no revisa contradicciones: «pollo en salsa roja» coincide con 2 de 3 palabras de «Pollo en salsa verde» y se da por buena.
4. **Cuando no entiende, muestra recetas sin relación** en vez de decir que no la tiene. El mensaje «todavía no tengo esa receta» solo aparece en casos muy específicos.
5. **Algunas frases no se reconocen** y caen en «No estoy seguro de haberte entendido».

## 5. Plan

### Capa 1 · Entender mejor (gratis, sin internet)

- **Primero el platillo, después el producto.** Se quitan las palabras de relleno («receta de», «cómo hacer», «quiero», «se me antoja») y, si lo que queda se parece a un platillo, se muestra la receta. Solo si no hay receta se busca el producto.
- **Coincidencia con confianza.** La coincidencia exacta gana; las palabras que se contradicen («verde» y «roja», «dulce» y «salado», «pollo» y «res») restan puntos o descartan la receta.
- **Sinónimos y variantes.** Por ejemplo: agua de limón = limonada; galletas = galletas de mantequilla, de avena o con chispas; pastel = de vainilla, de chocolate o tres leches. Cuando la frase es general, se ofrecen tres variantes para elegir.
- **Honestidad.** Si no hay una receta confiable, se dice «todavía no tengo esa receta» y se ofrecen opciones cercanas. Nunca se muestran recetas sin relación como si respondieran la pregunta.

### Capa 2 · Recetario grande (gratis, sin internet)

- De 95 a unas 300 recetas con el mismo formato de hoy (ingredientes ligados a los ingredientes que reconoce el catálogo, pasos, tiempo y porciones).
- Platillos mexicanos y oaxaqueños comunes, horneados básicos (galletas, pastel, brownies, pan), salsas, sopas, antojitos y bebidas.
- Un generador de combinaciones «carne + salsa» («pollo en salsa roja», «res en salsa verde», «cerdo en chile pasilla»…) para no escribir cada una a mano.
- El autor revisa el sabor local; las recetas con riesgo (carne, pollo, pescado) llevan tiempos de cocción claros.
- El texto de lo que no se encontró se guarda sin datos personales y marca cuáles recetas escribir después.

### Capa 3 · IA para lo que no esté (opcional, costo muy bajo)

- Una función de Supabase recibe el texto, pide la receta a un modelo de IA en el mismo formato que las recetas locales, la valida y la guarda en una tabla de caché.
- La app la muestra igual que las demás, con los ingredientes que sí hay en las tiendas y en cuál conviene comprar. El asistente sigue sin inventar productos: solo ofrece los que las tiendas publicaron.
- Límite de uso por persona (se reutiliza la tabla `limites_uso`) y tope mensual de gasto en el proveedor.
- Etiqueta visible: «Receta sugerida por IA: revísala antes de cocinar».
- Costo estimado: alrededor de US$0.0006 por receta nueva (supuesto de 1,500 tokens de entrada y 900 de salida con los precios publicados de Claude Haiku 5.5, fuente secundaria). Las recetas repetidas salen del caché y no cuestan.

## 6. Riesgos y cuidados

- **Seguridad alimentaria.** Las recetas con carne, pollo o pescado deben indicar cocción completa. Las recetas de IA llevan la etiqueta de revisión y se limita a platillos de comida y bebida.
- **Alergias.** La app no promete que una receta sea libre de un alérgeno.
- **Privacidad.** En la capa 3 el texto que escribe la persona se envía a un proveedor de IA, sin su nombre ni su cuenta. Hay que decirlo en el aviso de privacidad.
- **Llaves.** La llave del proveedor de IA va solo como secreto de Supabase, nunca en la app ni en el repositorio.

## 7. Cómo se sabrá que quedó bien

- Una lista de unas 60 frases (las 37 de esta prueba más las que pida el autor) con la receta esperada para cada una, que se corre antes de cada versión.
- Ninguna frase de la lista muestra recetas sin relación.
- Los platillos que ya existen en el recetario salen siempre cuando se escriben por su nombre.
- El recetario llega a unas 300 recetas con ingredientes ligados al catálogo.

## Anexo · Las 41 frases de la prueba

Resultado: ✓ receta correcta · ≈ receta parecida · ✗ nada útil o equivocado.

| # | Frase escrita | Qué respondió el asistente | Resultado |
|---|---|---|---|
| 1 | pollo en salsa verde | Una tienda con pollo y recetas sin relación; no mostró «Pollo en salsa verde», que sí existe | ✗ |
| 2 | pozole | «Pozole rojo» con pasos | ✓ |
| 3 | arroz con leche | Tiendas con arroz y recetas sin relación; no mostró «Arroz con leche», que sí existe | ✗ |
| 4 | chilaquiles | «Chilaquiles verdes» con pasos y «Chilaquiles rojos con pollo» | ✓ |
| 5 | enchiladas verdes | Una tienda que no vende enchiladas; no mostró «Enchiladas verdes con pollo», que sí existe | ✗ |
| 6 | flan | «Ninguna tienda tiene flan» y otros dulces; no mostró «Flan casero», que sí existe | ✗ |
| 7 | galletas | Una tienda con galletas y recetas sin relación | ✗ |
| 8 | pastel | Solo el pastel de la pastelería, sin receta | ✗ |
| 9 | pollo en salsa roja | Una tienda con pollo y recetas sin relación | ✗ |
| 10 | receta de galletas | Fresas con crema y Carlota de limón | ✗ |
| 11 | cómo hacer un pastel | Propuso una cena (Enchiladas verdes con pollo, Frijoles de la olla…) | ✗ |
| 12 | dame la receta del pollo en salsa roja | Dio «Pollo en salsa verde» | ✗ |
| 13 | mole | «Ninguna tienda tiene mole», sin receta (existe «Pollo con mole») | ✗ |
| 14 | tamales | Sin receta | ✗ |
| 15 | lasaña | «No estoy seguro de haberte entendido» | ✗ |
| 16 | hamburguesa | Sin receta | ✗ |
| 17 | pizza | Sin receta | ✗ |
| 18 | sopa de fideo | «Sopa de pasta» | ≈ |
| 19 | tacos al pastor | «Tacos de bistec» | ≈ |
| 20 | pay de limón | Milanesas con ensalada; Pollo dorado con ajo y limón | ✗ |
| 21 | enchiladas suizas | «Enchiladas verdes con pollo» | ≈ |
| 22 | pollo a la naranja | Enchiladas verdes con pollo; Sopa de pasta | ✗ |
| 23 | caldo de camarón | «Caldo de pollo con verduras» | ≈ |
| 24 | ceviche | «No estoy seguro de haberte entendido» | ✗ |
| 25 | pan de muerto | Sin receta | ✗ |
| 26 | empanadas | Sin receta | ✗ |
| 27 | pasta alfredo | Sopa de pasta (no es alfredo) | ✗ |
| 28 | pastel de chocolate | Crepas con cajeta; Chocolate caliente con pan de yema | ✗ |
| 29 | galletas de avena | Licuado de plátano; Fresas con crema | ✗ |
| 30 | brownies | «No estoy seguro de haberte entendido» | ✗ |
| 31 | pico de gallo | «No estoy seguro de haberte entendido» | ✗ |
| 32 | licuado de fresa | Sin receta (existe «Licuado de plátano») | ✗ |
| 33 | agua de limón | Milanesas; Pollo dorado con ajo y limón (existe «Limonada») | ✗ |
| 34 | sopa de lentejas | Sopa de pasta | ✗ |
| 35 | hot dogs | Sin receta | ✗ |
| 36 | tacos de canasta | «Tacos de bistec» | ≈ |
| 37 | sopa de tortilla | Una tienda de tortillas y recetas sin relación | ✗ |
| 38 | qué cocino con pollo y papa | Pollo dorado con ajo y limón; Enchiladas verdes con pollo; Sopa de pasta | ✓ |
| 39 | algo dulce | Dulces ya listos y recetas dulces | ✓ |
| 40 | tengo huevo y jitomate | Huevos a la mexicana; Omelette; Huevos rancheros | ✓ |
| 41 | dónde hay huevo | La tienda que lo vende | ✓ |
