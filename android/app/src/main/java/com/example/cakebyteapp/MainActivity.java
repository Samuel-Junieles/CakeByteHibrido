package com.example.cakebyteapp;

import android.graphics.Color;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.view.View;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.annotation.NonNull;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowCompat;
import androidx.core.view.WindowInsetsCompat;
import androidx.core.view.WindowInsetsControllerCompat;
import androidx.credentials.Credential;
import androidx.credentials.CredentialManager;
import androidx.credentials.CredentialManagerCallback;
import androidx.credentials.CustomCredential;
import androidx.credentials.GetCredentialRequest;
import androidx.credentials.GetCredentialResponse;
import androidx.credentials.exceptions.GetCredentialException;
import com.getcapacitor.BridgeActivity;
import com.google.android.libraries.identity.googleid.GetGoogleIdOption;
import com.google.android.libraries.identity.googleid.GoogleIdTokenCredential;
import java.util.concurrent.Executor;

public class MainActivity extends BridgeActivity {

    private static final String GOOGLE_WEB_CLIENT_ID =
        "624129257670-97bu0r29hpasfuriqfautjqj655mo3kp.apps.googleusercontent.com";

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Configurar colores claros para barra de estado y barra de navegación
        getWindow().setStatusBarColor(Color.WHITE);
        getWindow().setNavigationBarColor(Color.WHITE);
        WindowInsetsControllerCompat controller = WindowCompat.getInsetsController(getWindow(), getWindow().getDecorView());
        if (controller != null) {
            controller.setAppearanceLightStatusBars(true);
            controller.setAppearanceLightNavigationBars(true);
        }

        // Respetar márgenes del sistema (barra de estado superior, cámara/cutout y barra inferior en Android 15+)
        View contentView = findViewById(android.R.id.content);
        if (contentView != null) {
            contentView.setBackgroundColor(Color.WHITE);
            ViewCompat.setOnApplyWindowInsetsListener(contentView, (v, windowInsets) -> {
                Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout()
                );
                v.setPadding(insets.left, insets.top, insets.right, insets.bottom);
                if (getBridge() != null && getBridge().getWebView() != null) {
                    getBridge().getWebView().post(() ->
                        getBridge().getWebView().evaluateJavascript(
                            "document.documentElement.classList.add('native-insets-applied');",
                            null
                        )
                    );
                }
                return WindowInsetsCompat.CONSUMED;
            });
        }

        // Registrar puente nativo para BiometricPrompt y Google CredentialManager (LoginActivity.kt)
        if (getBridge() != null && getBridge().getWebView() != null) {
            WebView webView = getBridge().getWebView();
            webView.addJavascriptInterface(new CakeByteNativeBridge(), "CakeByteNative");
        }
    }

    public class CakeByteNativeBridge {
        @JavascriptInterface
        public void authenticateBiometric() {
            runOnUiThread(() -> {
                Executor executor = ContextCompat.getMainExecutor(MainActivity.this);
                BiometricPrompt biometricPrompt = new BiometricPrompt(
                    MainActivity.this,
                    executor,
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationError(int errorCode, @NonNull CharSequence errString) {
                            super.onAuthenticationError(errorCode, errString);
                            dispatchBiometricEvent(false, errString.toString());
                        }

                        @Override
                        public void onAuthenticationSucceeded(@NonNull BiometricPrompt.AuthenticationResult result) {
                            super.onAuthenticationSucceeded(result);
                            dispatchBiometricEvent(true, "");
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            super.onAuthenticationFailed();
                        }
                    }
                );

                BiometricPrompt.PromptInfo promptInfo = new BiometricPrompt.PromptInfo.Builder()
                    .setTitle("Ingreso Rápido")
                    .setSubtitle("Usa tu huella para entrar a Cake Byte")
                    .setNegativeButtonText("Cancelar")
                    .build();

                biometricPrompt.authenticate(promptInfo);
            });
        }

        @JavascriptInterface
        public void signInWithGoogle() {
            runOnUiThread(() -> {
                try {
                    CredentialManager credentialManager = CredentialManager.create(MainActivity.this);

                    GetGoogleIdOption googleIdOption = new GetGoogleIdOption.Builder()
                        .setFilterByAuthorizedAccounts(false)
                        .setServerClientId(GOOGLE_WEB_CLIENT_ID)
                        .setAutoSelectEnabled(true)
                        .build();

                    GetCredentialRequest request = new GetCredentialRequest.Builder()
                        .addCredentialOption(googleIdOption)
                        .build();

                    Executor executor = ContextCompat.getMainExecutor(MainActivity.this);
                    credentialManager.getCredentialAsync(
                        MainActivity.this,
                        request,
                        new CancellationSignal(),
                        executor,
                        new CredentialManagerCallback<GetCredentialResponse, GetCredentialException>() {
                            @Override
                            public void onResult(GetCredentialResponse result) {
                                Credential credential = result.getCredential();
                                if (GoogleIdTokenCredential.TYPE_GOOGLE_ID_TOKEN_CREDENTIAL.equals(credential.getType())) {
                                    try {
                                        GoogleIdTokenCredential googleIdTokenCredential =
                                            GoogleIdTokenCredential.createFrom(credential.getData());
                                        dispatchGoogleEvent(true, googleIdTokenCredential.getIdToken(), "");
                                    } catch (Exception ex) {
                                        dispatchGoogleEvent(false, "", "Error al leer credencial de Google: " + ex.getLocalizedMessage());
                                    }
                                } else {
                                    dispatchGoogleEvent(false, "", "Tipo de cuenta no soportado: " + credential.getType());
                                }
                            }

                            @Override
                            public void onError(@NonNull GetCredentialException e) {
                                dispatchGoogleEvent(false, "", "Error al obtener cuenta: " + e.getLocalizedMessage());
                            }
                        }
                    );
                } catch (Exception e) {
                    dispatchGoogleEvent(false, "", "Error al iniciar Google Sign-In: " + e.getLocalizedMessage());
                }
            });
        }
    }

    private void dispatchBiometricEvent(boolean success, String message) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String safeMsg = message == null ? "" : message.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
        String js = "window.dispatchEvent(new CustomEvent('cakebyte-biometric-result', { detail: { success: "
            + success + ", message: '" + safeMsg + "' } }));";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
    }

    private void dispatchGoogleEvent(boolean success, String idToken, String message) {
        if (getBridge() == null || getBridge().getWebView() == null) return;
        String safeToken = idToken == null ? "" : idToken.replace("\\", "\\\\").replace("'", "\\'").replace("\n", "");
        String safeMsg = message == null ? "" : message.replace("\\", "\\\\").replace("'", "\\'").replace("\n", " ");
        String js = "window.dispatchEvent(new CustomEvent('cakebyte-google-result', { detail: { success: "
            + success + ", idToken: '" + safeToken + "', message: '" + safeMsg + "' } }));";
        getBridge().getWebView().post(() -> getBridge().getWebView().evaluateJavascript(js, null));
    }
}
