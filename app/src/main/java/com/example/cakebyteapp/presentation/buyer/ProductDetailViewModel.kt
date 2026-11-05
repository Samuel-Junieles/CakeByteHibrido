package com.example.cakebyteapp.presentation.buyer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.CartItemEntity
import com.example.cakebyteapp.data.local.entity.ProductEntity
import com.example.cakebyteapp.domain.usecase.AddToCartUseCase
import com.example.cakebyteapp.domain.usecase.GetProductByIdUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProductDetailViewModel @Inject constructor(
    private val getProductByIdUseCase: GetProductByIdUseCase,
    private val addToCartUseCase: AddToCartUseCase
) : ViewModel() {

    private val _product = MutableStateFlow<ProductEntity?>(null)
    val product = _product.asStateFlow()

    private val _quantity = MutableStateFlow(1)
    val quantity = _quantity.asStateFlow()

    private val _addToCartSuccess = MutableSharedFlow<Boolean>()
    val addToCartSuccess = _addToCartSuccess.asSharedFlow()

    fun loadProduct(id: Int) {
        viewModelScope.launch {
            getProductByIdUseCase(id).collect {
                _product.value = it
            }
        }
    }

    fun increaseQuantity() {
        val currentStock = _product.value?.safeStock ?: 0
        if (_quantity.value < currentStock) {
            _quantity.value++
        }
    }

    fun decreaseQuantity() {
        if (_quantity.value > 1) {
            _quantity.value--
        }
    }

    fun addToCart(note: String) {
        val currentProduct = _product.value ?: return
        viewModelScope.launch {
            try {
                val cartItem = CartItemEntity(
                    productId = currentProduct.id ?: 0L,
                    productName = currentProduct.safeName,
                    productPrice = currentProduct.safePrice,
                    quantity = _quantity.value,
                    size = "Estándar",
                    note = note,
                    imageUrl = currentProduct.imageUrl
                )
                addToCartUseCase(cartItem)
                _addToCartSuccess.emit(true)
            } catch (e: Exception) {
                _addToCartSuccess.emit(false)
            }
        }
    }
}
