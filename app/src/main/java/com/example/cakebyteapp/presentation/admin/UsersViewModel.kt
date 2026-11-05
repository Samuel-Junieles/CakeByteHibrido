package com.example.cakebyteapp.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.ExperimentalCoroutinesApi
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@OptIn(ExperimentalCoroutinesApi::class)
@HiltViewModel
class UsersViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _searchQuery = MutableStateFlow("")
    private val _selectedRole = MutableStateFlow("Todos")
    
    // El trigger ahora lanza una recolección directa de la nube
    private val _refreshTrigger = MutableStateFlow(System.currentTimeMillis())

    val users: StateFlow<List<UserEntity>> = _refreshTrigger
        .flatMapLatest { 
            // Llamamos directamente a la lógica de nube en el repositorio
            authRepository.getAllUsers() 
        }
        .combine(_searchQuery) { list, query ->
            list.filter { it.name.contains(query, true) || it.email.contains(query, true) }
        }
        .combine(_selectedRole) { list, role ->
            if (role == "Todos") list else list.filter { it.role.equals(role, true) }
        }
        .stateIn(viewModelScope, SharingStarted.WhileSubscribed(5000), emptyList())

    fun refresh() {
        _refreshTrigger.value = System.currentTimeMillis()
    }

    fun onSearchQueryChanged(query: String) {
        _searchQuery.value = query
    }

    fun onRoleFilterChanged(role: String) {
        _selectedRole.value = role
    }

    fun deleteUser(user: UserEntity) {
        viewModelScope.launch {
            val result = authRepository.deleteUser(user.email)
            if (result.isSuccess) {
                refresh()
            }
        }
    }
}
