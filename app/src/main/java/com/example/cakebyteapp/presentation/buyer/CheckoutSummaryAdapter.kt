package com.example.cakebyteapp.presentation.buyer

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.data.local.entity.CartItemEntity
import com.example.cakebyteapp.databinding.ItemCartBinding
import java.text.NumberFormat
import java.util.Locale

class CheckoutSummaryAdapter : ListAdapter<CartItemEntity, CheckoutSummaryAdapter.ViewHolder>(DiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ViewHolder {
        val binding = ItemCartBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ViewHolder(private val binding: ItemCartBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(item: CartItemEntity) {
            binding.tvProductName.text = item.productName
            
            val colombianLocale = Locale("es", "CO")
            val currencyFormatter = NumberFormat.getCurrencyInstance(colombianLocale)
            binding.tvProductPrice.text = "${item.quantity} x ${currencyFormatter.format(item.productPrice)}"
            
            // Hide buttons for summary
            binding.quantityGroup.visibility = View.GONE
        }
    }

    class DiffCallback : DiffUtil.ItemCallback<CartItemEntity>() {
        override fun areItemsTheSame(oldItem: CartItemEntity, newItem: CartItemEntity): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: CartItemEntity, newItem: CartItemEntity): Boolean = oldItem == newItem
    }
}
