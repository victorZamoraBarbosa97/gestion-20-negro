# Gestión 20 Negro - Control de Pagos Semanales

![Logo de la Aplicación](public/logo.svg)

**Gestión 20 Negro** es una aplicación web interna y segura diseñada para el seguimiento y control de pagos semanales. Construida con React y Firebase, ofrece una solución robusta y en tiempo real para la gestión financiera de dos categorías de pagos: "PRONÓSTICOS" y "VÍA".

La aplicación permite a los usuarios autorizados añadir, visualizar y gestionar pagos. Cada pago está asociado a un comprobante (imagen) que se almacena de forma segura. La interfaz es intuitiva y proporciona un resumen claro de los totales semanales.

## ✨ Características Principales

- **Autenticación Segura:** Inicio de sesión mediante cuentas de Google autorizadas o como invitado (solo lectura). Solo los usuarios en una lista blanca (`allowlist`) pueden acceder y modificar datos.
- **Gestión de Pagos en Tiempo Real:** Los pagos se actualizan instantáneamente para todos los usuarios gracias a Firestore.
- **Clasificación por Categorías:** Los pagos se dividen en "PRONÓSTICOS" y "VÍA", con totales calculados automáticamente.
- **Navegación Semanal:** Permite moverse fácilmente entre semanas para revisar pagos pasados o futuros.
- **Carga y Descarga de Comprobantes:** Cada pago puede tener un comprobante (imagen) asociado, que se puede cargar y descargar de forma segura desde Firebase Storage.
- **Gestión de Fechas:** Permite modificar la fecha de un pago existente, moviéndolo a la semana correspondiente.
- **Diseño Responsivo:** Interfaz moderna y adaptable construida con Tailwind CSS.
- **Notificaciones Interactivas:** Feedback claro al usuario para cada acción (añadir, eliminar, actualizar) mediante notificaciones `react-hot-toast`.

## 🛠️ Tecnologías Utilizadas

- **Frontend:**
  - **[React](https://reactjs.org/)**: Biblioteca para construir la interfaz de usuario.
  - **[Vite](https://vitejs.dev/)**: Herramienta de desarrollo frontend moderna y ultrarrápida.
  - **[Tailwind CSS](https://tailwindcss.com/)**: Framework de CSS para un diseño rápido y personalizado.
- **Backend y Base de Datos (BaaS):**
  - **[Firebase](https://firebase.google.com/)**: Plataforma de Google para el desarrollo de aplicaciones.
    - **Firestore**: Base de datos NoSQL en tiempo real para almacenar la información de los pagos.
    - **Firebase Authentication**: Para gestionar el inicio de sesión con Google y de invitados.
    - **Firebase Storage**: Para almacenar los archivos de los comprobantes.
- **Gestión de Estado:**
  - **React Context API**: Para gestionar el estado global de la autenticación.
  - **Hooks Personalizados (`usePayments`)**: Para encapsular y reutilizar la lógica de negocio.

## 🚀 Puesta en Marcha Local

Para ejecutar el proyecto en un entorno de desarrollo local, sigue estos pasos:

### 1. Prerrequisitos

- **Node.js**: Asegúrate de tener Node.js instalado (versión 18 o superior recomendada).
- **Proyecto de Firebase**: Debes tener un proyecto de Firebase creado y configurado.

### 2. Clonar el Repositorio

```bash
git clone <URL_DEL_REPOSITORIO>
cd <NOMBRE_DE_LA_CARPETA>
```

### 3. Instalar Dependencias

```bash
npm install
```

### 4. Configurar Variables de Entorno

1.  Copia el archivo de ejemplo `.env.example` y renómbralo a `.env`:
    ```bash
    cp .env.example .env
    ```
2.  Abre el nuevo archivo `.env` y rellena las variables con las credenciales de tu proyecto de Firebase. Puedes encontrarlas en:
    *Firebase Console > Project Settings > General > Your apps > Firebase SDK snippet > Config*.

### 5. Configuración de Firebase

Asegúrate de haber configurado lo siguiente en tu [Consola de Firebase](https://console.firebase.google.com/):

1.  **Authentication**:
    - Habilita el proveedor de inicio de sesión de **Google**.
    - Habilita el inicio de sesión **Anónimo (invitado)**.
    - En la pestaña "Settings", añade los dominios desde los que ejecutarás la aplicación (ej. `localhost`) a la lista de **Dominios autorizados**.
2.  **Firestore**:
    - Crea una base de datos de Firestore.
    - **Crea una colección `allowlist`**: Cada documento en esta colección debe tener como ID el email de un usuario autorizado. Esto es crucial para el control de acceso.
      ```
      // Ejemplo de documento en 'allowlist'
      // ID del documento: usuario.autorizado@gmail.com
      {
        "role": "admin" // o "user"
      }
      ```
3.  **Storage**:
    - Habilita Firebase Storage para poder subir los comprobantes.

### 6. Ejecutar la Aplicación

```bash
npm run dev
```

La aplicación estará disponible en `http://localhost:5173` (o el puerto que Vite indique).

## ☁️ Despliegue

Este proyecto está configurado para un despliegue sencillo en **Firebase Hosting**.

1.  **Instala las Herramientas de Firebase CLI:**
    ```bash
    npm install -g firebase-tools
    ```
2.  **Inicia Sesión en Firebase:**
    ```bash
    firebase login
    ```
3.  **Inicializa Firebase Hosting (si no lo has hecho):**
    ```bash
    firebase init hosting
    ```
    Selecciona tu proyecto de Firebase y configura el directorio público como `dist`.
4.  **Construye el Proyecto para Producción:**
    ```bash
    npm run build
    ```
5.  **Despliega en Firebase Hosting:**
    ```bash
    firebase deploy --only hosting
    ```

---

*Este README fue generado y actualizado por el asistente de IA para reflejar el estado actual del proyecto.*
