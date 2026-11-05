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
  resolveProductImageUrl,
} from '../../domain/models/models';

@Component({
  selector: 'app-vendor-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NavbarComponent, PhotoPickerComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-navbar [user]="currentUser"></app-navbar>

      <main class="cb-container">
        <header class="vendor-header">
          <div>
            <span class="cb-badge cb-badge-role">Módulo de Vendedor</span>
            <h1>Hola, {{ currentUser?.name || 'Vendedor' }}</h1>
            <p>Gestiona tu inventario con cámara/galería y despacha pedidos en tiempo real.</p>
          </div>
          <div class="header-actions">
            <button
              type="button"
              class="cb-btn-outline"
              [class.active-tab]="section === 'orders'"
              (click)="section = 'orders'"
            >
              Pedidos ({{ orders.length }})
            </button>
            <button
              type="button"
              class="cb-btn-outline"
              [class.active-tab]="section === 'products'"
              (click)="section = 'products'"
            >
              Mis Productos ({{ products.length }})
            </button>
            <button type="button" class="cb-btn-primary" (click)="openProductModal()">
              + Agregar Producto
            </button>
          </div>
        </header>

        <div *ngIf="toastMessage" class="floating-toast">{{ toastMessage }}</div>

        <!-- KPIs Resumen Vendedor -->
        <section class="kpi-grid">
          <div class="kpi-card kpi-sales">
            <span class="kpi-label">Ventas del día (unidades)</span>
            <strong>{{ stats.dailySalesCount }}</strong>
          </div>
          <div class="kpi-card kpi-orders">
            <span class="kpi-label">Pedidos registrados</span>
            <strong>{{ stats.totalOrders }}</strong>
          </div>
          <div class="kpi-card kpi-total">
            <span class="kpi-label">Ventas totales</span>
            <strong>{{ formatCOP(stats.totalEarnings) }}</strong>
          </div>
          <div class="kpi-card kpi-active">
            <span class="kpi-label">Productos en stock</span>
            <strong>{{ stats.activeProductsCount }}</strong>
          </div>
        </section>

        <!-- SECCIÓN: PEDIDOS EN TIEMPO REAL -->
        <section *ngIf="section === 'orders'" class="cb-card section-card">
          <div class="section-bar">
            <h2>Seguimiento de Pedidos</h2>
            <div class="filter-pills">
              <button
                type="button"
                *ngFor="let f of orderFilters"
                class="pill-btn"
                [class.active]="selectedOrderFilter === f"
                (click)="selectedOrderFilter = f"
              >
                {{ f }}
              </button>
            </div>
          </div>

          <div class="orders-table-wrap">
            <table class="cb-table">
              <thead>
                <tr>
                  <th>Pedido</th>
                  <th>Cliente</th>
                  <th>Detalle y Dirección</th>
                  <th>Unidades</th>
                  <th>Total</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let o of filteredOrders">
                  <td><strong>#{{ o.id }}</strong></td>
                  <td>{{ o.customername }}</td>
                  <td class="summary-cell">{{ o.itemssummary }}</td>
                  <td>{{ o.totalitems }}</td>
                  <td><strong>{{ formatCOP(o.totalprice) }}</strong></td>
                  <td>
                    <span
                      class="cb-badge"
                      [ngClass]="{
                        'cb-badge-yellow': o.status === 'En espera' || o.status === 'Pendiente',
                        'cb-badge-green': o.status === 'Enviado' || o.status === 'Entregado'
                      }"
                    >
                      {{ o.status }}
                    </span>
                  </td>
                  <td class="actions-cell">
                    <button
                      *ngIf="o.status !== 'Enviado' && o.status !== 'Entregado'"
                      type="button"
                      class="btn-action send"
                      (click)="changeOrderStatus(o, 'Enviado')"
                    >
                      Enviar
                    </button>
                    <button
                      *ngIf="o.status !== 'Entregado'"
                      type="button"
                      class="btn-action deliver"
                      (click)="changeOrderStatus(o, 'Entregado')"
                    >
                      Entregar
                    </button>
                    <button type="button" class="btn-action delete" (click)="removeOrder(o)">
                      Eliminar
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <!-- SECCIÓN: MIS PRODUCTOS (INVENTARIO CRUD) -->
        <section *ngIf="section === 'products'" class="cb-card section-card">
          <div class="section-bar">
            <div class="search-wrap">
              <input
                type="text"
                class="cb-input"
                [(ngModel)]="productSearch"
                placeholder="Buscar en mis productos..."
              />
            </div>

            <div class="filter-pills">
              <button
                type="button"
                *ngFor="let c of categories"
                class="pill-btn"
                [class.active]="selectedCategory === c"
                (click)="selectedCategory = c"
              >
                {{ c }}
              </button>
            </div>
          </div>

          <div class="vendor-products-grid">
            <div *ngFor="let p of filteredProducts" class="vendor-prod-card cb-card">
              <img [src]="getImage(p.imageurl)" [alt]="p.name" class="v-prod-img" />
              <div class="v-prod-info">
                <div class="v-prod-top">
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
                <div class="v-prod-bottom">
                  <strong class="price">{{ formatCOP(p.price) }}</strong>
                  <div class="v-btns">
                    <button type="button" class="cb-btn-outline btn-xs" (click)="openProductModal(p)">
                      Editar
                    </button>
                    <button type="button" class="btn-del-xs" (click)="deleteProduct(p)">
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- MODAL CREAR / EDITAR PRODUCTO CON CÁMARA Y GALERÍA -->
        <div class="modal-backdrop" *ngIf="editingProduct" (click)="editingProduct = null">
          <form
            class="modal-card cb-card"
            (click)="$event.stopPropagation()"
            (ngSubmit)="saveProductForm()"
          >
            <div class="modal-header">
              <h2>{{ editingProduct.id ? 'Editar Producto' : 'Agregar Nuevo Producto' }}</h2>
              <button type="button" class="close-btn" (click)="editingProduct = null">✕</button>
            </div>

            <app-photo-picker
              label="Foto del Producto (Cámara, Galería del Teléfono o Catálogo)"
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
                  name="prodName"
                  placeholder="Ej. Tarta de Fresa Artesanal"
                  required
                />
              </div>

              <div class="form-group">
                <label>Categoría</label>
                <select class="cb-select" [(ngModel)]="editingProduct.category" name="prodCategory">
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
                  name="prodPrice"
                  min="0"
                  required
                />
              </div>

              <div class="form-group">
                <label>Stock disponible *</label>
                <input
                  type="number"
                  class="cb-input"
                  [(ngModel)]="editingProduct.stock"
                  name="prodStock"
                  min="0"
                  required
                />
              </div>
            </div>

            <div class="form-group">
              <label>Descripción (ingredientes, porciones, notas)</label>
              <textarea
                rows="3"
                class="cb-textarea"
                [(ngModel)]="editingProduct.description"
                name="prodDesc"
                placeholder="Describe los ingredientes y detalles del producto..."
              ></textarea>
            </div>

            <div class="modal-footer">
              <button type="button" class="cb-btn-outline" (click)="editingProduct = null">
                Cancelar
              </button>
              <button type="submit" class="cb-btn-primary" [disabled]="savingProduct">
                {{ savingProduct ? 'Guardando...' : editingProduct.id ? 'Guardar Cambios' : 'Publicar Producto' }}
              </button>
            </div>
          </form>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    .vendor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 20px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .vendor-header h1 {
      margin: 8px 0 4px;
      font-size: 2rem;
      font-weight: 800;
    }
    .vendor-header p {
      margin: 0;
      color: var(--cb-muted);
    }
    .header-actions {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }
    .active-tab {
      background: var(--cb-salmon-soft);
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
      gap: 8px;
    }
    .kpi-sales { background: var(--cb-card-sales); }
    .kpi-orders { background: var(--cb-card-orders); }
    .kpi-total { background: var(--cb-card-total); }
    .kpi-active { background: #EDE7F6; }
    .kpi-label {
      font-size: 0.85rem;
      font-weight: 700;
      color: #4e342e;
    }
    .kpi-card strong {
      font-size: 1.75rem;
      font-weight: 800;
      color: #231917;
    }
    .section-card {
      padding: 24px;
    }
    .section-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      margin-bottom: 20px;
      flex-wrap: wrap;
    }
    .section-bar h2 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 800;
    }
    .search-wrap {
      flex: 1;
      min-width: 240px;
    }
    .filter-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .pill-btn {
      border: 1px solid var(--cb-border);
      background: #fff;
      padding: 8px 15px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.84rem;
      cursor: pointer;
    }
    .pill-btn.active {
      background: var(--cb-salmon);
      color: #fff;
      border-color: var(--cb-salmon);
    }
    .orders-table-wrap {
      overflow-x: auto;
    }
    .cb-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
    }
    .cb-table th, .cb-table td {
      padding: 14px 12px;
      border-bottom: 1px solid var(--cb-border);
      font-size: 0.9rem;
    }
    .cb-table th {
      font-size: 0.78rem;
      text-transform: uppercase;
      color: var(--cb-muted);
      letter-spacing: 0.04em;
    }
    .summary-cell {
      max-width: 340px;
    }
    .actions-cell {
      display: flex;
      gap: 8px;
      align-items: center;
    }
    .btn-action {
      border: none;
      padding: 7px 12px;
      border-radius: 10px;
      font-weight: 700;
      font-size: 0.8rem;
      cursor: pointer;
    }
    .btn-action.send {
      background: #fff8e1;
      color: #e65100;
    }
    .btn-action.deliver {
      background: #e8f5e9;
      color: #2e7d32;
    }
    .btn-action.delete {
      background: #ffebee;
      color: #c62828;
    }
    .vendor-products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 18px;
    }
    .vendor-prod-card {
      display: flex;
      gap: 14px;
      padding: 14px;
      align-items: center;
    }
    .v-prod-img {
      width: 96px;
      height: 96px;
      border-radius: 14px;
      object-fit: cover;
      flex-shrink: 0;
    }
    .v-prod-info {
      flex: 1;
      min-width: 0;
    }
    .v-prod-top {
      display: flex;
      justify-content: space-between;
      gap: 6px;
      margin-bottom: 6px;
    }
    .v-prod-info h3 {
      margin: 0 0 4px;
      font-size: 1rem;
      font-weight: 800;
    }
    .v-prod-info p {
      margin: 0 0 10px;
      font-size: 0.8rem;
      color: var(--cb-muted);
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .v-prod-bottom {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }
    .price {
      color: #d84315;
      font-size: 1rem;
    }
    .v-btns {
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
      max-width: 720px;
      padding: 28px;
      max-height: 92vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .modal-header h2 {
      margin: 0;
      font-size: 1.4rem;
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
      margin-top: 18px;
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
      gap: 12px;
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
    @media (max-width: 700px) {
      .form-grid-2 {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class VendorPage implements OnInit {
  currentUser: UserEntity | null = null;
  orders: OrderEntity[] = [];
  products: ProductEntity[] = [];

  section: 'orders' | 'products' = 'products';
  orderFilters = ['Todos', 'En espera', 'Enviado', 'Entregado'];
  selectedOrderFilter = 'Todos';

  categories = ['Todos', 'Pasteles', 'Galletas', 'Pan', 'Bebidas'];
  selectedCategory = 'Todos';
  productSearch = '';

  editingProduct: ProductEntity | null = null;
  savingProduct = false;
  toastMessage = '';

  constructor(
    private authRepo: AuthRepository,
    private productRepo: ProductRepository,
    private orderRepo: OrderRepository
  ) {}

  ngOnInit(): void {
    this.authRepo.currentUser$.subscribe((u) => (this.currentUser = u));
    this.orderRepo.orders$.subscribe((o) => (this.orders = o));
    this.productRepo.products$.subscribe((p) => (this.products = p));

    this.orderRepo.loadAllOrders();
    this.productRepo.loadAllProducts();
  }

  get stats(): DashboardStats {
    const activeCount = this.products.filter((p) => Number(p.stock) > 1).length;
    return this.orderRepo.calculateStats(this.orders, activeCount);
  }

  get filteredOrders(): OrderEntity[] {
    if (this.selectedOrderFilter === 'Todos') return this.orders;
    return this.orders.filter((o) => o.status === this.selectedOrderFilter);
  }

  get filteredProducts(): ProductEntity[] {
    return this.products.filter((p) => {
      const matchCat =
        this.selectedCategory === 'Todos' ||
        (p.category || '').toLowerCase() === this.selectedCategory.toLowerCase();
      const matchSearch =
        !this.productSearch ||
        (p.name || '').toLowerCase().includes(this.productSearch.toLowerCase());
      return matchCat && matchSearch;
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

  openProductModal(product?: ProductEntity): void {
    if (product) {
      this.editingProduct = { ...product };
    } else {
      this.editingProduct = {
        name: '',
        description: '',
        category: 'Pasteles',
        price: 20000,
        stock: 10,
        status: 'Activo',
        imageurl: 'torta_de_chocolate',
      };
    }
  }

  async saveProductForm(): Promise<void> {
    if (!this.editingProduct) return;
    if (!this.editingProduct.name.trim() || !this.editingProduct.price) {
      this.showToast('El nombre y el precio son obligatorios');
      return;
    }

    this.savingProduct = true;
    const res = await this.productRepo.saveProduct(this.editingProduct);
    this.savingProduct = false;

    if (res.success) {
      this.editingProduct = null;
      this.section = 'products';
      this.showToast('Producto guardado correctamente');
    } else {
      this.showToast(res.error || 'Error al guardar el producto');
    }
  }

  async deleteProduct(product: ProductEntity): Promise<void> {
    if (!product.id) return;
    const ok = await this.productRepo.deleteProduct(product.id);
    if (ok) {
      this.showToast('Producto eliminado');
    }
  }

  async changeOrderStatus(order: OrderEntity, status: string): Promise<void> {
    const ok = await this.orderRepo.updateOrderStatus(order, status);
    if (ok) {
      this.showToast(`Pedido #${order.id} marcado como ${status}`);
    }
  }

  async removeOrder(order: OrderEntity): Promise<void> {
    const ok = await this.orderRepo.deleteOrder(order);
    if (ok) {
      this.showToast('Pedido eliminado');
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3200);
  }
}

