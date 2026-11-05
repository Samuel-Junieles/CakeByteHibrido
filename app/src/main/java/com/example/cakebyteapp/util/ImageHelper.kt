package com.example.cakebyteapp.util

import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import android.net.Uri
import android.util.Base64
import android.widget.ImageView
import com.example.cakebyteapp.R
import java.io.ByteArrayOutputStream

object ImageHelper {

    fun bitmapToDataUrl(bitmap: Bitmap, maxDim: Int = 512): String {
        val ratio = minOf(maxDim.toFloat() / bitmap.width, maxDim.toFloat() / bitmap.height, 1f)
        val scaled = if (ratio < 1f) {
            Bitmap.createScaledBitmap(
                bitmap,
                (bitmap.width * ratio).toInt().coerceAtLeast(1),
                (bitmap.height * ratio).toInt().coerceAtLeast(1),
                true
            )
        } else {
            bitmap
        }
        val out = ByteArrayOutputStream()
        scaled.compress(Bitmap.CompressFormat.JPEG, 80, out)
        val base64 = Base64.encodeToString(out.toByteArray(), Base64.NO_WRAP)
        return "data:image/jpeg;base64,$base64"
    }

    fun uriToDataUrl(context: Context, uri: Uri): String? {
        return try {
            context.contentResolver.openInputStream(uri)?.use { stream ->
                val bmp = BitmapFactory.decodeStream(stream) ?: return null
                bitmapToDataUrl(bmp)
            }
        } catch (e: Exception) {
            null
        }
    }

    fun bindProductImage(imageView: ImageView, imageUrl: String?, fallbackRes: Int = R.drawable.torta_de_chocolate) {
        val raw = imageUrl?.trim() ?: ""
        if (raw.isEmpty()) {
            imageView.setImageResource(fallbackRes)
            return
        }

        if (raw.startsWith("data:image")) {
            val comma = raw.indexOf(',')
            if (comma != -1) {
                try {
                    val bytes = Base64.decode(raw.substring(comma + 1), Base64.DEFAULT)
                    val bmp = BitmapFactory.decodeByteArray(bytes, 0, bytes.size)
                    if (bmp != null) {
                        imageView.setImageBitmap(bmp)
                        return
                    }
                } catch (_: Exception) {
                }
            }
        }

        val context = imageView.context
        val cleanName = raw.removePrefix("assets/images/").removeSuffix(".png").removeSuffix(".jpg")
        val resId = context.resources.getIdentifier(cleanName, "drawable", context.packageName)
        if (resId != 0) {
            imageView.setImageResource(resId)
        } else {
            imageView.setImageResource(fallbackRes)
        }
    }

    fun saveUserAvatar(context: Context, email: String, dataUrl: String) {
        context.getSharedPreferences("cakebyte_avatars", Context.MODE_PRIVATE)
            .edit()
            .putString(email.lowercase(), dataUrl)
            .apply()
    }

    fun loadUserAvatar(context: Context, email: String): String? {
        return context.getSharedPreferences("cakebyte_avatars", Context.MODE_PRIVATE)
            .getString(email.lowercase(), null)
    }
}

