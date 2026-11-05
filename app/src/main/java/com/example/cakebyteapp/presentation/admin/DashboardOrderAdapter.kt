package com.example.cakebyteapp.presentation.admin

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.R
import com.example.cakebyteapp.data.local.entity.OrderEntity
import com.example.cakebyteapp.databinding.ItemOrderDashboardBinding

class DashboardOrderAdapter(
    private val onOrderClick: (OrderEntity) -> Unit
) : ListAdapter<OrderEntity, DashboardOrderAdapter.OrderViewHolder>(OrderDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val binding = ItemOrderDashboardBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return OrderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class OrderViewHolder(private val binding: ItemOrderDashboardBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(order: OrderEntity) {
            binding.tvOrderId.text = "Pedido #${order.id}"
            binding.tvCustomerName.text = order.customerName
            binding.tvItemsSummary.text = order.itemsSummary
            binding.tvStatusBadge.text = order.status

            val context = binding.root.context
            when (order.status) {
                "En espera" -> {
                    binding.statusIndicator.setBackgroundColor(ContextCompat.getColor(context, R.color.salmon_primary))
                    binding.tvStatusBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.chip_all_bg)
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.salmon_primary))
                }
                "Enviado" -> {
                    binding.statusIndicator.setBackgroundColor(ContextCompat.getColor(context, R.color.text_green))
                    binding.tvStatusBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.percentage_green)
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.text_green))
                }
                else -> {
                    binding.statusIndicator.setBackgroundColor(ContextCompat.getColor(context, R.color.indicator_inactive))
                    binding.tvStatusBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.indicator_inactive)
                    binding.tvStatusBadge.setTextColor(ContextCompat.getColor(context, R.color.text_secondary))
                }
            }

            binding.root.setOnClickListener { onOrderClick(order) }
        }
    }

    class OrderDiffCallback : DiffUtil.ItemCallback<OrderEntity>() {
        override fun areItemsTheSame(oldItem: OrderEntity, newItem: OrderEntity): Boolean = oldItem.id == newItem.id
        override fun areContentsTheSame(oldItem: OrderEntity, newItem: OrderEntity): Boolean = oldItem == newItem
    }
}
