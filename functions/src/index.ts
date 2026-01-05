/**
 * Firebase Functions v2 - TypeScript
 */

import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";
import { gameSessionsApi } from "./api/gameSessions";

initializeApp();

setGlobalOptions({ maxInstances: 10 });

export const api = onRequest(gameSessionsApi);
