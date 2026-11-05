# 🍰 CakeByteApp - Plataforma de Repostería Digital

**CakeByteApp** es una solución móvil nativa de alto rendimiento diseñada para modernizar y digitalizar el ecosistema de la repostería artesanal. Construida específicamente para dispositivos **Android 8.0+ (API 26)**, la aplicación integra una arquitectura robusta con servicios de vanguardia en la nube para ofrecer una experiencia de usuario fluida, segura y escalable.

Este proyecto representa la convergencia entre el desarrollo móvil nativo moderno y la eficiencia de los microservicios, proporcionando herramientas especializadas para administradores, vendedores y clientes finales.

---

## 🏗️ Arquitectura y Principios de Diseño

La aplicación se fundamenta en los principios de **Clean Architecture** y el patrón de diseño **MVVM (Model-View-ViewModel)**, garantizando un código mantenible, testeable y desacoplado.

### Capas del Sistema:
1.  **Capa de Presentación (UI/UX):** Implementada con **View Binding** y componentes de **Material Design 3**, asegurando una interfaz moderna e intuitiva. Gestión de estados reactivos mediante **Kotlin Flow**.
2.  **Capa de Dominio:** Contiene la lógica central de negocio, entidades puras y definiciones de contratos (interfaces) que rigen el comportamiento del sistema, independiente de cualquier framework externo.
3.  **Capa de Datos:** Gestiona el flujo de información entre múltiples fuentes:
    *   **Remota:** Integración con **Supabase** mediante el cliente **Ktor**.
    *   **Local:** Persistencia de datos mediante **SharedPreferences** encriptadas.
    *   **Repositorios:** Implementan la lógica de mediación y mapeo de datos (DTOs a Domain Models).

---

## 🛠️ Stack Tecnológico

*   **Lenguaje:** [Kotlin](https://kotlinlang.org/) (Enfoque en seguridad de tipos y programación funcional).
*   **Backend as a Service (BaaS):** [Supabase](https://supabase.com/)
    *   **PostgreSQL:** Base de datos relacional para gestión compleja de pedidos.
    *   **Supabase Auth:** Sistema de identidad distribuido.
    *   **Storage:** Gestión de activos multimedia (fotos de productos).
*   **Networking & Serialización:**
    *   **Ktor Client:** Cliente HTTP ligero y asíncrono.
    *   **KotlinX Serialization:** Serialización de datos JSON de alto rendimiento.
*   **Inyección de Dependencias:** **Hilt (Dagger)** para la gestión eficiente del ciclo de vida de los componentes.
*   **Seguridad:**
    *   **Jetpack Security:** Encriptación de datos sensibles en el dispositivo.
    *   **Biometric Library:** Implementación de autenticación por huella dactilar.
    *   **Credential Manager:** Integración nativa para **Google Sign-In**.

---

## ✨ Características de Nivel Profesional

### 🔐 Seguridad y Autenticación Avanzada
*   **Auth Multi-factor:** Soporte para inicio de sesión tradicional, social (Google) y biométrico.
*   **Gestión de Sesiones:** Persistencia segura de tokens con capacidad de cierre de sesión global.

### 👥 Ecosistema Multi-rol
*   **Panel Administrativo:** Control total sobre usuarios, auditoría de productos y visualización de métricas de ventas.
*   **Módulo de Vendedor:** Gestión completa de inventario (CRUD de productos), captura de imágenes mediante **CameraX** y seguimiento de pedidos en tiempo real.
*   **Experiencia del Comprador:** Catálogo interactivo categorizado, carrito de compras dinámico y flujo de checkout optimizado.

### 🎨 Diseño UI/UX
*   Prototipado en **Figma** siguiendo las guías de **Material Design**.
*   Soporte para **Adaptive Icons** (Iconos adaptativos) que garantizan una presencia visual consistente en cualquier lanzador de Android.

---

## ⚙️ Instalación y Configuración

### Requisitos Técnicos
*   Android Studio Jellyfish o superior.
*   JDK 17.
*   Dispositivo físico o emulador con API Level 26+.

### Configuración del Entorno
1.  **Clonar:** `git clone https://github.com/Samuel-Junieles/CakeByteApp.git`
2.  **Credenciales:** Configurar `SUPABASE_URL` y `SUPABASE_ANON_KEY` en el cliente de datos.
3.  **Google Auth:** Registrar el SHA-1 del proyecto en Google Cloud Console y vincularlo con el panel de autenticación de Supabase.
4.  **Sincronizar:** Ejecutar `Gradle Sync` y construir el proyecto.

---

## 👤 Desarrollo y Autoría
**Samuel Junieles**
* *Estudiante de Ingeniería de Software - 7mo Semestre*

**Kevin Rojas**
* *Estudiante de Ingeniería de Software - 6to Semestre*

---
Desarrollador enfocado en arquitecturas limpias, y soluciones escalables en la nube.

