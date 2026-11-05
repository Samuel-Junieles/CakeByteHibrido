package com.example.cakebyteapp.domain.usecase

import com.example.cakebyteapp.domain.repository.AuthRepository
import io.github.jan.supabase.SupabaseClient
import io.github.jan.supabase.auth.auth
import kotlinx.coroutines.flow.first
import javax.inject.Inject

class AuthUseCase @Inject constructor(
    private val repository: AuthRepository,
    private val supabaseClient: SupabaseClient
) {
    suspend fun getInitialDestination(): Destination {
        // Primero verificamos si hay una sesión activa en Supabase
        val session = supabaseClient.auth.currentSessionOrNull()
        
        if (session == null) {
            return Destination.Login
        }

        // Si hay sesión en Supabase, buscamos el rol en la DB local
        val user = repository.getCurrentUser().first()
        return when {
            user == null -> Destination.Login
            else -> when (user.role) {
                "Admin" -> Destination.AdminDashboard
                "Vendedor" -> Destination.VendedorDashboard
                else -> Destination.CompradorDashboard
            }
        }
    }

    sealed class Destination {
        object Login : Destination()
        object AdminDashboard : Destination()
        object VendedorDashboard : Destination()
        object CompradorDashboard : Destination()
    }
}