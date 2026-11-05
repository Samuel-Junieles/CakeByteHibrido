import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabaseClient } from '../../core/supabase/supabase.client';
import { CartItemEntity, DashboardStats, OrderEntity } from '../../domain/models/models';
import { ProductRepository } from './product.repository';
import { CartRepository } from './cart.repository';

@Injectable({
  providedIn: 'root',
})
export class OrderRepository {
  private ordersSubject = new BehaviorSubject<OrderEntity[]>([]);
  public orders$: Observable<OrderEntity[]> = this.ordersSubject.asObservable();

  constructor(
    private productRepository: ProductRepository,
    private cartRepository: CartRepository
  ) {
    this.setupRealtimeAndFocusSync();
  }

  private setupRealtimeAndFocusSync(): void {
    try {
      supabaseClient
        .channel('cakebyte-orders-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'orders' },
          () => {
            this.loadAllOrders();
          }
        )
        .subscribe();
    } catch {
      // Ignorar si Realtime no está disponible temporalmente
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.loadAllOrders());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.loadAllOrders();
        }
      });
      setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.loadAllOrders();
        }
      }, 8000);
    }
  }

  async loadAllOrders(): Promise<OrderEntity[]> {
    const { data, error } = await supabaseClient
      .from('orders')
      .select('*')
      .order('id', { ascending: false });

    if (error || !data) {
      return this.ordersSubject.value;
    }

    const list = data as OrderEntity[];
    this.ordersSubject.next(list);
    return list;
  }

  async completeCheckoutOrder(
    customerName: string,
    address: string,
    paymentMethod: string,
    items: CartItemEntity[]
  ): Promise<{ success: boolean; order?: OrderEntity; error?: string }> {
    if (!items.length) {
      return { success: false, error: 'El carrito está vacío' };
    }

    const summary =
      items.map((i) => `${i.productname} x${i.quantity}`).join(', ') +
      ` | Dir: ${address} (${paymentMethod})`;
    const totalItems = items.reduce((acc, i) => acc + Number(i.quantity), 0);
    const totalPrice = items.reduce(
      (acc, i) => acc + Number(i.productprice) * Number(i.quantity),
      0
    );

    const payload = {
      customername: customerName || 'Cliente',
      itemssummary: summary,
      totalprice: totalPrice,
      totalitems: totalItems,
      status: 'En espera',
    };

    const { data, error } = await supabaseClient
      .from('orders')
      .insert(payload)
      .select('*')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    // Descontar stock de cada producto comprado directamente en la BD
    for (const item of items) {
      const product = await this.productRepository.getProductById(item.productid);
      if (product) {
        const newStock = Math.max(0, Number(product.stock || 0) - Number(item.quantity));
        await this.productRepository.saveProduct({
          ...product,
          stock: newStock,
        });
      }
    }

    await this.cartRepository.clearCart();
    await this.loadAllOrders();
    return { success: true, order: data as OrderEntity };
  }

  async updateOrderStatus(order: OrderEntity, newStatus: string): Promise<boolean> {
    if (!order.id) return false;
    const { error } = await supabaseClient
      .from('orders')
      .update({ status: newStatus })
      .eq('id', order.id);

    if (!error) {
      await this.loadAllOrders();
      return true;
    }
    return false;
  }

  async deleteOrder(order: OrderEntity): Promise<boolean> {
    if (!order.id) return false;
    const { error } = await supabaseClient.from('orders').delete().eq('id', order.id);
    if (!error) {
      await this.loadAllOrders();
      return true;
    }
    return false;
  }

  calculateStats(orders: OrderEntity[], activeProductsCount = 0): DashboardStats {
    const todayPrefix = new Date().toISOString().slice(0, 10);
    const dailySalesCount = orders
      .filter((o) => !o.createdat || o.createdat.startsWith(todayPrefix))
      .reduce((acc, o) => acc + Number(o.totalitems || 0), 0);

    const totalOrders = orders.length;
    const totalEarnings = orders.reduce((acc, o) => acc + Number(o.totalprice || 0), 0);

    return {
      dailySalesCount,
      totalOrders,
      totalEarnings,
      activeProductsCount,
    };
  }
}
