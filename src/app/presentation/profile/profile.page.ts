import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from '../shared/navbar.component';
import { AuthRepository } from '../../data/services/auth.repository';
import { PhotoService } from '../../data/services/photo.service';
import { UserEntity } from '../../domain/models/models';

@Component({
  selector: 'app-profile-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NavbarComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-navbar [user]="currentUser"></app-navbar>

      <div *ngIf="toastMessage" class="floating-toast">{{ toastMessage }}</div>

      <input
        #profileFileInput
        type="file"
        accept="image/*"
        style="display: none"
        (change)="onFileSelected($event)"
      />

      <!-- ============================================================== -->
      <!-- VISTA MÓVIL ORIGINAL (<= 768px): activity_user_profile.xml     -->
      <!-- ============================================================== -->
      <div class="mobile-profile-flow" *ngIf="currentUser">
        <!-- VISTA PRINCIPAL DEL PERFIL MÓVIL (activity_user_profile.xml) -->
        <div *ngIf="!mobileEditMode" class="m-profile-main">
          <div class="m-header-salmon"></div>

          <div class="m-avatar-container">
            <img
              [src]="avatarPreview || currentUser.avatarUrl || 'assets/images/logo_cake_byte_app_original.png'"
              alt="Foto de Perfil"
              class="m-avatar-circle"
            />
            <button
              type="button"
              class="m-btn-edit-avatar"
              (click)="showMobilePhotoSheet = true"
              title="Cambiar foto de perfil"
            >
              ✎
            </button>
          </div>

          <h1 class="m-user-name">{{ currentUser.name }}</h1>
          <p class="m-user-email">{{ currentUser.email }}</p>

          <!-- Tarjeta 1: Editar Perfil + Notificaciones -->
          <div class="m-menu-card">
            <div class="m-menu-row" (click)="mobileEditMode = true">
              <span class="m-menu-text">Editar Perfil</span>
              <span class="m-menu-chevron">›</span>
            </div>
            <div class="m-menu-divider"></div>
            <div class="m-menu-row">
              <span class="m-menu-text">Notificaciones</span>
              <span class="m-menu-status">ON</span>
            </div>
          </div>

          <!-- Tarjeta 2: Ayuda, Contacto, Privacidad -->
          <div class="m-menu-card">
            <div class="m-menu-row" (click)="showToast('Soporte CakeByte disponible en línea')">
              <span class="m-menu-text">Ayuda y Soporte</span>
              <span class="m-menu-chevron">›</span>
            </div>
            <div class="m-menu-divider"></div>
            <div class="m-menu-row" (click)="showToast('Contacto: soporte@cakebyte.com')">
              <span class="m-menu-text">Contáctanos</span>
              <span class="m-menu-chevron">›</span>
            </div>
            <div class="m-menu-divider"></div>
            <div class="m-menu-row" (click)="showToast('Tus datos están protegidos en Supabase')">
              <span class="m-menu-text">Política de Privacidad</span>
              <span class="m-menu-chevron">›</span>
            </div>
          </div>

          <button type="button" class="m-btn-logout-red" (click)="logout()">
            Cerrar Sesión
          </button>
        </div>

        <!-- VISTA EDITAR PERFIL MÓVIL (activity_edit_profile.xml) -->
        <div *ngIf="mobileEditMode" class="m-edit-profile-screen">
          <div class="m-edit-top">
            <button type="button" class="m-back-btn" (click)="mobileEditMode = false">←</button>
            <h1 class="m-edit-title">Editar Perfil</h1>
            <span style="width: 40px"></span>
          </div>

          <form (ngSubmit)="saveProfile(); mobileEditMode = false" class="m-edit-form">
            <div class="m-input-group">
              <label>Nombre completo</label>
              <input type="text" [(ngModel)]="editName" name="mEditName" required />
            </div>

            <div class="m-input-group">
              <label>Email</label>
              <input type="email" [value]="currentUser.email" disabled />
            </div>

            <div class="m-input-group">
              <label>Dirección</label>
              <input type="text" [(ngModel)]="editAddress" name="mEditAddress" />
            </div>

            <div class="m-input-group">
              <label>Teléfono</label>
              <input type="tel" [(ngModel)]="editPhone" name="mEditPhone" />
            </div>

            <button type="submit" class="m-btn-save" [disabled]="saving">
              {{ saving ? 'GUARDANDO...' : 'GUARDAR' }}
            </button>
          </form>
        </div>

        <!-- HOJA DE OPCIONES PARA CÁMARA Y GALERÍA EN MÓVIL -->
        <div
          class="modal-backdrop"
          *ngIf="showMobilePhotoSheet"
          (click)="showMobilePhotoSheet = false"
        >
          <div class="m-photo-sheet" (click)="$event.stopPropagation()">
            <h3>Foto de Perfil</h3>
            <p>Elige cómo deseas actualizar tu foto</p>
            <button
              type="button"
              class="m-sheet-btn primary"
              (click)="showMobilePhotoSheet = false; takeProfilePhoto()"
            >
              Tomar foto con la Cámara
            </button>
            <button
              type="button"
              class="m-sheet-btn outline"
              (click)="showMobilePhotoSheet = false; pickProfileFromGallery()"
            >
              Elegir de la Galería del Teléfono
            </button>
            <button
              type="button"
              class="m-sheet-btn cancel"
              (click)="showMobilePhotoSheet = false"
            >
              Cancelar
            </button>
          </div>
        </div>

        <!-- BOTTOM NAVIGATION BAR SEGÚN EL ROL DEL USUARIO -->
        <nav class="m-bottom-nav" *ngIf="currentUser.role === 'Comprador'">
          <button type="button" class="m-nav-btn" (click)="goRoleTab('/buyer', 'home')">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Inicio</span>
          </button>
          <button type="button" class="m-nav-btn" (click)="goRoleTab('/buyer', 'catalog')">
            <ion-icon name="book-outline"></ion-icon>
            <span>Catálogo</span>
          </button>
          <button type="button" class="m-nav-btn" (click)="goRoleTab('/buyer', 'cart')">
            <ion-icon name="cart-outline"></ion-icon>
            <span>Carrito</span>
          </button>
          <button type="button" class="m-nav-btn active">
            <ion-icon name="person-outline"></ion-icon>
            <span>Perfil</span>
          </button>
        </nav>

        <nav class="m-bottom-nav cols-3" *ngIf="currentUser.role === 'Vendedor'">
          <button type="button" class="m-nav-btn" (click)="goRoleRoute('/vendor')">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Inicio</span>
          </button>
          <button type="button" class="m-nav-btn" (click)="goRoleRoute('/vendor')">
            <ion-icon name="grid-outline"></ion-icon>
            <span>Productos</span>
          </button>
          <button type="button" class="m-nav-btn active">
            <ion-icon name="person-outline"></ion-icon>
            <span>Perfil</span>
          </button>
        </nav>

        <nav class="m-bottom-nav" *ngIf="currentUser.role === 'Admin'">
          <button type="button" class="m-nav-btn" (click)="goRoleRoute('/admin')">
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Inicio</span>
          </button>
          <button type="button" class="m-nav-btn" (click)="goRoleRoute('/admin')">
            <ion-icon name="people-outline"></ion-icon>
            <span>Usuarios</span>
          </button>
          <button type="button" class="m-nav-btn" (click)="goRoleRoute('/admin')">
            <ion-icon name="grid-outline"></ion-icon>
            <span>Productos</span>
          </button>
          <button type="button" class="m-nav-btn active">
            <ion-icon name="person-outline"></ion-icon>
            <span>Perfil</span>
          </button>
        </nav>
      </div>

      <!-- ============================================================== -->
      <!-- VISTA ESCRITORIO WEB (> 768px)                                 -->
      <!-- ============================================================== -->
      <main class="cb-container desktop-profile-flow">
        <div class="profile-grid" *ngIf="currentUser">
          <!-- Tarjeta de Foto de Perfil con Cámara y Galería (PhotoService) -->
          <section class="profile-avatar-card cb-card">
            <div class="avatar-ring">
              <img
                [src]="avatarPreview || currentUser.avatarUrl || 'assets/images/logo_cake_byte_app_original.png'"
                alt="Foto de Perfil"
                class="profile-avatar-img"
              />
            </div>

            <h2>{{ currentUser.name }}</h2>
            <p class="email-text">{{ currentUser.email }}</p>
            <span class="cb-badge cb-badge-role">{{ currentUser.role }}</span>

            <div class="camera-actions-box">
              <h4>Actualizar Foto de Perfil</h4>
              <p>Toma una foto con la cámara o selecciónala desde la galería de tu teléfono.</p>

              <div class="cam-btns">
                <button type="button" class="cb-btn-primary w-full" (click)="takeProfilePhoto()">
                  Tomar Foto con Cámara
                </button>

                <button type="button" class="cb-btn-outline w-full" (click)="pickProfileFromGallery()">
                  Elegir de la Galería del Teléfono
                </button>

                <button
                  type="button"
                  class="cb-btn-outline w-full"
                  (click)="profileFileInput.click()"
                >
                  Seleccionar Imagen del Dispositivo
                </button>
              </div>
            </div>
          </section>

          <!-- Formulario Editar Perfil -->
          <section class="profile-form-card cb-card">
            <h2>Editar Información del Perfil</h2>
            <p class="subtitle">
              Actualiza tus datos personales y de entrega.
            </p>

            <form (ngSubmit)="saveProfile()" class="profile-form">
              <div class="form-group">
                <label>Nombre completo</label>
                <input
                  type="text"
                  class="cb-input"
                  [(ngModel)]="editName"
                  name="editName"
                  placeholder="Tu nombre completo"
                  required
                />
              </div>

              <div class="form-group">
                <label>Correo electrónico (Identificador de cuenta)</label>
                <input
                  type="email"
                  class="cb-input"
                  [value]="currentUser.email"
                  disabled
                />
              </div>

              <div class="grid-2">
                <div class="form-group">
                  <label>Dirección predeterminada de entrega</label>
                  <input
                    type="text"
                    class="cb-input"
                    [(ngModel)]="editAddress"
                    name="editAddress"
                    placeholder="Ej. Calle 45 #12-34"
                  />
                </div>

                <div class="form-group">
                  <label>Teléfono de contacto</label>
                  <input
                    type="tel"
                    class="cb-input"
                    [(ngModel)]="editPhone"
                    name="editPhone"
                    placeholder="+57 300 000 0000"
                  />
                </div>
              </div>

              <div class="profile-settings-list">
                <div class="setting-item">
                  <span>Notificaciones de pedidos</span>
                  <span class="cb-badge cb-badge-green">ON</span>
                </div>
                <div class="setting-item">
                  <span>Seguridad de la cuenta</span>
                  <span class="cb-badge cb-badge-role">Activa</span>
                </div>
              </div>

              <div class="form-actions">
                <button type="submit" class="cb-btn-primary" [disabled]="saving">
                  {{ saving ? 'Guardando...' : 'GUARDAR CAMBIOS' }}
                </button>
                <button type="button" class="btn-logout-full" (click)="logout()">
                  Cerrar Sesión
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    .mobile-profile-flow {
      display: none;
    }

    @media (max-width: 768px) {
      .desktop-profile-flow {
        display: none !important;
      }
      .mobile-profile-flow {
        display: block;
        min-height: 100vh;
        background: #F5F5F5;
        padding-bottom: 84px;
      }

      /* PERFIL MÓVIL (activity_user_profile.xml) */
      .m-profile-main {
        display: flex;
        flex-direction: column;
        align-items: center;
      }
      .m-header-salmon {
        width: 100%;
        height: 150px;
        background: #FFF1EB;
      }
      .m-avatar-container {
        position: relative;
        width: 120px;
        height: 120px;
        margin-top: -60px;
      }
      .m-avatar-circle {
        width: 120px;
        height: 120px;
        border-radius: 50%;
        object-fit: cover;
        background: #FFFFFF;
        padding: 4px;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
      }
      .m-btn-edit-avatar {
        position: absolute;
        bottom: 0;
        right: 0;
        width: 36px;
        height: 36px;
        border-radius: 50%;
        border: none;
        background: #FFFFFF;
        color: #000000;
        font-size: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
      }
      .m-user-name {
        margin: 12px 0 4px;
        font-size: 22px;
        font-weight: 700;
        color: #000000;
      }
      .m-user-email {
        margin: 0 0 20px;
        font-size: 14px;
        color: #757575;
      }
      .m-menu-card {
        width: calc(100% - 48px);
        background: #FFFFFF;
        border-radius: 16px;
        padding: 8px 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 6px rgba(0, 0, 0, 0.05);
      }
      .m-menu-row {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 13px 0;
        cursor: pointer;
      }
      .m-menu-text {
        font-size: 16px;
        color: #000000;
      }
      .m-menu-chevron {
        font-size: 20px;
        color: #757575;
      }
      .m-menu-status {
        font-size: 14px;
        font-weight: 700;
        color: #FF8B6A;
      }
      .m-menu-divider {
        height: 1px;
        background: #F0F0F0;
      }
      .m-btn-logout-red {
        margin-top: 8px;
        background: none;
        border: none;
        color: #D32F2F;
        font-size: 16px;
        font-weight: 700;
        padding: 12px 24px;
      }

      /* EDITAR PERFIL MÓVIL (activity_edit_profile.xml) */
      .m-edit-profile-screen {
        min-height: 100vh;
        background: #FFFFFF;
        padding: 20px 24px 40px;
      }
      .m-edit-top {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 28px;
      }
      .m-back-btn {
        width: 40px;
        height: 40px;
        border: none;
        background: none;
        font-size: 24px;
        color: #000000;
      }
      .m-edit-title {
        font-size: 24px;
        font-weight: 700;
        margin: 0;
        color: #000000;
      }
      .m-edit-form {
        display: flex;
        flex-direction: column;
        gap: 16px;
      }
      .m-input-group label {
        display: block;
        font-size: 13px;
        font-weight: 600;
        color: #757575;
        margin-bottom: 6px;
      }
      .m-input-group input {
        width: 100%;
        padding: 14px 16px;
        border: 1.5px solid #CCCCCC;
        border-radius: 10px;
        font-size: 15px;
        color: #000000;
      }
      .m-btn-save {
        margin-top: 28px;
        width: 100%;
        padding: 16px;
        border: none;
        border-radius: 12px;
        background: #FF8B6A;
        color: #FFFFFF;
        font-size: 18px;
        font-weight: 700;
      }

      /* HOJA CÁMARA Y GALERÍA */
      .m-photo-sheet {
        width: 100%;
        max-width: 380px;
        background: #FFFFFF;
        border-radius: 24px;
        padding: 24px;
        text-align: center;
      }
      .m-photo-sheet h3 {
        margin: 0 0 6px;
        font-size: 18px;
      }
      .m-photo-sheet p {
        margin: 0 0 18px;
        font-size: 13px;
        color: #757575;
      }
      .m-sheet-btn {
        width: 100%;
        padding: 14px;
        border-radius: 14px;
        font-weight: 700;
        font-size: 15px;
        margin-bottom: 10px;
      }
      .m-sheet-btn.primary {
        background: #FF8B6A;
        color: #FFFFFF;
        border: none;
      }
      .m-sheet-btn.outline {
        background: #FFF1EB;
        color: #FF8B6A;
        border: 1px solid #FF8B6A;
      }
      .m-sheet-btn.cancel {
        background: #F5F5F5;
        color: #424242;
        border: none;
        margin-bottom: 0;
      }

      /* BOTTOM NAV */
      .m-bottom-nav {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        height: 64px;
        background: #FFFFFF;
        border-top: 1px solid #EEEEEE;
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        z-index: 150;
      }
      .m-bottom-nav.cols-3 {
        grid-template-columns: repeat(3, 1fr);
      }
      .m-nav-btn {
        background: none;
        border: none;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        color: #9E9E9E;
        font-size: 12px;
        font-weight: 600;
      }
      .m-nav-btn ion-icon {
        font-size: 20px;
      }
      .m-nav-btn.active {
        color: #FF8B6A;
      }
    }

    /* ============================================================ */
    /* ESTILOS DE ESCRITORIO (> 768px)                              */
    /* ============================================================ */
    .profile-grid {
      display: grid;
      grid-template-columns: 380px 1fr;
      gap: 28px;
      align-items: start;
    }
    .profile-avatar-card {
      padding: 32px 24px;
      text-align: center;
    }
    .avatar-ring {
      width: 150px;
      height: 150px;
      margin: 0 auto 16px;
      border-radius: 50%;
      padding: 5px;
      background: linear-gradient(135deg, #FF8B6A, #8E24AA);
    }
    .profile-avatar-img {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      object-fit: cover;
      background: #fff;
    }
    .profile-avatar-card h2 {
      margin: 0 0 4px;
      font-size: 1.4rem;
      font-weight: 800;
    }
    .email-text {
      margin: 0 0 12px;
      color: var(--cb-muted);
      font-size: 0.9rem;
    }
    .camera-actions-box {
      margin-top: 24px;
      padding-top: 20px;
      border-top: 1px solid var(--cb-border);
      text-align: left;
    }
    .camera-actions-box h4 {
      margin: 0 0 4px;
      font-size: 0.98rem;
    }
    .camera-actions-box p {
      margin: 0 0 14px;
      font-size: 0.82rem;
      color: var(--cb-muted);
    }
    .cam-btns {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .w-full {
      width: 100%;
    }
    .profile-form-card {
      padding: 32px;
    }
    .profile-form-card h2 {
      margin: 0 0 6px;
      font-size: 1.5rem;
      font-weight: 800;
    }
    .subtitle {
      margin: 0 0 24px;
      color: var(--cb-muted);
      font-size: 0.9rem;
    }
    .form-group {
      margin-bottom: 18px;
    }
    .form-group label {
      display: block;
      font-size: 0.85rem;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
    }
    .profile-settings-list {
      margin: 22px 0;
      padding: 14px 18px;
      border-radius: 14px;
      background: #fff7f4;
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .setting-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.88rem;
      font-weight: 600;
    }
    .form-actions {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 14px;
      flex-wrap: wrap;
    }
    .btn-logout-full {
      background: #ffebee;
      color: #c62828;
      border: none;
      padding: 12px 20px;
      border-radius: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: rgba(35, 25, 23, 0.55);
      backdrop-filter: blur(4px);
      z-index: 200;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .floating-toast {
      position: fixed;
      bottom: 76px;
      right: 24px;
      background: #231917;
      color: #fff;
      padding: 13px 20px;
      border-radius: 14px;
      font-weight: 700;
      z-index: 300;
    }
  `],
})
export class ProfilePage implements OnInit {
  @ViewChild('profileFileInput') profileFileInput!: ElementRef<HTMLInputElement>;

  currentUser: UserEntity | null = null;
  editName = '';
  editAddress = '';
  editPhone = '';
  editRole: 'Admin' | 'Vendedor' | 'Comprador' = 'Comprador';
  avatarPreview: string | null = null;
  saving = false;
  toastMessage = '';

  /* Estado móvil original */
  mobileEditMode = false;
  showMobilePhotoSheet = false;

  constructor(
    private authRepo: AuthRepository,
    private photoService: PhotoService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authRepo.currentUser$.subscribe((u) => {
      this.currentUser = u;
      if (u) {
        this.editName = u.name;
        this.editAddress = u.address || '';
        this.editPhone = u.phone || '';
        this.editRole = u.role;
        this.avatarPreview = u.avatarUrl || null;
      }
    });
  }

  goRoleTab(route: string, tab: string): void {
    this.router.navigate([route], { queryParams: { tab } });
  }

  goRoleRoute(route: string): void {
    this.router.navigate([route]);
  }

  async takeProfilePhoto(): Promise<void> {
    if (!this.currentUser) return;
    const captured = await this.photoService.takePhotoFromCamera();
    if (captured?.dataUrl) {
      this.avatarPreview = captured.dataUrl;
      await this.authRepo.updateProfilePhoto(this.currentUser.email, captured.dataUrl);
      this.showToast('Foto de perfil tomada y guardada con éxito');
    }
  }

  async pickProfileFromGallery(): Promise<void> {
    if (!this.currentUser) return;
    const captured = await this.photoService.pickFromGallery();
    if (captured?.dataUrl) {
      this.avatarPreview = captured.dataUrl;
      await this.authRepo.updateProfilePhoto(this.currentUser.email, captured.dataUrl);
      this.showToast('Foto de perfil actualizada desde la galería');
    } else if (this.profileFileInput?.nativeElement) {
      this.profileFileInput.nativeElement.click();
    }
  }

  async onFileSelected(event: Event): Promise<void> {
    if (!this.currentUser) return;
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;
    const captured = await this.photoService.readFromFileInput(file);
    if (captured?.dataUrl) {
      this.avatarPreview = captured.dataUrl;
      await this.authRepo.updateProfilePhoto(this.currentUser.email, captured.dataUrl);
      this.showToast('Foto de perfil actualizada');
    }
  }

  async saveProfile(): Promise<void> {
    if (!this.currentUser) return;
    if (!this.editName.trim()) {
      this.showToast('El nombre no puede estar vacío');
      return;
    }

    this.saving = true;
    const res = await this.authRepo.updateUser({
      ...this.currentUser,
      name: this.editName.trim(),
      address: this.editAddress.trim(),
      phone: this.editPhone.trim(),
      role: this.editRole,
      avatarUrl: this.avatarPreview || this.currentUser.avatarUrl,
    });
    this.saving = false;

    if (res.success) {
      this.showToast('Perfil actualizado con éxito');
    } else {
      this.showToast(res.error || 'Error al actualizar el perfil');
    }
  }

  async logout(): Promise<void> {
    await this.authRepo.logout();
    this.router.navigate(['/login']);
  }

  showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3200);
  }
}
