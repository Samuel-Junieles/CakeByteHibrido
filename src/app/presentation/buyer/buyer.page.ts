import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { NavbarComponent } from '../shared/navbar.component';
import { AuthRepository } from '../../data/services/auth.repository';
import { ProductRepository } from '../../data/services/product.repository';
import { CartRepository } from '../../data/services/cart.repository';
import { OrderRepository } from '../../data/services/order.repository';
import {
  CartItemEntity,
  OrderEntity,
  ProductEntity,
  UserEntity,
  resolveProductImageUrl,
} from '../../domain/models/models';

@Component({
  selector: 'app-buyer-page',
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, NavbarComponent],
  template: `
    <ion-content [fullscreen]="true">
      <app-navbar [user]="currentUser"></app-navbar>

      <main class="cb-container">
        <!-- Hero Banner Web Responsive -->
        <section class="buyer-hero">
          <div class="hero-text">
            <span class="cb-badge cb-badge-role">Repostería Artesanal Fresca</span>
            <h1>Bienvenido {{ currentUser?.name || 'a CakeByte' }}</h1>
            <p>
              Explora nuestro catálogo interactivo de pasteles, cheesecakes y galletas recién
              horneadas. Personaliza tu pedido y recíbelo en casa.
            </p>
            <div class="hero-actions">
              <button
                type="button"
                class="cb-btn-primary"
                [class.active]="activeTab === 'home'"
                (click)="activeTab = 'home'"
              >
                Explorar Catálogo ({{ filteredProducts.length }})
              </button>
              <button
                type="button"
                class="cb-btn-outline"
                [class.active]="activeTab === 'cart'"
                (click)="activeTab = 'cart'"
              >
                Ir a Mi Carrito ({{ cartItems.length }} ítems)
              </button>
            </div>
          </div>
          <img
            src="assets/images/torta_de_chocolate.png"
            alt="Pastel Destacado"
            class="hero-cake-img"
          />
        </section>

        <div *ngIf="toastMessage" class="floating-toast">{{ toastMessage }}</div>

        <!-- VISTA CATÁLOGO -->
        <section *ngIf="activeTab === 'home'" class="catalog-section">
          <div class="filters-bar cb-card">
            <div class="search-box">
              <input
                type="text"
                class="cb-input"
                [(ngModel)]="searchQuery"
                placeholder="Buscar pastel, cheesecake, galletas..."
              />
            </div>

            <div class="category-pills">
              <button
                type="button"
                *ngFor="let cat of categories"
                class="cat-pill"
                [class.active]="selectedCategory === cat"
                (click)="selectedCategory = cat"
              >
                {{ cat }}
              </button>
            </div>
          </div>

          <div class="products-grid">
            <article
              *ngFor="let product of filteredProducts"
              class="product-card cb-card"
              [class.out-of-stock]="product.stock <= 1"
              (click)="openProductDetail(product)"
            >
              <div class="product-img-wrap">
                <img [src]="getImage(product.imageurl)" [alt]="product.name" />
                <span class="category-tag">{{ product.category }}</span>
                <span
                  class="stock-tag"
                  [ngClass]="product.stock > 1 ? 'cb-badge-green' : 'cb-badge-red'"
                >
                  {{ product.stock > 1 ? 'Stock: ' + product.stock : 'Agotado' }}
                </span>
              </div>

              <div class="product-body">
                <h3>{{ product.name }}</h3>
                <p>{{ product.description || 'Elaborado artesanalmente con ingredientes frescos.' }}</p>

                <div class="product-footer">
                  <strong class="price-text">{{ formatCOP(product.price) }}</strong>
                  <button
                    type="button"
                    class="cb-btn-primary btn-add"
                    [disabled]="product.stock <= 1"
                    (click)="$event.stopPropagation(); openProductDetail(product)"
                  >
                    {{ product.stock > 1 ? '+ Añadir' : 'Agotado' }}
                  </button>
                </div>
              </div>
            </article>
          </div>
        </section>

        <!-- VISTA CARRITO Y CHECKOUT -->
        <section *ngIf="activeTab === 'cart'" class="checkout-grid">
          <div class="cart-list-panel cb-card">
            <div class="panel-header">
              <h2>Mi Carrito de Compras</h2>
              <button
                *ngIf="cartItems.length > 0"
                type="button"
                class="cb-btn-outline"
                (click)="clearCart()"
              >
                Vaciar carrito
              </button>
            </div>

            <div *ngIf="cartItems.length === 0" class="empty-state">
              <img src="assets/images/onboarding_1.png" alt="Carrito vacío" />
              <h3>Tu carrito está vacío</h3>
              <p>Agrega tus postres favoritos desde el catálogo para continuar.</p>
              <button type="button" class="cb-btn-primary" (click)="activeTab = 'home'">
                Ver Catálogo
              </button>
            </div>

            <div *ngIf="cartItems.length > 0" class="cart-items-container">
              <div *ngFor="let item of cartItems" class="cart-row">
                <img [src]="getImage(item.imageurl)" [alt]="item.productname" class="cart-thumb" />
                <div class="cart-item-info">
                  <h4>{{ item.productname }}</h4>
                  <small>Tamaño: {{ item.size }} <span *ngIf="item.note">· Nota: "{{ item.note }}"</span></small>
                  <strong class="unit-price">{{ formatCOP(item.productprice) }} c/u</strong>
                </div>

                <div class="qty-controls">
                  <button type="button" (click)="changeItemQty(item, -1)">−</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" (click)="changeItemQty(item, 1)">+</button>
                </div>

                <div class="item-subtotal">
                  <strong>{{ formatCOP(item.productprice * item.quantity) }}</strong>
                  <button type="button" class="btn-remove" (click)="removeItem(item)">Eliminar</button>
                </div>
              </div>
            </div>
          </div>

          <!-- Panel de Checkout -->
          <div class="checkout-form-panel cb-card" *ngIf="cartItems.length > 0">
            <h2>Finalizar Compra</h2>
            <p class="customer-summary">
              Cliente: <strong>{{ currentUser?.name }}</strong> ({{ currentUser?.email }})
            </p>

            <div class="form-group">
              <label>Dirección de entrega *</label>
              <input
                type="text"
                class="cb-input"
                [(ngModel)]="deliveryAddress"
                placeholder="Ej. Calle 45 #12-34, Apto 301"
              />
            </div>

            <div class="form-group">
              <label>Método de pago</label>
              <select class="cb-select" [(ngModel)]="paymentMethod">
                <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
                <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                <option value="Transferencia bancaria">Transferencia bancaria / PSE</option>
              </select>
            </div>

            <div class="card-extra-fields" *ngIf="paymentMethod.includes('Tarjeta')">
              <input type="text" class="cb-input mb-2" placeholder="Nombre del titular" [(ngModel)]="cardHolder" />
              <input type="text" class="cb-input" placeholder="**** **** **** 6789" />
            </div>

            <div class="order-totals">
              <div class="total-line">
                <span>Subtotal ({{ totalCartQty }} productos)</span>
                <span>{{ formatCOP(totalCartPrice) }}</span>
              </div>
              <div class="total-line">
                <span>Envío a domicilio</span>
                <span class="free-tag">Gratis</span>
              </div>
              <div class="total-line grand-total">
                <strong>Total a Pagar</strong>
                <strong>{{ formatCOP(totalCartPrice) }}</strong>
              </div>
            </div>

            <button
              type="button"
              class="cb-btn-primary w-full"
              [disabled]="processingOrder"
              (click)="confirmOrder()"
            >
              {{ processingOrder ? 'Procesando pedido...' : 'Confirmar Pedido y Pagar' }}
            </button>
          </div>
        </section>

        <!-- MODAL DETALLE DE PRODUCTO -->
        <div class="modal-backdrop" *ngIf="selectedProduct" (click)="selectedProduct = null">
          <div class="modal-card cb-card" (click)="$event.stopPropagation()">
            <button type="button" class="modal-close" (click)="selectedProduct = null">✕</button>
            <div class="detail-grid">
              <img
                [src]="getImage(selectedProduct.imageurl)"
                [alt]="selectedProduct.name"
                class="detail-img"
              />
              <div class="detail-info">
                <span class="cb-badge cb-badge-role">{{ selectedProduct.category }}</span>
                <h2>{{ selectedProduct.name }}</h2>
                <h3 class="detail-price">{{ formatCOP(selectedProduct.price) }}</h3>
                <p class="detail-desc">{{ selectedProduct.description }}</p>
                <p class="allergens">
                  <strong>Alérgenos:</strong> Gluten, lácteos, huevos. Stock disponible:
                  <strong>{{ selectedProduct.stock }}</strong> unidades.
                </p>

                <div class="form-group">
                  <label>Tamaño de presentación</label>
                  <select class="cb-select" [(ngModel)]="detailSize">
                    <option value="Estándar">Estándar (8-10 porciones)</option>
                    <option value="Mediano">Mediano (12-15 porciones)</option>
                    <option value="Familiar">Familiar (20 porciones)</option>
                  </select>
                </div>

                <div class="form-group">
                  <label>Añade un mensaje en tu pastel (opcional)</label>
                  <input
                    type="text"
                    class="cb-input"
                    [(ngModel)]="detailNote"
                    placeholder="Ej. ¡Feliz Cumpleaños María!"
                  />
                </div>

                <div class="detail-actions">
                  <div class="qty-controls">
                    <button type="button" (click)="detailQty = detailQty > 1 ? detailQty - 1 : 1">−</button>
                    <span>{{ detailQty }}</span>
                    <button
                      type="button"
                      (click)="detailQty = detailQty < selectedProduct.stock ? detailQty + 1 : detailQty"
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    class="cb-btn-primary flex-1"
                    [disabled]="selectedProduct.stock <= 1"
                    (click)="addSelectedToCart()"
                  >
                    Añadir al carrito · {{ formatCOP(selectedProduct.price * detailQty) }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- MODAL RECIBO DE TRANSACCIÓN EXITOSA (PaymentSuccessActivity) -->
        <div class="modal-backdrop" *ngIf="completedReceipt" (click)="completedReceipt = null">
          <div class="receipt-card cb-card" (click)="$event.stopPropagation()">
            <div class="receipt-badge">✓</div>
            <h2>TRANSACCIÓN EXITOSA</h2>
            <p class="receipt-sub">Tu pedido ha sido registrado correctamente</p>

            <div class="receipt-rows">
              <div class="r-row"><span>Estado de transacción</span><strong>APROBADA</strong></div>
              <div class="r-row"><span>Nombre del comercio</span><strong>CakeByte Repostería</strong></div>
              <div class="r-row"><span>Pedido #</span><strong>#{{ completedReceipt.id || 1001 }}</strong></div>
              <div class="r-row"><span>Cliente</span><strong>{{ completedReceipt.customername }}</strong></div>
              <div class="r-row"><span>CUS / Referencia</span><strong>CB-{{ transactionCus }}</strong></div>
              <div class="r-row"><span>Concepto</span><strong>{{ completedReceipt.itemssummary }}</strong></div>
              <div class="r-row total"><span>Total Pagado</span><strong>{{ formatCOP(completedReceipt.totalprice) }}</strong></div>
            </div>

            <button
              type="button"
              class="cb-btn-primary w-full"
              (click)="completedReceipt = null; activeTab = 'home'"
            >
              REGRESAR AL INICIO
            </button>
          </div>
        </div>
      </main>
    </ion-content>
  `,
  styles: [`
    .buyer-hero {
      background: linear-gradient(135deg, #FFF0EB 0%, #FFE0D4 100%);
      border-radius: 28px;
      padding: 36px 44px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 32px;
      margin-bottom: 28px;
      border: 1px solid #ffd4c4;
    }
    .hero-text {
      max-width: 640px;
    }
    .hero-text h1 {
      font-size: 2.3rem;
      font-weight: 800;
      margin: 12px 0 10px;
      color: #231917;
    }
    .hero-text p {
      font-size: 1rem;
      color: #5d4037;
      line-height: 1.6;
      margin: 0 0 22px;
    }
    .hero-actions {
      display: flex;
      gap: 12px;
      flex-wrap: wrap;
    }
    .hero-cake-img {
      width: 220px;
      height: 220px;
      object-fit: cover;
      border-radius: 24px;
      box-shadow: 0 14px 32px rgba(255, 139, 106, 0.25);
    }
    .filters-bar {
      padding: 18px 22px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 18px;
      margin-bottom: 24px;
      flex-wrap: wrap;
    }
    .search-box {
      flex: 1;
      min-width: 260px;
    }
    .category-pills {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .cat-pill {
      border: 1px solid var(--cb-border);
      background: #fff;
      color: #5d4037;
      padding: 9px 16px;
      border-radius: 999px;
      font-weight: 700;
      font-size: 0.86rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }
    .cat-pill.active, .cat-pill:hover {
      background: var(--cb-salmon);
      color: #fff;
      border-color: var(--cb-salmon);
    }
    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(270px, 1fr));
      gap: 22px;
    }
    .product-card {
      overflow: hidden;
      display: flex;
      flex-direction: column;
      cursor: pointer;
    }
    .product-card.out-of-stock {
      opacity: 0.65;
    }
    .product-img-wrap {
      position: relative;
      height: 210px;
      background: #fff5f2;
    }
    .product-img-wrap img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }
    .category-tag {
      position: absolute;
      top: 12px;
      left: 12px;
      background: rgba(255, 255, 255, 0.92);
      padding: 4px 11px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
      color: #d84315;
    }
    .stock-tag {
      position: absolute;
      top: 12px;
      right: 12px;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.74rem;
      font-weight: 700;
    }
    .product-body {
      padding: 18px;
      display: flex;
      flex-direction: column;
      flex: 1;
    }
    .product-body h3 {
      margin: 0 0 6px;
      font-size: 1.12rem;
      font-weight: 800;
    }
    .product-body p {
      margin: 0 0 16px;
      font-size: 0.86rem;
      color: var(--cb-muted);
      line-height: 1.45;
      flex: 1;
    }
    .product-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
    }
    .price-text {
      font-size: 1.18rem;
      font-weight: 800;
      color: #d84315;
    }
    .btn-add {
      padding: 9px 16px;
      font-size: 0.85rem;
    }
    .checkout-grid {
      display: grid;
      grid-template-columns: 1.35fr 1fr;
      gap: 24px;
      align-items: start;
    }
    .cart-list-panel, .checkout-form-panel {
      padding: 26px;
    }
    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 18px;
    }
    .panel-header h2, .checkout-form-panel h2 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 800;
    }
    .empty-state {
      text-align: center;
      padding: 36px 16px;
    }
    .empty-state img {
      width: 140px;
      height: 140px;
      object-fit: contain;
    }
    .cart-row {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 14px 0;
      border-bottom: 1px solid var(--cb-border);
      flex-wrap: wrap;
    }
    .cart-thumb {
      width: 72px;
      height: 72px;
      border-radius: 14px;
      object-fit: cover;
    }
    .cart-item-info {
      flex: 1;
      min-width: 180px;
    }
    .cart-item-info h4 {
      margin: 0 0 4px;
      font-size: 1rem;
    }
    .cart-item-info small {
      display: block;
      color: var(--cb-muted);
      margin-bottom: 4px;
    }
    .unit-price {
      font-size: 0.85rem;
      color: #d84315;
    }
    .qty-controls {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      background: var(--cb-salmon-soft);
      padding: 6px 12px;
      border-radius: 12px;
    }
    .qty-controls button {
      border: none;
      background: #fff;
      width: 28px;
      height: 28px;
      border-radius: 8px;
      font-weight: 800;
      cursor: pointer;
    }
    .item-subtotal {
      text-align: right;
      min-width: 110px;
    }
    .item-subtotal strong {
      display: block;
      font-size: 1rem;
    }
    .btn-remove {
      background: none;
      border: none;
      color: #c62828;
      font-size: 0.78rem;
      font-weight: 700;
      cursor: pointer;
      margin-top: 4px;
    }
    .customer-summary {
      font-size: 0.88rem;
      color: var(--cb-muted);
      margin: 6px 0 18px;
    }
    .form-group {
      margin-bottom: 16px;
    }
    .form-group label {
      display: block;
      font-size: 0.84rem;
      font-weight: 700;
      margin-bottom: 6px;
    }
    .mb-2 {
      margin-bottom: 10px;
    }
    .order-totals {
      margin: 20px 0;
      padding: 16px;
      border-radius: 14px;
      background: #fff7f4;
    }
    .total-line {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 0.92rem;
    }
    .grand-total {
      border-top: 1px solid var(--cb-border);
      padding-top: 10px;
      font-size: 1.15rem;
      color: #d84315;
    }
    .free-tag {
      color: #2e7d32;
      font-weight: 700;
    }
    .w-full {
      width: 100%;
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
      position: relative;
      width: 100%;
      max-width: 820px;
      padding: 28px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-close {
      position: absolute;
      top: 16px;
      right: 16px;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border: none;
      background: var(--cb-salmon-soft);
      font-weight: 800;
      cursor: pointer;
    }
    .detail-grid {
      display: grid;
      grid-template-columns: 1fr 1.2fr;
      gap: 26px;
      align-items: center;
    }
    .detail-img {
      width: 100%;
      height: 320px;
      object-fit: cover;
      border-radius: 20px;
    }
    .detail-info h2 {
      margin: 10px 0 4px;
      font-size: 1.6rem;
    }
    .detail-price {
      margin: 0 0 12px;
      color: #d84315;
      font-size: 1.4rem;
    }
    .detail-desc {
      color: #5d4037;
      line-height: 1.5;
    }
    .allergens {
      font-size: 0.82rem;
      color: var(--cb-muted);
      margin-bottom: 16px;
    }
    .detail-actions {
      display: flex;
      gap: 14px;
      align-items: center;
      margin-top: 18px;
    }
    .flex-1 {
      flex: 1;
    }
    .receipt-card {
      width: 100%;
      max-width: 480px;
      padding: 32px;
      text-align: center;
    }
    .receipt-badge {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: #c8e6c9;
      color: #2e7d32;
      font-size: 2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 14px;
    }
    .receipt-rows {
      text-align: left;
      margin: 20px 0;
      background: #fff7f4;
      padding: 16px;
      border-radius: 14px;
    }
    .r-row {
      display: flex;
      justify-content: space-between;
      gap: 12px;
      padding: 7px 0;
      border-bottom: 1px dashed var(--cb-border);
      font-size: 0.86rem;
    }
    .r-row.total {
      border-bottom: none;
      font-size: 1.05rem;
      color: #d84315;
      padding-top: 12px;
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
      box-shadow: 0 10px 24px rgba(0, 0, 0, 0.2);
    }
    @media (max-width: 860px) {
      .buyer-hero {
        flex-direction: column;
        text-align: center;
        padding: 24px;
      }
      .hero-actions {
        justify-content: center;
      }
      .checkout-grid, .detail-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class BuyerPage implements OnInit {
  currentUser: UserEntity | null = null;
  products: ProductEntity[] = [];
  cartItems: CartItemEntity[] = [];

  activeTab: 'home' | 'cart' = 'home';
  categories = ['Todos', 'Pasteles', 'Galletas', 'Pan', 'Bebidas'];
  selectedCategory = 'Todos';
  searchQuery = '';

  selectedProduct: ProductEntity | null = null;
  detailQty = 1;
  detailSize = 'Estándar';
  detailNote = '';

  deliveryAddress = '';
  paymentMethod = 'Tarjeta de Crédito / Débito';
  cardHolder = '';
  processingOrder = false;
  completedReceipt: OrderEntity | null = null;
  transactionCus = '';
  toastMessage = '';

  constructor(
    private authRepo: AuthRepository,
    private productRepo: ProductRepository,
    private cartRepo: CartRepository,
    private orderRepo: OrderRepository,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.authRepo.currentUser$.subscribe((u) => {
      this.currentUser = u;
      if (u?.address && !this.deliveryAddress) {
        this.deliveryAddress = u.address;
      }
    });

    this.productRepo.products$.subscribe((list) => (this.products = list));
    this.cartRepo.cartItems$.subscribe((items) => (this.cartItems = items));

    this.route.queryParams.subscribe((params) => {
      if (params['tab'] === 'cart') {
        this.activeTab = 'cart';
      } else if (params['tab'] === 'home') {
        this.activeTab = 'home';
      }
    });

    this.productRepo.loadAllProducts();
    this.cartRepo.loadCartItems();
  }

  get filteredProducts(): ProductEntity[] {
    return this.products.filter((p) => {
      const matchCat =
        this.selectedCategory === 'Todos' ||
        (p.category || '').toLowerCase() === this.selectedCategory.toLowerCase();
      const matchQuery =
        !this.searchQuery ||
        (p.name || '').toLowerCase().includes(this.searchQuery.toLowerCase()) ||
        (p.description || '').toLowerCase().includes(this.searchQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }

  get totalCartQty(): number {
    return this.cartItems.reduce((acc, i) => acc + Number(i.quantity || 0), 0);
  }

  get totalCartPrice(): number {
    return this.cartItems.reduce(
      (acc, i) => acc + Number(i.productprice || 0) * Number(i.quantity || 0),
      0
    );
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

  openProductDetail(product: ProductEntity): void {
    this.selectedProduct = product;
    this.detailQty = 1;
    this.detailSize = 'Estándar';
    this.detailNote = '';
  }

  async addSelectedToCart(): Promise<void> {
    if (!this.selectedProduct || !this.selectedProduct.id) return;
    const ok = await this.cartRepo.addToCart({
      productid: this.selectedProduct.id,
      productname: this.selectedProduct.name,
      productprice: this.selectedProduct.price,
      quantity: this.detailQty,
      size: this.detailSize,
      note: this.detailNote || null,
      imageurl: this.selectedProduct.imageurl,
    });
    this.selectedProduct = null;
    this.showToast(ok ? 'Producto añadido a tu carrito' : 'Inicia sesión para usar el carrito');
  }

  async changeItemQty(item: CartItemEntity, delta: number): Promise<void> {
    const nextQty = item.quantity + delta;
    if (nextQty < 1) return;
    await this.cartRepo.updateQuantity(item, nextQty);
  }

  async removeItem(item: CartItemEntity): Promise<void> {
    await this.cartRepo.removeFromCart(item);
  }

  async clearCart(): Promise<void> {
    await this.cartRepo.clearCart();
  }

  async confirmOrder(): Promise<void> {
    if (!this.deliveryAddress.trim()) {
      this.showToast('Por favor ingresa tu dirección de entrega');
      return;
    }
    this.processingOrder = true;
    const res = await this.orderRepo.completeCheckoutOrder(
      this.currentUser?.name || 'Cliente CakeByte',
      this.deliveryAddress.trim(),
      this.paymentMethod,
      this.cartItems
    );
    this.processingOrder = false;

    if (res.success && res.order) {
      this.transactionCus = Math.floor(100000 + Math.random() * 900000).toString();
      this.completedReceipt = res.order;
      this.showToast('Pedido confirmado con éxito');
    } else {
      this.showToast(res.error || 'Error al procesar el pedido');
    }
  }

  private showToast(msg: string): void {
    this.toastMessage = msg;
    setTimeout(() => {
      if (this.toastMessage === msg) this.toastMessage = '';
    }, 3200);
  }
}

