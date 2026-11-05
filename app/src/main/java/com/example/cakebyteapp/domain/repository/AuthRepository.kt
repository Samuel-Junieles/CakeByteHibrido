package com.example.cakebyteapp.domain.repository

import com.example.cakebyteapp.data.local.entity.UserEntity
import kotlinx.coroutines.flow.Flow

interface AuthRepository {
    suspend fun login(email: String, pass: String): Result<UserEntity>
    suspend fun loginWithGoogle(idToken: String): Result<UserEntity>
    suspend fun register(email: String, pass: String, name: String, role: String): Result<Unit>
    suspend fun logout(): Result<Unit>
    fun getCurrentUser(): Flow<UserEntity?>
    fun getAllUsers(): Flow<List<UserEntity>>
    suspend fun getUserByEmail(email: String): UserEntity?
    suspend fun updateUser(user: UserEntity): Result<Unit>
    suspend fun deleteUser(email: String): Result<Unit>
}