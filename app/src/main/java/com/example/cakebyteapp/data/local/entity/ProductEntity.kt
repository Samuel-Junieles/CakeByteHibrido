package com.example.cakebyteapp.data.local.entity

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class ProductEntity(
    val id: Long? = null,
    val name: String? = "",
    val description: String? = "",
    val category: String? = "Pasteles",
    val price: Double? = 0.0,
    val stock: Int? = 0,
    val status: String? = "Activo",
    @SerialName("imageurl")
    val imageUrl: String? = null,
    @SerialName("createdat")
    val createdAt: String? = null
) {
    // Helper properties to handle nulls safely in UI
    val safeName: String get() = name ?: "Producto"
    val safePrice: Double get() = price ?: 0.0
    val safeStock: Int get() = stock ?: 0
}
