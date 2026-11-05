package com.example.cakebyteapp

import android.os.Bundle
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.lifecycle.lifecycleScope
import com.example.cakebyteapp.databinding.ActivityRegisterBinding
import com.example.cakebyteapp.presentation.register.RegisterState
import com.example.cakebyteapp.presentation.register.RegisterViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class RegisterActivity : AppCompatActivity() {

    private lateinit var binding: ActivityRegisterBinding
    private val viewModel: RegisterViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
        binding = ActivityRegisterBinding.inflate(layoutInflater)
        setContentView(binding.root)

        observeState()

        binding.tvGoToLogin.setOnClickListener { finish() }

        binding.btnSignup.setOnClickListener {
            val nombres = binding.etFullName.text.toString()
            val apellidos = binding.etSurname.text.toString()
            val email = binding.etEmail.text.toString()
            val pass = binding.etPassword.text.toString()
            val confirmPass = binding.etConfirmPassword.text.toString()
            val termsAccepted = binding.cbTerms.isChecked
            val defaultRole = "Comprador"

            if (nombres.isBlank() || apellidos.isBlank() || email.isBlank() || pass.isBlank()) {
                Toast.makeText(this, "Por favor completa todos los campos", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (pass != confirmPass) {
                Toast.makeText(this, "Las contraseñas no coinciden", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            if (!termsAccepted) {
                Toast.makeText(this, "Debes aceptar los términos y condiciones", Toast.LENGTH_SHORT).show()
                return@setOnClickListener
            }

            // Unimos nombres y apellidos para el registro actual que espera un string 'name'
            viewModel.register(email, pass, "$nombres $apellidos", defaultRole)
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.state.collect { state ->
                when (state) {
                    is RegisterState.Loading -> binding.btnSignup.isEnabled = false
                    is RegisterState.Success -> {
                        Toast.makeText(this@RegisterActivity, "¡Cuenta creada con éxito!", Toast.LENGTH_SHORT).show()
                        finish()
                    }
                    is RegisterState.Error -> {
                        binding.btnSignup.isEnabled = true
                        Toast.makeText(this@RegisterActivity, state.message, Toast.LENGTH_LONG).show()
                    }
                    else -> binding.btnSignup.isEnabled = true
                }
            }
        }
    }
}
