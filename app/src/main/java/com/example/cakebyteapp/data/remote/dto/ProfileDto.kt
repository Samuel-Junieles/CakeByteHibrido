package com.example.cakebyteapp.data.remote.dto

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProfileDto(
    @SerialName("id")
    val id: String? = null,
    @SerialName("correo")
    val email: String,
    @SerialName("nombres")
    val nombres: String? = "",
    @SerialName("apellidos")
    val apellidos: String? = "",
    @SerialName("rol_id")
    val rolId: Int? = 3,
    @SerialName("created_at")
    val createdAt: String? = null
)
