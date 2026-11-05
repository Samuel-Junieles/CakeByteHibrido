package com.example.cakebyteapp.domain.repository

import com.example.cakebyteapp.data.local.entity.ProductEntity
import kotlinx.coroutines.flow.Flow

interface ProductRepository {
    fun getAllProducts(): Flow<List<ProductEntity>>
    fun getProductById(id: Long): Flow<ProductEntity?>
    fun searchProducts(query: String): Flow<List<ProductEntity>>
    suspend fun insertProduct(product: ProductEntity)
    suspend fun updateProduct(product: ProductEntity)
    suspend fun deleteProduct(product: ProductEntity)
}
