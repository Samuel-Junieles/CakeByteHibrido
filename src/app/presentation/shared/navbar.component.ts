import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthRepository } from '../../data/services/auth.repository';
import { CartRepository } from '../../data/services/cart.repository';
import { UserEntity } from '../../domain/models/models';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterModule],
  template: `
    <header class="cb-navbar">
      <div class="cb-navbar-inner">
        <div class="cb-brand" (click)="goHome()">
          <img src="assets/images/logo_raw.png" alt="CakeByte" class="cb-brand-logo" />
          <div>
            <span class="cb-brand-title">CakeByte</span>
            <span class="cb-brand-sub">Repostería Digital</span>
          </div>
        </div>

        <nav class="cb-nav-links" *ngIf="user">
          <!-- Navegación Comprador -->
          <ng-container *ngIf="user.role === 'Comprador'">
            <a routerLink="/buyer" routerLinkActive="active" [queryParams]="{ tab: 'home' }" class="cb-nav-item">
              Inicio y Catálogo
            </a>
            <a routerLink="/buyer" [queryParams]="{ tab: 'cart' }" class="cb-nav-item cb-cart-link">
              Mi Carrito
              <span class="cb-cart-pill" *ngIf="(cartRepo.totalItems$ | async) as count">{{ count }}</span>
            </a>
          </ng-container>

          <!-- Navegación Vendedor -->
          <ng-container *ngIf="user.role === 'Vendedor'">
            <a routerLink="/vendor" routerLinkActive="active" class="cb-nav-item">
              Panel Vendedor y Productos
            </a>
            <a routerLink="/buyer" class="cb-nav-item">
              Ver Tienda
            </a>
          </ng-container>

          <!-- Navegación Admin -->
          <ng-container *ngIf="user.role === 'Admin'">
            <a routerLink="/admin" routerLinkActive="active" class="cb-nav-item">
              Panel Administrativo
            </a>
            <a routerLink="/vendor" routerLinkActive="active" class="cb-nav-item">
              Módulo Vendedor
            </a>
            <a routerLink="/buyer" routerLinkActive="active" class="cb-nav-item">
              Vista Comprador
            </a>
          </ng-container>

          <a routerLink="/profile" routerLinkActive="active" class="cb-nav-item">
            Mi Perfil
          </a>
        </nav>

        <div class="cb-user-actions" *ngIf="user">
          <span class="cb-badge cb-badge-role">{{ user.role }}</span>

          <div class="cb-user-chip" routerLink="/profile" title="Ir a Mi Perfil y cambiar foto">
            <img
              [src]="user.avatarUrl || 'assets/images/logo_cake_byte_app_original.png'"
              alt="Avatar"
              class="cb-user-avatar"
            />
            <div class="cb-user-meta">
              <strong>{{ user.name }}</strong>
              <small>{{ user.email }}</small>
            </div>
          </div>

          <button class="cb-btn-logout" (click)="onLogout()" title="Cerrar Sesión">
            Salir
          </button>
        </div>
      </div>
    </header>
  `,
  styles: [`
    .cb-navbar {
      position: sticky;
      top: 0;
      z-index: 100;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(12px);
      border-bottom: 1px solid var(--cb-border);
      box-shadow: 0 4px 20px rgba(35, 25, 23, 0.04);
    }
    .cb-navbar-inner {
      max-width: 1360px;
      margin: 0 auto;
      padding: 12px 32px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      flex-wrap: wrap;
    }
    .cb-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      cursor: pointer;
    }
    .cb-brand-logo {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      object-fit: cover;
      background: var(--cb-salmon-soft);
      padding: 4px;
    }
    .cb-brand-title {
      display: block;
      font-weight: 800;
      font-size: 1.25rem;
      color: #231917;
      letter-spacing: -0.02em;
    }
    .cb-brand-sub {
      display: block;
      font-size: 0.74rem;
      color: var(--cb-salmon);
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .cb-nav-links {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cb-nav-item {
      text-decoration: none;
      color: #4e3b36;
      font-weight: 600;
      font-size: 0.92rem;
      padding: 9px 15px;
      border-radius: 12px;
      display: inline-flex;
      align-items: center;
      gap: 7px;
      transition: all 0.2s ease;
    }
    .cb-nav-item:hover, .cb-nav-item.active {
      background: var(--cb-salmon-soft);
      color: #d84315;
    }
    .cb-cart-pill {
      background: var(--cb-salmon);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
    }
    .cb-user-actions {
      display: flex;
      align-items: center;
      gap: 12px;
    }
    .cb-user-chip {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 5px 12px 5px 6px;
      border-radius: 999px;
      background: #fff7f4;
      border: 1px solid var(--cb-border);
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .cb-user-chip:hover {
      background: var(--cb-salmon-soft);
    }
    .cb-user-avatar {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
      border: 2px solid var(--cb-salmon);
    }
    .cb-user-meta {
      display: flex;
      flex-direction: column;
      line-height: 1.15;
    }
    .cb-user-meta strong {
      font-size: 0.85rem;
      color: #231917;
    }
    .cb-user-meta small {
      font-size: 0.72rem;
      color: var(--cb-muted);
    }
    .cb-btn-logout {
      background: #ffebee;
      color: #c62828;
      border: none;
      border-radius: 10px;
      padding: 8px 14px;
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }
    .cb-btn-logout:hover {
      background: #ffcdd2;
    }
    @media (max-width: 768px) {
      .cb-navbar {
        display: none !important;
      }
    }
  `],
})
export class NavbarComponent {
  @Input() user: UserEntity | null = null;

  constructor(
    private authRepo: AuthRepository,
    public cartRepo: CartRepository,
    private router: Router
  ) {}

  goHome(): void {
    if (!this.user) {
      this.router.navigate(['/login']);
      return;
    }
    if (this.user.role === 'Admin') {
      this.router.navigate(['/admin']);
    } else if (this.user.role === 'Vendedor') {
      this.router.navigate(['/vendor']);
    } else {
      this.router.navigate(['/buyer']);
    }
  }

  async onLogout(): Promise<void> {
    await this.authRepo.logout();
    this.router.navigate(['/login']);
  }
}

