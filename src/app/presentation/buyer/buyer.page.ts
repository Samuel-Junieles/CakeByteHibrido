import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
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
    <ion-content>
      <app-navbar [user]="currentUser"></app-navbar>

      <div *ngIf="toastMessage" class="floating-toast">{{ toastMessage }}</div>

      <!-- ============================================================== -->
      <!-- VISTA MÓVIL ORIGINAL (<= 768px): Inicio, Catálogo, Carrito     -->
      <!-- ============================================================== -->
      <div class="mobile-buyer-flow">
        <!-- 1. PANTALLA INICIO MÓVIL (activity_buyer_home.xml) -->
        <div *ngIf="mobileTab === 'home'" class="m-home-screen">
          <div class="m-welcome-container m-welcome-row">
            <h1 class="m-welcome-title-black">
              Bienvenido {{ currentUser?.name || '' }} a CakeByte
            </h1>
            <button
              type="button"
              class="m-welcome-search-btn"
              (click)="mobileTab = 'catalog'"
              title="Buscar en catálogo"
            >
              <ion-icon name="search-outline"></ion-icon>
            </button>
          </div>

          <h2 class="m-offers-heading">Ofertas de hoy</h2>

          <div class="m-promo-scroll">
            <div class="m-promo-banner" (click)="selectedCategory = 'Galletas'; mobileTab = 'catalog'">
              <img src="assets/images/onboarding_1.png" alt="20% OFF" class="m-promo-bg" />
              <div class="m-promo-overlay">
                <h3 class="m-promo-title">20% OFF</h3>
                <p class="m-promo-sub">En todas las Galletas</p>
              </div>
            </div>

            <div class="m-promo-banner" (click)="selectedCategory = 'Pasteles'; mobileTab = 'catalog'">
              <img src="assets/images/torta_de_chocolate.png" alt="Combo Especial" class="m-promo-bg" />
              <div class="m-promo-overlay">
                <h3 class="m-promo-title">Combo Especial</h3>
                <p class="m-promo-sub">Pastel + 2 Cafés</p>
              </div>
            </div>

            <div class="m-promo-banner" (click)="mobileTab = 'catalog'">
              <img src="assets/images/cheesecake_de_fresa.png" alt="2x1 en Postres" class="m-promo-bg" />
              <div class="m-promo-overlay">
                <h3 class="m-promo-title">2x1 en Postres</h3>
                <p class="m-promo-sub">Solo por hoy en CakeByte</p>
              </div>
            </div>
          </div>

          <div class="m-explore-salmon-card" (click)="mobileTab = 'catalog'">
            <h3>Explora nuestro catálogo completo</h3>
            <ion-icon name="caret-forward-outline"></ion-icon>
          </div>
        </div>

        <!-- 2. PANTALLA CATÁLOGO MÓVIL (activity_buyer_catalog.xml) -->
        <div *ngIf="mobileTab === 'catalog'" class="m-catalog-screen">
          <h1 class="m-screen-title">Catálogo de productos</h1>

          <div class="m-search-box">
            <input
              type="text"
              class="m-search-input"
              [(ngModel)]="searchQuery"
              placeholder="¿Qué te apetece hoy?"
            />
          </div>

          <div class="m-tabs-row">
            <button
              type="button"
              *ngFor="let cat of mobileCategories"
              class="m-tab-btn"
              [class.active]="selectedCategory === cat"
              (click)="selectedCategory = cat"
            >
              {{ cat }}
            </button>
          </div>

          <div class="m-products-grid">
            <div
              *ngFor="let product of filteredProducts"
              class="m-grid-card"
              (click)="openProductDetail(product)"
            >
              <div class="m-grid-img-wrap">
                <img [src]="getImage(product.imageurl)" [alt]="product.name" />
                <span
                  class="m-stock-badge"
                  [class.in-stock]="product.stock > 1"
                  [class.out-stock]="product.stock <= 1"
                >
                  {{ product.stock > 1 ? 'En stock' : 'Agotado' }}
                </span>
              </div>
              <div class="m-grid-footer">
                <div class="m-grid-meta">
                  <h4>{{ product.name }}</h4>
                  <span>{{ formatCOP(product.price) }}</span>
                </div>
                <button
                  type="button"
                  class="m-grid-action"
                  (click)="$event.stopPropagation(); openProductDetail(product)"
                >
                  +
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- 3. PANTALLA MI CARRITO MÓVIL (activity_cart.xml + checkout) -->
        <div *ngIf="mobileTab === 'cart'" class="m-cart-screen">
          <h1 class="m-screen-title">Mi Carrito</h1>

          <div *ngIf="cartItems.length === 0" class="m-empty-cart">
            <p>Tu carrito está vacío</p>
            <button type="button" class="m-btn-primary-round" (click)="mobileTab = 'catalog'">
              Ir al Catálogo
            </button>
          </div>

          <div *ngIf="cartItems.length > 0 && !showMobileCheckout" class="m-cart-content">
            <div class="m-cart-list">
              <div *ngFor="let item of cartItems" class="m-cart-item">
                <div class="m-cart-item-left">
                  <h4>{{ item.productname }}</h4>
                  <span class="m-cart-item-price">{{ formatCOP(item.productprice) }}</span>
                </div>
                <div class="m-qty-pill">
                  <button type="button" (click)="changeItemQty(item, -1)">-</button>
                  <span>{{ item.quantity }}</span>
                  <button type="button" class="plus" (click)="changeItemQty(item, 1)">+</button>
                </div>
              </div>
            </div>

            <div class="m-summary-card">
              <span>Total</span>
              <strong>{{ formatCOP(totalCartPrice) }}</strong>
            </div>

            <div class="m-cart-btn-group">
              <button type="button" class="m-btn-cancel-round" (click)="clearCart()">
                Cancelar
              </button>
              <button
                type="button"
                class="m-btn-pay-round"
                (click)="showMobileCheckout = true"
              >
                Pagar ahora
              </button>
            </div>
          </div>

          <!-- Formulario de Checkout móvil -->
          <div *ngIf="cartItems.length > 0 && showMobileCheckout" class="m-checkout-box">
            <h2 class="m-sub-heading">Finalizar Compra</h2>

            <label class="m-field-label">Dirección de entrega</label>
            <input
              type="text"
              class="m-field-input"
              [(ngModel)]="deliveryAddress"
              placeholder="Ej. Calle 45 #12-34"
            />

            <label class="m-field-label">Método de pago</label>
            <select class="m-field-input" [(ngModel)]="paymentMethod">
              <option value="Tarjeta de Crédito / Débito">Tarjeta de Crédito / Débito</option>
              <option value="Efectivo contra entrega">Efectivo contra entrega</option>
              <option value="Transferencia bancaria">Transferencia bancaria</option>
            </select>

            <div class="m-summary-card mt-3">
              <span>Total</span>
              <strong>{{ formatCOP(totalCartPrice) }}</strong>
            </div>

            <div class="m-cart-btn-group">
              <button
                type="button"
                class="m-btn-cancel-round"
                (click)="showMobileCheckout = false"
              >
                Atrás
              </button>
              <button
                type="button"
                class="m-btn-pay-round"
                [disabled]="processingOrder"
                (click)="confirmOrder()"
              >
                {{ processingOrder ? 'Procesando...' : 'Confirmar Pedido' }}
              </button>
            </div>
          </div>
        </div>

        <!-- BOTTOM NAVIGATION BAR ORIGINAL (buyer_bottom_menu.xml) -->
        <nav class="m-bottom-nav">
          <button
            type="button"
            class="m-nav-btn"
            [class.active]="mobileTab === 'home'"
            (click)="mobileTab = 'home'; activeTab = 'home'"
          >
            <ion-icon name="calendar-outline"></ion-icon>
            <span>Inicio</span>
          </button>
          <button
            type="button"
            class="m-nav-btn"
            [class.active]="mobileTab === 'catalog'"
            (click)="mobileTab = 'catalog'; activeTab = 'home'"
          >
            <ion-icon name="book-outline"></ion-icon>
            <span>Catálogo</span>
          </button>
          <button
            type="button"
            class="m-nav-btn"
            [class.active]="mobileTab === 'cart'"
            (click)="mobileTab = 'cart'; activeTab = 'cart'"
          >
            <ion-icon name="cart-outline"></ion-icon>
            <span>Carrito</span>
          </button>
          <button type="button" class="m-nav-btn" (click)="goToProfile()">
            <ion-icon name="person-outline"></ion-icon>
            <span>Perfil</span>
          </button>
        </nav>
      </div>

      <!-- ============================================================== -->
      <!-- VISTA ESCRITORIO WEB (> 768px)                                 -->
      <!-- ============================================================== -->
      <main class="cb-container desktop-buyer-flow">
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
      </main>

      <!-- MODAL DETALLE DE PRODUCTO (compartido móvil y web) -->
      <div class="modal-backdrop" *ngIf="selectedProduct" (click)="selectedProduct = null">
        <div class="modal-card cb-card" (click)="$event.stopPropagation()">
          <button type="button" class="modal-close" (click)="selectedProduct = null">X</button>
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
                  placeholder="Ej. Feliz Cumpleaños María"
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
          <div class="receipt-badge">OK</div>
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
            (click)="completedReceipt = null; showMobileCheckout = false; mobileTab = 'home'; activeTab = 'home'"
          >
            REGRESAR AL INICIO
          </button>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    .mobile-buyer-flow {
      display: none;
    }

    @media (max-width: 768px) {
      .desktop-buyer-flow {
        display: none !important;
      }
      .mobile-buyer-flow {
        display: block;
        min-height: 100vh;
        background: #FFFFFF;
        padding-bottom: 84px;
      }

      /* 1. INICIO MÓVIL (activity_buyer_home.xml) */
      .m-home-screen {
        padding-bottom: 24px;
      }
      .m-welcome-container {
        padding: 48px 24px 0;
      }
      .m-welcome-name {
        font-size: 20px;
        font-weight: 700;
        color: #FF8B6A;
        margin: 0;
      }
      .m-offers-title {
        font-size: 20px;
        font-weight: 700;
        color: #000000;
        margin: 24px 24px 12px;
      }
      .m-offers-scroll {
        display: flex;
        gap: 14px;
        overflow-x: auto;
        padding: 4px 24px 16px;
      }
      .m-offer-card {
        min-width: 170px;
        max-width: 170px;
        background: #FFFFFF;
        border-radius: 20px;
        box-shadow: 0 4px 14px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        flex-shrink: 0;
      }
      .m-offer-img {
        width: 100%;
        height: 130px;
        object-fit: cover;
      }
      .m-offer-body {
        padding: 10px 12px 14px;
      }
      .m-offer-body h4 {
        margin: 0 0 4px;
        font-size: 14px;
        font-weight: 700;
        color: #000000;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .m-offer-price {
        font-size: 13px;
        font-weight: 700;
        color: #FF8B6A;
      }
      .m-explore-card {
        margin: 20px 24px;
        background: #FFF1EB;
        border-radius: 24px;
        padding: 24px;
        cursor: pointer;
      }
      .m-explore-inner {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 12px;
      }
      .m-explore-inner h3 {
        margin: 0;
        font-size: 18px;
        font-weight: 700;
        color: #FF8B6A;
      }
      .m-explore-inner p {
        margin: 4px 0 0;
        font-size: 14px;
        color: #757575;
      }
      .m-explore-arrow {
        width: 34px;
        height: 34px;
        border-radius: 50%;
        background: #FF8B6A;
        color: #FFFFFF;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 20px;
        font-weight: 700;
      }

      /* 2. CATÁLOGO MÓVIL (activity_buyer_catalog.xml) */
      .m-catalog-screen,
      .m-cart-screen {
        padding: 32px 0 24px;
      }
      .m-screen-title {
        font-size: 24px;
        font-weight: 700;
        color: #000000;
        margin: 0 24px 16px;
      }
      .m-search-box {
        padding: 0 24px;
      }
      .m-search-input {
        width: 100%;
        padding: 12px 18px;
        border: 1.5px solid #CCCCCC;
        border-radius: 24px;
        font-size: 14px;
        color: #000000;
        outline: none;
      }
      .m-tabs-row {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-bottom: 1px solid #EEEEEE;
        margin-top: 12px;
      }
      .m-tab-btn {
        background: none;
        border: none;
        border-bottom: 3px solid transparent;
        padding: 12px 8px;
        font-size: 14px;
        font-weight: 700;
        color: #757575;
      }
      .m-tab-btn.active {
        color: #FF8B6A;
        border-bottom-color: #FF8B6A;
      }
      .m-products-grid {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        padding: 14px 16px;
      }
      .m-grid-card {
        background: #FFFFFF;
        border-radius: 24px;
        box-shadow: 0 2px 10px rgba(0, 0, 0, 0.08);
        overflow: hidden;
        padding-bottom: 12px;
      }
      .m-grid-img-wrap {
        position: relative;
        height: 150px;
      }
      .m-grid-img-wrap img {
        width: 100%;
        height: 100%;
        object-fit: cover;
      }
      .m-stock-badge {
        position: absolute;
        top: 10px;
        right: 10px;
        padding: 4px 10px;
        border-radius: 999px;
        font-size: 10px;
        font-weight: 700;
      }
      .m-stock-badge.in-stock {
        background: #E8F5E9;
        color: #2E7D32;
      }
      .m-stock-badge.out-stock {
        background: #FFEBEE;
        color: #C62828;
      }
      .m-grid-footer {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        padding: 8px 12px 0;
        gap: 6px;
      }
      .m-grid-meta {
        min-width: 0;
      }
      .m-grid-meta h4 {
        margin: 0;
        font-size: 14px;
        font-weight: 700;
        color: #000000;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }
      .m-grid-meta span {
        display: block;
        margin-top: 2px;
        font-size: 13px;
        font-weight: 700;
        color: #FF8B6A;
      }
      .m-grid-action {
        width: 30px;
        height: 30px;
        border-radius: 50%;
        border: none;
        background: #FF8B6A;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 16px;
        flex-shrink: 0;
      }

      /* 3. MI CARRITO MÓVIL (activity_cart.xml + item_cart.xml) */
      .m-empty-cart {
        text-align: center;
        padding: 48px 24px;
        color: #757575;
      }
      .m-btn-primary-round {
        background: #FF8B6A;
        color: #FFFFFF;
        border: none;
        border-radius: 24px;
        padding: 14px 28px;
        font-weight: 700;
        margin-top: 12px;
      }
      .m-cart-list {
        padding: 0 24px;
      }
      .m-cart-item {
        display: flex;
        align-items: center;
        justify-content: space-between;
        padding: 20px 0;
        border-bottom: 1px solid #EEEEEE;
      }
      .m-cart-item-left h4 {
        margin: 0 0 4px;
        font-size: 18px;
        font-weight: 700;
        color: #000000;
      }
      .m-cart-item-price {
        font-size: 14px;
        color: #FF8B6A;
        font-weight: 600;
      }
      .m-qty-pill {
        display: inline-flex;
        align-items: center;
        gap: 12px;
        background: #FFF1EB;
        padding: 6px 14px;
        border-radius: 999px;
      }
      .m-qty-pill button {
        background: none;
        border: none;
        font-size: 18px;
        font-weight: 700;
        color: #000000;
      }
      .m-qty-pill button.plus {
        color: #FF8B6A;
      }
      .m-qty-pill span {
        font-size: 16px;
        font-weight: 700;
        color: #000000;
      }
      .m-summary-card {
        margin: 24px 24px 16px;
        padding: 16px 20px;
        border: 1px solid #EEEEEE;
        border-radius: 16px;
        display: flex;
        align-items: center;
        justify-content: space-between;
      }
      .m-summary-card span {
        font-size: 20px;
        font-weight: 700;
        color: #000000;
      }
      .m-summary-card strong {
        font-size: 20px;
        font-weight: 700;
        color: #FF8B6A;
      }
      .m-cart-btn-group {
        display: flex;
        gap: 12px;
        padding: 0 24px;
      }
      .m-btn-cancel-round {
        flex: 1;
        padding: 14px;
        border-radius: 24px;
        border: 1px solid #EEEEEE;
        background: #FFFFFF;
        color: #757575;
        font-weight: 600;
        font-size: 15px;
      }
      .m-btn-pay-round {
        flex: 1.5;
        padding: 14px;
        border-radius: 24px;
        border: none;
        background: #FF8B6A;
        color: #FFFFFF;
        font-weight: 700;
        font-size: 16px;
      }
      .m-checkout-box {
        padding: 0 24px;
      }
      .m-sub-heading {
        font-size: 20px;
        font-weight: 700;
        margin: 8px 0 16px;
      }
      .m-field-label {
        display: block;
        font-size: 14px;
        font-weight: 700;
        margin: 12px 0 6px;
      }
      .m-field-input {
        width: 100%;
        padding: 13px 16px;
        border: 1.5px solid #CCCCCC;
        border-radius: 12px;
        font-size: 15px;
      }

      /* BARRA DE NAVEGACIÓN INFERIOR (BottomNavigationView) */
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
    .mt-3 {
      margin-top: 16px;
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
      font-size: 1.2rem;
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
      bottom: 76px;
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
      .detail-grid {
        grid-template-columns: 1fr;
      }
      .detail-img {
        height: 200px;
      }
    }
  `],
})
export class BuyerPage implements OnInit {
  currentUser: UserEntity | null = null;
  products: ProductEntity[] = [];
  cartItems: CartItemEntity[] = [];

  /* Estado móvil original */
  mobileTab: 'home' | 'catalog' | 'cart' = 'home';
  mobileCategories = ['Todos', 'Pasteles', 'Galletas'];
  showMobileCheckout = false;

  /* Estado escritorio */
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
    private route: ActivatedRoute,
    private router: Router
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
        this.mobileTab = 'cart';
      } else if (params['tab'] === 'catalog') {
        this.mobileTab = 'catalog';
      } else if (params['tab'] === 'home') {
        this.activeTab = 'home';
        this.mobileTab = 'home';
      }
    });

    this.productRepo.loadAllProducts();
    this.cartRepo.loadCartItems();
  }

  goToProfile(): void {
    this.router.navigate(['/profile']);
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
    if (nextQty < 1) {
      await this.removeItem(item);
      return;
    }
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
