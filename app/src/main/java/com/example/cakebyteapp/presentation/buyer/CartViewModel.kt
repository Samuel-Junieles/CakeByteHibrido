package com.example.cakebyteapp.presentation.buyer

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.CartItemEntity
import com.example.cakebyteapp.data.local.entity.OrderEntity
import com.example.cakebyteapp.domain.repository.CartRepository
import com.example.cakebyteapp.domain.repository.OrderRepository
import com.example.cakebyteapp.domain.repository.ProductRepository
import com.example.cakebyteapp.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class CartViewModel @Inject constructor(
    private val cartRepository: CartRepository,
    private val orderRepository: OrderRepository,
    private val productRepository: ProductRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _refreshTrigger = MutableStateFlow(System.currentTimeMillis())

    val cartItems: StateFlow<List<CartItemEntity>> = _refreshTrigger.flatMapLatest {
        cartRepository.getCartItems()
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    val totalPrice: StateFlow<Double> = cartItems.map { items ->
        items.sumOf { it.productPrice * it.quantity }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), 0.0)

    private val _orderSuccess = MutableSharedFlow<Boolean>()
    val orderSuccess = _orderSuccess.asSharedFlow()

    fun refresh() {
        _refreshTrigger.value = System.currentTimeMillis()
    }

    fun removeItem(item: CartItemEntity) {
        viewModelScope.launch {
            cartRepository.removeFromCart(item)
            refresh()
        }
    }

    fun clearCart() {
        viewModelScope.launch {
            cartRepository.clearCart()
            refresh()
        }
    }

    fun updateQuantity(item: CartItemEntity, newQuantity: Int) {
        viewModelScope.launch {
            productRepository.getProductById(item.productId).first()?.let { product ->
                if (newQuantity <= product.safeStock && newQuantity >= 1) {
                    cartRepository.updateQuantity(item.copy(quantity = newQuantity))
                    refresh()
                }
            }
        }
    }

    fun getCurrentUser() = authRepository.getCurrentUser()

    fun completeOrder(address: String) {
        viewModelScope.launch {
            try {
                val items = cartItems.value
                if (items.isEmpty()) {
                    _orderSuccess.emit(false)
                    return@launch
                }

                val user = authRepository.getCurrentUser().first()
                val customerName = user?.name ?: "Cliente"
                
                val summary = items.joinToString(", ") { "${it.productName} x${it.quantity}" } + " | Dir: $address"
                val totalQty = items.sumOf { it.quantity }
                val totalAmount = totalPrice.value

                val order = OrderEntity(
                    customerName = customerName,
                    itemsSummary = summary,
                    totalPrice = totalAmount,
                    totalItems = totalQty,
                    status = "En espera"
                )
                orderRepository.insertOrder(order)

                items.forEach { item ->
                    productRepository.getProductById(item.productId).first()?.let { product ->
                        val newStock = (product.safeStock - item.quantity).coerceAtLeast(0)
                        productRepository.updateProduct(product.copy(stock = newStock))
                    }
                }

                cartRepository.clearCart()
                refresh()
                _orderSuccess.emit(true)
            } catch (e: Exception) {
                _orderSuccess.emit(false)
            }
        }
    }
}
