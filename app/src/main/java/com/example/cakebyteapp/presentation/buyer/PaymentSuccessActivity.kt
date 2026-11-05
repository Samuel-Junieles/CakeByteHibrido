package com.example.cakebyteapp.presentation.buyer

import android.content.Intent
import android.os.Bundle
import androidx.appcompat.app.AppCompatActivity
import androidx.lifecycle.lifecycleScope
import com.example.cakebyteapp.R
import com.example.cakebyteapp.databinding.ActivityPaymentSuccessBinding
import com.example.cakebyteapp.domain.repository.AuthRepository
import dagger.hilt.android.AndroidEntryPoint
import kotlinx.coroutines.flow.first
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.*
import javax.inject.Inject

@AndroidEntryPoint
class PaymentSuccessActivity : AppCompatActivity() {

    private lateinit var binding: ActivityPaymentSuccessBinding

    @Inject
    lateinit var authRepository: AuthRepository

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityPaymentSuccessBinding.inflate(layoutInflater)
        setContentView(binding.root)

        setupReceipt()
        setupListeners()
        loadUserData()
    }

    private fun loadUserData() {
        lifecycleScope.launch {
            val user = authRepository.getCurrentUser().first()
            user?.let {
                binding.tvTitle.text = "Gracias por tu compra, ${it.name}"
            }
        }
    }

    private fun setupReceipt() {
        val now = Calendar.getInstance().time
        val dateFormat = SimpleDateFormat("dd 'de' MMMM", Locale("es", "CO"))
        val timeFormat = SimpleDateFormat("HH:mm", Locale("es", "CO"))

        binding.rowStatus.tvLabel.text = getString(R.string.label_transaction_status)
        binding.rowStatus.tvValue.text = "Exitosa"
        binding.rowStatus.tvValue.setTextColor(getColor(R.color.text_green))

        binding.rowMerchant.tvLabel.text = getString(R.string.label_merchant)
        binding.rowMerchant.tvValue.text = "CakeByte Bakery"

        binding.rowDate.tvLabel.text = getString(R.string.label_payment_date)
        binding.rowDate.tvValue.text = dateFormat.format(now)

        binding.rowTime.tvLabel.text = getString(R.string.label_payment_time)
        binding.rowTime.tvValue.text = timeFormat.format(now)

        binding.rowId.tvLabel.text = getString(R.string.label_transaction_id)
        binding.rowId.tvValue.text = "#${System.currentTimeMillis().toString().takeLast(10)}"

        binding.rowConcept.tvLabel.text = getString(R.string.label_concept)
        binding.rowConcept.tvValue.text = "Pedido CakeByte"
    }

    private fun setupListeners() {
        binding.btnBackHome.setOnClickListener {
            val intent = Intent(this, BuyerHomeActivity::class.java)
            intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
            startActivity(intent)
            finish()
        }
    }
}
