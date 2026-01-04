/**
 * Firebase Functions v2 - TypeScript
 */

import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import * as logger from "firebase-functions/logger";

// Opciones globales para control de costos
setGlobalOptions({
  maxInstances: 10,
});

// Ejemplo de función HTTP
export const helloWorld = onRequest((req, res) => {
  logger.info("Hello logs!", { structuredData: true });
  res.send("Hello from Firebase (TypeScript) 🚀");
});
