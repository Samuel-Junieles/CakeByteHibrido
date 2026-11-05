package com.example.cakebyteapp.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.OrderEntity
import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.domain.repository.AuthRepository
import com.example.cakebyteapp.domain.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@HiltViewModel
class AdminViewModel @Inject constructor(
    private val authRepository: AuthRepository,
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _currentUser = MutableStateFlow<UserEntity?>(null)
    val currentUser = _currentUser.asStateFlow()

    private val _orders = MutableStateFlow<List<OrderEntity>>(emptyList())
    val orders = _orders.asStateFlow()

    private val _stats = MutableStateFlow(DashboardStats())
    val stats = _stats.asStateFlow()

    private val _logoutSuccess = MutableSharedFlow<Boolean>()
    val logoutSuccess = _logoutSuccess.asSharedFlow()

    init {
        loadData()
    }

    fun loadData() {
        viewModelScope.launch {
            authRepository.getCurrentUser().collect { user ->
                _currentUser.value = user
            }
        }
        
        viewModelScope.launch {
            orderRepository.getAllOrders().collect { orderList ->
                if (orderList.isEmpty()) {
                    addSampleOrders()
                } else {
                    _orders.value = orderList
                    updateStats(orderList)
                }
            }
        }
    }

    private fun updateStats(orderList: List<OrderEntity>) {
        val today = SimpleDateFormat("yyyy-MM-dd", Locale.getDefault()).format(Date())
        
        val dailySalesCount = orderList.filter { 
            it.createdAt?.startsWith(today) == true 
        }.sumOf { it.totalItems }

        val totalOrders = orderList.size
        val totalEarnings = orderList.sumOf { it.totalPrice }

        _stats.value = DashboardStats(
            dailySalesCount = dailySalesCount,
            totalOrders = totalOrders,
            totalEarnings = totalEarnings
        )
    }

    private fun addSampleOrders() {
        viewModelScope.launch {
            val samples = listOf(
                OrderEntity(customerName = "Juan Pérez", itemsSummary = "Torta de Chocolate x1", totalPrice = 25000.0, totalItems = 1, status = "En espera"),
                OrderEntity(customerName = "Ana María", itemsSummary = "Galletas x12", totalPrice = 15000.0, totalItems = 12, status = "En espera"),
                OrderEntity(customerName = "Carlos Ruiz", itemsSummary = "Cheesecake x1", totalPrice = 18000.0, totalItems = 1, status = "Enviado")
            )
            samples.forEach { orderRepository.insertOrder(it) }
            // Volver a cargar para disparar la UI
            orderRepository.getAllOrders().collect {
                _orders.value = it
                updateStats(it)
            }
        }
    }

    fun updateOrderStatus(order: OrderEntity) {
        viewModelScope.launch {
            orderRepository.updateOrder(order)
            loadData() // Refrescar
        }
    }

    fun logout() {
        viewModelScope.launch {
            val result = authRepository.logout()
            _logoutSuccess.emit(result.isSuccess)
        }
    }

    data class DashboardStats(
        val dailySalesCount: Int = 0,
        val totalOrders: Int = 0,
        val totalEarnings: Double = 0.0
    )
}
