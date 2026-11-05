package com.example.cakebyteapp

import android.content.Intent
import android.os.Bundle
import android.view.View
import android.widget.Toast
import androidx.activity.viewModels
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.AppCompatDelegate
import androidx.biometric.BiometricPrompt
import androidx.credentials.CredentialManager
import androidx.credentials.GetCredentialRequest
import com.google.android.libraries.identity.googleid.GetGoogleIdOption
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential
import androidx.core.content.ContextCompat
import androidx.lifecycle.lifecycleScope
import com.example.cakebyteapp.databinding.ActivityLoginBinding
import com.example.cakebyteapp.presentation.login.LoginState
import com.example.cakebyteapp.presentation.login.LoginViewModel
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.launch

@AndroidEntryPoint
class LoginActivity : AppCompatActivity() {

    private lateinit var binding: ActivityLoginBinding
    private val viewModel: LoginViewModel by viewModels()

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityLoginBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupListeners()
        observeState()
        viewModel.checkBiometricAvailability()
    }

    private fun setupListeners() {
        binding.tvGoToRegister.setOnClickListener {
            startActivity(Intent(this, RegisterActivity::class.java))
        }

        binding.btnLogin.setOnClickListener {
            val email = binding.etEmail.text.toString()
            val pass = binding.etPassword.text.toString()
            viewModel.login(email, pass)
        }

        binding.btnGoogle.setOnClickListener {
            signInWithGoogle()
        }

        binding.btnBiometric.setOnClickListener {
            showBiometricPrompt()
        }

        binding.tvForgotPassword.setOnClickListener {
            startActivity(Intent(this, com.example.cakebyteapp.presentation.login.ForgotPasswordActivity::class.java))
        }
    }

    private fun observeState() {
        lifecycleScope.launch {
            viewModel.state.collect { state ->
                when (state) {
                    is LoginState.Loading -> {
                        binding.btnLogin.isEnabled = false
                        binding.progressBar.visibility = View.VISIBLE
                    }
                    is LoginState.Success -> {
                        binding.btnLogin.isEnabled = true
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@LoginActivity, "Bienvenido: ${state.role}", Toast.LENGTH_SHORT).show()
                        
                        if (state.role == "Admin") {
                            startActivity(Intent(this@LoginActivity, AdminDashboardActivity::class.java))
                            finish()
                        } else if (state.role == "Vendedor") {
                            startActivity(Intent(this@LoginActivity, VendorDashboardActivity::class.java))
                            finish()
                        } else if (state.role == "Comprador") {
                            startActivity(Intent(this@LoginActivity, com.example.cakebyteapp.presentation.buyer.BuyerHomeActivity::class.java))
                            finish()
                        } else {
                            startActivity(Intent(this@LoginActivity, com.example.cakebyteapp.presentation.buyer.BuyerHomeActivity::class.java))
                            finish()
                        }
                    }
                    is LoginState.Error -> {
                        binding.btnLogin.isEnabled = true
                        binding.progressBar.visibility = View.GONE
                        Toast.makeText(this@LoginActivity, state.message, Toast.LENGTH_LONG).show()
                    }
                    is LoginState.BiometricReady -> {
                        binding.btnBiometric.visibility = View.VISIBLE
                    }
                    else -> {
                        binding.btnLogin.isEnabled = true
                        binding.progressBar.visibility = View.GONE
                    }
                }
            }
        }
    }

    private fun showBiometricPrompt() {
        val executor = ContextCompat.getMainExecutor(this)
        val biometricPrompt = BiometricPrompt(this, executor,
            object : BiometricPrompt.AuthenticationCallback() {
                override fun onAuthenticationError(errorCode: Int, errString: CharSequence) {
                    super.onAuthenticationError(errorCode, errString)
                    Toast.makeText(applicationContext, "Error: $errString", Toast.LENGTH_SHORT).show()
                }

                override fun onAuthenticationSucceeded(result: BiometricPrompt.AuthenticationResult) {
                    super.onAuthenticationSucceeded(result)
                    viewModel.loginWithBiometric()
                }

                override fun onAuthenticationFailed() {
                    super.onAuthenticationFailed()
                    Toast.makeText(applicationContext, "Autenticación fallida", Toast.LENGTH_SHORT).show()
                }
            })

        val promptInfo = BiometricPrompt.PromptInfo.Builder()
            .setTitle("Ingreso Rápido")
            .setSubtitle("Usa tu huella para entrar a Cake Byte")
            .setNegativeButtonText("Cancelar")
            .build()

        biometricPrompt.authenticate(promptInfo)
    }

    private fun signInWithGoogle() {
        val credentialManager = CredentialManager.create(this)

        val googleIdOption: GetGoogleIdOption = GetGoogleIdOption.Builder()
            .setFilterByAuthorizedAccounts(false)
            .setServerClientId("624129257670-97bu0r29hpasfuriqfautjqj655mo3kp.apps.googleusercontent.com")
            .setAutoSelectEnabled(true)
            .build()

        val request = GetCredentialRequest.Builder()
            .addCredentialOption(googleIdOption)
            .build()

        lifecycleScope.launch {
            try {
                val result = credentialManager.getCredential(
                    context = this@LoginActivity,
                    request = request
                )
                val credential = result.credential
                
                // Extraemos el ID Token de manera robusta
                if (credential.type == GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL) {
                    val googleIdTokenCredential = GoogleIdTokenCredential.createFrom(credential.data)
                    viewModel.loginWithGoogle(googleIdTokenCredential.idToken)
                } else {
                    Toast.makeText(this@LoginActivity, "Tipo de cuenta no soportado: ${credential.type}", Toast.LENGTH_SHORT).show()
                }
            } catch (e: Exception) {
                // Captura errores como cancelación del usuario o problemas de red
                Toast.makeText(this@LoginActivity, "Error al obtener cuenta: ${e.localizedMessage}", Toast.LENGTH_SHORT).show()
            }
        }
    }
}
