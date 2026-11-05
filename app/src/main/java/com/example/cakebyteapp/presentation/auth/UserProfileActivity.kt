package com.example.cakebyteapp.presentation.auth

import android.content.Intent
import android.os.Bundle
import android.widget.ImageView
import android.widget.Toast
import androidx.activity.result.contract.ActivityResultContracts
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.cakebyteapp.AdminDashboardActivity
import com.example.cakebyteapp.VendorDashboardActivity
import com.example.cakebyteapp.LoginActivity
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityUserProfileBinding
import com.example.cakebyteapp.domain.repository.AuthRepository
import com.example.cakebyteapp.presentation.admin.AdminProductsActivity
import com.example.cakebyteapp.presentation.admin.AdminUsersActivity
import com.example.cakebyteapp.presentation.admin.AdminViewModel
import com.example.cakebyteapp.presentation.buyer.BuyerHomeActivity
import com.example.cakebyteapp.presentation.buyer.BuyerCatalogActivity
import com.example.cakebyteapp.presentation.buyer.CartActivity
import com.example.cakebyteapp.presentation.vendor.VendorProductsActivity
import com.example.cakebyteapp.util.ImageHelper
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class UserProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityUserProfileBinding
    private val viewModel: AdminViewModel by viewModels()
    private var currentEmail: String = ""

    @Inject
    lateinit var authRepository: AuthRepository

    private val takeAvatarCameraLauncher = registerForActivityResult(
        ActivityResultContracts.TakePicturePreview()
    ) { bitmap ->
        if (bitmap != null && currentEmail.isNotEmpty()) {
            val dataUrl = ImageHelper.bitmapToDataUrl(bitmap)
            ImageHelper.saveUserAvatar(this, currentEmail, dataUrl)
            applyAvatar(dataUrl)
            Toast.makeText(this, "Foto de perfil actualizada con la cámara", Toast.LENGTH_SHORT).show()
        }
    }

    private val pickAvatarGalleryLauncher = registerForActivityResult(
        ActivityResultContracts.GetContent()
    ) { uri ->
        if (uri != null && currentEmail.isNotEmpty()) {
            val dataUrl = ImageHelper.uriToDataUrl(this, uri)
            if (dataUrl != null) {
                ImageHelper.saveUserAvatar(this, currentEmail, dataUrl)
                applyAvatar(dataUrl)
                Toast.makeText(this, "Foto de perfil actualizada desde la galería", Toast.LENGTH_SHORT).show()
            }
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityUserProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        observeViewModel()
        loadUserData()
    }

    private fun loadUserData() {
        lifecycleScope.launch {
            val user = authRepository.getCurrentUser().first()
            user?.let {
                currentEmail = it.email
                binding.tvName.text = it.name
                binding.tvEmail.text = it.email
                ImageHelper.loadUserAvatar(this@UserProfileActivity, it.email)?.let { savedAvatar ->
                    applyAvatar(savedAvatar)
                }
                setupBottomNavigation(it.role)
            }
        }
    }

    private fun applyAvatar(dataUrl: String) {
        binding.ivAvatar.scaleType = ImageView.ScaleType.CENTER_CROP
        ImageHelper.bindProductImage(binding.ivAvatar, dataUrl, android.R.drawable.ic_menu_gallery)
    }

    private fun showAvatarPickerDialog() {
        val options = arrayOf(
            "Tomar foto con la Cámara",
            "Elegir de la Galería del Teléfono"
        )
        AlertDialog.Builder(this)
            .setTitle("Actualizar Foto de Perfil")
            .setItems(options) { _, which ->
                when (which) {
                    0 -> takeAvatarCameraLauncher.launch(null)
                    1 -> pickAvatarGalleryLauncher.launch("image/*")
                }
            }
            .show()
    }

    private fun setupListeners() {
        binding.btnEditAvatar.setOnClickListener {
            showAvatarPickerDialog()
        }

        binding.ivAvatar.setOnClickListener {
            showAvatarPickerDialog()
        }

        binding.btnEditProfile.setOnClickListener {
            startActivity(Intent(this, EditProfileActivity::class.java))
        }

        binding.btnLogout.setOnClickListener {
            viewModel.logout()
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            viewModel.logoutSuccess.collect { success ->
                if (success) {
                    val intent = Intent(this@UserProfileActivity, LoginActivity::class.java)
                    intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                    startActivity(intent)
                    finish()
                }
            }
        }
    }

    private fun setupBottomNavigation(role: String) {
        if (binding.bottomNavigation.menu.size() > 0) return

        when (role) {
            "Admin" -> {
                binding.bottomNavigation.inflateMenu(R.menu.admin_bottom_menu)
                binding.bottomNavigation.selectedItemId = R.id.navigation_profile
                binding.bottomNavigation.setOnItemSelectedListener { item ->
                    when (item.itemId) {
                        R.id.navigation_dashboard -> {
                            startActivity(Intent(this, AdminDashboardActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_users -> {
                            startActivity(Intent(this, AdminUsersActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_products -> {
                            startActivity(Intent(this, AdminProductsActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_profile -> true
                        else -> false
                    }
                }
            }
            "Vendedor" -> {
                binding.bottomNavigation.inflateMenu(R.menu.vendor_bottom_menu)
                binding.bottomNavigation.selectedItemId = R.id.navigation_profile
                binding.bottomNavigation.setOnItemSelectedListener { item ->
                    when (item.itemId) {
                        R.id.navigation_dashboard -> {
                            startActivity(Intent(this, VendorDashboardActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_products -> {
                            startActivity(Intent(this, VendorProductsActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_profile -> true
                        else -> false
                    }
                }
            }
            else -> {
                binding.bottomNavigation.inflateMenu(R.menu.buyer_bottom_menu)
                binding.bottomNavigation.selectedItemId = R.id.navigation_profile
                binding.bottomNavigation.setOnItemSelectedListener { item ->
                    when (item.itemId) {
                        R.id.navigation_home -> {
                            startActivity(Intent(this, BuyerHomeActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_catalog -> {
                            startActivity(Intent(this, BuyerCatalogActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_cart -> {
                            startActivity(Intent(this, CartActivity::class.java).addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION))
                            finish()
                            overridePendingTransition(0, 0)
                            true
                        }
                        R.id.navigation_profile -> true
                        else -> false
                    }
                }
            }
        }
    }
}
