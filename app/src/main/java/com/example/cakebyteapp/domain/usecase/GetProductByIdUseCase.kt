package com.example.cakebyteapp.domain.usecase

import com.example.cakebyteapp.data.local.entity.ProductEntity
import com.example.cakebyteapp.domain.repository.ProductRepository
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject

class GetProductByIdUseCase @Inject constructor(
    private val repository: ProductRepository
) {
    operator fun invoke(id: Int): Flow<ProductEntity?> = repository.getProductById(id.toLong())
}
