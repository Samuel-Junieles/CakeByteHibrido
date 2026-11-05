package com.example.cakebyteapp.data.local.entity

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class CartItemEntity(
    val id: Long? = null,
    @SerialName("productid")
    val productId: Long,
    @SerialName("productname")
    val productName: String,
    @SerialName("productprice")
    val productPrice: Double,
    val quantity: Int,
    val size: String,
    val note: String? = null,
    @SerialName("imageurl")
    val imageUrl: String? = null,
    @SerialName("user_email")
    val userEmail: String? = null
)
