package com.example.cakebyteapp.presentation.vendor

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.R
import com.example.cakebyteapp.data.local.entity.ProductEntity
import com.example.cakebyteapp.databinding.ItemProductGridBinding
import java.text.NumberFormat
import java.util.Locale

class VendorProductAdapter(
    private val onEdit: (ProductEntity) -> Unit
) : ListAdapter<ProductEntity, VendorProductAdapter.VendorProductViewHolder>(VendorProductDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): VendorProductViewHolder {
        val binding = ItemProductGridBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return VendorProductViewHolder(binding)
    }

    override fun onBindViewHolder(holder: VendorProductViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class VendorProductViewHolder(private val binding: ItemProductGridBinding) : RecyclerView.ViewHolder(binding.root) {
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

            // Logic for Stock Badge (Threshold: 1)
            if (product.safeStock > 1) {
                binding.tvStockBadge.text = context.getString(R.string.filter_in_stock)
                binding.tvStockBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.percentage_green)
                binding.tvStockBadge.setTextColor(ContextCompat.getColor(context, R.color.text_green))
            } else {
                binding.tvStockBadge.text = context.getString(R.string.filter_out_of_stock)
                binding.tvStockBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.percentage_red)
                binding.tvStockBadge.setTextColor(ContextCompat.getColor(context, R.color.text_red))
            }

            // Para vendedor, el icono es editar (lápiz)
            binding.btnAction.setImageResource(android.R.drawable.ic_menu_edit)
            binding.btnAction.setOnClickListener { onEdit(product) }
            binding.root.setOnClickListener { onEdit(product) }
        }
    }

    class VendorProductDiffCallback : DiffUtil.ItemCallback<ProductEntity>() {
        override fun areItemsTheSame(oldItem: ProductEntity, newItem: ProductEntity): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: ProductEntity, newItem: ProductEntity): Boolean = oldItem == newItem
    }
}
