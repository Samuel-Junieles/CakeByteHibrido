package com.example.cakebyteapp.presentation.login

import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import com.example.cakebyteapp.databinding.ActivityForgotPasswordBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class ForgotPasswordActivity : AppCompatActivity() {

    private lateinit var binding: ActivityForgotPasswordBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityForgotPasswordBinding.inflate(layoutInflater)
        setContentView(binding.root)

        binding.btnBack.setOnClickListener { finish() }
        
        binding.btnRecover.setOnClickListener {
            val email = binding.etEmail.text.toString()
            if (email.isNotBlank()) {
                Toast.makeText(this, "Enlace enviado a $email", Toast.LENGTH_LONG).show()
                finish()
            } else {
                Toast.makeText(this, "Por favor ingresa tu correo", Toast.LENGTH_SHORT).show()
            }
        }
    }
}