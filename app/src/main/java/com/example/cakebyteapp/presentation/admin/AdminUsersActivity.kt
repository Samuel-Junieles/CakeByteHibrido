package com.example.cakebyteapp.presentation.admin

import android.content.Intent
import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AlertDialog
import androidx.appcompat.app.AppCompatActivity
import androidx.biometric.BiometricPrompt
import androidx.core.content.ContextCompat
import androidx.core.widget.addTextChangedListener
import androidx.lifecycle.Lifecycle
import androidx.lifecycle.lifecycleScope
import androidx.lifecycle.repeatOnLifecycle
import androidx.recyclerview.widget.LinearLayoutManager
import com.example.cakebyteapp.AdminDashboardActivity
import com.example.cakebyteapp.R
import com.example.cakebyteapp.data.local.entity.UserEntity
import com.example.cakebyteapp.databinding.ActivityAdminUsersBinding
import com.example.cakebyteapp.presentation.auth.UserProfileActivity
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class AdminUsersActivity : AppCompatActivity() {

    private lateinit var binding: ActivityAdminUsersBinding
    private val viewModel: UsersViewModel by viewModels()
    private lateinit var adapter: UserAdapter

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityAdminUsersBinding.inflate(layoutInflater)
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
        adapter = UserAdapter(
            onEdit = { user -> 
                val intent = Intent(this, CreateUserActivity::class.java)
                intent.putExtra("USER_EMAIL", user.email)
                startActivity(intent)
            },
            onDelete = { user -> showDeleteConfirmation(user) }
        )
        binding.rvUsers.apply {
            layoutManager = LinearLayoutManager(this@AdminUsersActivity)
            adapter = this@AdminUsersActivity.adapter
        }
    }

    private fun showDeleteConfirmation(user: UserEntity) {
        AlertDialog.Builder(this)
            .setTitle("Eliminar Usuario")
            .setMessage("¿Estás seguro de que deseas eliminar a ${user.name}? Esta acción no se puede deshacer.")
            .setPositiveButton("Eliminar") { _, _ ->
                showDeleteAuthPrompt(user)
            }
            .setNegativeButton("Cancelar", null)
            .show()
    }

    private fun showDeleteAuthPrompt(user: UserEntity) {
        val executor = ContextCompat.getMainExecutor(this)
        val biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    viewModel.deleteUser(user)
                    Toast.makeText(this@AdminUsersActivity, "Usuario eliminado", Toast.LENGTH_SHORT).show()
                }

                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    Toast.makeText(this@AdminUsersActivity, "Autenticación requerida para eliminar", Toast.LENGTH_SHORT).show()
                }
            })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Autorización requerida")
            .setSubtitle("Confirma tu identidad para eliminar al usuario")
            .setAllowedAuthenticators(androidx.biometric.BiometricManager.Authenticators.BIOMETRIC_STRONG or androidx.biometric.BiometricManager.Authenticators.DEVICE_CREDENTIAL)
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    private fun setupListeners() {
        binding.etSearch.addTextChangedListener { text ->
            viewModel.onSearchQueryChanged(text?.toString() ?: "")
        }

        binding.cgFilters.setOnCheckedStateChangeListener { _, checkedIds ->
            val role = when (checkedIds.firstOrNull()) {
                R.id.chipAdmin -> "Admin"
                R.id.chipVendor -> "Vendedor"
                R.id.chipBuyer -> "Comprador"
                else -> "Todos"
            }
            viewModel.onRoleFilterChanged(role)
        }

        binding.bottomNavigation.selectedItemId = R.id.navigation_users
        binding.bottomNavigation.setOnItemSelectedListener { item ->
            when (item.itemId) {
                R.id.navigation_dashboard -> {
                    val intent = Intent(this, AdminDashboardActivity::class.java)
                    intent.addFlags(Intent.FLAG_ACTIVITY_NO_ANIMATION)
                    startActivity(intent)
                    finish()
                    overridePendingTransition(0, 0)
                    true
                }
                R.id.navigation_users -> true
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

        binding.fabAddUser.setOnClickListener {
            startActivity(Intent(this, CreateUserActivity::class.java))
        }
    }

    private fun observeViewModel() {
        lifecycleScope.launch {
            repeatOnLifecycle(Lifecycle.State.STARTED) {
                viewModel.users.collect { userList ->
                    adapter.submitList(userList)
                }
            }
        }
    }
}
