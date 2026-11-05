package com.example.cakebyteapp.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.ProductEntity
import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.domain.repository.AuthRepository
import com.example.cakebyteapp.domain.repository.ProductRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class ProductsViewModel @Inject constructor(
    private val productRepository: ProductRepository,
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _selectedCategory = MutableStateFlow("Todos")
    private val _stockFilter = MutableStateFlow("Todos")
    private val _refreshTrigger = MutableStateFlow(System.currentTimeMillis())
    
    private val _saveSuccess = MutableSharedFlow<Boolean>()
    val saveSuccess = _saveSuccess.asSharedFlow()

    val products: StateFlow<List<ProductEntity>> = _refreshTrigger.flatMapLatest {
        combine(
            productRepository.getAllProducts(),
            _searchQuery,
            _selectedCategory,
            _stockFilter
        ) { allProducts, query, category, stockFilter ->
            allProducts.filter { product ->
                val matchesQuery = product.safeName.contains(query, ignoreCase = true)
                val matchesCategory = category == "Todos" || (product.category?.equals(category, ignoreCase = true) == true)
                
                val matchesStock = when(stockFilter) {
                    "En stock" -> product.safeStock > 1
                    "Fuera de stock" -> product.safeStock <= 1
                    else -> true
                }
                matchesQuery && matchesCategory && matchesStock
            }
        }
    }.stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    init {
        refresh()
    }

    fun refresh() {
        _refreshTrigger.value = System.currentTimeMillis()
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onCategoryFilterChanged(category: String) {
        _selectedCategory.value = category
    }

    fun onStockFilterChanged(filter: String) {
        _stockFilter.value = filter
    }

    fun getProductById(id: Long): Flow<ProductEntity?> = productRepository.getProductById(id)

    fun getCurrentUser(): Flow<UserEntity?> = authRepository.getCurrentUser()

    fun saveProduct(
        id: Long? = null,
        name: String,
        description: String,
        price: Double,
        category: String,
        stock: Int,
        status: String = "Activo",
        imageUrl: String? = null
    ) {
        viewModelScope.launch {
            try {
                val finalId = if (id == null || id == 0L) null else id
                
                val product = ProductEntity(
                    id = finalId,
                    name = name,
                    description = description,
                    price = price,
                    category = category,
                    stock = stock,
                    status = status,
                    imageUrl = imageUrl
                )
                productRepository.insertProduct(product)
                refresh()
                _saveSuccess.emit(true)
            } catch (e: Exception) {
                _saveSuccess.emit(false)
            }
        }
    }

    fun deleteProduct(product: ProductEntity) {
        viewModelScope.launch {
            productRepository.deleteProduct(product)
            refresh()
        }
    }
}
