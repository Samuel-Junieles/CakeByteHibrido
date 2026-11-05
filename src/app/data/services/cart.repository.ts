import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { supabaseClient } from '../../core/supabase/supabase.client';
import { CartItemEntity } from '../../domain/models/models';
import { AuthRepository } from './auth.repository';

@Injectable({
  providedIn: 'root',
})
export class CartRepository {
  private cartItemsSubject = new BehaviorSubject<CartItemEntity[]>([]);
  public cartItems$: Observable<CartItemEntity[]> = this.cartItemsSubject.asObservable();

  public totalItems$: Observable<number> = this.cartItems$.pipe(
    map((items) => items.reduce((acc, item) => acc + Number(item.quantity || 0), 0))
  );

  public totalPrice$: Observable<number> = this.cartItems$.pipe(
    map((items) =>
      items.reduce((acc, item) => acc + Number(item.productprice || 0) * Number(item.quantity || 0), 0)
    )
  );

  constructor(private authRepository: AuthRepository) {
    this.authRepository.currentUser$.subscribe((user) => {
      if (user?.email) {
        this.loadCartItems(user.email);
      } else {
        this.cartItemsSubject.next([]);
      }
    });
  }

  get currentItems(): CartItemEntity[] {
    return this.cartItemsSubject.value;
  }

  async loadCartItems(email?: string): Promise<CartItemEntity[]> {
    const userEmail = email || this.authRepository.currentUserValue?.email;
    if (!userEmail) {
      this.cartItemsSubject.next([]);
      return [];
    }

    const { data, error } = await supabaseClient
      .from('cart')
      .select('*')
      .eq('user_email', userEmail)
      .order('id', { ascending: true });

    if (error || !data) {
      return this.cartItemsSubject.value;
    }

    const items = data as CartItemEntity[];
    this.cartItemsSubject.next(items);
    return items;
  }

  async addToCart(item: Omit<CartItemEntity, 'id' | 'user_email'>): Promise<boolean> {
    const userEmail = this.authRepository.currentUserValue?.email;
    if (!userEmail) return false;

    const existing = this.cartItemsSubject.value.find(
      (i) => i.productid === item.productid && (i.note || '') === (item.note || '')
    );

    if (existing && existing.id) {
      return this.updateQuantity(existing, existing.quantity + item.quantity);
    }

    const payload = {
      productid: item.productid,
      productname: item.productname,
      productprice: item.productprice,
      quantity: item.quantity,
      size: item.size || 'Estándar',
      note: item.note || null,
      imageurl: item.imageurl || 'torta_de_chocolate',
      user_email: userEmail,
    };

    const { error } = await supabaseClient.from('cart').insert(payload);
    if (!error) {
      await this.loadCartItems(userEmail);
      return true;
    }
    return false;
  }

  async updateQuantity(item: CartItemEntity, newQuantity: number): Promise<boolean> {
    if (!item.id || newQuantity < 1) return false;
    const { error } = await supabaseClient
      .from('cart')
      .update({ quantity: newQuantity })
      .eq('id', item.id);

    if (!error) {
      await this.loadCartItems();
      return true;
    }
    return false;
  }

  async removeFromCart(item: CartItemEntity): Promise<boolean> {
    if (!item.id) return false;
    const { error } = await supabaseClient.from('cart').delete().eq('id', item.id);
    if (!error) {
      await this.loadCartItems();
      return true;
    }
    return false;
  }

  async clearCart(): Promise<void> {
    const userEmail = this.authRepository.currentUserValue?.email;
    if (!userEmail) return;
    await supabaseClient.from('cart').delete().eq('user_email', userEmail);
    this.cartItemsSubject.next([]);
  }
}

