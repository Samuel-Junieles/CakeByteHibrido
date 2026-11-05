package com.example.cakebyteapp.data.remote

import io.github.jan.supabase.auth.Auth
import io.github.jan.supabase.createSupabaseClient
import io.github.jan.supabase.postgrest.Postgrest

object SupabaseClient {
    private const val SUPABASE_URL = "https://lmejrryaroqniwemjgry.supabase.co"
    private const val SUPABASE_KEY = "sb_publishable_CjcbWfZJUJt3s2mgxo43rQ_7nkGuk6w"

    val client = createSupabaseClient(
        supabaseUrl = SUPABASE_URL,
        supabaseKey = SUPABASE_KEY
    ) {
        install(Postgrest)
        install(Auth)
    }
}
