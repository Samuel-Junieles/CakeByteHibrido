import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from '../shared/navbar.component';
import { PhotoPickerComponent } from '../shared/photo-picker.component';
import { AuthRepository } from '../../data/services/auth.repository';
import { ProductRepository } from '../../data/services/product.repository';
import { OrderRepository } from '../../data/services/order.repository';
import {
  DashboardStats,
  OrderEntity,
  ProductEntity,
  UserEntity,
  UserRole,
  resolveProductImageUrl,
} from '../../domain/models/models';

@Component({
  selector: 'app-admin-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NavbarComponent, PhotoPickerComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-navbar [user]="currentUser"></app-navbar>

      <main class="cb-container">
        <header class="admin-header">
          <div>
            <span class="cb-badge cb-badge-role">Panel Administrativo</span>
            <h1>Bienvenido, {{ currentUser?.name || 'Administrador' }}</h1>
            <p>Control global de usuarios, auditoría de productos y métricas de ventas en vivo.</p>
          </div>

          <div class="admin-nav-pills">
            <button
              type="button"
              class="cb-btn-outline"
              [class.active-pill]="activeSection === 'dashboard'"
              (click)="activeSection = 'dashboard'"
            >
              Dashboard y Reportes
            </button>
            <button
              type="button"
              class="cb-btn-outline"
              [class.active-pill]="activeSection === 'users'"
              (click)="activeSection = 'users'"
            >
              Usuarios ({{ users.length }})
            </button>
            <button
              type="button"
              class="cb-btn-outline"
              [class.active-pill]="activeSection === 'products'"
              (click)="activeSection = 'products'"
            >
              Productos ({{ products.length }})
            </button>
          </div>
        </header>

        <div *ngIf="toastMessage" class="floating-toast">{{ toastMessage }}</div>

        <!-- KPIs Globales -->
        <section class="kpi-grid">
          <div class="kpi-card kpi-sales">
            <span class="kpi-title">Ventas del día</span>
            <strong>{{ stats.dailySalesCount }} uds</strong>
            <small class="kpi-trend">{{ stats.activeProductsCount }} productos activos</small>
          </div>
          <div class="kpi-card kpi-orders">
            <span class="kpi-title">Pedidos totales</span>
            <strong>{{ stats.totalOrders }}</strong>
            <small class="kpi-trend">En tiempo real</small>
          </div>
          <div class="kpi-card kpi-total">
            <span class="kpi-title">Ganancias totales</span>
            <strong>{{ formatCOP(stats.totalEarnings) }}</strong>
            <small class="kpi-trend">Ingresos acumulados</small>
          </div>
          <div class="kpi-card kpi-users">
            <span class="kpi-title">Usuarios registrados</span>
            <strong>{{ users.length }}</strong>
            <small class="kpi-trend">Multi-rol activo</small>
          </div>
        </section>

        <!-- SECCIÓN 1: DASHBOARD & REPORTES -->
        <section *ngIf="activeSection === 'dashboard'" class="dashboard-split">
          <div class="cb-card panel-box">
            <div class="panel-top">
              <h2>Pedidos Recientes</h2>
              <span class="cb-badge cb-badge-green">{{ orders.length }} registros</span>
            </div>

            <div class="table-scroll">
              <table class="cb-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Cliente</th>
                    <th>Resumen</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Cambiar</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let o of orders">
                    <td><strong>#{{ o.id }}</strong></td>
                    <td>{{ o.customername }}</td>
                    <td>{{ o.itemssummary }}</td>
                    <td><strong>{{ formatCOP(o.totalprice) }}</strong></td>
                    <td>
                      <span
                        class="cb-badge"
                        [ngClass]="
                          o.status === 'Enviado' || o.status === 'Entregado'
                            ? 'cb-badge-green'
                            : 'cb-badge-yellow'
                        "
                      >
                        {{ o.status }}
                      </span>
                    </td>
                    <td>
                      <button
                        *ngIf="o.status === 'En espera' || o.status === 'Pendiente'"
                        type="button"
                        class="btn-mini"
                        (click)="toggleOrderSent(o)"
                      >
                        Marcar Enviado
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="cb-card panel-box">
            <h2>Top Productos del Catálogo</h2>
            <p class="muted">Productos destacados por disponibilidad y rotación</p>

            <div class="top-products-list">
              <div *ngFor="let p of products.slice(0, 5); let i = index" class="top-prod-row">
                <span class="rank-num">#{{ i + 1 }}</span>
                <img [src]="getImage(p.imageurl)" [alt]="p.name" />
                <div class="top-prod-meta">
                  <strong>{{ p.name }}</strong>
                  <small>{{ p.category }} · Stock: {{ p.stock }}</small>
                </div>
                <strong class="top-price">{{ formatCOP(p.price) }}</strong>
              </div>
            </div>
          </div>
        </section>

        <!-- SECCIÓN 2: GESTIÓN DE USUARIOS -->
        <section *ngIf="activeSection === 'users'" class="cb-card panel-box">
          <div class="panel-top">
            <div class="search-wrap">
              <input
                type="text"
                class="cb-input"
                [(ngModel)]="userSearch"
                placeholder="Buscar usuario por nombre o correo..."
              />
            </div>

            <div class="role-filters">
              <button
                type="button"
                *ngFor="let r of ['Todos', 'Admin', 'Vendedor', 'Comprador']"
                class="pill-btn"
                [class.active]="selectedRoleFilter === r"
                (click)="selectedRoleFilter = r"
              >
                {{ r }}
              </button>
            </div>

            <button type="button" class="cb-btn-primary" (click)="openUserModal()">
              + Crear Usuario
            </button>
          </div>

          <div class="table-scroll">
            <table class="cb-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Correo</th>
                  <th>Rol</th>
                  <th>Fecha Registro</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of filteredUsers">
                  <td>
                    <div class="user-cell">
                      <img
                        [src]="u.avatarUrl || 'assets/images/logo_cake_byte_app_original.png'"
                        alt="Avatar"
                      />
                      <strong>{{ u.name }}</strong>
                    </div>
                  </td>
                  <td>{{ u.email }}</td>
                  <td>
                    <span
                      class="cb-badge"
                      [ngClass]="{
                        'cb-badge-green': u.role === 'Admin',
                        'cb-badge-yellow': u.role === 'Vendedor',
                        'cb-badge-role': u.role === 'Comprador'
                      }"
                    >
                      {{ u.role }}
                    </span>
                  </td>
                  <td>{{ (u.createdAt || '').slice(0, 10) || 'Activo' }}</td>
                  <td>
                    <div class="row-btns">
                      <button type="button" class="cb-btn-outline btn-xs" (click)="openUserModal(u)">
                        Editar
                      </button>
                      <button type="button" class="btn-del-xs" (click)="removeUser(u)">
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SECCIÓN 3: AUDITORÍA Y GESTIÓN DE PRODUCTOS -->
        <section *ngIf="activeSection === 'products'" class="cb-card panel-box">
          <div class="panel-top">
            <div class="search-wrap">
              <input
                type="text"
                class="cb-input"
                [(ngModel)]="productSearch"
                placeholder="Buscar alimento o producto..."
              />
            </div>

            <div class="role-filters">
              <button
                type="button"
                *ngFor="let sf of ['Todos', 'En stock', 'Fuera de stock']"
                class="pill-btn"
                [class.active]="selectedStockFilter === sf"
                (click)="selectedStockFilter = sf"
              >
                {{ sf }}
              </button>
            </div>

            <button type="button" class="cb-btn-primary" (click)="openProductModal()">
              + Agregar Producto
            </button>
          </div>

          <div class="admin-products-grid">
            <div *ngFor="let p of filteredProducts" class="admin-prod-card cb-card">
              <img [src]="getImage(p.imageurl)" [alt]="p.name" />
              <div class="a-prod-body">
                <div class="a-prod-badges">
                  <span class="cb-badge cb-badge-role">{{ p.category }}</span>
                  <span
                    class="cb-badge"
                    [ngClass]="p.stock > 1 ? 'cb-badge-green' : 'cb-badge-red'"
                  >
                    Stock: {{ p.stock }}
                  </span>
                </div>
                <h3>{{ p.name }}</h3>
                <p>{{ p.description }}</p>
                <div class="a-prod-footer">
                  <strong>{{ formatCOP(p.price) }}</strong>
                  <div class="row-btns">
                    <button type="button" class="cb-btn-outline btn-xs" (click)="openProductModal(p)">
                      Editar
                    </button>
                    <button type="button" class="btn-del-xs" (click)="removeProduct(p)">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- MODAL CREAR / EDITAR USUARIO -->
        <div class="modal-backdrop" *ngIf="editingUser" (click)="editingUser = null">
          <form
            class="modal-card cb-card"
            (click)="$event.stopPropagation()"
            (ngSubmit)="saveUserForm()"
          >
            <div class="modal-header">
              <h2>{{ isEditingExistingUser ? 'Editar Usuario' : 'Agregar Nuevo Usuario al Sistema' }}</h2>
              <button type="button" class="close-btn" (click)="editingUser = null">✕</button>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Nombre *</label>
                <input
                  type="text"
                  class="cb-input"
                  [(ngModel)]="userFormName"
                  name="userFormName"
                  required
                />
              </div>
              <div class="form-group">
                <label>Apellido *</label>
                <input
                  type="text"
                  class="cb-input"
                  [(ngModel)]="userFormSurname"
                  name="userFormSurname"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Correo electrónico *</label>
              <input
                type="email"
                class="cb-input"
                [(ngModel)]="editingUser.email"
                name="userEmail"
                [disabled]="isEditingExistingUser"
                required
              />
            </div>

            <div class="form-group" *ngIf="!isEditingExistingUser">
              <label>Contraseña *</label>
              <input
                type="password"
                class="cb-input"
                [(ngModel)]="userFormPassword"
                name="userFormPassword"
                placeholder="Contraseña para el nuevo usuario"
                required
              />
            </div>

            <div class="form-group">
              <label>Rol en CakeByte</label>
              <select class="cb-select" [(ngModel)]="editingUser.role" name="userRole">
                <option value="Comprador">Comprador</option>
                <option value="Vendedor">Vendedor</option>
                <option value="Admin">Admin</option>
              </select>
            </div>

            <div class="modal-footer">
              <button type="button" class="cb-btn-outline" (click)="editingUser = null">
                Cancelar
              </button>
              <button type="submit" class="cb-btn-primary">Guardar Usuario</button>
            </div>
          </form>
        </div>

        <!-- MODAL CREAR / EDITAR PRODUCTO CON CÁMARA Y GALERÍA -->
        <div class="modal-backdrop" *ngIf="editingProduct" (click)="editingProduct = null">
          <form
            class="modal-card cb-card"
            (click)="$event.stopPropagation()"
            (ngSubmit)="saveProductForm()"
          >
            <div class="modal-header">
              <h2>{{ editingProduct.id ? 'Editar Producto' : 'Agregar Producto' }}</h2>
              <button type="button" class="close-btn" (click)="editingProduct = null">✕</button>
            </div>

            <app-photo-picker
              label="Imagen del Producto (Cámara, Galería o Catálogo)"
              [imageValue]="editingProduct.imageurl || 'torta_de_chocolate'"
              [showPresets]="true"
              (imageChange)="editingProduct.imageurl = $event"
            ></app-photo-picker>

            <div class="form-grid-2 mt-3">
              <div class="form-group">
                <label>Nombre del producto *</label>
                <input
                  type="text"
                  class="cb-input"
                  [(ngModel)]="editingProduct.name"
                  name="adminProdName"
                  required
                />
              </div>
              <div class="form-group">
                <label>Categoría</label>
                <select class="cb-select" [(ngModel)]="editingProduct.category" name="adminProdCat">
                  <option value="Pasteles">Pasteles</option>
                  <option value="Galletas">Galletas</option>
                  <option value="Pan">Pan</option>
                  <option value="Bebidas">Bebidas</option>
                </select>
              </div>
            </div>

            <div class="form-grid-2">
              <div class="form-group">
                <label>Precio (COP) *</label>
                <input
                  type="number"
                  class="cb-input"
                  [(ngModel)]="editingProduct.price"
                  name="adminProdPrice"
                  required
                />
              </div>
              <div class="form-group">
                <label>Stock *</label>
                <input
                  type="number"
                  class="cb-input"
                  [(ngModel)]="editingProduct.stock"
                  name="adminProdStock"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Descripción</label>
              <textarea
                rows="3"
                class="cb-textarea"
                [(ngModel)]="editingProduct.description"
                name="adminProdDesc"
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="cb-btn-outline" (click)="editingProduct = null">
                Cancelar
              </button>
              <button type="submit" class="cb-btn-primary">Guardar Producto</button>
            </div>
          </form>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    .admin-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .admin-header h1 {
      margin: 8px 0 4px;
      font-size: 2rem;
      font-weight: 800;
    }
    .admin-header p {
      margin: 0;
      color: var(--cb-muted);
    }
    .admin-nav-pills {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .active-pill {
      background: var(--cb-salmon);
      color: #fff;
      border-color: var(--cb-salmon);
    }
    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 18px;
      margin-bottom: 26px;
    }
    .kpi-card {
      padding: 22px;
      border-radius: 20px;
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .kpi-sales { background: var(--cb-card-sales); }
    .kpi-orders { background: var(--cb-card-orders); }
    .kpi-total { background: var(--cb-card-total); }
    .kpi-users { background: #E3F2FD; }
    .kpi-title {
      font-size: 0.84rem;
      font-weight: 700;
      color: #4e342e;
    }
    .kpi-card strong {
      font-size: 1.7rem;
      font-weight: 800;
    }
    .kpi-trend {
      font-size: 0.76rem;
      color: #5d4037;
    }
    .dashboard-split {
      display: grid;
      grid-template-columns: 1.45fr 1fr;
      gap: 22px;
    }
    .panel-box {
      padding: 24px;
    }
    .panel-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 18px;
      flex-wrap: wrap;
    }
    .panel-top h2, .panel-box h2 {
      margin: 0;
      font-size: 1.3rem;
      font-weight: 800;
    }
    .muted {
      color: var(--cb-muted);
      font-size: 0.86rem;
      margin: 4px 0 16px;
    }
    .search-wrap {
      flex: 1;
      min-width: 240px;
    }
    .role-filters {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill-btn {
      border: 1px solid var(--cb-border);
      background: #fff;
      padding: 8px 14px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.82rem;
      cursor: pointer;
    }
    .pill-btn.active {
      background: var(--cb-salmon);
      color: #fff;
      border-color: var(--cb-salmon);
    }
    .table-scroll {
      overflow-x: auto;
    }
    .cb-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .cb-table th, .cb-table td {
      padding: 12px 10px;
      border-bottom: 1px solid var(--cb-border);
      font-size: 0.88rem;
    }
    .user-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .user-cell img {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      object-fit: cover;
    }
    .btn-mini {
      border: none;
      background: #e8f5e9;
      color: #2e7d32;
      padding: 6px 10px;
      border-radius: 8px;
      font-weight: 700;
      font-size: 0.76rem;
      cursor: pointer;
    }
    .top-products-list {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    .top-prod-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 10px;
      border-radius: 14px;
      background: #fff7f4;
    }
    .rank-num {
      font-weight: 800;
      color: var(--cb-salmon);
      width: 28px;
    }
    .top-prod-row img {
      width: 48px;
      height: 48px;
      border-radius: 10px;
      object-fit: cover;
    }
    .top-prod-meta {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .top-price {
      color: #d84315;
    }
    .admin-products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(290px, 1fr));
      gap: 18px;
    }
    .admin-prod-card {
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .admin-prod-card img {
      width: 100%;
      height: 170px;
      object-fit: cover;
    }
    .a-prod-body {
      padding: 16px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .a-prod-badges {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
    }
    .a-prod-body h3 {
      margin: 0 0 6px;
      font-size: 1.05rem;
    }
    .a-prod-body p {
      margin: 0 0 14px;
      font-size: 0.84rem;
      color: var(--cb-muted);
      flex: 1;
    }
    .a-prod-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .row-btns {
      display: flex;
      gap: 6px;
    }
    .btn-xs {
      padding: 6px 11px;
      font-size: 0.78rem;
      border-radius: 9px;
    }
    .btn-del-xs {
      border: none;
      background: #ffebee;
      color: #c62828;
      border-radius: 9px;
      padding: 6px 10px;
      font-weight: 700;
      font-size: 0.78rem;
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
    .modal-card {
      width: 100%;
      max-width: 680px;
      padding: 28px;
      max-height: 92vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 18px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.35rem;
    }
    .close-btn {
      border: none;
      background: var(--cb-salmon-soft);
      width: 34px;
      height: 34px;
      border-radius: 50%;
      font-weight: 800;
      cursor: pointer;
    }
    .form-grid-2 {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
    }
    .mt-3 {
      margin-top: 16px;
    }
    .form-group {
      margin-bottom: 14px;
    }
    .form-group label {
      display: block;
      font-size: 0.84rem;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 18px;
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
    @media (max-width: 900px) {
      .dashboard-split, .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class AdminPage implements OnInit {
  currentUser: UserEntity | null = null;
  users: UserEntity[] = [];
  products: ProductEntity[] = [];
  orders: OrderEntity[] = [];

  activeSection: 'dashboard' | 'users' | 'products' = 'dashboard';

  userSearch = '';
  selectedRoleFilter = 'Todos';

  productSearch = '';
  selectedStockFilter = 'Todos';

  editingUser: UserEntity | null = null;
  isEditingExistingUser = false;
  userFormName = '';
  userFormSurname = '';
  userFormPassword = '';

  editingProduct: ProductEntity | null = null;
  toastMessage = '';

  constructor(
    private authRepo: AuthRepository,
    private productRepo: ProductRepository,
    private orderRepo: OrderRepository
  ) {}

  async ngOnInit(): Promise<void> {
    this.authRepo.currentUser$.subscribe((u) => (this.currentUser = u));
    this.productRepo.products$.subscribe((p) => (this.products = p));
    this.orderRepo.orders$.subscribe((o) => (this.orders = o));

    await Promise.all([
      this.reloadUsers(),
      this.productRepo.loadAllProducts(),
      this.orderRepo.loadAllOrders(),
    ]);
  }

  async reloadUsers(): Promise<void> {
    this.users = await this.authRepo.getAllUsers();
  }

  get stats(): DashboardStats {
    const activeCount = this.products.filter((p) => Number(p.stock) > 1).length;
    return this.orderRepo.calculateStats(this.orders, activeCount);
  }

  get filteredUsers(): UserEntity[] {
    return this.users.filter((u) => {
      const matchRole =
        this.selectedRoleFilter === 'Todos' ||
        u.role.toLowerCase() === this.selectedRoleFilter.toLowerCase();
      const matchQuery =
        !this.userSearch ||
        u.name.toLowerCase().includes(this.userSearch.toLowerCase()) ||
        u.email.toLowerCase().includes(this.userSearch.toLowerCase());
      return matchRole && matchQuery;
    });
  }

  get filteredProducts(): ProductEntity[] {
    return this.products.filter((p) => {
      const matchQuery =
        !this.productSearch ||
        (p.name || '').toLowerCase().includes(this.productSearch.toLowerCase());
      const matchStock =
        this.selectedStockFilter === 'Todos'
          ? true
          : this.selectedStockFilter === 'En stock'
          ? Number(p.stock) > 1
          : Number(p.stock) <= 1;
      return matchQuery && matchStock;
    });
  }

  getImage(imageurl?: string | null): string {
    return resolveProductImageUrl(imageurl);
  }

  formatCOP(amount: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(amount || 0);
  }

  async toggleOrderSent(order: OrderEntity): Promise<void> {
    const ok = await this.orderRepo.updateOrderStatus(order, 'Enviado');
    if (ok) {
      this.showToast(`Pedido #${order.id} actualizado a Enviado`);
    }
  }

  openUserModal(user?: UserEntity): void {
    if (user) {
      this.isEditingExistingUser = true;
      this.editingUser = { ...user };
      const parts = user.name.split(' ');
      this.userFormName = parts[0] || '';
      this.userFormSurname = parts.slice(1).join(' ');
      this.userFormPassword = '';
    } else {
      this.isEditingExistingUser = false;
      this.editingUser = {
        email: '',
        name: '',
        role: 'Comprador',
      };
      this.userFormName = '';
      this.userFormSurname = '';
      this.userFormPassword = '';
    }
  }

  async saveUserForm(): Promise<void> {
    if (!this.editingUser) return;
    const fullName = `${this.userFormName.trim()} ${this.userFormSurname.trim()}`.trim();
    if (!fullName || !this.editingUser.email.trim()) {
      this.showToast('Completa los campos obligatorios');
      return;
    }

    if (this.isEditingExistingUser) {
      const res = await this.authRepo.updateUser({
        ...this.editingUser,
        name: fullName,
      });
      if (res.success) {
        this.editingUser = null;
        await this.reloadUsers();
        this.showToast('Usuario actualizado correctamente');
      } else {
        this.showToast(res.error || 'Error al actualizar usuario');
      }
    } else {
      const res = await this.authRepo.register(
        this.editingUser.email,
        this.userFormPassword || 'CakeByte123!',
        fullName,
        this.editingUser.role as UserRole,
        false
      );
      if (!res.error) {
        this.editingUser = null;
        await this.reloadUsers();
        this.showToast('Nuevo usuario registrado');
      } else {
        this.showToast(res.error);
      }
    }
  }

  async removeUser(user: UserEntity): Promise<void> {
    const ok = await this.authRepo.deleteUser(user.email);
    if (ok) {
      await this.reloadUsers();
      this.showToast('Usuario eliminado');
    }
  }

  openProductModal(product?: ProductEntity): void {
    if (product) {
      this.editingProduct = { ...product };
    } else {
      this.editingProduct = {
        name: '',
        description: '',
        category: 'Pasteles',
        price: 22000,
        stock: 10,
        status: 'Activo',
        imageurl: 'torta_de_chocolate',
      };
    }
  }

  async saveProductForm(): Promise<void> {
    if (!this.editingProduct) return;
    const res = await this.productRepo.saveProduct(this.editingProduct);
    if (res.success) {
      this.editingProduct = null;
      this.showToast('Producto guardado');
    } else {
      this.showToast(res.error || 'Error al guardar producto');
    }
  }

  async removeProduct(product: ProductEntity): Promise<void> {
    if (!product.id) return;
    await this.productRepo.deleteProduct(product.id);
    this.showToast('Producto eliminado');
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3200);
  }
}

