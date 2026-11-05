package com.example.cakebyteapp.presentation.vendor

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.OrderEntity
import com.example.cakebyteapp.domain.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrdersViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _selectedFilter = MutableStateFlow("Todos")

    val orders: StateFlow<List<OrderEntity>> = _selectedFilter
        .flatMapLatest { filter ->
            orderRepository.getAllOrders().map { list ->
                if (filter == "Todos") list
                else list.filter { it.status == filter }
            }
        }.stateIn(viewModelScope, SharingStarted.Lazily, emptyList())

    init {
        viewModelScope.launch {
            orderRepository.getAllOrders().first().let { currentList ->
                if (localOrdersEmpty(currentList)) {
                    addSampleOrders()
                }
            }
        }
    }

    private fun localOrdersEmpty(list: List<OrderEntity>): Boolean = list.isEmpty()

    fun onFilterChanged(filter: String) {
        _selectedFilter.value = filter
    }

    fun completeOrder(order: OrderEntity) {
        viewModelScope.launch {
            orderRepository.updateOrder(order.copy(status = "Entregado"))
        }
    }

    fun deleteOrder(order: OrderEntity) {
        viewModelScope.launch {
            orderRepository.deleteOrder(order)
        }
    }

    private fun addSampleOrders() {
        viewModelScope.launch {
            orderRepository.insertOrder(OrderEntity(1042, "Juan P.", "Tarta fresas ×1 · Croissant ×2", 34000.0, 3, "Pendiente"))
            orderRepository.insertOrder(OrderEntity(1038, "Ana M.", "Red velvet ×1", 18000.0, 1, "Pendiente"))
            orderRepository.insertOrder(OrderEntity(1031, "Carlos V.", "Chocobrownie ×3", 21000.0, 3, "Entregado"))
        }
    }
}
