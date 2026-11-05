package com.example.cakebyteapp.presentation.register

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.domain.usecase.RegisterUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class RegisterViewModel @Inject constructor(
    private val registerUseCase: RegisterUseCase
) : ViewModel() {

    private val _state = MutableStateFlow<RegisterState>(RegisterState.Idle)
    val state = _state.asStateFlow()

    fun register(email: String, pass: String, name: String, role: String) {
        viewModelScope.launch {
            _state.value = RegisterState.Loading
            val result = registerUseCase(email, pass, name, role)
            result.onSuccess {
                _state.value = RegisterState.Success
            }.onFailure { error ->
                _state.value = RegisterState.Error(error.message ?: "Error al registrar")
            }
        }
    }
}

sealed class RegisterState {
    object Idle : RegisterState()
    object Loading : RegisterState()
    object Success : RegisterState()
    data class Error(val message: String) : RegisterState()
}