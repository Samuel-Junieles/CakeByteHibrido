package com.example.cakebyteapp.presentation.buyer

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.GridLayoutManager
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityBuyerCatalogBinding
import com.example.cakebyteapp.presentation.admin.ProductsViewModel
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import com.google.android.material.tabs.TabLayout
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class BuyerCatalogActivity : AppCompatActivity() {

    private lateinit var binding: ActivityBuyerCatalogBinding
    private val viewModel: ProductsViewModel by viewModels()
    private lateinit var adapter: BuyerProductAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityBuyerCatalogBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
    }

    override fun onResume() {
        super.onResume()
        viewModel.refresh()
    }

    private fun setupRecyclerView() {
        adapter = BuyerProductAdapter { product ->
            val intent = Intent(this, ProductDetailActivity::class.java)
            intent.putExtra("PRODUCT_ID", product.id)
            startActivity(intent)
        }
        binding.rvProducts.apply {
            layoutManager = GridLayoutManager(this@BuyerCatalogActivity, 2)
            adapter = this@BuyerCatalogActivity.adapter
        }
    }

    private fun setupListeners() {
        binding.etSearch.addTextChangedListener { text ->
            viewModel.onSearchQueryChanged(text?.toString() ?: "")
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

        binding.bottomNavigation.selectedItemId = R.id.navigation_catalog
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_home -> {
                    val intent = Intent(this, BuyerHomeActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
                    true
                }
                R.id.navigation_catalog -> true
                R.id.navigation_cart -> {
                    val intent = Intent(this, CartActivity::class.java)
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
