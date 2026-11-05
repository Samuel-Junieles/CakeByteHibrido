import { Component, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthRepository } from '../../data/services/auth.repository';
import { UserRole } from '../../domain/models/models';

@Component({
  selector: 'app-auth-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule],
  template: `
    <ion-content [fullscreen]="true">
      <!-- ============================================================== -->
      <!-- VISTA MÓVIL ORIGINAL (<= 768px): Splash -> Onboarding -> Login -->
      <!-- ============================================================== -->
      <div class="mobile-auth-flow">
        <!-- 1. SPLASH SCREEN (activity_main.xml) -->
        <div *ngIf="mobileStep === 'splash'" class="m-splash" (click)="skipSplash()">
          <div class="m-splash-center">
            <h1 class="m-splash-title">CakeByte</h1>
            <p class="m-splash-slogan">Tu pastel a un click de distancia</p>
          </div>
        </div>

        <!-- 2. ONBOARDING INTERACTIVO CON TOQUE EN LA PANTALLA (activity_onboarding.xml + item_onboarding.xml) -->
        <div *ngIf="mobileStep === 'onboarding'" class="m-onboarding">
          <div class="m-onboarding-slide">
            <!-- Imagen ocupa el 65% superior (scaleType="centerCrop") -->
            <div class="m-onb-image-wrap">
              <img
                [src]="slides[mobileSlide].image"
                [alt]="slides[mobileSlide].title"
                class="m-onb-img"
              />
            </div>

            <!-- Contenido inferior 35% -->
            <div class="m-onb-body">
              <h2 class="m-onb-title">{{ slides[mobileSlide].title }}</h2>
              <p class="m-onb-desc">{{ slides[mobileSlide].desc }}</p>
            </div>
          </div>

          <!-- Zonas táctiles izquierda (atrás) y derecha (siguiente) igual que OnboardingActivity.kt -->
          <div class="m-tap-zones">
            <div class="m-tap-left" (click)="prevMobileSlide()"></div>
            <div class="m-tap-right" (click)="nextMobileSlide()"></div>
          </div>

          <!-- Botón "Empieza a comprar" visible en el 3er slide (position == 2) -->
          <button
            *ngIf="mobileSlide === slides.length - 1"
            type="button"
            class="m-btn-start"
            (click)="goToMobileAuth('login')"
          >
            Empieza a comprar
          </button>

          <!-- Indicadores de barra horizontal en la parte inferior (activity_onboarding.xml) -->
          <div class="m-indicator-bars">
            <span
              *ngFor="let s of slides; let i = index"
              class="m-bar"
              [class.active]="i === mobileSlide"
            ></span>
          </div>
        </div>

        <!-- 3. PANTALLAS DE LOGIN / REGISTRO / RECUPERAR CONTRASEÑA EN MÓVIL (activity_login.xml / activity_register.xml) -->
        <div *ngIf="mobileStep === 'auth'" class="m-auth-screen">
          <!-- MODO LOGIN MÓVIL (activity_login.xml) -->
          <div *ngIf="mode === 'login'" class="m-auth-container">
            <img src="assets/images/logo_raw.png" alt="CakeByte" class="m-logo-login" />
            <h1 class="m-auth-heading">Iniciar Sesión</h1>

            <div *ngIf="errorMsg" class="alert-box alert-error m-alert">{{ errorMsg }}</div>
            <div *ngIf="successMsg" class="alert-box alert-success m-alert">{{ successMsg }}</div>

            <form (ngSubmit)="onLogin()" class="m-form">
              <label class="m-label">Correo electrónico</label>
              <input
                type="email"
                class="m-outlined-input"
                [(ngModel)]="loginEmail"
                name="mLoginEmail"
                placeholder="usuario@gmail.com"
                required
              />

              <div class="m-password-header">
                <label class="m-label mb-0">Contraseña</label>
                <button type="button" class="m-forgot-link" (click)="switchMode('forgot')">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>
              <input
                type="password"
                class="m-outlined-input"
                [(ngModel)]="loginPassword"
                name="mLoginPassword"
                placeholder="********"
                required
              />

              <label class="m-keep-signed">
                <input type="checkbox" checked />
                <span>Mantenerme conectado</span>
              </label>

              <button type="submit" class="m-btn-salmon" [disabled]="loading">
                {{ loading ? 'Ingresando...' : 'Ingresar' }}
              </button>

              <div class="m-divider-row">
                <span class="m-line"></span>
                <span class="m-or-text">o inicia sesión con</span>
                <span class="m-line"></span>
              </div>

              <button type="button" class="m-btn-google" (click)="onGoogleInfo()">
                Continuar con Google
              </button>

              <p class="m-bottom-switch" (click)="switchMode('register')">
                ¿No tienes una cuenta? <strong>Regístrate</strong>
              </p>
            </form>
          </div>

          <!-- MODO REGISTRO MÓVIL (activity_register.xml) -->
          <div *ngIf="mode === 'register'" class="m-auth-container">
            <img src="assets/images/logo_raw.png" alt="CakeByte" class="m-logo-register" />
            <h1 class="m-auth-heading">Registrarse</h1>

            <div *ngIf="errorMsg" class="alert-box alert-error m-alert">{{ errorMsg }}</div>

            <form (ngSubmit)="onRegister()" class="m-form">
              <label class="m-label">Nombre</label>
              <input
                type="text"
                class="m-outlined-input"
                [(ngModel)]="regName"
                name="mRegName"
                placeholder="Juan"
                required
              />

              <label class="m-label">Apellido</label>
              <input
                type="text"
                class="m-outlined-input"
                [(ngModel)]="regSurname"
                name="mRegSurname"
                placeholder="Flores"
                required
              />

              <label class="m-label">Correo electrónico</label>
              <input
                type="email"
                class="m-outlined-input"
                [(ngModel)]="regEmail"
                name="mRegEmail"
                placeholder="usuario@gmail.com"
                required
              />

              <label class="m-label">Contraseña</label>
              <input
                type="password"
                class="m-outlined-input"
                [(ngModel)]="regPassword"
                name="mRegPassword"
                placeholder="********"
                required
              />

              <label class="m-label">Confirmar contraseña</label>
              <input
                type="password"
                class="m-outlined-input"
                [(ngModel)]="regConfirmPassword"
                name="mRegConfirmPassword"
                placeholder="********"
                required
              />

              <label class="m-terms-row">
                <input type="checkbox" [(ngModel)]="regTerms" name="mRegTerms" />
                <span>Al crear una cuenta, acepto los Términos de Uso y la Política de Privacidad</span>
              </label>

              <button type="submit" class="m-btn-salmon" [disabled]="loading">
                {{ loading ? 'Registrando...' : 'Registrarse' }}
              </button>

              <p class="m-bottom-switch" (click)="switchMode('login')">
                ¿Ya tienes una cuenta? <strong>Inicia sesión</strong>
              </p>
            </form>
          </div>

          <!-- MODO RECUPERAR CONTRASEÑA MÓVIL -->
          <div *ngIf="mode === 'forgot'" class="m-auth-container">
            <img src="assets/images/logo_raw.png" alt="CakeByte" class="m-logo-register" />
            <h1 class="m-auth-heading">Recuperar Contraseña</h1>
            <p class="m-forgot-desc">
              Ingresa tu correo electrónico para recibir las instrucciones de recuperación.
            </p>

            <div *ngIf="errorMsg" class="alert-box alert-error m-alert">{{ errorMsg }}</div>
            <div *ngIf="successMsg" class="alert-box alert-success m-alert">{{ successMsg }}</div>

            <form (ngSubmit)="onForgot()" class="m-form">
              <label class="m-label">Correo electrónico</label>
              <input
                type="email"
                class="m-outlined-input"
                [(ngModel)]="forgotEmail"
                name="mForgotEmail"
                placeholder="usuario@gmail.com"
                required
              />

              <button type="submit" class="m-btn-salmon">Enviar enlace</button>

              <p class="m-bottom-switch" (click)="switchMode('login')">
                <strong>Volver a Iniciar Sesión</strong>
              </p>
            </form>
          </div>
        </div>
      </div>

      <!-- ============================================================== -->
      <!-- VISTA ESCRITORIO WEB (> 768px): Dos columnas responsivas        -->
      <!-- ============================================================== -->
      <div class="auth-shell desktop-auth-flow">
        <!-- Columna izquierda: Onboarding interactivo de CakeByte -->
        <section class="auth-showcase">
          <div class="showcase-brand">
            <img src="assets/images/logo_raw.png" alt="CakeByte" class="showcase-logo" />
            <div>
              <h1>CakeByte</h1>
              <p>Tu pastel a un click de distancia</p>
            </div>
          </div>

          <div class="onboarding-slide">
            <div class="slide-img-frame">
              <img
                *ngFor="let s of slides; let idx = index"
                [src]="s.image"
                [alt]="s.title"
                class="slide-img"
                [class.active]="idx === activeSlide"
              />
            </div>
            <h2>{{ slides[activeSlide].title }}</h2>
            <p>{{ slides[activeSlide].desc }}</p>

            <div class="slide-dots">
              <button
                type="button"
                *ngFor="let s of slides; let idx = index"
                class="dot-btn"
                [class.active]="idx === activeSlide"
                (click)="selectSlide(idx)"
              ></button>
            </div>
          </div>
        </section>

        <!-- Columna derecha: Formulario de Login / Registro / Recuperar contraseña -->
        <section class="auth-form-panel">
          <div class="auth-card cb-card">
            <div class="auth-tabs">
              <button
                type="button"
                [class.active]="mode === 'login'"
                (click)="switchMode('login')"
              >
                Iniciar Sesión
              </button>
              <button
                type="button"
                [class.active]="mode === 'register'"
                (click)="switchMode('register')"
              >
                Registrarse
              </button>
            </div>

            <div *ngIf="errorMsg" class="alert-box alert-error">{{ errorMsg }}</div>
            <div *ngIf="successMsg" class="alert-box alert-success">{{ successMsg }}</div>

            <!-- MODO LOGIN -->
            <form *ngIf="mode === 'login'" (ngSubmit)="onLogin()" class="auth-form">
              <h3>Bienvenido de nuevo</h3>
              <p class="subtitle">Ingresa tus credenciales para acceder a CakeByte</p>

              <div class="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  class="cb-input"
                  [(ngModel)]="loginEmail"
                  name="loginEmail"
                  placeholder="usuario@gmail.com"
                  required
                />
              </div>

              <div class="form-group">
                <label>Contraseña</label>
                <input
                  type="password"
                  class="cb-input"
                  [(ngModel)]="loginPassword"
                  name="loginPassword"
                  placeholder="********"
                  required
                />
              </div>

              <div class="form-row-between">
                <label class="checkbox-label">
                  <input type="checkbox" checked /> Mantenerme conectado
                </label>
                <button type="button" class="link-btn" (click)="switchMode('forgot')">
                  ¿Olvidaste tu contraseña?
                </button>
              </div>

              <button type="submit" class="cb-btn-primary w-full" [disabled]="loading">
                {{ loading ? 'Ingresando...' : 'Ingresar' }}
              </button>
            </form>

            <!-- MODO REGISTRO -->
            <form *ngIf="mode === 'register'" (ngSubmit)="onRegister()" class="auth-form">
              <h3>Crear cuenta en CakeByte</h3>
              <p class="subtitle">Regístrate para comprar en nuestra repostería artesanal</p>

              <div class="grid-2">
                <div class="form-group">
                  <label>Nombre</label>
                  <input
                    type="text"
                    class="cb-input"
                    [(ngModel)]="regName"
                    name="regName"
                    placeholder="Juan"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Apellido</label>
                  <input
                    type="text"
                    class="cb-input"
                    [(ngModel)]="regSurname"
                    name="regSurname"
                    placeholder="Flores"
                    required
                  />
                </div>
              </div>

              <div class="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  class="cb-input"
                  [(ngModel)]="regEmail"
                  name="regEmail"
                  placeholder="usuario@gmail.com"
                  required
                />
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Contraseña</label>
                  <input
                    type="password"
                    class="cb-input"
                    [(ngModel)]="regPassword"
                    name="regPassword"
                    placeholder="Mínimo 6 caracteres"
                    required
                  />
                </div>
                <div class="form-group">
                  <label>Confirmar contraseña</label>
                  <input
                    type="password"
                    class="cb-input"
                    [(ngModel)]="regConfirmPassword"
                    name="regConfirmPassword"
                    placeholder="Repite tu contraseña"
                    required
                  />
                </div>
              </div>

              <label class="checkbox-label mb-3">
                <input type="checkbox" [(ngModel)]="regTerms" name="regTerms" />
                Al crear una cuenta, acepto los Términos de Uso y la Política de Privacidad
              </label>

              <button type="submit" class="cb-btn-primary w-full" [disabled]="loading">
                {{ loading ? 'Creando cuenta...' : 'Registrarse' }}
              </button>
            </form>

            <!-- MODO RECUPERAR CONTRASEÑA -->
            <form *ngIf="mode === 'forgot'" (ngSubmit)="onForgot()" class="auth-form">
              <h3>Recuperar Contraseña</h3>
              <p class="subtitle">
                Ingresa tu correo electrónico para recibir las instrucciones de recuperación.
              </p>

              <div class="form-group">
                <label>Correo electrónico</label>
                <input
                  type="email"
                  class="cb-input"
                  [(ngModel)]="forgotEmail"
                  name="forgotEmail"
                  placeholder="usuario@gmail.com"
                  required
                />
              </div>

              <button type="submit" class="cb-btn-primary w-full">Enviar enlace</button>
              <button type="button" class="cb-btn-outline w-full mt-2" (click)="switchMode('login')">
                Volver a Iniciar Sesión
              </button>
            </form>
          </div>
        </section>
      </div>
    </ion-content>
  `,
  styles: [`
    /* Por defecto en escritorio (> 768px) se muestra desktop-auth-flow */
    .mobile-auth-flow {
      display: none;
    }
    .desktop-auth-flow {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.08fr 1fr;
      background: #FFFBF9;
    }

    /* ============================================================ */
    /* ESTILOS NATIVOS DE TELÉFONO (<= 768px)                       */
    /* ============================================================ */
    @media (max-width: 768px) {
      .desktop-auth-flow {
        display: none !important;
      }
      .mobile-auth-flow {
        display: block;
        min-height: 100vh;
        background: #FFFFFF;
      }

      /* 1. SPLASH SCREEN (activity_main.xml) */
      .m-splash {
        min-height: 100vh;
        width: 100%;
        background: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 24px;
      }
      .m-splash-center {
        text-align: center;
      }
      .m-splash-title {
        font-family: Georgia, 'Times New Roman', serif;
        font-size: 48px;
        font-weight: 700;
        color: #FF8B6A;
        margin: 0;
        letter-spacing: 0.02em;
      }
      .m-splash-slogan {
        font-family: sans-serif;
        font-size: 18px;
        color: #FF8B6A;
        margin: 8px 0 0;
      }

      /* 2. ONBOARDING INTERACTIVO (activity_onboarding.xml + item_onboarding.xml) */
      .m-onboarding {
        position: relative;
        height: 100vh;
        width: 100%;
        background: #FFFFFF;
        overflow: hidden;
        display: flex;
        flex-direction: column;
      }
      .m-onboarding-slide {
        flex: 1;
        display: flex;
        flex-direction: column;
        height: 100%;
      }
      .m-onb-image-wrap {
        height: 62vh;
        width: 100%;
        overflow: hidden;
      }
      .m-onb-img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: center;
        display: block;
      }
      .m-onb-body {
        flex: 1;
        padding: 28px 32px 90px;
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        background: #FFFFFF;
      }
      .m-onb-title {
        font-size: 24px;
        font-weight: 700;
        color: #000000;
        margin: 0 0 14px;
      }
      .m-onb-desc {
        font-size: 15px;
        line-height: 1.5;
        color: #757575;
        margin: 0;
      }
      .m-tap-zones {
        position: absolute;
        inset: 0;
        display: flex;
        z-index: 5;
      }
      .m-tap-left,
      .m-tap-right {
        flex: 1;
        height: 100%;
      }
      .m-btn-start {
        position: absolute;
        left: 24px;
        right: 24px;
        bottom: 64px;
        z-index: 10;
        background: #FF8B6A;
        color: #FFFFFF;
        border: none;
        border-radius: 24px;
        padding: 15px 24px;
        font-size: 16px;
        font-weight: 700;
        box-shadow: 0 6px 16px rgba(255, 139, 106, 0.35);
      }
      .m-indicator-bars {
        position: absolute;
        bottom: 32px;
        left: 0;
        right: 0;
        z-index: 10;
        display: flex;
        justify-content: center;
        gap: 8px;
      }
      .m-bar {
        width: 40px;
        height: 4px;
        background: #EEEEEE;
        border-radius: 2px;
        transition: background 0.2s ease;
      }
      .m-bar.active {
        background: #FF8B6A;
      }

      /* 3. LOGIN & REGISTRO MÓVIL (activity_login.xml + activity_register.xml) */
      .m-auth-screen {
        min-height: 100vh;
        background: #FFFFFF;
        padding: 28px 32px 40px;
      }
      .m-auth-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        max-width: 420px;
        margin: 0 auto;
      }
      .m-logo-login {
        width: 120px;
        height: 120px;
        object-fit: contain;
        margin-top: 12px;
      }
      .m-logo-register {
        width: 100px;
        height: 100px;
        object-fit: contain;
        margin-top: 8px;
      }
      .m-auth-heading {
        font-size: 32px;
        font-weight: 700;
        color: #FF8B6A;
        margin: 12px 0 24px;
        text-align: center;
      }
      .m-forgot-desc {
        text-align: center;
        color: #757575;
        font-size: 14px;
        margin: -10px 0 20px;
      }
      .m-alert {
        width: 100%;
      }
      .m-form {
        width: 100%;
        display: flex;
        flex-direction: column;
      }
      .m-label {
        font-size: 14px;
        font-weight: 700;
        color: #000000;
        margin-bottom: 6px;
        margin-top: 14px;
      }
      .m-label.mb-0 {
        margin: 0;
      }
      .m-password-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-top: 14px;
        margin-bottom: 6px;
      }
      .m-forgot-link {
        background: none;
        border: none;
        color: #FF8B6A;
        font-size: 12px;
        font-weight: 600;
        padding: 0;
      }
      .m-outlined-input {
        width: 100%;
        padding: 14px 16px;
        border: 1.5px solid #CCCCCC;
        border-radius: 12px;
        font-size: 15px;
        color: #000000;
        background: #FFFFFF;
        outline: none;
      }
      .m-outlined-input:focus {
        border-color: #FF8B6A;
      }
      .m-keep-signed {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 14px;
        font-size: 14px;
        color: #000000;
      }
      .m-terms-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 18px;
        font-size: 12px;
        color: #757575;
        line-height: 1.4;
      }
      .m-btn-salmon {
        width: 100%;
        margin-top: 22px;
        padding: 16px;
        background: #FF8B6A;
        color: #FFFFFF;
        border: none;
        border-radius: 12px;
        font-size: 18px;
        font-weight: 700;
      }
      .m-divider-row {
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 22px 0;
      }
      .m-line {
        flex: 1;
        height: 1px;
        background: #EEEEEE;
      }
      .m-or-text {
        font-size: 12px;
        color: #757575;
      }
      .m-btn-google {
        width: 100%;
        padding: 13px;
        background: #FFFFFF;
        color: #757575;
        border: 1px solid #EEEEEE;
        border-radius: 12px;
        font-size: 15px;
        font-weight: 600;
      }
      .m-bottom-switch {
        margin-top: 24px;
        text-align: center;
        color: #FF8B6A;
        font-size: 14px;
        cursor: pointer;
      }
    }

    /* ============================================================ */
    /* ESTILOS DE ESCRITORIO (> 768px)                              */
    /* ============================================================ */
    .auth-showcase {
      background: linear-gradient(145deg, #FF8B6A 0%, #FF6B4A 55%, #E65100 100%);
      color: #fff;
      padding: 48px 56px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      gap: 28px;
    }
    .showcase-brand {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      max-width: 520px;
      width: 100%;
      margin: 0 auto;
      text-align: left;
    }
    .showcase-logo {
      width: 64px;
      height: 64px;
      border-radius: 18px;
      background: #fff;
      padding: 6px;
      object-fit: contain;
    }
    .showcase-brand h1 {
      margin: 0;
      font-size: 2rem;
      font-weight: 800;
    }
    .showcase-brand p {
      margin: 4px 0 0;
      opacity: 0.92;
      font-size: 0.98rem;
    }
    .onboarding-slide {
      max-width: 520px;
      width: 100%;
      margin: 0 auto;
      text-align: center;
      background: rgba(255, 255, 255, 0.14);
      backdrop-filter: blur(10px);
      border-radius: 28px;
      padding: 28px;
      border: 1px solid rgba(255, 255, 255, 0.25);
    }
    .slide-img-frame {
      position: relative;
      width: 100%;
      height: 300px;
      border-radius: 22px;
      overflow: hidden;
      margin-bottom: 22px;
      box-shadow: 0 14px 32px rgba(0, 0, 0, 0.18);
    }
    .slide-img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
      object-position: center;
      opacity: 0;
      transform: scale(1.04);
      transition: opacity 0.65s ease, transform 0.65s ease;
    }
    .slide-img.active {
      opacity: 1;
      transform: scale(1);
    }
    .onboarding-slide h2 {
      font-size: 1.6rem;
      font-weight: 800;
      margin: 0 0 10px;
    }
    .onboarding-slide p {
      font-size: 0.98rem;
      line-height: 1.55;
      opacity: 0.95;
      margin: 0 0 20px;
      min-height: 4.5em;
    }
    .slide-dots {
      display: flex;
      justify-content: center;
      gap: 10px;
    }
    .dot-btn {
      width: 12px;
      height: 12px;
      border-radius: 999px;
      border: none;
      background: rgba(255, 255, 255, 0.45);
      cursor: pointer;
      transition: all 0.25s ease;
    }
    .dot-btn.active {
      width: 32px;
      background: #fff;
    }
    .auth-form-panel {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 40px 28px;
    }
    .auth-card {
      width: 100%;
      max-width: 500px;
      padding: 34px;
    }
    .auth-tabs {
      display: grid;
      grid-template-columns: 1fr 1fr;
      background: var(--cb-salmon-soft);
      padding: 5px;
      border-radius: 14px;
      margin-bottom: 24px;
    }
    .auth-tabs button {
      border: none;
      background: transparent;
      padding: 11px;
      border-radius: 11px;
      font-weight: 700;
      color: #6d4c41;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .auth-tabs button.active {
      background: #fff;
      color: var(--cb-salmon);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.06);
    }
    .auth-form h3 {
      margin: 0 0 4px;
      font-size: 1.45rem;
      font-weight: 800;
    }
    .subtitle {
      margin: 0 0 20px;
      color: var(--cb-muted);
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 0.84rem;
      font-weight: 700;
      margin-bottom: 6px;
      color: #3e2723;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
    }
    .form-row-between {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 0.84rem;
      color: #4e342e;
      cursor: pointer;
    }
    .mb-3 {
      margin-bottom: 18px;
    }
    .mt-2 {
      margin-top: 10px;
    }
    .link-btn {
      background: none;
      border: none;
      color: var(--cb-salmon);
      font-weight: 700;
      cursor: pointer;
      font-size: 0.85rem;
    }
    .w-full {
      width: 100%;
    }
    .alert-box {
      padding: 12px 16px;
      border-radius: 12px;
      font-size: 0.86rem;
      font-weight: 600;
      margin-bottom: 16px;
    }
    .alert-error {
      background: #ffebee;
      color: #c62828;
      border: 1px solid #ffcdd2;
    }
    .alert-success {
      background: #e8f5e9;
      color: #2e7d32;
      border: 1px solid #c8e6c9;
    }
  `],
})
export class AuthPage implements OnInit, OnDestroy {
  /* Estado para el flujo móvil original (Splash -> Onboarding -> Login) */
  mobileStep: 'splash' | 'onboarding' | 'auth' = 'splash';
  mobileSlide = 0;
  private splashTimeoutId: any = null;

  /* Estado compartido y de escritorio */
  mode: 'login' | 'register' | 'forgot' = 'login';
  activeSlide = 0;
  private slideIntervalId: any = null;
  loading = false;
  errorMsg = '';
  successMsg = '';

  loginEmail = '';
  loginPassword = '';

  regName = '';
  regSurname = '';
  regEmail = '';
  regPassword = '';
  regConfirmPassword = '';
  regRole: UserRole = 'Comprador';
  regTerms = true;

  forgotEmail = '';

  slides = [
    {
      title: 'Delicias dulces sin fin',
      desc: 'Déjate llevar por un mundo de deliciosos postres que saciarán tu gusto por lo dulce con nuestra amplia selección de pasteles, cupcakes y galletas.',
      image: 'assets/images/onboarding_1.png',
    },
    {
      title: 'Crea el pastel de tus sueños',
      desc: 'Nuestras opciones flexibles de pasteles personalizados te permiten adaptar cada detalle de tu pastel para que sea verdaderamente único.',
      image: 'assets/images/onboarding_2.png',
    },
    {
      title: 'Pedidos sin complicaciones',
      desc: 'Disfruta de una experiencia de compra fluida y cómoda con nuestra plataforma en línea, que te permite recibir tu pastel directamente en tu domicilio.',
      image: 'assets/images/onboarding_3.png',
    },
  ];

  constructor(private authRepo: AuthRepository, private router: Router) {}

  ngOnInit(): void {
    this.startAutoSlide();
    /* Igual que MainActivity.kt: Splash de 2 segundos antes de pasar al Onboarding */
    this.splashTimeoutId = setTimeout(() => {
      if (this.mobileStep === 'splash') {
        this.mobileStep = 'onboarding';
      }
    }, 2000);
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
    if (this.splashTimeoutId) {
      clearTimeout(this.splashTimeoutId);
    }
  }

  skipSplash(): void {
    if (this.splashTimeoutId) {
      clearTimeout(this.splashTimeoutId);
    }
    this.mobileStep = 'onboarding';
  }

  prevMobileSlide(): void {
    if (this.mobileSlide > 0) {
      this.mobileSlide--;
    }
  }

  nextMobileSlide(): void {
    if (this.mobileSlide < this.slides.length - 1) {
      this.mobileSlide++;
    }
  }

  goToMobileAuth(initialMode: 'login' | 'register'): void {
    this.mode = initialMode;
    this.mobileStep = 'auth';
  }

  selectSlide(idx: number): void {
    this.activeSlide = idx;
    this.startAutoSlide();
  }

  private startAutoSlide(): void {
    this.stopAutoSlide();
    this.slideIntervalId = setInterval(() => {
      this.activeSlide = (this.activeSlide + 1) % this.slides.length;
    }, 3500);
  }

  private stopAutoSlide(): void {
    if (this.slideIntervalId) {
      clearInterval(this.slideIntervalId);
      this.slideIntervalId = null;
    }
  }

  switchMode(newMode: 'login' | 'register' | 'forgot'): void {
    this.mode = newMode;
    this.errorMsg = '';
    this.successMsg = '';
  }

  onGoogleInfo(): void {
    this.errorMsg = '';
    this.successMsg = 'Inicia sesión con tu correo registrado en CakeByte.';
  }

  async onLogin(): Promise<void> {
    this.errorMsg = '';
    if (!this.loginEmail || !this.loginPassword) {
      this.errorMsg = 'Por favor completa tu correo y contraseña.';
      return;
    }
    this.loading = true;
    const { user, error } = await this.authRepo.login(this.loginEmail, this.loginPassword);
    this.loading = false;

    if (error || !user) {
      this.errorMsg = error || 'No se pudo iniciar sesión.';
      return;
    }
    this.navigateByRole(user.role);
  }

  async onRegister(): Promise<void> {
    this.errorMsg = '';
    if (!this.regName || !this.regSurname || !this.regEmail || !this.regPassword) {
      this.errorMsg = 'Por favor completa todos los campos.';
      return;
    }
    if (this.regPassword !== this.regConfirmPassword) {
      this.errorMsg = 'Las contraseñas no coinciden.';
      return;
    }
    if (!this.regTerms) {
      this.errorMsg = 'Debes aceptar los términos y condiciones.';
      return;
    }

    this.loading = true;
    const fullName = `${this.regName.trim()} ${this.regSurname.trim()}`;
    const { user, error } = await this.authRepo.register(
      this.regEmail,
      this.regPassword,
      fullName,
      this.regRole,
      true
    );
    this.loading = false;

    if (error || !user) {
      this.errorMsg = error || 'Error al registrar la cuenta.';
      return;
    }
    this.navigateByRole(user.role);
  }

  onForgot(): void {
    if (!this.forgotEmail) {
      this.errorMsg = 'Ingresa tu correo electrónico.';
      return;
    }
    this.errorMsg = '';
    this.successMsg = `Se han enviado las instrucciones de recuperación a ${this.forgotEmail}.`;
  }

  private navigateByRole(role: UserRole): void {
    if (role === 'Admin') {
      this.router.navigate(['/admin']);
    } else if (role === 'Vendedor') {
      this.router.navigate(['/vendor']);
    } else {
      this.router.navigate(['/buyer']);
    }
  }
}
