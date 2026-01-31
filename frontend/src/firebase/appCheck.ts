import { initializeAppCheck, ReCaptchaEnterpriseProvider, type AppCheck } from 'firebase/app-check';
import type { FirebaseApp } from 'firebase/app';

// Habilitar debug token en desarrollo
if (import.meta.env.DEV) {
  const debugToken = import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN || true;
  // @ts-ignore
  self.FIREBASE_APPCHECK_DEBUG_TOKEN = debugToken;
}

let appCheckInstance: AppCheck | null = null;

/**
 * Inicializa App Check con reCAPTCHA Enterprise
 *
 * @param app - Instancia de Firebase App
 * @returns Instancia de App Check o null si hay error
 */
export function initAppCheck(app: FirebaseApp): AppCheck | null {
  if (appCheckInstance) {
    return appCheckInstance;
  }

  const recaptchaKey = import.meta.env.VITE_RECAPTCHA_SITE_KEY;

  if (!recaptchaKey || recaptchaKey === 'REEMPLAZAR_CON_TU_RECAPTCHA_SITE_KEY') {
    if (import.meta.env.DEV && import.meta.env.VITE_APP_CHECK_DEBUG_TOKEN) {
      return null;
    }

    console.error('App Check: VITE_RECAPTCHA_SITE_KEY no está configurado');
    return null;
  }

  try {
    appCheckInstance = initializeAppCheck(app, {
      provider: new ReCaptchaEnterpriseProvider(recaptchaKey),
      isTokenAutoRefreshEnabled: true,
    });

    return appCheckInstance;
  } catch (error) {
    console.error('App Check: Error al inicializar', error);
    return null;
  }
}

export const getAppCheck = (): AppCheck | null => appCheckInstance;
