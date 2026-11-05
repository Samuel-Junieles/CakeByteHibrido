package com.example.cakebyteapp.domain.usecase

import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.domain.repository.AuthRepository
import javax.inject.Inject

class LoginUseCase @Inject constructor(
    private val repository: AuthRepository
) {
    suspend operator fun invoke(email: String, pass: String): Result<UserEntity> {
        if (email.isBlank() || pass.isBlank()) {
            return Result.failure(Exception("Campos vacíos"))
        }
        return repository.login(email, pass)
    }
}