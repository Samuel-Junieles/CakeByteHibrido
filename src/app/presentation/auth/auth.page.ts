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
      <div class="auth-shell">
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
              <p class="subtitle">Regístrate para comprar o gestionar repostería artesanal</p>

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
    .auth-shell {
      min-height: 100vh;
      display: grid;
      grid-template-columns: 1.08fr 1fr;
      background: #FFFBF9;
    }
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
    .quick-demo-section {
      margin-top: 24px;
      padding-top: 18px;
      border-top: 1px solid var(--cb-border);
      text-align: center;
    }
    .divider-text {
      display: block;
      font-size: 0.78rem;
      font-weight: 700;
      color: var(--cb-muted);
      margin-bottom: 12px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .demo-buttons {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }
    .demo-btn {
      padding: 9px 10px;
      font-size: 0.82rem;
    }
    @media (max-width: 960px) {
      .auth-shell {
        grid-template-columns: 1fr;
      }
      .auth-showcase {
        padding: 28px 20px;
      }
      .onboarding-slide {
        margin: 16px auto;
        padding: 20px;
      }
      .slide-img-frame {
        height: 220px;
      }
    }
  `],
})
export class AuthPage implements OnInit, OnDestroy {
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
  }

  ngOnDestroy(): void {
    this.stopAutoSlide();
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

