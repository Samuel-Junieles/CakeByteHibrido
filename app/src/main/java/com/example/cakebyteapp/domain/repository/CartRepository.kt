package com.example.cakebyteapp.domain.repository

import com.example.cakebyteapp.data.local.entity.CartItemEntity
import kotlinx.coroutines.flow.Flow

interface CartRepository {
    fun getCartItems(): Flow<List<CartItemEntity>>
    suspend fun addToCart(item: CartItemEntity)
    suspend fun updateQuantity(item: CartItemEntity)
    suspend fun removeFromCart(item: CartItemEntity)
    suspend fun clearCart()
}
