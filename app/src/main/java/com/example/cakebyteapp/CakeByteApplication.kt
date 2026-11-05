package com.example.cakebyteapp

import android.app.Application
import androidx.appcompat.app.AppCompatDelegate
import dagger.hilt.android.HiltAndroidApp

@HiltAndroidApp
class CakeByteApplication : Application() {
    override fun onCreate() {
        super.onCreate()
        // Forzamos el modo claro
        AppCompatDelegate.setDefaultNightMode(AppCompatDelegate.MODE_NIGHT_NO)
    }
}