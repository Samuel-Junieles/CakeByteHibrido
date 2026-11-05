package com.example.cakebyteapp

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.cakebyteapp.databinding.ActivityVendorDashboardBinding
import com.example.cakebyteapp.presentation.vendor.VendorProductsActivity
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import com.example.cakebyteapp.presentation.admin.AdminViewModel
import com.example.cakebyteapp.presentation.admin.DashboardOrderAdapter
import com.google.android.material.tabs.TabLayout
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class VendorDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVendorDashboardBinding
    private val viewModel: AdminViewModel by viewModels()
    private lateinit var orderAdapter: DashboardOrderAdapter
    private var currentFilter = "Todos"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVendorDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadData()
    }

    private fun setupRecyclerView() {
        orderAdapter = DashboardOrderAdapter { order ->
            if (order.status == "En espera") {
                showChangeStatusDialog(order)
            }
        }
        binding.rvVendorDashboardOrders.apply {
            layoutManager = LinearLayoutManager(this@VendorDashboardActivity)
            adapter = orderAdapter
        }
    }

    private fun setupListeners() {
        binding.tabOrderFilters.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                currentFilter = when (tab?.position) {
                    1 -> "En espera"
                    2 -> "Enviado"
                    else -> "Todos"
                }
                viewModel.orders.value.let { updateList(it) }
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })

        binding.bottomNavigation.selectedItemId = R.id.navigation_dashboard
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_dashboard -> true
                R.id.navigation_products -> {
                    val intent = Intent(this, VendorProductsActivity::class.java)
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
                    overridePendingTransition(0, 0)
                    true
                }
                else -> false
            }
        }
    }

    private fun showChangeStatusDialog(order: com.example.cakebyteapp.data.local.entity.OrderEntity) {
        AlertDialog.Builder(this)
            .setTitle("Actualizar Pedido")
            .setMessage("¿Deseas marcar el pedido #${order.id} de ${order.customerName} como ENVIADO?")
            .setPositiveButton("Sí, enviar") { _, _ ->
                viewModel.updateOrderStatus(order.copy(status = "Enviado"))
                Toast.makeText(this, "Pedido enviado", Toast.LENGTH_SHORT).show()
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.currentUser.collect { user ->
                    user?.let {
                        binding.tvWelcomeName.text = getString(R.string.welcome_message, it.name)
                    }
                }
            }
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.orders.collect { orders ->
                    updateList(orders)
                }
            }
        }

        lifecycleScope.launch {
            viewModel.logoutSuccess.collect { success ->
                if (success) {
                    val intent = Intent(this@VendorDashboardActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
        }
    }

    private fun updateList(orders: List<com.example.cakebyteapp.data.local.entity.OrderEntity>) {
        val filteredList = if (currentFilter == "Todos") {
            orders
        } else {
            orders.filter { it.status == currentFilter }
        }
        orderAdapter.submitList(filteredList)
    }
}
