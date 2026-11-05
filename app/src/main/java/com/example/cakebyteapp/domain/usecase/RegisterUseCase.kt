package com.example.cakebyteapp.domain.usecase

import com.example.cakebyteapp.domain.repository.AuthRepository
import javax.inject.Inject

class RegisterUseCase @Inject constructor(
    private val repository: AuthRepository
) {
    suspend operator fun invoke(email: String, pass: String, name: String, role: String): Result<Unit> {
        if (email.isBlank() || pass.isBlank() || name.isBlank() || role.isBlank()) {
            return Result.failure(Exception("Todos los campos son obligatorios"))
        }
        if (!android.util.Patterns.EMAIL_ADDRESS.matcher(email).matches()) {
            return Result.failure(Exception("Formato de correo inválido"))
        }
        if (pass.length < 6) {
            return Result.failure(Exception("La contraseña debe tener al menos 6 caracteres"))
        }
        return repository.register(email, pass, name, role)
    }
}