/**
 * Firebase Functions v2 - TypeScript
 */

import { initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import { setGlobalOptions } from "firebase-functions/v2";
import { onRequest } from "firebase-functions/v2/https";

initializeApp();

setGlobalOptions({ maxInstances: 10 });

// Importar después de initializeApp()
import { createGameSessionsApi } from "./api/gameSessions";
import { createQuestionsApi } from "./api/questions";
import { createQuestionnairesApi } from "./api/questionnaires";
import { createPublicGameApi } from "./api/publicGame";
import { createUsersApi } from "./api/users";

const db = getFirestore();

export const gameSessions = onRequest(createGameSessionsApi(db));
export const questions = onRequest(createQuestionsApi(db));
export const questionnaires = onRequest(createQuestionnairesApi(db));
export const publicGame = onRequest(createPublicGameApi(db));
export const users = onRequest(createUsersApi(db));
