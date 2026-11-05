package com.example.cakebyteapp.presentation.vendor

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.GridLayoutManager
import com.example.cakebyteapp.VendorDashboardActivity
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityVendedorProductsBinding
import com.example.cakebyteapp.presentation.admin.ProductsViewModel
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import com.google.android.material.tabs.TabLayout
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class VendorProductsActivity : AppCompatActivity() {

    private lateinit var binding: ActivityVendedorProductsBinding
    private val viewModel: ProductsViewModel by viewModels()
    private lateinit var adapter: VendorProductAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityVendedorProductsBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    private fun setupRecyclerView() {
        adapter = VendorProductAdapter(
            onEdit = { product ->
                val intent = Intent(this, AddEditProductActivity::class.java)
                intent.putExtra("PRODUCT_ID", product.id)
                startActivity(intent)
            }
        )
        binding.rvVendorProducts.apply {
            layoutManager = GridLayoutManager(this@VendorProductsActivity, 2)
            adapter = this@VendorProductsActivity.adapter
        }
    }

    private fun setupListeners() {
        // Search Logic
        binding.etSearch.addTextChangedListener { text ->
            viewModel.onSearchQueryChanged(text?.toString() ?: "")
        }

        // FAB to Add Product
        binding.fabAddProduct.setOnClickListener {
            startActivity(Intent(this, AddEditProductActivity::class.java))
        }

        // Navigation
        binding.bottomNavigation.selectedItemId = R.id.navigation_products
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_dashboard -> {
                    val intent = Intent(this, VendorDashboardActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
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

        // Category Tabs
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

        // Stock Filter Logic
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
    }
}
