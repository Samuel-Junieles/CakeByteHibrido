package com.example.cakebyteapp.data.repository

import com.example.cakebyteapp.data.local.entity.OrderEntity
import com.example.cakebyteapp.domain.repository.OrderRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import javax.inject.Inject

class OrderRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient
) : OrderRepository {

    override fun getAllOrders(): Flow<List<OrderEntity>> = flow {
        try {
            val orders = supabaseClient.postgrest["orders"]
                .select().decodeList<OrderEntity>()
            emit(orders)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun insertOrder(order: OrderEntity) {
        supabaseClient.postgrest["orders"].insert(order)
    }

    override suspend fun updateOrder(order: OrderEntity) {
        supabaseClient.postgrest["orders"].update(order) {
            filter { eq("id", order.id) }
        }
    }

    override suspend fun deleteOrder(order: OrderEntity) {
        supabaseClient.postgrest["orders"].delete {
            filter { eq("id", order.id) }
        }
    }
}
