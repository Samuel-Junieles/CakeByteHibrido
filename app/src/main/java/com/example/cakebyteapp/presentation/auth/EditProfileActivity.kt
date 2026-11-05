package com.example.cakebyteapp.presentation.auth

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.cakebyteapp.databinding.ActivityEditProfileBinding
import com.example.cakebyteapp.domain.repository.AuthRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import javax.inject.Inject

@AndroidEntryPoint
class EditProfileActivity : AppCompatActivity() {

    private lateinit var binding: ActivityEditProfileBinding
    
    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityEditProfileBinding.inflate(layoutInflater)
        setContentView(binding.root)

        loadUserData()
        
        binding.btnBack.setOnClickListener { finish() }
        binding.btnSave.setOnClickListener {
            saveChanges()
        }
    }

    private fun loadUserData() {
        lifecycleScope.launch {
            val user = authRepository.getCurrentUser().first()
            user?.let {
                binding.etName.setText(it.name)
                binding.etEmail.setText(it.email)
                binding.etAddress.setText(it.address)
                binding.etPhone.setText(it.phone)
            }
        }
    }

    private fun saveChanges() {
        val newName = binding.etName.text.toString()
        val newAddress = binding.etAddress.text.toString()
        val newPhone = binding.etPhone.text.toString()
        
        if (newName.isBlank()) {
            Toast.makeText(this, "El nombre no puede estar vacío", Toast.LENGTH_SHORT).show()
            return
        }

        lifecycleScope.launch {
            val user = authRepository.getCurrentUser().first()
            user?.let {
                val updatedUser = it.copy(
                    name = newName,
                    address = newAddress,
                    phone = newPhone
                )
                authRepository.updateUser(updatedUser)
                Toast.makeText(this@EditProfileActivity, "Perfil actualizado con éxito", Toast.LENGTH_SHORT).show()
                finish()
            }
        }
    }
}
