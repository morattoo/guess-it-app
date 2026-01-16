import express from "express";
import cors from "cors";
import { getFirestore } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";

const db = getFirestore();
export const gameSessionsApi = express();

gameSessionsApi.use(cors({ origin: true }));
gameSessionsApi.use(express.json());
gameSessionsApi.use(authMiddleware);

gameSessionsApi.post("/gameSessions", async (req, res) => {
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

gameSessionsApi.post("/gameSessions/:id/join", async (req, res) => {
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

gameSessionsApi.post("/gameSessions/:id/validate-answer", async (req, res) => {
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

  const player = playerSnap.data()!;
  const currentIndex = player.currentQuestionIndex;

  // 2️⃣ Obtener questionnaire
  const gameSessionSnap = await db
    .collection("gameSessions")
    .doc(gameSessionId)
    .get();

  const { questionnaireId } = gameSessionSnap.data()!;

  const questionnaireSnap = await db
    .collection("questionnaires")
    .doc(questionnaireId)
    .get();

  const { questionIds } = questionnaireSnap.data()!;
  const questionId = questionIds[currentIndex];

  // 3️⃣ Obtener pregunta
  const questionSnap = await db.collection("questions").doc(questionId).get();

  const { expectedAnswer } = questionSnap.data()!;

  // 4️⃣ Validar respuesta (V1 simple)
  const isCorrect =
    expectedAnswer.trim().toLowerCase() === answer.trim().toLowerCase();

  if (!isCorrect) {
    return res.json({
      correct: false,
      currentQuestionIndex: currentIndex,
    });
  }

  // 5️⃣ Avanzar
  const nextIndex = currentIndex + 1;
  const update: any = {
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

gameSessionsApi.get("/gameSessions/:id/ranking", async (req, res) => {
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
