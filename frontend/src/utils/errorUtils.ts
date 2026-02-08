/**
 * Tipo para errores de Firebase
 */
export interface FirebaseError extends Error {
  code?: string;
  customData?: unknown;
}

/**
 * Tipo para errores genéricos que pueden venir del backend
 */
export interface ApiError extends Error {
  statusCode?: number;
  code?: string;
  details?: unknown;
}

/**
 * Union type para todos los posibles errores
 */
export type AppError = FirebaseError | ApiError | Error;

/**
 * Extrae el mensaje de error de forma segura
 * @param error - Error capturado
 * @param fallbackMessage - Mensaje por defecto si no se puede extraer
 * @returns Mensaje de error legible
 */
export function getErrorMessage(error: unknown, fallbackMessage = 'Unknown error'): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message);
  }

  return fallbackMessage;
}

/**
 * Obtiene el código de error si está disponible
 * @param error - Error capturado
 * @returns Código de error o undefined
 */
export function getErrorCode(error: unknown): string | undefined {
  if (error && typeof error === 'object' && 'code' in error) {
    return String(error.code);
  }
  return undefined;
}

/**
 * Formatea un error completo con prefijo
 * @param error - Error capturado
 * @param prefix - Prefijo del mensaje (ej: "Error al cargar sesiones")
 * @returns Mensaje formateado
 */
export function formatError(error: unknown, prefix: string): string {
  const message = getErrorMessage(error);
  const code = getErrorCode(error);

  if (code) {
    return `${prefix}: [${code}] ${message}`;
  }

  return `${prefix}: ${message}`;
}
