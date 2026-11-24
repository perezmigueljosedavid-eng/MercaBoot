# 🛒 MercaBoot

**MercaBoot** es un proyecto desarrollado por **José David Pérez Miguel** e **Izebel Altamirano Carreño** para la materia de **Inteligencia Artificial** de la Licenciatura en Computación.

El proyecto consiste en el desarrollo de una aplicación móvil enfocada en facilitar la comunicación entre **clientes y pequeños comercios locales**, permitiendo consultar de manera sencilla la disponibilidad de productos, promociones, horarios, servicio a domicilio y otra información importante del negocio.

## 💡 Idea del proyecto

En muchas ocasiones, los clientes necesitan acudir a una tienda, pollería, cremería, tortillería, carnicería o negocio de comida para comprar algún producto, pero desconocen si este se encuentra disponible. Esto puede provocar desplazamientos innecesarios cuando, por ejemplo, un producto ya se agotó o el establecimiento se encuentra cerrado.

MercaBoot busca solucionar este problema mediante una plataforma donde los comerciantes puedan mantener actualizada la información de sus productos y los clientes puedan consultarla antes de acudir al establecimiento.

## 👥 Tipos de usuarios

La aplicación contará principalmente con dos tipos de usuarios:

### 👤 Cliente

El cliente podrá:

* Registrarse e iniciar sesión.
* Consultar diferentes negocios locales.
* Ver los productos disponibles.
* Consultar si un producto se encuentra agotado.
* Ver promociones y avisos.
* Consultar horarios y servicio a domicilio.
* Calificar los negocios mediante estrellas.
* Escribir reseñas y comentarios.
* Identificarse como cliente frecuente y, posteriormente, obtener posibles beneficios.
* Utilizar un asistente de Inteligencia Artificial para obtener recomendaciones de comida y recetas.

### 🏪 Comerciante

El comerciante podrá:

* Registrarse como vendedor/comerciante.
* Registrar su negocio.
* Agregar y administrar productos.
* Actualizar la disponibilidad de sus productos.
* Publicar avisos.
* Informar cuando un producto se haya agotado.
* Publicar promociones.
* Indicar si el negocio está abierto o cerrado.
* Indicar si cuenta con servicio a domicilio.

## 🤖 Inteligencia Artificial

Uno de los componentes principales de MercaBoot será la integración de **Inteligencia Artificial**.

El usuario podrá realizar consultas mediante lenguaje natural. Por ejemplo:

> "Se me antoja algo salado para hacer de comer."

La IA podrá generar diferentes ideas de comida o recetas y posteriormente relacionarlas con los productos disponibles dentro de los negocios registrados en MercaBoot.

Por ejemplo, si una receta necesita pollo, tortillas y quesillo, la aplicación podrá mostrar los negocios que actualmente cuentan con esos productos disponibles.

También se contempla que la IA pueda recomendar establecimientos que ya tengan comida preparada relacionada con lo que el usuario está buscando.


## 🚀 Versión 2 («Mercaboot 2»)

Después de la exposición se armó la **versión 2** (rama `version-2`), que se instala como otra app y no reemplaza a la versión final registrada. Agrega:

* Herramientas para **tiendas con muchos productos**: catálogo listo para palomear, precios de hoy, importar la lista desde Excel o Google Sheets o desde una foto, escáner de códigos de barras y horario que abre y cierra el negocio solo.
* **Compartir el negocio** con enlace, código QR y cartel para imprimir.
* **Pagos**: efectivo, transferencia o link de tarjeta del propio negocio (Mercaboot no cobra ni mueve dinero).
* **Boti con más funciones**: arma «mi mandado», dice qué tiendas están abiertas y avisa cuando llega un producto.
* **Avisos al teléfono** y **recetas con IA** para los platillos que no estén en el recetario (las dos se activan con cuentas del autor; vienen listas y dormidas).
* **Reportar y bloquear**, **eliminar mi cuenta**, pantalla de error con reintento y pantalla «Acerca de».

Detalle y estado de cada punto: [`docs/HOJA-DE-RUTA-VERSION-2.md`](docs/HOJA-DE-RUTA-VERSION-2.md). Para instalarla y activarla: [`docs/GUIA-DE-ACTIVACION.md`](docs/GUIA-DE-ACTIVACION.md) y [`LEEME.md`](LEEME.md).

## ©️ Autoría y derechos de autor

**Mercaboot** (aplicación, código, diseño de la interfaz, base de datos, personaje «Boti», logotipo, título, sonidos, textos y documentación) es obra de **José David Pérez Miguel** (autor principal) e **Izebel Altamirano Carreño** (segunda autora).

Copyright © 2026 José David Pérez Miguel. **Todos los derechos reservados.** Ver el archivo [`LICENSE`](LICENSE). Las piezas de terceros conservan sus licencias: ver [`THIRD-PARTY-LICENSES.md`](THIRD-PARTY-LICENSES.md).
