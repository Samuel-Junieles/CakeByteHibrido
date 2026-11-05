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

      <main class="cb-container">
        <div *ngIf="toastMessage" class="floating-toast">{{ toastMessage }}</div>

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
                <input
                  #profileFileInput
                  type="file"
                  accept="image/*"
                  style="display: none"
                  (change)="onFileSelected($event)"
                />
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
    .floating-toast {
      position: fixed;
      bottom: 24px;
      right: 24px;
      background: #231917;
      color: #fff;
      padding: 13px 20px;
      border-radius: 14px;
      font-weight: 700;
      z-index: 300;
    }
    @media (max-width: 860px) {
      .profile-grid, .grid-2 {
        grid-template-columns: 1fr;
      }
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

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3200);
  }
}

