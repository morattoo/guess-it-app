/**
 * Firebase Functions v2 - TypeScript
 */

import { initializeApp } from "firebase-admin/app";
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";

initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Importar después de initializeApp()
import { gameSessionsApi } from "./api/gameSessions";
import { questionsApi } from "./api/questions";
import { questionnairesApi } from "./api/questionnaires";

export const gameSessions = onRequest(gameSessionsApi);
export const questions = onRequest(questionsApi);
export const questionnaires = onRequest(questionnairesApi);
