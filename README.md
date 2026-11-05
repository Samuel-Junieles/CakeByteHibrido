# 🍰 CakeByteApp Híbrido — Plataforma Multiplataforma de Repostería Digital

**CakeByteApp Híbrido** es una aplicación multiplataforma (**Web Responsive + Android Nativo**) diseñada para modernizar y digitalizar el ecosistema de la repostería artesanal. Construida con **Ionic Framework 8**, **Angular 19**, **Capacitor 7** y **Supabase**, combina una experiencia móvil nativa en teléfonos Android con una interfaz web de escritorio completa, conectadas en tiempo real a una misma base de datos en la nube.

---

## 🏗️ Arquitectura del Proyecto

El sistema implementa los principios de **Clean Architecture** adaptados a una aplicación híbrida reactiva con componentes *Standalone* de Angular y programación reactiva mediante **RxJS**:

1. **Capa Core (`src/app/core`):**
   - Configuración del cliente de conexión a la nube (**Supabase**).
   - **Guards de Seguridad (`authGuard` y `roleGuard`):** Protección de rutas privadas y validación de permisos según el rol activo del usuario (`Admin`, `Vendedor`, `Comprador`).
2. **Capa de Dominio (`src/app/domain`):**
   - Modelos y entidades de negocio (`UserEntity`, `ProductEntity`, `OrderEntity`, `CartItemEntity`, `DashboardStats`, `CapturedPhoto`).
3. **Capa de Datos (`src/app/data/services`):**
   - **Repositorios Reactivos (`AuthRepository`, `ProductRepository`, `OrderRepository`, `CartRepository`):** Sincronización bidireccional y en tiempo real con la base de datos en la nube y persistencia local mediante `@capacitor/preferences`.
   - **Servicio Multimedia (`PhotoService`):** Integración con la cámara del dispositivo, galería del teléfono y selector de archivos con compresión y optimización automática de imágenes.
4. **Capa de Presentación (`src/app/presentation`):**
   - Vistas adaptativas que ofrecen el flujo móvil original en pantallas de teléfono (`<= 768px`) y paneles de escritorio expandidos en navegadores web (`> 768px`).

---

## 🛠️ Stack Tecnológico, APIs y Plugins

### Frontend & UI Híbrida
- **Angular 19** (Componentes *Standalone*, *Lazy Loading*, *Router Guards*, *FormsModule*).
- **Ionic Framework 8 (`@ionic/angular`)** + **Ionicons 7**.
- **Diseño Adaptativo Dual (Mobile-First & Desktop Web):**
  - En **Teléfono (`<= 768px`)**: Splash Screen, Onboarding interactivo por toques, barra de navegación inferior accesible con soporte de *Safe Area* (`WindowInsetsCompat` para Android 15+) y tarjetas KPI rediseñadas.
  - En **Escritorio Web (`> 768px`)**: Barra de navegación superior, tablas de gestión, paneles divididos y grillas responsivas.

### Runtime Nativo y Plugins de Capacitor 7
- **`@capacitor/camera` + `@ionic/pwa-elements`:** Toma de fotografías en vivo desde la cámara trasera/frontal del teléfono o webcam del computador, y selección de imágenes desde la galería del dispositivo.
- **`@capacitor/preferences`:** Almacenamiento clave-valor nativo para sesión activa y preferencias del dispositivo.
- **`@capacitor/haptics`:** Respuesta háptica nativa en interacciones biométricas y controles móviles.
- **`@capacitor/status-bar` & `@capacitor/keyboard`:** Control nativo de barras del sistema y teclado en Android.

### APIs Nativas de Android Integradas (`MainActivity.java`)
- **API Biométrica de Huella Dactilar (`androidx.biometric:biometric`):** Diálogo nativo `BiometricPrompt` disponible exclusivamente en la versión móvil para ingreso rápido mediante el sensor de huella del teléfono.
- **Google Identity Services & Credential Manager (`androidx.credentials` + `GoogleIdTokenCredential`):** Autenticación real con cuentas de Google del dispositivo en Android y flujo OAuth 2.0 en navegadores web.

### Base de Datos en la Nube (Supabase BaaS)
- **PostgreSQL en la Nube:** Persistencia centralizada de usuarios, roles, catálogo de productos/tortas y pedidos.
- **Sincronización Universal en Tiempo Real (`Supabase Realtime`):** Los cambios realizados desde el teléfono (como actualizar la foto de perfil, agregar una nueva torta con foto de la cámara o cambiar el estado de un pedido) se reflejan automáticamente en la versión web y viceversa.
- **Supabase Auth:** Gestión de sesiones seguras, inicio de sesión con credenciales, integración con proveedor Google y validación de rutas protegidas.

---

## ✨ Funcionalidades Principales

### 🔐 Autenticación y Seguridad
- **Splash Screen & Onboarding Interactivo:** Presentación guiada en móvil y carrusel dinámico en escritorio.
- **Inicio de Sesión Multi-método:**
  - Correo electrónico y contraseña.
  - **Continuar con Google:** Consumo real de la API de Google Identity / OAuth sincronizada con la tabla de usuarios en la nube.
  - **Acceder con Huella Dactilar:** Exclusivo para teléfono mediante el lector biométrico de Android.
- **Rutas Protegidas:** Bloqueo de acceso no autorizado y redirección automática según el rol (`Admin`, `Vendedor` o `Comprador`).

### 🛒 Módulo de Comprador (`/buyer`)
- **Carrusel de Ofertas de Hoy:** Banners promocionales interactivos en la pantalla de inicio.
- **Catálogo de Repostería:** Filtrado por categorías (*Todos*, *Pasteles*, *Galletas*) y búsqueda en tiempo real.
- **Personalización y Carrito:** Selección de tamaño, notas de decoración, cálculo automático de totales, checkout con descuento de stock en la nube y recibo digital de compra.

### 📦 Módulo de Vendedor (`/vendor`)
- **Tarjetas de Métricas (KPIs):** Visualización de *Ventas del día*, *Pedidos* y *Ventas totales* con indicadores de estado.
- **Gestión de Pedidos en Vivo:** Cambio de estado (*En espera* → *Enviado* → *Entregado*) sincronizado con la nube.
- **Inventario con Cámara y Galería:** Creación y edición de tortas/postres capturando fotos directamente con la cámara del teléfono o eligiendo desde la galería.

### 🛡️ Módulo de Administrador (`/admin`)
- **Dashboard Global:** Métricas consolidadas del negocio en tiempo real.
- **Gestión de Usuarios Multi-rol:** Creación, edición de roles (`Admin`, `Vendedor`, `Comprador`), visualización de avatares sincronizados y eliminación de cuentas.
- **Auditoría y CRUD de Productos:** Control total de existencias (*En stock* / *Fuera de stock*), precios, categorías y fotografías.

### 👤 Perfil Universal (`/profile`)
- **Foto de Perfil con Cámara o Galería:** Captura o selección de fotografía de perfil con sincronización inmediata en la nube para que se visualice tanto en el teléfono como en la web.
- **Actualización de Datos:** Edición de nombre completo, dirección de entrega y teléfono de contacto.

---

## ⚙️ Variables de Entorno y Seguridad del Repositorio

Por buenas prácticas de seguridad:
- **No se exponen credenciales privadas, secretos de cliente ni scripts SQL de base de datos** dentro del repositorio (`.gitignore` excluye archivos `.env`, `*.sql` y configuraciones sensibles).
- Para configurar un entorno propio, define la URL del proyecto y la llave pública (*Publishable / Anon Key*) de tu instancia de **Supabase** en el archivo de configuración del cliente (`src/app/core/supabase/supabase.client.ts`) y registra tu cliente OAuth en Google Cloud Console y Supabase Auth.

---

## 🚀 Comandos de Ejecución y Despliegue

### 1. Instalar dependencias del proyecto
```bash
npm install
```

### 2. Levantar la aplicación en local (Modo Web / Desarrollo)
Inicia el servidor de desarrollo en `http://localhost:8100` (también accesible desde la red local):
```bash
npm start
```

### 3. Compilar y sincronizar el proyecto web con el contenedor nativo
Genera el *build* de producción en `www/` y sincroniza los activos y plugins con Capacitor:
```bash
npm run cap:sync
```

### 4. Ejecutar la aplicación en el teléfono (Android)
Compila el proyecto, sincroniza la plataforma Android y abre el proyecto nativo listo para instalar y ejecutar en tu teléfono físico o emulador:
```bash
npm run cap:android
```
*(También puedes ejecutar directamente en el dispositivo conectado por USB mediante `npx cap run android`).*

---

## 👥 Autores

- **Samuel Junieles** — *Ingeniería de Software*
- **Kevin Rojas** — *Ingeniería de Software*
