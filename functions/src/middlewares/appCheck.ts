import { Request, Response, NextFunction } from "express";
import { getAppCheck } from "firebase-admin/app-check";

/**
 * Middleware para verificar App Check token
 * Protege las Cloud Functions de solicitudes no autorizadas
 */
export const appCheckMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  // TEMPORAL: Deshabilitado mientras se configura en Firebase Console
  console.warn(
    "⚠️ App Check validation temporarily disabled - Configuring reCAPTCHA",
  );
  return next();

  /* Habilitar después de registrar la app en Firebase App Check:
  const appCheckToken = req.header("X-Firebase-AppCheck");

  if (!appCheckToken) {
    return res.status(401).send("Unauthorized: Missing App Check token");
  }

  try {
    await getAppCheck().verifyToken(appCheckToken);
    next();
  } catch (error) {
    console.error("Error verifying App Check token:", error);
    return res.status(401).send("Unauthorized: Invalid App Check token");
  }
  */
};
