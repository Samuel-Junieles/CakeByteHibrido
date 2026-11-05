package com.example.cakebyteapp.presentation.buyer

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityCheckoutBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.*

@AndroidEntryPoint
class CheckoutActivity : AppCompatActivity() {

    private lateinit var binding: ActivityCheckoutBinding
    private val viewModel: CartViewModel by viewModels()
    private lateinit var summaryAdapter: CheckoutSummaryAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityCheckoutBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupRecyclerView()
        setupListeners()
        observeViewModel()
        loadCustomerData()
    }

    private fun setupRecyclerView() {
        summaryAdapter = CheckoutSummaryAdapter()
        binding.rvOrderSummary.apply {
            layoutManager = LinearLayoutManager(this@CheckoutActivity)
            adapter = summaryAdapter
        }
    }

    private fun loadCustomerData() {
        lifecycleScope.launch {
            val user = viewModel.getCurrentUser().first()
            user?.let {
                binding.tvCustomerName.text = "Nombre: ${it.name}"
                binding.tvCustomerEmail.text = "Correo: ${it.email}"
            }
        }
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener { finish() }
        
        binding.btnConfirmOrder.setOnClickListener {
            val address = binding.etAddress.text.toString()
            if (address.isBlank()) {
                Toast.makeText(this, "Por favor ingresa la dirección de entrega", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            binding.btnConfirmOrder.isEnabled = false
            binding.progressBar.visibility = View.VISIBLE
            viewModel.completeOrder(address)
        }
    }

    private fun observeViewModel() {
        val currencyFormatter = NumberFormat.getCurrencyInstance(Locale("es", "CO"))

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.cartItems.collect { items ->
                    summaryAdapter.submitList(items)
                }
            }
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.totalPrice.collect { total ->
                    binding.tvTotalPrice.text = currencyFormatter.format(total)
                }
            }
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.orderSuccess.collect { success ->
                    binding.progressBar.visibility = View.GONE
                    if (success) {
                        Toast.makeText(this@CheckoutActivity, "Pedido confirmado con éxito", Toast.LENGTH_SHORT).show()
                        startActivity(Intent(this@CheckoutActivity, PaymentSuccessActivity::class.java))
                        finish()
                    } else {
                        binding.btnConfirmOrder.isEnabled = true
                        Toast.makeText(this@CheckoutActivity, "Error al procesar el pedido", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}
