package com.example.cakebyteapp.data.repository

import com.example.cakebyteapp.data.local.entity.CartItemEntity
import com.example.cakebyteapp.domain.repository.CartRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import javax.inject.Inject

class CartRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient
) : CartRepository {

    override fun getCartItems(): Flow<List<CartItemEntity>> = flow {
        try {
            val userEmail = supabaseClient.auth.currentUserOrNull()?.email ?: ""
            if (userEmail.isEmpty()) {
                emit(emptyList())
                return@flow
            }
            
            val items = supabaseClient.postgrest["cart"]
                .select {
                    filter { eq("user_email", userEmail) }
                }.decodeList<CartItemEntity>()
            emit(items)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun addToCart(item: CartItemEntity) {
        val userEmail = supabaseClient.auth.currentUserOrNull()?.email ?: ""
        // Aseguramos que el item tenga el email del usuario actual
        val itemWithUser = item.copy(userEmail = userEmail)
        supabaseClient.postgrest["cart"].insert(itemWithUser)
    }

    override suspend fun updateQuantity(item: CartItemEntity) {
        supabaseClient.postgrest["cart"].update(item) {
            filter { eq("id", item.id ?: 0L) }
        }
    }

    override suspend fun removeFromCart(item: CartItemEntity) {
        supabaseClient.postgrest["cart"].delete {
            filter { eq("id", item.id ?: 0L) }
        }
    }

    override suspend fun clearCart() {
        val userEmail = supabaseClient.auth.currentUserOrNull()?.email ?: ""
        if (userEmail.isNotEmpty()) {
            supabaseClient.postgrest["cart"].delete {
                filter { eq("user_email", userEmail) }
            }
        }
    }
}
