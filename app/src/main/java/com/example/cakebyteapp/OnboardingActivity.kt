package com.example.cakebyteapp

import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import androidx.recyclerview.widget.RecyclerView
import com.example.cakebyteapp.databinding.ActivityOnboardingBinding
import com.example.cakebyteapp.databinding.ItemOnboardingBinding
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint
class OnboardingActivity : AppCompatActivity() {

    private lateinit var binding: ActivityOnboardingBinding

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        binding = ActivityOnboardingBinding.inflate(layoutInflater)
        setContentView(binding.root)

        val onboardingItems = listOf(
            OnboardingItem(
                R.drawable.onboarding_1,
                getString(R.string.title_onboarding_1),
                getString(R.string.desc_onboarding_1)
            ),
            OnboardingItem(
                R.drawable.onboarding_2,
                getString(R.string.title_onboarding_2),
                getString(R.string.desc_onboarding_2)
            ),
            OnboardingItem(
                R.drawable.onboarding_3,
                getString(R.string.title_onboarding_3),
                getString(R.string.desc_onboarding_3)
            )
        )

        binding.viewPager.adapter = OnboardingAdapter(onboardingItems, {
            // Acción al hacer clic en "Empieza a comprar"
            val intent = android.content.Intent(this, LoginActivity::class.java)
            startActivity(intent)
            finish()
        }, { direction ->
            // direction: -1 para atrás, 1 para adelante
            val currentItem = binding.viewPager.currentItem
            val nextItem = currentItem + direction
            if (nextItem in 0 until onboardingItems.size) {
                binding.viewPager.setCurrentItem(nextItem, false)
            }
        })

        // Deshabilitar el deslizamiento manual (swipe)
        binding.viewPager.isUserInputEnabled = false
    }

    data class OnboardingItem(val image: Int, val title: String, val description: String)

    class OnboardingAdapter(
        private val items: List<OnboardingItem>,
        private val onStartClick: () -> Unit,
        private val onNavigate: (Int) -> Unit
    ) : RecyclerView.Adapter<OnboardingAdapter.OnboardingViewHolder>() {

        inner class OnboardingViewHolder(val binding: ItemOnboardingBinding) :
            RecyclerView.ViewHolder(binding.root)

        override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OnboardingViewHolder {
            val binding = ItemOnboardingBinding.inflate(
                LayoutInflater.from(parent.context),
                parent,
                false
            )
            return OnboardingViewHolder(binding)
        }

        override fun onBindViewHolder(holder: OnboardingViewHolder, position: Int) {
            val item = items[position]
            holder.binding.ivOnboarding.setImageResource(item.image)
            holder.binding.tvTitle.text = item.title
            holder.binding.tvDescription.text = item.description

            // Detectar toque en la mitad izquierda o derecha
            holder.binding.root.setOnClickListener { view ->
                // No navegamos si se toca el botón (el botón tiene su propio listener)
                // Pero como el root es el padre, necesitamos verificar la posición
            }
            
            // Usaremos un touch listener para mayor precisión
            holder.binding.root.setOnTouchListener { v, event ->
                if (event.action == android.view.MotionEvent.ACTION_UP) {
                    val width = v.width
                    val x = event.x
                    if (x < width / 2) {
                        onNavigate(-1) // Izquierda -> Atrás
                    } else {
                        onNavigate(1)  // Derecha -> Adelante
                    }
                    v.performClick()
                }
                true
            }

            // Mostrar botón solo en la última pantalla
            if (position == items.size - 1) {
                holder.binding.btnStart.visibility = View.VISIBLE
                // IMPORTANTE: El botón debe estar encima para recibir el clic
                holder.binding.btnStart.setOnTouchListener { _, _ -> false } // Dejar que el botón maneje su toque
                holder.binding.btnStart.setOnClickListener { onStartClick() }
            } else {
                holder.binding.btnStart.visibility = View.GONE
            }

            // Update indicators
            val activeColor = ContextCompat.getColor(holder.binding.root.context, R.color.salmon_primary)
            val inactiveColor = ContextCompat.getColor(holder.binding.root.context, R.color.indicator_inactive)
            
            holder.binding.indicator1.setBackgroundColor(if (position == 0) activeColor else inactiveColor)
            holder.binding.indicator2.setBackgroundColor(if (position == 1) activeColor else inactiveColor)
            holder.binding.indicator3.setBackgroundColor(if (position == 2) activeColor else inactiveColor)
        }

        override fun getItemCount(): Int = items.size
    }
}