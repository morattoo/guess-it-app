import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

// DIAGNÓSTICO: Mostrar configuración en todas las builds
console.log('🔍 App Check Configuration:', {
  recaptchaKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  isDev: import.meta.env.DEV,
  mode: import.meta.env.MODE,
  hasKey: !!import.meta.env.VITE_RECAPTCHA_SITE_KEY,
});

// Para desarrollo/testing, puedes habilitar debug mode
// descomentar esto en desarrollo y agregar el token que aparece en la consola a Firebase Console
if (import.meta.env.DEV) {
  const debugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true;
  console.log('🔍 App Check Debug Mode:', {
    isDev: import.meta.env.DEV,
    debugToken: debugToken,
    recaptchaKey: import.meta.env.VITE_RECAPTCHA_SITE_KEY,
  });
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

let appCheckInstance: AppCheck | null = null;

// Inicializar App Check con ReCAPTCHA v3
// En desarrollo, puedes usar el debug token
export function initAppCheck(app: FirebaseApp): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  // Validar que exista la clave de reCAPTCHA
  if (!recaptchaKey) {
    console.error('❌ VITE_RECAPTCHA_SITE_KEY no está configurado');
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(recaptchaKey),
      // En desarrollo, permite usar debug tokens
      // Configura esto en Firebase Console -> App Check -> Debug tokens
      isTokenAutoRefreshEnabled: true,
    });

    console.log('✅ App Check inicializado correctamente');
    return appCheckInstance;
  } catch (error) {
    console.error('❌ Error al inicializar App Check:', error);
    return null;
  }
}

export const getAppCheck = (): AppCheck | null => appCheckInstance;
