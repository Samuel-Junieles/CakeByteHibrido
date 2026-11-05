package com.example.cakebyteapp.presentation.vendor

import android.os.Bundle
import android.widget.ArrayAdapter
import android.widget.ImageView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityAddEditProductBinding
import com.example.cakebyteapp.presentation.admin.ProductsViewModel
import com.example.cakebyteapp.util.ImageHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class AddEditProductActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAddEditProductBinding
    private val viewModel: ProductsViewModel by viewModels()
    private var productId: Long = 0L
    private var selectedImageName: String = ""

    private val takePictureLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        if (bitmap != null) {
            selectedImageName = ImageHelper.bitmapToDataUrl(bitmap)
            updatePreviewImage(selectedImageName)
            Toast.makeText(this, "Foto tomada con la cámara", Toast.LENGTH_SHORT).show()
        }
    }

    private val pickGalleryLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null) {
            val dataUrl = ImageHelper.uriToDataUrl(this, uri)
            if (dataUrl != null) {
                selectedImageName = dataUrl
                updatePreviewImage(selectedImageName)
                Toast.makeText(this, "Imagen seleccionada de la galería", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAddEditProductBinding.inflate(layoutInflater)
        setContentView(binding.root)

        productId = intent.getLongExtra("PRODUCT_ID", 0L)
        
        setupDropdown()
        setupListeners()
        observeViewModel()
        
        if (productId != 0L) {
            binding.tvTitle.text = "Editar Producto"
            binding.btnSave.text = "Guardar"
            loadProductData()
        }
    }

    private fun setupDropdown() {
        val categories = arrayOf("Pan", "Pasteles", "Galletas", "Bebidas")
        val adapter = ArrayAdapter(this, android.R.layout.simple_dropdown_item_1line, categories)
        binding.actvCategory.setAdapter(adapter)
    }

    private fun loadProductData() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.getProductById(productId).collect { product ->
                    product?.let {
                        binding.etName.setText(it.name)
                        binding.etDesc.setText(it.description)
                        binding.etPrice.setText(it.price.toString())
                        binding.actvCategory.setText(it.category, false)
                        binding.etStock.setText(it.stock.toString())
                        selectedImageName = it.imageUrl ?: ""
                        updatePreviewImage(selectedImageName)
                    }
                }
            }
        }
    }

    private fun setupListeners() {
        binding.btnCancel.setOnClickListener { finish() }

        binding.imagePickerCard.setOnClickListener {
            showImagePickerDialog()
        }

        binding.btnSave.setOnClickListener {
            val name = binding.etName.text.toString()
            val desc = binding.etDesc.text.toString()
            val priceText = binding.etPrice.text.toString()
            val price = priceText.toDoubleOrNull() ?: 0.0
            val category = binding.actvCategory.text.toString()
            val stockText = binding.etStock.text.toString()

            val stock = stockText.toIntOrNull() ?: 0

            if (name.isBlank() || priceText.isBlank()) {
                Toast.makeText(this, "El nombre y el precio son obligatorios", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            viewModel.saveProduct(
                id = if (productId == 0L) null else productId,
                name = name,
                description = desc,
                price = price,
                category = category,
                stock = stock,
                status = "Activo",
                imageUrl = selectedImageName
            )
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.saveSuccess.collect { success ->
                    if (success) {
                        Toast.makeText(this@AddEditProductActivity, "Operación exitosa", Toast.LENGTH_SHORT).show()
                        finish()
                    } else {
                        Toast.makeText(this@AddEditProductActivity, "Error al guardar cambios", Toast.LENGTH_SHORT).show()
                    }
                }
            }
        }
    }

    private fun showImagePickerDialog() {
        val options = arrayOf(
            "Tomar foto con la Cámara",
            "Elegir de la Galería del Teléfono",
            "Torta de Chocolate (Catálogo)",
            "Torta de Vainilla (Catálogo)",
            "Red Velvet (Catálogo)",
            "Carrot Cake (Catálogo)",
            "Cheesecake Mora (Catálogo)",
            "Cheesecake Fresa (Catálogo)",
            "Galletas (Catálogo)"
        )
        val presetNames = arrayOf(
            "torta_de_chocolate", "torta_de_vainilla", "red_velvet_torta",
            "carrot_torta", "cheesecake_de_mora", "cheesecake_de_fresa", "galletas_de_chocolate"
        )

        AlertDialog.Builder(this)
            .setTitle("Imagen del Producto")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takePictureLauncher.launch(null)
                    1 -> pickGalleryLauncher.launch("image/*")
                    else -> {
                        selectedImageName = presetNames[which - 2]
                        updatePreviewImage(selectedImageName)
                    }
                }
            }
            .show()
    }

    private fun updatePreviewImage(name: String) {
        if (name.isEmpty()) return
        binding.ivProductPreview.imageTintList = null
        binding.ivProductPreview.scaleType = ImageView.ScaleType.CENTER_CROP
        ImageHelper.bindProductImage(binding.ivProductPreview, name)
    }
}
