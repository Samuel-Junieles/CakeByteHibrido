package com.example.cakebyteapp.presentation.buyer

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityProductDetailBinding
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch
import java.text.NumberFormat
import java.util.*

@AndroidEntryPoint
class ProductDetailActivity : AppCompatActivity() {

    private lateinit var binding: ActivityProductDetailBinding
    private val viewModel: ProductDetailViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityProductDetailBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val productId = intent.getLongExtra("PRODUCT_ID", -1L)
        if (productId != -1L) {
            viewModel.loadProduct(productId.toInt())
        }

        setupListeners()
        observeViewModel()
    }

    private fun setupListeners() {
        binding.btnBack.setOnClickListener { finish() }

        binding.btnAddToCart.setOnClickListener {
            val note = binding.etNote.text.toString()
            viewModel.addToCart(note)
        }
    }

    private fun observeViewModel() {
        val currencyFormatter = NumberFormat.getCurrencyInstance(Locale("es", "CO"))

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.product.collect { product ->
                    product?.let {
                        binding.tvProductName.text = it.safeName
                        binding.tvProductPrice.text = currencyFormatter.format(it.safePrice)
                        binding.tvDescription.text = it.description

                        // Carga de imagen
                        val imageName = it.imageUrl ?: ""
                        val resId = if (imageName.isNotEmpty()) {
                            resources.getIdentifier(imageName, "drawable", packageName)
                        } else {
                            0
                        }
                        
                        if (resId != 0) {
                            binding.ivProduct.setImageResource(resId)
                        } else {
                            binding.ivProduct.setImageResource(R.drawable.torta_de_chocolate)
                        }

                        // Lógica de botón añadir según stock
                        if (it.safeStock <= 1) {
                            binding.btnAddToCart.isEnabled = false
                            binding.btnAddToCart.text = "Agotado"
                            binding.btnAddToCart.backgroundTintList = getColorStateList(R.color.indicator_inactive)
                        } else {
                            binding.btnAddToCart.isEnabled = true
                            binding.btnAddToCart.text = "Añadir al carrito"
                            binding.btnAddToCart.backgroundTintList = getColorStateList(R.color.salmon_primary)
                        }
                    }
                }
            }
        }

        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.addToCartSuccess.collect { success ->
                    if (success) {
                        Toast.makeText(this@ProductDetailActivity, "Añadido al carrito con éxito", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@ProductDetailActivity, "Error al añadir al carrito", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }
}
