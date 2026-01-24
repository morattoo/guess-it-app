import { initializeAppCheck, ReCaptchaV3Provider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

// Para desarrollo/testing, puedes habilitar debug mode
// descomentar esto en desarrollo y agregar el token que aparece en la consola a Firebase Console
if (import.meta.env.DEV) {
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true;
}

let appCheckInstance: AppCheck | null = null;

// Inicializar App Check con ReCAPTCHA v3
// En desarrollo, puedes usar el debug token
export function initAppCheck(app: FirebaseApp): AppCheck {
  if (!appCheckInstance) {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaV3Provider(import.meta.env.VITE_RECAPTCHA_SITE_KEY),

      // En desarrollo, permite usar debug tokens
      // Configura esto en Firebase Console -> App Check -> Debug tokens
      isTokenAutoRefreshEnabled: true,
    });
  }
  return appCheckInstance;
}

export const getAppCheck = (): AppCheck | null => appCheckInstance;
