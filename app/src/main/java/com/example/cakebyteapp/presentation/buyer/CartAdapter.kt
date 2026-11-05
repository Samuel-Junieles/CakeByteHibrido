package com.example.cakebyteapp.presentation.buyer

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.data.local.entity.CartItemEntity
import com.example.cakebyteapp.databinding.ItemCartBinding
import java.text.NumberFormat
import java.util.Locale

class CartAdapter(
    private val onUpdateQuantity: (CartItemEntity, Int) -> Unit,
    private val onRemove: (CartItemEntity) -> Unit
) : ListAdapter<CartItemEntity, CartAdapter.CartViewHolder>(CartDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): CartViewHolder {
        val binding = ItemCartBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return CartViewHolder(binding)
    }

    override fun onBindViewHolder(holder: CartViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class CartViewHolder(private val binding: ItemCartBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: CartItemEntity) {
            binding.tvProductName.text = item.productName
            
            val colombianLocale = Locale("es", "CO")
            val currencyFormatter = NumberFormat.getCurrencyInstance(colombianLocale)
            binding.tvProductPrice.text = currencyFormatter.format(item.productPrice)
            
            binding.tvQuantity.text = item.quantity.toString()

            binding.btnPlus.setOnClickListener {
                onUpdateQuantity(item, item.quantity + 1)
            }

            binding.btnMinus.setOnClickListener {
                if (item.quantity > 1) {
                    onUpdateQuantity(item, item.quantity - 1)
                } else {
                    onRemove(item)
                }
            }
        }
    }

    class CartDiffCallback : DiffUtil.ItemCallback<CartItemEntity>() {
        override fun areItemsTheSame(oldItem: CartItemEntity, newItem: CartItemEntity): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: CartItemEntity, newItem: CartItemEntity): Boolean = oldItem == newItem
    }
}
