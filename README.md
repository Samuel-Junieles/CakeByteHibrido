# 🍰 CakeByteApp Híbrido — Plataforma Multiplataforma de Repostería Digital

**CakeByteApp Híbrido** es una solución tecnológica multiplataforma (**Web Responsive + Aplicación Móvil Android**) diseñada para modernizar y digitalizar el ecosistema de la repostería artesanal. El proyecto integra una arquitectura limpia por capas con servicios en la nube en tiempo real, seguridad basada en **JWT (JSON Web Tokens)** y **RBAC (Role-Based Access Control)**, autenticación biométrica, inicio de sesión con Google y captura multimedia mediante cámara y galería.

---

## 🏛️ 1. Arquitectura y Capas del Sistema

La aplicación está estructurada bajo los principios de **Clean Architecture** (Arquitectura Limpia) combinada con programación reactiva (**RxJS**), separando las responsabilidades en **5 capas independientes y desacopladas**:

```text
src/app/
 ├── core/           # Capa 1: Núcleo, conexión a la nube y Guards de seguridad (JWT / RBAC)
 ├── domain/         # Capa 2: Modelos de dominio, entidades y contratos de negocio
 ├── data/           # Capa 3: Repositorios reactivos, sincronización Realtime y servicios de Cámara
 └── presentation/   # Capa 4: Componentes UI Standalone adaptativos (Móvil y Web)
android/app/
 └── src/main/java/  # Capa 5: Puente nativo Android (Biometría, Google Credential Manager, WindowInsets)
```

### Detalle de cada Capa:
1. **Capa Core (`src/app/core`):**
   - Inicializa y gestiona la instancia única (*Singleton*) del cliente de **Supabase** con persistencia de sesión y renovación automática de tokens **JWT**.
   - Implementa los interceptores de navegación y guardias de rutas (`authGuard` y `roleGuard`) encargados de aplicar el modelo **RBAC**.
2. **Capa de Dominio (`src/app/domain`):**
   - Contiene las entidades puras del negocio (`UserEntity`, `ProductEntity`, `OrderEntity`, `CartItemEntity`, `DashboardStats`, `CapturedPhoto`) y las reglas de resolución de recursos multimedia, sin depender de librerías externas de interfaz.
3. **Capa de Datos (`src/app/data/services`):**
   - **`AuthRepository`:** Administra la identidad del usuario, inicio de sesión tradicional, autenticación con Google (`idToken` / OAuth), acceso biométrico y sincronización del perfil en la nube.
   - **`ProductRepository`:** Gestiona el catálogo de tortas y postres (CRUD) y mantiene suscripciones en tiempo real (`postgres_changes`) con la base de datos.
   - **`OrderRepository`:** Procesa el flujo de compras (*checkout*), cálculo de métricas financieras (KPIs), actualización de stock y estados de pedidos en vivo.
   - **`CartRepository`:** Controla el estado reactivo del carrito de compras y cálculo de subtotales.
   - **`PhotoService`:** Orquesta el acceso a la cámara física, galería del teléfono y compresión de imágenes en formato Base64/DataURL optimizado.
4. **Capa de Presentación (`src/app/presentation`):**
   - Compuesta por páginas *Standalone* (`AuthPage`, `BuyerPage`, `VendorPage`, `AdminPage`, `ProfilePage`) y componentes reutilizables (`NavbarComponent`, `PhotoPickerComponent`) que reaccionan automáticamente a los flujos de datos (`Observables`).
5. **Capa de Integración Nativa Android (`android/`):**
   -Extiende `BridgeActivity` de Capacitor en `MainActivity.java` para comunicarse directamente con las APIs del sistema operativo Android (sensor de huella dactilar, selector de cuentas de Google del dispositivo y márgenes seguros de pantalla en Android 15+).

---

## 💻 2. Lenguajes de Programación Utilizados y Para Qué Sirve Cada Uno

| Lenguaje | Ubicación en el Proyecto | ¿Para qué se utiliza en CakeByteApp? |
| :--- | :--- | :--- |
| **TypeScript (v5.6)** | `src/**/*.ts`, `capacitor.config.ts` | Lenguaje principal de la aplicación híbrida. Se utiliza para programar toda la lógica de negocio, modelos tipados, repositorios de datos, servicios de cámara, guardias de seguridad (**JWT/RBAC**) y controladores de las vistas en Angular. |
| **Java (JDK 17+)** | `android/app/src/main/java/.../MainActivity.java` | Se utiliza en la capa nativa de Android para construir el puente `@JavascriptInterface` (`CakeByteNative`), invocar el lector biométrico de huella (`BiometricPrompt`), ejecutar `CredentialManager` de Google y controlar los márgenes del sistema (`WindowInsetsCompat`). |
| **HTML5 (Templates Angular)** | Integrado en `src/app/presentation/**/*.page.ts` | Define la estructura semántica de todas las pantallas tanto para la vista móvil como para la vista de escritorio web, utilizando directivas reactivas (`*ngIf`, `*ngFor`, `[(ngModel)]`) y Web Components de Ionic (`<ion-content>`, `<ion-icon>`). |
| **SCSS / CSS3** | `src/global.scss`, `src/theme/variables.scss` y estilos de componentes | Define el sistema de diseño visual, paleta de colores corporativa (*Salmón CakeByte*), animaciones, tarjetas KPI con degradados, carrusel horizontal con `scroll-snap` y las reglas `@media (max-width: 768px)` que separan el diseño móvil del diseño web. |
| **SQL (PostgreSQL)** | Motor en la nube de **Supabase** | Lenguaje de base de datos relacional en la nube donde residen las tablas (`usuarios`, `roles`, `products`, `orders`), relaciones de integridad referencial y políticas de acceso. |
| **Groovy / Kotlin DSL & XML** | `android/app/build.gradle`, `AndroidManifest.xml`, `res/layout/` | Configuración de compilación del APK de Android, declaración de dependencias nativas (`androidx.biometric`, `androidx.credentials`, `googleid`), permisos de cámara/internet y temas del sistema operativo. |

---

## 🛠️ 3. Tecnologías, Frameworks, APIs y Plugins

- **Angular 19:** Framework principal de arquitectura SPA (*Single Page Application*) con componentes *Standalone*, *Lazy Loading* de rutas e inyección de dependencias.
- **Ionic Framework 8 (`@ionic/angular`):** Biblioteca de interfaz móvil e híbrida que proporciona el contenedor de vistas, gestos táctiles y soporte de ciclo de vida multiplataforma.
- **Capacitor 7 (`@capacitor/core`, `@capacitor/android`):** Runtime híbrido encargado de empaquetar la aplicación web dentro de un contenedor nativo de Android y exponer el hardware del teléfono.
- **Supabase BaaS (`@supabase/supabase-js`):** Plataforma *Backend-as-a-Service* en la nube que provee base de datos PostgreSQL, autenticación **JWT** y canales de sincronización en tiempo real (**Supabase Realtime**).
- **RxJS (`BehaviorSubject` / `Observable`):** Librería de programación reactiva para actualizar la interfaz instantáneamente cuando cambian los productos, pedidos, carrito o foto de perfil.
- **API de Cámara y Galería (`@capacitor/camera` + `@ionic/pwa-elements`):** Permite tomar fotografías directamente desde la cámara del teléfono o webcam y seleccionar imágenes de la galería con redimensionamiento y compresión en `Canvas`.
- **API Biométrica de Android (`androidx.biometric:biometric`):** API oficial de Android Jetpack para autenticar al usuario con el lector de huella dactilar físico del teléfono.
- **API de Google Identity (`androidx.credentials` + `com.google.android.libraries.identity.googleid`):** API oficial de Google Play Services para iniciar sesión con cuentas reales de Google mediante tokens OpenID Connect (**JWT**).

---

## 🔐 4. Seguridad: RBAC, JWT, Biometría y Protección de Datos

1. **Autenticación Basada en JWT (JSON Web Tokens):**
   - Al iniciar sesión con correo/contraseña o con Google, **Supabase Auth** y **Google Identity Services** emiten un token **JWT** firmado criptográficamente.
   - El cliente gestiona la sesión de forma segura (`persistSession: true`, `autoRefreshToken: true`) y valida la vigencia del token en cada cambio de estado (`onAuthStateChange`).
2. **Control de Acceso Basado en Roles — RBAC (Role-Based Access Control):**
   - Cada usuario está vinculado a un rol en la base de datos (`1 = Admin`, `2 = Vendedor`, `3 = Comprador`).
   - **`authGuard`:** Verifica que exista una sesión autenticada válida antes de permitir el ingreso a cualquier ruta privada; de lo contrario, redirige a `/login`.
   - **`roleGuard`:** Evalúa los permisos del rol activo y restringe el acceso a las rutas exclusivas:
     - `/admin` → Exclusivo para rol **Admin**.
     - `/vendor` → Permitido para roles **Vendedor** y **Admin**.
     - `/buyer` → Acceso a la tienda para **Comprador**, **Vendedor** y **Admin**.
     - `/profile` → Acceso autenticado universal para gestión del propio perfil.
3. **Autenticación Biométrica en Teléfono (Huella Dactilar):**
   - Disponible únicamente en la vista móvil (`<= 768px`), invocando el sensor de huella del dispositivo mediante `BiometricPrompt` y vinculando de forma segura la cuenta autenticada en `@capacitor/preferences`.
4. **Protección de Credenciales en el Repositorio:**
   - El archivo `.gitignore` bloquea cualquier archivo de variables de entorno (`.env`, `.env.*`), scripts de esquemas (`*.sql`) o llaves privadas (`google-services.json`), garantizando que no se expongan secretos ni scripts de base de datos en el repositorio público.

---

## 🎨 5. Diseño UI/UX Adaptativo (Móvil Nativo vs. Escritorio Web)

- **Experiencia en Teléfono (`<= 768px`):**
  - **Pantallas de Login y Registro sin scroll:** Diseñadas a medida para encajar exactamente en el alto de la pantalla del teléfono.
  - **Respeto de Safe Area y Barras del Sistema:** Integración nativa con `WindowInsetsCompat` para que el contenido nunca se superponga con la barra de estado superior (hora/batería) ni con la barra de gestos inferior de Android.
  - **Barra de Navegación Inferior Accesible (`.m-bottom-nav`):** Botones amplios con íconos superiores, indicador activo tipo píldora y espaciado ergonómico.
  - **Tarjetas KPI Enriquecidas:** Tarjetas de métricas con iconografía destacada, subtítulos descriptivos, etiquetas de estado (*Hoy*, *En vivo*, *COP*), degradados suaves y barras de progreso.
- **Experiencia en Escritorio Web (`> 768px`):**
  - Layout de dos columnas en autenticación con carrusel de presentación automático.
  - Barra de navegación superior (`NavbarComponent`) con avatar del usuario en vivo, indicador de rol y contador del carrito.
  - Tablas administrativas de auditoría, filtros avanzados y paneles de gestión en pantalla ancha.

---

## ✨ 6. Funciones y Módulos del Sistema

### 🔑 Módulo de Autenticación (`/login`)
- **Splash Screen** y **Onboarding interactivo** con navegación táctil por zonas (izquierda/derecha).
- Inicio de sesión con **Correo y Contraseña**, botón **Continuar con Google** (API real de Google) y botón **Acceder con huella** (exclusivo en teléfono).
- Formulario de **Registro de Cuenta** y recuperación de contraseña.

### 🛍️ Módulo de Comprador (`/buyer`)
- **Carrusel de Ofertas de Hoy:** Banners promocionales deslizables en la pantalla de inicio (*20% OFF en Galletas*, *Combo Especial Pastel + 2 Cafés*, *2x1 en Postres*).
- **Catálogo Interactivo:** Búsqueda por nombre y filtrado por categorías (*Todos*, *Pasteles*, *Galletas*).
- **Detalle de Producto y Carrito:** Selección de porciones/tamaño, notas personalizadas, ajuste de cantidades, checkout con descuento automático de inventario en la nube y generación de **Recibo Digital de Compra**.

### 👨‍🍳 Módulo de Vendedor (`/vendor`)
- **Resumen de Métricas (KPIs):** *Ventas del día*, *Pedidos* y *Ventas totales*.
- **Seguimiento de Pedidos en Tiempo Real:** Actualización inmediata del estado del pedido a *Enviado* o *Entregado*.
- **Gestión de Productos con Cámara y Galería:** Creación y edición de tortas tomando fotos con la cámara o seleccionándolas de la galería del teléfono.

### 🛡️ Módulo de Administrador (`/admin`)
- **Dashboard Ejecutivo:** Indicadores globales de ventas del día, pedidos activos, ganancias acumuladas en COP y total de usuarios.
- **Gestión de Usuarios (RBAC):** Buscador, filtro por rol, creación de cuentas, cambio de roles (`Admin`, `Vendedor`, `Comprador`), visualización de fotos de perfil sincronizadas y eliminación de usuarios.
- **Auditoría de Inventario:** Control de productos *En stock* y *Fuera de stock*, edición de precios, categorías y fotografías.

### 👤 Módulo de Perfil Universal (`/profile`)
- **Sincronización Universal de Foto de Perfil:** Al tomar una foto con la cámara o elegirla de la galería en el teléfono, se sincroniza en la nube con Supabase y se actualiza automáticamente en la versión web (y viceversa).
- **Edición de Datos Personales:** Actualización de nombre completo, dirección de entrega y teléfono de contacto.

---

## ☁️ 7. Base de Datos en la Nube y Sincronización en Tiempo Real

Toda la información de la plataforma está centralizada en **Supabase (PostgreSQL en la nube)**:
- **Tablas Principales:** `usuarios`, `roles`, `products` y `orders`.
- **Sincronización en Tiempo Real (`Supabase Realtime`):** Los repositorios escuchan eventos `postgres_changes` (`INSERT`, `UPDATE`, `DELETE`) sobre las tablas de la nube y sincronizan al recuperar el foco de la ventana. Si se agrega una nueva torta o se cambia una foto de perfil desde el teléfono, la interfaz web se actualiza automáticamente sin necesidad de recargar la página.

---

## 🚀 8. Comandos para Ejecutar y Levantar el Proyecto

### 1. Instalar las dependencias
```bash
npm install
```

### 2. Levantar el servidor de desarrollo local (Web)
Inicia la aplicación en `http://localhost:8100` (también accesible en la red local para pruebas):
```bash
npm start
```

### 3. Compilar y sincronizar cambios con la plataforma nativa
Compila el proyecto Angular en `www/` y sincroniza los activos y plugins con Capacitor:
```bash
npm run cap:sync
```

### 4. Ejecutar la aplicación en el teléfono Android
Compila el proyecto, sincroniza los cambios con el contenedor nativo de Android y abre el entorno listo para instalar y ejecutar en tu teléfono:
```bash
npm run cap:android
```
*(Alternativamente, con el teléfono conectado por depuración USB puedes ejecutar directamente `npx cap run android`).*

---

## 👥 Autores

- **Samuel Junieles** — *Ingeniería de Software*
- **Kevin Rojas** — *Ingeniería de Software*
