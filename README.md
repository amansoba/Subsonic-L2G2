# Subsonic

Repositorio para el desarrollo del proyecto de la asignatura PI.

## Descripción

Subsonic es una aplicación web para una empresa ficticia de festivales de música del mismo nombre. El sitio permite a los usuarios explorar próximos festivales y eventos, ver detalles de artistas, comprar entradas y adquirir merchandising de la tienda oficial.

Este proyecto es una aplicación puramente **frontend** que no requiere un backend. Todos los datos son simulados y se almacenan en el navegador del usuario utilizando `localStorage`, lo que significa que la información de entradas, carritos de compra y pedidos persistirá entre visitas.

## Características

El proyecto está dividido en varios módulos que ofrecen distintas funcionalidades según el rol del usuario (visitante, cliente, proveedor o administrador).

### Funcionalidades Públicas
*   **Página de Inicio**: Presenta los próximos festivales destacados.
*   **Festivales y Eventos**: Lista completa de todos los eventos con opciones de búsqueda y filtrado.
*   **Detalle de Evento**: Muestra información detallada de un evento, incluyendo el cartel de artistas y los tipos de entradas disponibles.
*   **Artistas**: Página para explorar los artistas que participan en los festivales.
*   **Tienda**: Catálogo de productos de merchandising.
*   **Autenticación**: Formularios de inicio de sesión y registro (simulados).

### Panel de Cliente (`/client`)
*   **Dashboard Personal**: Un resumen de la actividad del cliente.
*   **Mis Entradas**: Lista de las entradas compradas por el usuario, con la opción de ver detalles y códigos QR (simulados).
*   **Mis Pedidos**: Historial de compras realizadas en la tienda.
*   **Perfil**: Permite al usuario ver y editar sus datos.

### Panel de Proveedor (`/spaces`)
*   **Gestión de Espacios**: Los proveedores pueden ver y solicitar el alquiler de espacios (como *food trucks* o puestos de merchandising) dentro de los recintos del festival.

### Panel de Administración (`/admin`)
*   **Gestión de Eventos**: Crear, editar y eliminar eventos.
*   **Gestión de Artistas**: Añadir y editar información de los artistas.
*   **Gestión de Productos**: Añadir y eliminar productos de la tienda.
*   **Gestión de Espacios**: Administrar los espacios disponibles para proveedores.

## Tecnologías Utilizadas

*   **HTML5**: Para la estructura semántica de las páginas.
*   **CSS3**: Para el diseño y la maquetación, a través de una hoja de estilos personalizada en `css/styles.css`.
*   **JavaScript (ES6+)**: Para toda la lógica de la aplicación, incluyendo:
    *   Enrutamiento del lado del cliente basado en el atributo `data-page`.
    *   Manipulación dinámica del DOM.
    *   Gestión de estado y roles de usuario.
*   **LocalStorage**: Como mecanismo de persistencia de datos en el navegador para simular una base de datos.

El proyecto está desarrollado en **JavaScript puro**, sin dependencias de frameworks externos como React, Angular o Vue.

## Estructura del Proyecto

El repositorio está organizado en carpetas que separan las distintas vistas y recursos de la aplicación:

```
c:\Users\amanb\Desktop\Informática\PI\Subsonic\
├───index.html
├───README.md
├───.git\
├───.vscode\
├───admin\
│   ├───add-product.html
│   ├───add-space.html
│   ├───artists.html
│   ├───create-event.html
│   ├───edit-event.html
│   ├───edit-product.html
│   ├───edit-space.html
│   ├───edit-user.html
│   ├───entries.html
│   ├───manage-products.html
│   ├───manage-spaces.html
│   └───manage-users.html
├───auth\
│   ├───forgot-password.html
│   ├───login.html
│   └───register.html
├───client\
│   ├───change-password.html
│   ├───dashboard.html
│   ├───orders.html
│   ├───profile.html
│   ├───purchase-success.html
│   ├───purchase-summary.html
│   ├───ticket.html
│   └───tickets.html
├───css\
│   └───styles.css
├───events\
│   ├───artist.html
│   ├───artists.html
│   ├───event.html
│   ├───events.html
│   ├───pass.html
│   ├───search.html
│   └───tickets-purchase.html
├───experiences\
│   └───experiences.html
├───festivals\
│   ├───asia.html
│   ├───barcelona.html
│   ├───brasil.html
│   ├───madrid.html
│   ├───valencia.html
│   └───winter.html
├───fotos_artistas\
│   └───placeholder.jpg
├───fotos_lugares\
│   ├───Asia.jpg
│   ├───Barcelona.jpg
│   ├───Brasil.jpg
│   ├───ImagenFestivalAsia.png
│   ├───ImagenFestivalBarcelona.png
│   ├───ImagenFestivalBrasil.png
│   ├───ImagenFestivalMadrid.png
│   ├───ImagenFestivalValencia.png
│   ├───ImagenFestivalWinter.png
│   ├───Invierno.jpg
│   ├───Madrid.jpg
│   └───Valencia.jpg
├───fotos_principales\
│   ├───fotoLogin.jpg
│   ├───logo.jpg
│   └───principal.jpg
├───fotos_store\
│   ├───g1.jpg
│   ├───g2.jpg
│   ├───g3.jpg
│   ├───g4.jpg
│   ├───s1.jpg
│   ├───s2.jpg
│   ├───s3.jpg
│   ├───s4.jpg
│   ├───s5.jpg
│   └───s6.jpg
├───help\
│   └───help.html
├───js\
│   ├───admin-edit-product-loader.js
│   ├───admin-edit-space-loader.js
│   ├───admin-edit-user-loader.js
│   ├───admin-event-editor-loader.js
│   ├───admin-manage-products-loader.js
│   ├───admin-manage-spaces-loader.js
│   ├───admin-manage-users-loader.js
│   ├───apiService.js
│   ├───app.js
│   ├───artist-detail-loader.js
│   ├───artist-loader.js
│   ├───config.js
│   ├───data.js
│   ├───event-detail-loader.js
│   ├───events-loader.js
│   ├───experiences-loader.js
│   ├───festival-loader.js
│   ├───index-loader.js
│   ├───orders-loader.js
│   ├───player-modal.js
│   ├───product-detail-loader.js
│   ├───profile-loader.js
│   ├───store-loader.js
│   └───tickets-loader.js
├───mocks\
│   ├───artists.json
│   ├───events.json
│   ├───experiences.json
│   ├───products.json
│   ├───spaces.json
│   └───users.json
├───spaces\
│   ├───provider-spaces.html
│   ├───space-request.html
│   └───space.html
└───store\
    ├───cart.html
    ├───product.html
    └───store.html
```

## Metodología

Este proyecto se ha desarrollado siguiendo una metodología **"Frontend-First"** con un **backend simulado**. La finalidad es construir una interfaz de usuario completamente funcional y navegable sin depender de un servidor real.

### Backend Simulado

Para lograr la persistencia de datos y simular el comportamiento de un backend, se han utilizado las siguientes técnicas:

-   **`localStorage`**: Toda la información dinámica (usuarios, productos, entradas, etc.) se carga desde archivos `json` estáticos (en la carpeta `/mocks`) y se almacena en el `localStorage` del navegador. Esto permite que los datos persistan entre sesiones.
-   **Simulación de API**: Las interacciones que normalmente requerirían una llamada a una API (como iniciar sesión, comprar un producto o guardar cambios en un formulario) se gestionan a través de funciones de JavaScript que manipulan directamente los datos en `localStorage`.

Este enfoque permite desarrollar y probar la experiencia de usuario de forma aislada, asegurando que todos los componentes visuales y flujos de navegación funcionen correctamente antes de integrarlos con un backend real.

## Miembros del Grupo

-   **Andrea Lozano Toledo**  
-   **Julia Álvarez Hernández** 
-   **Álvaro Manso Barras** 
-   **Borja Gómez Castaño**
-   **Oscar Peña Tienza** a

## Cómo Ejecutar el Proyecto

Para que la aplicación funcione correctamente, es necesario servir los archivos a través de un servidor local. Esto se debe a que las funciones de JavaScript que cargan los datos simulados (`mocks`) mediante `fetch` pueden ser bloqueadas por las políticas de seguridad (CORS) de los navegadores si se abre el `index.html` directamente como un archivo local.

Sigue estos pasos para ejecutar el proyecto:

### Opción 1: Usar Python

1.  **Clona el repositorio** en tu máquina local:
    ```bash
    git clone <URL_DEL_REPOSITORIO>
    cd <NOMBRE_DEL_DIRECTORIO>
    ```

2.  **Levanta un servidor local**. Abre una terminal en la raíz del proyecto y ejecuta el siguiente comando:

    *   Si tienes **Python 3**:
        ```bash
        python -m http.server
        ```
    *   Si tienes **Python 2**:
        ```bash
        python -m SimpleHTTPServer
        ```

3.  **Abre la aplicación en tu navegador**. Una vez que el servidor esté en marcha, verás un mensaje en la terminal similar a `Serving HTTP on 0.0.0.0 port 8000 (http://0.0.0.0:8000/)`.

    Abre tu navegador y ve a la siguiente dirección:
    [**http://localhost:8000**](http://localhost:8000)


### Opción 2: Usar Visual Studio Code con Live Server

Si utilizas Visual Studio Code, la forma más sencilla de ejecutar el proyecto es con la extensión **Live Server**.

1.  **Instala la extensión**: Si no la tienes, búscala en el panel de extensiones de VS Code ( `Ctrl+Shift+X` ) como `Live Server` (de Ritwick Dey) e instálala.

2.  **Abre el proyecto**: Abre la carpeta raíz del proyecto en VS Code.

3.  **Inicia el servidor**: Haz clic derecho sobre el archivo `index.html` en el explorador de archivos y selecciona la opción **"Open with Live Server"**.

Esto abrirá automáticamente una nueva pestaña en tu navegador con la aplicación en funcionamiento y, además, recargará la página cada vez que guardes un cambio en el código.

