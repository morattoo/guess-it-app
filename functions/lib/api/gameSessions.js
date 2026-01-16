"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.gameSessionsApi = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../middlewares/auth");
const db = (0, firestore_1.getFirestore)();
exports.gameSessionsApi = (0, express_1.default)();
exports.gameSessionsApi.use((0, cors_1.default)({ origin: true }));
exports.gameSessionsApi.use(express_1.default.json());
exports.gameSessionsApi.use(auth_1.authMiddleware);
exports.gameSessionsApi.post("/gameSessions", async (req, res) => {
    const { questionnaireId, userId } = req.body;
    if (!questionnaireId || !userId) {
        return res.status(400).send("Missing data");
    }
    const gameSessionRef = db.collection("gameSessions").doc();
    await gameSessionRef.set({
        questionnaireId,
        createdBy: userId,
        startedAt: Date.now(),
        isOpen: true,
    });
    res.json({ gameSessionId: gameSessionRef.id });
});
exports.gameSessionsApi.post("/gameSessions/:id/join", async (req, res) => {
    const { userId } = req.body;
    const { id: gameSessionId } = req.params;
    const playerRef = db
        .collection("gameSessions")
        .doc(gameSessionId)
        .collection("players")
        .doc(userId);
    await playerRef.set({
        userId,
        gameSessionId,
        currentQuestionIndex: 0,
        startedAt: Date.now(),
    });
    res.sendStatus(200);
});
exports.gameSessionsApi.post("/gameSessions/:id/validate-answer", async (req, res) => {
    const { userId, answer } = req.body;
    const { id: gameSessionId } = req.params;
    if (!userId || !answer) {
        return res.status(400).send("Missing data");
    }
    // 1️⃣ Obtener progreso del jugador
    const playerRef = db
        .collection("gameSessions")
        .doc(gameSessionId)
        .collection("players")
        .doc(userId);
    const playerSnap = await playerRef.get();
    if (!playerSnap.exists) {
        return res.status(404).send("Player not found");
    }
    const player = playerSnap.data();
    const currentIndex = player.currentQuestionIndex;
    // 2️⃣ Obtener questionnaire
    const gameSessionSnap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .get();
    const { questionnaireId } = gameSessionSnap.data();
    const questionnaireSnap = await db
        .collection("questionnaires")
        .doc(questionnaireId)
        .get();
    const { questionIds } = questionnaireSnap.data();
    const questionId = questionIds[currentIndex];
    // 3️⃣ Obtener pregunta
    const questionSnap = await db.collection("questions").doc(questionId).get();
    const { expectedAnswer } = questionSnap.data();
    // 4️⃣ Validar respuesta (V1 simple)
    const isCorrect = expectedAnswer.trim().toLowerCase() === answer.trim().toLowerCase();
    if (!isCorrect) {
        return res.json({
            correct: false,
            currentQuestionIndex: currentIndex,
        });
    }
    // 5️⃣ Avanzar
    const nextIndex = currentIndex + 1;
    const update = {
        currentQuestionIndex: nextIndex,
    };
    if (nextIndex >= questionIds.length) {
        update.finishedAt = Date.now();
    }
    await playerRef.update(update);
    res.json({
        correct: true,
        currentQuestionIndex: nextIndex,
        finished: !!update.finishedAt,
    });
});
exports.gameSessionsApi.get("/gameSessions/:id/ranking", async (req, res) => {
    const { id: gameSessionId } = req.params;
    const snap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .collection("players")
        .orderBy("finishedAt", "asc")
        .get();
    const ranking = snap.docs
        .map((doc) => doc.data())
        .filter((p) => p.finishedAt);
    res.json(ranking);
});
//# sourceMappingURL=gameSessions.js.map