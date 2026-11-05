package com.example.cakebyteapp.domain.repository

import com.example.cakebyteapp.data.local.entity.OrderEntity
import kotlinx.coroutines.flow.Flow

interface OrderRepository {
    fun getAllOrders(): Flow<List<OrderEntity>>
    suspend fun insertOrder(order: OrderEntity)
    suspend fun updateOrder(order: OrderEntity)
    suspend fun deleteOrder(order: OrderEntity)
}
