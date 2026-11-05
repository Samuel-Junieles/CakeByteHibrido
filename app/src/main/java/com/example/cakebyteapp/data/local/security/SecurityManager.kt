package com.example.cakebyteapp.data.local.security

import android.content.Context
import android.content.SharedPreferences
import androidx.security.crypto.EncryptedSharedPreferences
import androidx.security.crypto.MasterKey
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SecurityManager @Inject constructor(@ApplicationContext private val context: Context) {

    private val fileName = "secure_prefs"
    private var sharedPreferences: SharedPreferences? = null

    init {
        initPrefs()
    }

    private fun initPrefs() {
        try {
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            sharedPreferences = EncryptedSharedPreferences.create(
                context,
                fileName,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        } catch (e: Exception) {
            // Error de Keystore (AEADBadTagException u otros). 
            // La solución técnica es borrar los prefs corruptos y reintentar.
            context.getSharedPreferences(fileName, Context.MODE_PRIVATE).edit().clear().apply()
            
            val masterKey = MasterKey.Builder(context)
                .setKeyScheme(MasterKey.KeyScheme.AES256_GCM)
                .build()

            sharedPreferences = EncryptedSharedPreferences.create(
                context,
                fileName,
                masterKey,
                EncryptedSharedPreferences.PrefKeyEncryptionScheme.AES256_SIV,
                EncryptedSharedPreferences.PrefValueEncryptionScheme.AES256_GCM
            )
        }
    }

    fun saveCredentials(email: String, pass: String) {
        sharedPreferences?.edit()?.apply {
            putString("email", email)
            putString("pass", pass)
            apply()
        }
    }

    fun getSavedEmail(): String? = sharedPreferences?.getString("email", null)
    fun getSavedPass(): String? = sharedPreferences?.getString("pass", null)
}
