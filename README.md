# Subsonic

Repositorio para el desarrollo del proyecto de la asignatura PI.

## Descripción

Subsonic es una aplicación web para una empresa ficticia de festivales de música del mismo nombre. El sitio permite a los usuarios explorar próximos festivales y eventos, ver detalles de artistas, comprar entradas y adquirir merchandising de la tienda oficial.

El proyecto ha sido refactorizado desde una versión original puramente frontend a una arquitectura **Full-Stack**. Ahora cuenta con un backend en **Python (FastAPI)** y una base de datos en la nube gestionada con **Firebase (Firestore)**. El frontend, compuesto por plantillas HTML, CSS y JavaScript, es servido a través del sistema de rutas de FastAPI para mantener la estructura y compatibilidad con el enrutamiento original.

## Características

El proyecto ofrece distintas funcionalidades según el rol del usuario que esté interactuando con el sistema (visitante, cliente, proveedor o administrador).

### Funcionalidades Públicas
* **Página de Inicio**: Presenta los próximos festivales destacados.
* **Festivales y Eventos**: Lista completa de todos los eventos con opciones de búsqueda y filtrado.
* **Detalle de Evento**: Muestra información detallada de una fecha de festival, incluyendo artistas y entradas.
* **Artistas**: Página para explorar los artistas que participan en los festivales.
* **Tienda**: Catálogo de productos de merchandising.
* **Autenticación**: Inicio de sesión (Login) y Registro conectados de forma eficiente al backend y Firebase.

### Panel de Cliente (`/client/...`)
* **Dashboard Personal**: Un resumen de la actividad del cliente.
* **Mis Entradas**: Lista de las entradas adquiridas por el usuario, con códigos QR (simulados/asignados).
* **Mis Pedidos**: Historial de comprobantes de compras realizadas en la tienda.
* **Perfil**: Permite al usuario editar sus datos personales.

### Panel de Proveedor (`/spaces/...`)
* **Gestión de Espacios**: Para que los proveedores soliciten el alquiler de espacios en festivales (ejemplo: concesiones alimentarias, stands de marcas temporales).

### Panel de Administración (`/admin/...`)
* Interfaz dedicada para realizar la gestión completa de eventos (Eventos, Sesiones), artistas, productos, espacios, usuarios y roles a través de las operaciones que conectan con la DB en el backend.

## Tecnologías Utilizadas

* **Backend**:
  * **Python 3**: Sistema base del servidor.
  * **FastAPI**: Framrwork web moderno utilizado para exponer la API REST asíncrona y servir los assets de frontend.
  * **Uvicorn**: Servidor web ASGI en el que se ejecuta la aplicación FastAPI.
  * **Firebase Admin SDK**: Gestión principal de la autenticación de usuarios y transacciones a la base de datos con **Firestore**.
* **Frontend**:
  * **HTML5 y Jinja2**: Plantillas de interfaz HTML que se inyectan y sirven a través de los *endpoints* de FastAPI.
  * **CSS3**: Hoja de estilos centralizada para el apartado visual (y adaptación mobile).
  * **JavaScript (ES6+)**: Lógica del cliente en el entorno web, consumiendo las API web del propio backend utilizando `fetch()`, con modularización distribuida en *loaders*.

## Estructura del Proyecto

La estructura actual concentra la aplicación dentro del directorio `backend/`.

```text
├───README.md
└───backend/
    ├───app/                # Lógica central del sistema, DAO Firebase, esquemas Pydantic y enrutamiento (API endpoint routes)
    ├───controller/         # Configuración del servidor principal FastAPI, montaje estáticos y vistas HTML (pages routes)
    ├───model/              # (Capa de arquitectura / Modelos)
    ├───view/
    │   ├───static/         # Archivos CSS, JS y recursos visuales (imágenes globales estructuradas por categoría)
    │   └───templates/      # Archivos de las interfaces y pantallas HTML (admin, auth, client, index...)
    ├───main.py             # Punto de entrada de inicialización de la aplicación
    ├───requirements.txt    # Lista de dependencias de entorno de Python
    └───.env                # Variables de entorno secretas del sistema
```

## Configuración y Ejecución del Proyecto

Para correr la aplicación correctamente, es necesario acondicionar el entorno de empaquetado de dependencias de Python y vincular correctamente un archivo válido de tu instancia Firebase.

### 1. Variables de entorno y credenciales Firebase
* Crea un archivo `.env` en la carpeta `backend/` basándote en la plantilla `.env.example`.
* Debes disponer del archivo *JSON* de credenciales de clave de servicio de Firebase (p.e. `proyectosubsonic-firebase-adminsdk-fbsvc-*.json`). Ubica este archivo en la raíz de la carpeta `backend/` (y comprueba el nombre en el `.env` o en la ruta de inicio) para poder conectar la base de datos **Firestore**.

### 2. Entorno y Dependencias de Python

Es altamente recomendable implementar un entorno virtual (Virtual Environment) para asegurar un control íntegro de bibliotecas y prevenir conflictos:

```bash
# Ingresar al servidor backend
cd backend

# Aislar dependencias creando un entorno virtual
python -m venv .venv

# Activar el entorno virtual localmente
# → En Windows:
.venv\Scripts\activate
# → En Linux/macOS:
source .venv/bin/activate

# Instalar las librerías necesarias del proyecto a través de gestor de paquetes de python
pip install -r requirements.txt
```

### 3. Iniciar la aplicación en el Servidor Web

Estando localizado dentro del directorio de `backend/`, ejecuta el siguiente comando:

```bash
python main.py
```
> El servicio alojará el backend en el nodo predeterminado de Uvicorn usando el puerto `8000`.

Abre tu navegador de preferencia y visita el punto de partida: [**http://localhost:8000**](http://localhost:8000).

---

## Miembros del Grupo

-   **Andrea Lozano Toledo**  
-   **Julia Álvarez Hernández** 
-   **Álvaro Manso Barras** 
-   **Borja Gómez Castaño**
-   **Oscar Peña Tienza**
