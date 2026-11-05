package com.example.cakebyteapp.presentation.admin

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.GridLayoutManager
import com.example.cakebyteapp.AdminDashboardActivity
import com.example.cakebyteapp.VendorDashboardActivity
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityAdminProductsBinding
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import com.example.cakebyteapp.presentation.vendor.AddEditProductActivity
import com.google.android.material.tabs.TabLayout
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class AdminProductsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminProductsBinding
    private val viewModel: ProductsViewModel by viewModels()
    private lateinit var adapter: ProductAdapter
    private var userRole: String = "Admin"

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminProductsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        adapter = ProductAdapter(
            onEdit = { product -> 
                val intent = Intent(this, AddEditProductActivity::class.java)
                intent.putExtra("PRODUCT_ID", product.id)
                startActivity(intent)
            }
        )
        binding.rvProducts.apply {
            layoutManager = GridLayoutManager(this@AdminProductsActivity, 2)
            adapter = this@AdminProductsActivity.adapter
        }
    }

    private fun setupListeners() {
        binding.etSearch.addTextChangedListener { text ->
            viewModel.onSearchQueryChanged(text?.toString() ?: "")
        }

        binding.fabAddProduct.setOnClickListener {
            startActivity(Intent(this, AddEditProductActivity::class.java))
        }

        binding.tabCategories.addOnTabSelectedListener(object : TabLayout.OnTabSelectedListener {
            override fun onTabSelected(tab: TabLayout.Tab?) {
                val category = when (tab?.position) {
                    1 -> "Pasteles"
                    2 -> "Galletas"
                    else -> "Todos"
                }
                viewModel.onCategoryFilterChanged(category)
            }
            override fun onTabUnselected(tab: TabLayout.Tab?) {}
            override fun onTabReselected(tab: TabLayout.Tab?) {}
        })

        binding.cgStockFilters.setOnCheckedStateChangeListener { _, checkedIds ->
            val filter = when (checkedIds.firstOrNull()) {
                R.id.chipInStock -> "En stock"
                R.id.chipOutOfStock -> "Fuera de stock"
                else -> "Todos"
            }
            viewModel.onStockFilterChanged(filter)
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.products.collect { productList ->
                    adapter.submitList(productList)
                }
            }
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.getCurrentUser().collect { user ->
                    user?.let {
                        userRole = it.role
                        binding.bottomNavigation.menu.clear()
                        if (it.role == "Vendedor") {
                            binding.bottomNavigation.inflateMenu(R.menu.vendor_bottom_menu)
                        } else {
                            binding.bottomNavigation.inflateMenu(R.menu.admin_bottom_menu)
                        }
                        setupBottomNavigation()
                    }
                }
            }
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.selectedItemId = R.id.navigation_products
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_dashboard -> {
                    val target = if (userRole == "Vendedor") VendorDashboardActivity::class.java else AdminDashboardActivity::class.java
                    val intent = Intent(this, target)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
                    true
                }
                R.id.navigation_users -> {
                    if (userRole == "Admin") {
                        val intent = Intent(this, AdminUsersActivity::class.java)
                        intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                        startActivity(intent)
                        finish()
                        overridePendingTransition(0, 0)
                    }
                    true
                }
                R.id.navigation_products -> true
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
}
