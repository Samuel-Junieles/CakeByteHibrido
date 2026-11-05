package com.example.cakebyteapp.domain.usecase

import com.example.cakebyteapp.data.local.entity.CartItemEntity
import com.example.cakebyteapp.domain.repository.CartRepository
import javax.inject.Inject

class AddToCartUseCase @Inject constructor(
    private val repository: CartRepository
) {
    suspend operator fun invoke(item: CartItemEntity) = repository.addToCart(item)
}
