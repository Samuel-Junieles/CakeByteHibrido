package com.example.cakebyteapp.presentation.login

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.domain.repository.AuthRepository
import com.example.cakebyteapp.domain.usecase.LoginUseCase
import com.example.cakebyteapp.data.local.security.SecurityManager
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class LoginViewModel @Inject constructor(
    private val loginUseCase: LoginUseCase,
    private val authRepository: AuthRepository,
    private val securityManager: SecurityManager
) : ViewModel() {

    private val _state = MutableStateFlow<LoginState>(LoginState.Idle)
    val state = _state.asStateFlow()

    fun login(email: String, pass: String) {
        viewModelScope.launch {
            _state.value = LoginState.Loading
            val result = loginUseCase(email, pass)
            result.onSuccess { user ->
                securityManager.saveCredentials(email, pass) // Guardar para biometría
                _state.value = LoginState.Success(user.role)
            }.onFailure { error ->
                _state.value = LoginState.Error(error.message ?: "Error desconocido")
            }
        }
    }

    fun loginWithGoogle(idToken: String) {
        viewModelScope.launch {
            _state.value = LoginState.Loading
            val result = authRepository.loginWithGoogle(idToken)
            result.onSuccess { user ->
                _state.value = LoginState.Success(user.role)
            }.onFailure { error ->
                _state.value = LoginState.Error(error.message ?: "Error en Google Sign-In")
            }
        }
    }

    fun loginWithBiometric() {
        val email = securityManager.getSavedEmail()
        val pass = securityManager.getSavedPass()
        if (email != null && pass != null) {
            login(email, pass)
        } else {
            _state.value = LoginState.Error("No hay credenciales guardadas")
        }
    }

    fun checkBiometricAvailability() {
        viewModelScope.launch {
            if (securityManager.getSavedEmail() != null) {
                _state.value = LoginState.BiometricReady
            }
        }
    }
}

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val role: String) : LoginState()
    data class Error(val message: String) : LoginState()
    object BiometricReady : LoginState()
}