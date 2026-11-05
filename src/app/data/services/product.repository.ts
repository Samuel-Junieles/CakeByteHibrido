import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { supabaseClient } from '../../core/supabase/supabase.client';
import { ProductEntity } from '../../domain/models/models';

@Injectable({
  providedIn: 'root',
})
export class ProductRepository {
  private productsSubject = new BehaviorSubject<ProductEntity[]>([]);
  public products$: Observable<ProductEntity[]> = this.productsSubject.asObservable();

  constructor() {
    this.setupRealtimeAndFocusSync();
  }

  private setupRealtimeAndFocusSync(): void {
    try {
      supabaseClient
        .channel('cakebyte-products-realtime')
        .on(
          'postgres_changes',
          { event: '*', schema: 'public', table: 'products' },
          () => {
            this.loadAllProducts();
          }
        )
        .subscribe();
    } catch {
      // Ignorar si Realtime no está disponible temporalmente
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('focus', () => this.loadAllProducts());
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
          this.loadAllProducts();
        }
      });
      setInterval(() => {
        if (typeof document !== 'undefined' && document.visibilityState === 'visible') {
          this.loadAllProducts();
        }
      }, 8000);
    }
  }

  async loadAllProducts(): Promise<ProductEntity[]> {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .neq('category', '__user_profile__')
      .order('id', { ascending: true });

    if (error || !data) {
      return this.productsSubject.value;
    }

    const list = (data as ProductEntity[])
      .filter((p) => p.category !== '__user_profile__')
      .map((p) => ({
        ...p,
        name: p.name || 'Producto',
        description: p.description || '',
        category: p.category || 'Pasteles',
        price: Number(p.price ?? 0),
        stock: Number(p.stock ?? 0),
        status: p.status || 'Activo',
      }));

    this.productsSubject.next(list);
    return list;
  }

  async getProductById(id: number): Promise<ProductEntity | null> {
    const { data, error } = await supabaseClient
      .from('products')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error || !data) {
      return null;
    }
    return data as ProductEntity;
  }

  async saveProduct(product: ProductEntity): Promise<{ success: boolean; error?: string }> {
    const payload: Record<string, any> = {
      name: product.name.trim(),
      description: product.description.trim(),
      category: product.category || 'Pasteles',
      price: Number(product.price) || 0,
      stock: Number(product.stock) || 0,
      status: product.status || 'Activo',
      imageurl: product.imageurl || 'torta_de_chocolate',
    };

    if (product.id && product.id > 0) {
      const { error } = await supabaseClient
        .from('products')
        .update(payload)
        .eq('id', product.id);
      if (error) return { success: false, error: error.message };
    } else {
      const { error } = await supabaseClient.from('products').insert(payload);
      if (error) return { success: false, error: error.message };
    }

    await this.loadAllProducts();
    return { success: true };
  }

  async deleteProduct(id: number): Promise<boolean> {
    const { error } = await supabaseClient.from('products').delete().eq('id', id);
    if (!error) {
      await this.loadAllProducts();
      return true;
    }
    return false;
  }
}
