package com.example.cakebyteapp.presentation.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.cakebyteapp.domain.usecase.AuthUseCase
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AuthViewModel @Inject constructor(
    private val authUseCase: AuthUseCase
) : ViewModel() {

    private val _destination = MutableSharedFlow<AuthUseCase.Destination>()
    val destination = _destination.asSharedFlow()

    fun checkSession() {
        viewModelScope.launch {
            val dest = authUseCase.getInitialDestination()
            _destination.emit(dest)
        }
    }
}