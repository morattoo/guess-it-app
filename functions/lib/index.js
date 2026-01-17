"use strict";
/**
 * Firebase Functions v2 - TypeScript
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionnaires = exports.questions = exports.gameSessions = void 0;
const app_1 = require("firebase-admin/app");
const v2_1 = require("firebase-functions/v2");
const https_1 = require("firebase-functions/v2/https");
(0, app_1.initializeApp)();
(0, v2_1.setGlobalOptions)({ maxInstances: 10 });
// Importar después de initializeApp()
const gameSessions_1 = require("./api/gameSessions");
const questions_1 = require("./api/questions");
const questionnaires_1 = require("./api/questionnaires");
exports.gameSessions = (0, https_1.onRequest)(gameSessions_1.gameSessionsApi);
exports.questions = (0, https_1.onRequest)(questions_1.questionsApi);
exports.questionnaires = (0, https_1.onRequest)(questionnaires_1.questionnairesApi);
//# sourceMappingURL=index.js.map