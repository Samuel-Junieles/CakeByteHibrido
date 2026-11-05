package com.example.cakebyteapp.presentation.buyer

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.R
import com.example.cakebyteapp.data.local.entity.ProductEntity
import com.example.cakebyteapp.databinding.ItemProductGridBinding
import java.text.NumberFormat
import java.util.Locale

class BuyerProductAdapter(
    private val onClick: (ProductEntity) -> Unit
) : ListAdapter<ProductEntity, BuyerProductAdapter.ProductViewHolder>(ProductDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): ProductViewHolder {
        val binding = ItemProductGridBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return ProductViewHolder(binding)
    }

    override fun onBindViewHolder(holder: ProductViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class ProductViewHolder(private val binding: ItemProductGridBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(product: ProductEntity) {
            binding.tvProductName.text = product.safeName
            
            val colombianLocale = Locale("es", "CO")
            val currencyFormatter = NumberFormat.getCurrencyInstance(colombianLocale)
            binding.tvProductPrice.text = currencyFormatter.format(product.safePrice)

            val imageName = product.imageUrl ?: ""
            val context = binding.root.context
            val resId = if (imageName.isNotEmpty()) {
                context.resources.getIdentifier(imageName, "drawable", context.packageName)
            } else {
                0
            }
            
            if (resId != 0) {
                binding.ivProduct.setImageResource(resId)
            } else {
                binding.ivProduct.setImageResource(R.drawable.torta_de_chocolate)
            }

            // Para comprador, el icono es añadir (+)
            binding.btnAction.setImageResource(android.R.drawable.ic_input_add)
            
            // Si el stock es 1 o menos, opacar la tarjeta o el botón
            if (product.safeStock <= 1) {
                binding.root.alpha = 0.6f
                binding.btnAction.isEnabled = false
            } else {
                binding.root.alpha = 1.0f
                binding.btnAction.isEnabled = true
            }

            binding.btnAction.setOnClickListener { onClick(product) }
            binding.root.setOnClickListener { onClick(product) }
        }
    }

    class ProductDiffCallback : DiffUtil.ItemCallback<ProductEntity>() {
        override fun areItemsTheSame(oldItem: ProductEntity, newItem: ProductEntity): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: ProductEntity, newItem: ProductEntity): Boolean = oldItem == newItem
    }
}
