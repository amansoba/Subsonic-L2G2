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
├─── admin/         # Vistas del panel de administración
├─── auth/          # Vistas de autenticación (login, registro)
├─── client/        # Vistas del panel de cliente
├─── css/           # Hojas de estilo
├─── events/        # Vistas relacionadas con eventos y artistas
├─── festivals/     # Páginas dedicadas a cada festival
├─── fotos_*/       # Imágenes para artistas, lugares, tienda, etc.
├─── js/            # Scripts de la aplicación
│   ├─── app.js     # Controlador principal del frontend
│   └─── data.js    # Base de datos simulada y lógica de persistencia
├─── store/         # Vistas de la tienda
└─── index.html     # Página de inicio
```

## Cómo Ejecutar el Proyecto

Dado que es un proyecto frontend estático, no se necesita un servidor complejo ni un proceso de compilación.

1.  Clona este repositorio en tu máquina local.
2.  Abre el archivo `index.html` en tu navegador web.

¡Eso es todo! La aplicación se ejecutará localmente en tu navegador.
