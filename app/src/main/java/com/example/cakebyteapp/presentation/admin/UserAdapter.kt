package com.example.cakebyteapp.presentation.admin

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.DiffUtil
import androidx.recyclerview.widget.ListAdapter
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.R
import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.databinding.ItemUserBinding

class UserAdapter(
    private val onEdit: (UserEntity) -> Unit,
    private val onDelete: (UserEntity) -> Unit
) : ListAdapter<UserEntity, UserAdapter.UserViewHolder>(UserDiffCallback()) {

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val binding = ItemUserBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return UserViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        holder.bind(getItem(position))
    }

    inner class UserViewHolder(private val binding: ItemUserBinding) : RecyclerView.ViewHolder(binding.root) {
        fun bind(user: UserEntity) {
            binding.tvUserName.text = user.name
            binding.tvUserEmail.text = user.email
            binding.tvUserRoleBadge.text = user.role.uppercase()
            
            val context = binding.root.context
            when (user.role) {
                "Admin" -> {
                    binding.tvUserRoleBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.chip_admin_bg)
                    binding.tvUserRoleBadge.setTextColor(ContextCompat.getColor(context, R.color.role_admin_text))
                }
                "Vendedor" -> {
                    binding.tvUserRoleBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.chip_vendor_bg)
                    binding.tvUserRoleBadge.setTextColor(ContextCompat.getColor(context, R.color.role_vendor_text))
                }
                else -> {
                    binding.tvUserRoleBadge.backgroundTintList = ContextCompat.getColorStateList(context, R.color.chip_all_bg)
                    binding.tvUserRoleBadge.setTextColor(ContextCompat.getColor(context, R.color.text_red))
                }
            }

            binding.btnEditUser.setOnClickListener { onEdit(user) }
            binding.btnDeleteUser.setOnClickListener { onDelete(user) }
        }
    }

    class UserDiffCallback : DiffUtil.ItemCallback<UserEntity>() {
        override fun areItemsTheSame(oldItem: UserEntity, newItem: UserEntity): Boolean = 
            oldItem.email == newItem.email
        override fun areContentsTheSame(oldItem: UserEntity, newItem: UserEntity): Boolean = 
            oldItem == newItem
    }
}
