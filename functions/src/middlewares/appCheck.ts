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
  // En desarrollo, puedes comentar esto para facilitar las pruebas
  const appCheckToken = req.header("X-Firebase-AppCheck");

  if (!appCheckToken) {
    return res.status(401).send("Unauthorized: Missing App Check token");
  }

  try {
    // Verificar el token de App Check
    await getAppCheck().verifyToken(appCheckToken);

    // Token válido, continuar
    next();
  } catch (error) {
    console.error("Error verifying App Check token:", error);
    return res.status(401).send("Unauthorized: Invalid App Check token");
  }
};
