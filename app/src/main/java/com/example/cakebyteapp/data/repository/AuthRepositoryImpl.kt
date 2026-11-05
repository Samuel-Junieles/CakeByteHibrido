package com.example.cakebyteapp.data.repository

import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.data.remote.dto.ProfileDto
import com.example.cakebyteapp.domain.repository.AuthRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import io.github.jan.supabase.auth.providers.Google
import io.github.jan.supabase.auth.providers.builtin.Email
import io.github.jan.supabase.auth.providers.builtin.IDToken
import io.github.jan.supabase.postgrest.postgrest
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.flowOn
import kotlinx.coroutines.withContext
import kotlinx.serialization.json.buildJsonObject
import kotlinx.serialization.json.put
import javax.inject.Inject

class AuthRepositoryImpl @Inject constructor(
    private val supabaseClient: SupabaseClient
) : AuthRepository {

    private fun mapRolIdToString(rolId: Int?): String {
        return when (rolId) {
            1 -> "Admin"
            2 -> "Vendedor"
            else -> "Comprador"
        }
    }

    private fun mapStringToRolId(role: String): Int {
        return when (role) {
            "Admin" -> 1
            "Vendedor" -> 2
            else -> 3
        }
    }

    override suspend fun login(email: String, pass: String): Result<UserEntity> {
        return try {
            supabaseClient.auth.signInWith(Email) {
                this.email = email
                this.password = pass
            }
            
            val user = getUserByEmail(email)
            if (user != null) {
                Result.success(user)
            } else {
                Result.success(UserEntity(email = email, name = "Usuario", role = "Comprador"))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun loginWithGoogle(idToken: String): Result<UserEntity> {
        return try {
            supabaseClient.auth.signInWith(IDToken) {
                this.idToken = idToken
                this.provider = Google
            }
            
            val currentUser = supabaseClient.auth.currentUserOrNull() 
                ?: return Result.failure(Exception("Error: No se pudo establecer la sesión en Supabase."))
            
            val email = currentUser.email ?: return Result.failure(Exception("Error: La cuenta de Google no proporcionó un correo."))
            val userId = currentUser.id
            
            // 2. Buscar si el usuario ya existe en nuestra tabla 'usuarios'
            val existingUser = getUserByEmail(email)
            if (existingUser != null) {
                return Result.success(existingUser)
            }
            
            // 3. Si es nuevo, extraer datos del perfil de Google y crear registro en 'usuarios'
            val metadata = currentUser.userMetadata
            val fullName = metadata?.get("full_name")?.toString()?.trim()?.removeSurrounding("\"") ?: "Usuario Google"
            val names = fullName.split(" ")
            val firstName = names.getOrNull(0) ?: fullName
            val lastName = if (names.size > 1) names.drop(1).joinToString(" ") else ""
            
            // Sincronizamos con la tabla 'usuarios' de la base de datos
            withContext(Dispatchers.IO) {
                try {
                    supabaseClient.postgrest["usuarios"].insert(
                        buildJsonObject {
                            put("id", userId)
                            put("nombres", firstName)
                            put("apellidos", lastName)
                            put("correo", email)
                            put("contrasena", "google_oauth_${userId.takeLast(6)}")
                            put("rol_id", 3)
                        }
                    )
                } catch (e: Exception) {
                    // Log error o manejar duplicados
                }
            }
            
            Result.success(UserEntity(email = email, name = fullName, role = "Comprador"))
        } catch (e: Exception) {
            Result.failure(Exception("Error Supabase Google: ${e.localizedMessage}"))
        }
    }

    override suspend fun register(email: String, pass: String, name: String, role: String): Result<Unit> {
        return try {
            val authResponse = supabaseClient.auth.signUpWith(Email) {
                this.email = email
                this.password = pass
            }
            
            val userId = authResponse?.id ?: supabaseClient.auth.currentUserOrNull()?.id

            val names = name.split(" ")
            val firstName = names.getOrNull(0) ?: name
            val lastName = if (names.size > 1) names.drop(1).joinToString(" ") else ""

            if (userId != null) {
                supabaseClient.postgrest["usuarios"].insert(
                    buildJsonObject {
                        put("id", userId)
                        put("nombres", firstName)
                        put("apellidos", lastName)
                        put("correo", email)
                        put("contrasena", pass) 
                        put("rol_id", mapStringToRolId(role))
                    }
                )
            }
            
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override fun getCurrentUser(): Flow<UserEntity?> = flow {
        val sessionUser = supabaseClient.auth.currentUserOrNull()
        if (sessionUser != null) {
            val profile = getUserByEmail(sessionUser.email ?: "")
            emit(profile)
        } else {
            emit(null)
        }
    }.flowOn(Dispatchers.IO)

    override fun getAllUsers(): Flow<List<UserEntity>> = flow {
        try {
            val supabaseProfiles = supabaseClient.postgrest["usuarios"]
                .select().decodeList<ProfileDto>()
            
            val users = supabaseProfiles.map { profile ->
                UserEntity(
                    email = profile.email,
                    name = "${profile.nombres} ${profile.apellidos}".trim(),
                    role = mapRolIdToString(profile.rolId),
                    createdAt = profile.createdAt
                )
            }
            emit(users)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }.flowOn(Dispatchers.IO)

    override suspend fun getUserByEmail(email: String): UserEntity? {
        return withContext(Dispatchers.IO) {
            try {
                val profile = supabaseClient.postgrest["usuarios"]
                    .select {
                        filter { eq("correo", email) }
                    }.decodeSingleOrNull<ProfileDto>()
                
                profile?.let {
                    UserEntity(
                        email = it.email,
                        name = "${it.nombres} ${it.apellidos}".trim(),
                        role = mapRolIdToString(it.rolId),
                        createdAt = it.createdAt
                    )
                }
            } catch (e: Exception) {
                null
            }
        }
    }

    override suspend fun updateUser(user: UserEntity): Result<Unit> {
        return try {
            val names = user.name.split(" ")
            val firstName = names.getOrNull(0) ?: user.name
            val lastName = if (names.size > 1) names.drop(1).joinToString(" ") else ""

            withContext(Dispatchers.IO) {
                supabaseClient.postgrest["usuarios"].update(
                    buildJsonObject {
                        put("nombres", firstName)
                        put("apellidos", lastName)
                        put("rol_id", mapStringToRolId(user.role))
                    }
                ) {
                    filter { eq("correo", user.email) }
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun deleteUser(email: String): Result<Unit> {
        return try {
            withContext(Dispatchers.IO) {
                supabaseClient.postgrest["usuarios"].delete {
                    filter { eq("correo", email) }
                }
            }
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            supabaseClient.auth.signOut()
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
}
