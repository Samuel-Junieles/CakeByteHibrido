package com.example.cakebyteapp.data.local.entity

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class OrderEntity(
    val id: Int = 0,
    @SerialName("customername")
    val customerName: String,
    @SerialName("itemssummary")
    val itemsSummary: String,
    @SerialName("totalprice")
    val totalPrice: Double,
    @SerialName("totalitems")
    val totalItems: Int = 0,
    val status: String, // "Pendiente", "Entregado"
    @SerialName("createdat")
    val createdAt: String? = null
)
