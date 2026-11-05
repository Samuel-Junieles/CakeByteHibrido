package com.example.cakebyteapp.presentation.vendor

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.cakebyteapp.AdminDashboardActivity
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityVendedorOrdersBinding
import com.example.cakebyteapp.presentation.admin.AdminProductsActivity
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import com.google.android.material.tabs.TabLayout
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class VendorOrdersActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVendedorOrdersBinding
    private val viewModel: OrdersViewModel by viewModels()
    private lateinit var adapter: OrderAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVendedorOrdersBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        adapter = OrderAdapter { order ->
            if (order.status == "Pendiente") {
                showConfirmationDialog(order)
            }
        }
        binding.rvOrders.apply {
            layoutManager = LinearLayoutManager(this@VendorOrdersActivity)
            adapter = this@VendorOrdersActivity.adapter
        }
    }

    private fun showConfirmationDialog(order: com.example.cakebyteapp.data.local.entity.OrderEntity) {
        AlertDialog.Builder(this)
            .setTitle("Confirmar Entrega")
            .setMessage("¿Deseas marcar el pedido #${order.id} como entregado?")
            .setPositiveButton("Sí, confirmar") { _, _ ->
                viewModel.completeOrder(order)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun setupListeners() {
        binding.bottomNavigation.selectedItemId = R.id.navigation_dashboard
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_dashboard -> {
                    val intent = Intent(this, AdminDashboardActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
                    true
                }
                R.id.navigation_products -> {
                    val intent = Intent(this, AdminProductsActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
                    true
                }
                R.id.navigation_profile -> {
                    val intent = Intent(this, UserProfileActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
                    true
                }
                else -> false
            }
        }

        binding.tabOrderFilters.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                val filter = when (tab?.position) {
                    1 -> "Pendiente"
                    2 -> "Entregado"
                    else -> "Todos"
                }
                viewModel.onFilterChanged(filter)
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.orders.collect { orderList ->
                    adapter.submitList(orderList)
                }
            }
        }
    }
}
