package com.example.cakebyteapp.presentation.admin

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.domain.repository.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class CreateUserViewModel @Inject constructor(
    private val authRepository: AuthRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<CreateUserUiState>(CreateUserUiState.Idle)
    val uiState = _uiState.asStateFlow()

    private val _userToEdit = MutableStateFlow<UserEntity?>(null)
    val userToEdit = _userToEdit.asStateFlow()

    private val _navigationEvent = MutableSharedFlow<CreateUserNavigationEvent>()
    val navigationEvent = _navigationEvent.asSharedFlow()

    fun loadUser(email: String) {
        viewModelScope.launch {
            val user = authRepository.getUserByEmail(email)
            _userToEdit.value = user
        }
    }

    fun saveUser(name: String, surname: String, email: String, pass: String, role: String, isEdit: Boolean = false) {
        if (name.isBlank() || email.isBlank()) {
            _uiState.value = CreateUserUiState.Error("Nombre y Correo son obligatorios")
            return
        }

        viewModelScope.launch {
            _uiState.value = CreateUserUiState.Loading
            
            val result = if (isEdit) {
                authRepository.updateUser(UserEntity(
                    email = email,
                    name = "$name $surname",
                    role = role
                ))
            } else {
                authRepository.register(email, pass, "$name $surname", role)
            }

            if (result.isSuccess) {
                _uiState.value = CreateUserUiState.Success
                _navigationEvent.emit(CreateUserNavigationEvent.NavigateBack)
            } else {
                _uiState.value = CreateUserUiState.Error(result.exceptionOrNull()?.message ?: "Error al guardar")
            }
        }
    }

    sealed class CreateUserUiState {
        object Idle : CreateUserUiState()
        object Loading : CreateUserUiState()
        object Success : CreateUserUiState()
        data class Error(val message: String) : CreateUserUiState()
    }

    sealed class CreateUserNavigationEvent {
        object NavigateBack : CreateUserNavigationEvent()
    }
}
