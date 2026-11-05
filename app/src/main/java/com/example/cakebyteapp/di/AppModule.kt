package com.example.cakebyteapp.di

import com.example.cakebyteapp.data.remote.SupabaseClient
import com.example.cakebyteapp.data.repository.AuthRepositoryImpl
import com.example.cakebyteapp.data.repository.CartRepositoryImpl
import com.example.cakebyteapp.data.repository.OrderRepositoryImpl
import com.example.cakebyteapp.data.repository.ProductRepositoryImpl
import com.example.cakebyteapp.domain.repository.AuthRepository
import com.example.cakebyteapp.domain.repository.CartRepository
import com.example.cakebyteapp.domain.repository.OrderRepository
import com.example.cakebyteapp.domain.repository.ProductRepository
import dagger.Module
import dagger.Provides
import dagger.hilt.InstallIn
import dagger.hilt.components.SingletonComponent
import io.github.jan.supabase.SupabaseClient as JanSupabaseClient
import javax.inject.Singleton

@Module
@InstallIn(SingletonComponent::class)
object AppModule {

    @Provides
    @Singleton
    fun provideSupabaseClient(): JanSupabaseClient {
        return SupabaseClient.client
    }

    @Provides
    @Singleton
    fun provideAuthRepository(client: JanSupabaseClient): AuthRepository {
        return AuthRepositoryImpl(client)
    }

    @Provides
    @Singleton
    fun provideProductRepository(client: JanSupabaseClient): ProductRepository {
        return ProductRepositoryImpl(client)
    }

    @Provides
    @Singleton
    fun provideCartRepository(client: JanSupabaseClient): CartRepository {
        return CartRepositoryImpl(client)
    }

    @Provides
    @Singleton
    fun provideOrderRepository(client: JanSupabaseClient): OrderRepository {
        return OrderRepositoryImpl(client)
    }
}
