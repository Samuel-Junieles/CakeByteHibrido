package com.example.cakebyteapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.example.cakebyteapp.databinding.ActivityAdminDashboardBinding
import com.example.cakebyteapp.presentation.admin.AdminProductsActivity
import com.example.cakebyteapp.presentation.admin.AdminUsersActivity
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import com.example.cakebyteapp.presentation.admin.AdminViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.*

@AndroidEntryPoint
class AdminDashboardActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminDashboardBinding
    private val viewModel: AdminViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminDashboardBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupBottomNavigation()
        observeViewModel()
    }

    override fun onResume() {
        super.onResume()
        viewModel.loadData()
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
                viewModel.stats.collect { stats ->
                    binding.tvDailySalesCount.text = stats.dailySalesCount.toString()
                    binding.tvTotalOrders.text = stats.totalOrders.toString()
                    
                    val colombianLocale = Locale("es", "CO")
                    val currencyFormatter = NumberFormat.getCurrencyInstance(colombianLocale)
                    binding.tvTotalEarnings.text = currencyFormatter.format(stats.totalEarnings)
                }
            }
        }

        lifecycleScope.launch {
            viewModel.logoutSuccess.collect { success ->
                if (success) {
                    val intent = Intent(this@AdminDashboardActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
        }
    }

    private fun setupBottomNavigation() {
        binding.bottomNavigation.selectedItemId = R.id.navigation_dashboard
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_dashboard -> true
                R.id.navigation_users -> {
                    val intent = Intent(this, AdminUsersActivity::class.java)
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
                    overridePendingTransition(0, 0)
                    true
                }
                else -> false
            }
        }
    }
}
