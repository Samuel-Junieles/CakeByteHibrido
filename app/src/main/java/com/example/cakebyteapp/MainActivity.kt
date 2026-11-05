package com.example.cakebyteapp

import android.content.Intent
import android.os.Bundle
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatDelegate
import androidx.core.view.ViewCompat
import androidx.core.view.WindowInsetsCompat
import androidx.lifecycle.lifecycleScope
import com.example.cakebyteapp.databinding.ActivityMainBinding
import com.example.cakebyteapp.domain.usecase.AuthUseCase
import com.example.cakebyteapp.presentation.auth.AuthViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

@AndroidEntryPoint
class MainActivity : AppCompatActivity() {

    private lateinit var binding: ActivityMainBinding
    private val viewModel: AuthViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        // Eliminamos setDefaultNightMode de aquí
        // Comentamos esto temporalmente para evitar el crash en MIUI/Xiaomi
        // enableEdgeToEdge()

        binding = ActivityMainBinding.inflate(layoutInflater)
        setContentView(binding.root)

        // ViewCompat.setOnApplyWindowInsetsListener(binding.main) { v, insets ->
        //    val systemBars = insets.getInsets(WindowInsetsCompat.Type.systemBars())
        //    v.setPadding(systemBars.left, systemBars.top, systemBars.right, systemBars.bottom)
        //    insets
        // }

        observeDestination()
        
        lifecycleScope.launch {
            delay(2000) // Simular splash
            viewModel.checkSession()
        }
    }

    private fun observeDestination() {
        lifecycleScope.launch {
            viewModel.destination.collect { destination ->
                android.util.Log.d("NAV_DEBUG", "Destino: $destination")
                when (destination) {
                    is AuthUseCase.Destination.Login -> {
                        startActivity(Intent(this@MainActivity, OnboardingActivity::class.java))
                    }
                    is AuthUseCase.Destination.AdminDashboard -> {
                        startActivity(Intent(this@MainActivity, AdminDashboardActivity::class.java))
                    }
                    is AuthUseCase.Destination.VendedorDashboard -> {
                        val intent = Intent(this@MainActivity, com.example.cakebyteapp.presentation.vendor.VendorProductsActivity::class.java)
                        startActivity(intent)
                    }
                    is AuthUseCase.Destination.CompradorDashboard -> {
                        val intent = Intent(this@MainActivity, com.example.cakebyteapp.presentation.buyer.BuyerHomeActivity::class.java)
                        startActivity(intent)
                    }
                    else -> {
                        // Otros casos
                        startActivity(Intent(this@MainActivity, OnboardingActivity::class.java))
                    }
                }
                finish()
            }
        }
    }
}