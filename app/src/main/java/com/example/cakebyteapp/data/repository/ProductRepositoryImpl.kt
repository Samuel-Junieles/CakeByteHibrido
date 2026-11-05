package com.example.cakebyteapp.data.repository

import com.example.cakebyteapp.data.local.entity.ProductEntity
import com.example.cakebyteapp.domain.repository.ProductRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import javax.inject.Inject

class ProductRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient
) : ProductRepository {

    override fun getAllProducts(): Flow<List<ProductEntity>> = flow {
        try {
            val products = supabaseClient.postgrest["products"]
                .select().decodeList<ProductEntity>()
            emit(products)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)

    override fun getProductById(id: Long): Flow<ProductEntity?> = flow {
        try {
            val product = supabaseClient.postgrest["products"]
                .select {
                    filter { eq("id", id) }
                }.decodeSingleOrNull<ProductEntity>()
            emit(product)
        } catch (e: Exception) {
            emit(null)
        }
    }.flowOn(Dispatchers.IO)

    override fun searchProducts(query: String): Flow<List<ProductEntity>> = flow {
        try {
            val products = supabaseClient.postgrest["products"]
                .select {
                    filter { ilike("name", "%$query%") }
                }.decodeList<ProductEntity>()
            emit(products)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun insertProduct(product: ProductEntity) {
        supabaseClient.postgrest["products"].upsert(product)
    }

    override suspend fun updateProduct(product: ProductEntity) {
        supabaseClient.postgrest["products"].update(product) {
            filter { eq("id", product.id ?: 0L) }
        }
    }

    override suspend fun deleteProduct(product: ProductEntity) {
        supabaseClient.postgrest["products"].delete {
            filter { eq("id", product.id ?: 0L) }
        }
    }
}
