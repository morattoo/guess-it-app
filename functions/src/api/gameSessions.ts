import express from "express";
import cors from "cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";

const db = getFirestore();
export const gameSessionsApi = express();

gameSessionsApi.use(cors({ origin: true }));
gameSessionsApi.use(express.json());
gameSessionsApi.use(authMiddleware);

// Crear nueva sesión de juego copiando las preguntas del cuestionario
gameSessionsApi.post("/gameSessions", async (req, res) => {
  const { questionnaireId, userId } = req.body;

  if (!questionnaireId || !userId) {
    return res.status(400).send("Missing data");
  }

  try {
    // Obtener el cuestionario
    const questionnaireSnap = await db
      .collection("questionnaires")
      .doc(questionnaireId)
      .get();

    if (!questionnaireSnap.exists) {
      return res.status(404).send("Questionnaire not found");
    }

    const questionnaire = questionnaireSnap.data()!;

    // Verificar que el usuario sea el creador del cuestionario
    if (questionnaire.createdBy !== userId) {
      return res
        .status(403)
        .send(
          "Unauthorized: You can only create sessions from your own questionnaires",
        );
    }

    // Obtener todas las preguntas del cuestionario
    const questionIds = questionnaire.questionIds || [];
    const questions = [];

    for (const questionId of questionIds) {
      const questionSnap = await db
        .collection("questions")
        .doc(questionId)
        .get();

      console.log("Question Snap:", questionSnap.id, questionSnap.exists);

      if (questionSnap.exists) {
        const questionData = questionSnap.data()!;

        // Verificar que la pregunta pertenezca al mismo usuario
        if (questionData.createdBy !== userId) {
          console.warn(
            `Question ${questionId} does not belong to user ${userId}, skipping`,
          );
          continue;
        }

        questions.push({
          id: questionSnap.id,
          type: questionData.type,
          title: questionData.title,
          description: questionData.description,
          points: questionData.points,
          penaltySeconds: questionData.timeLimitSec || 0,
          validation: {
            type: questionData.type,
            expectedAnswer: questionData.expectedAnswer,
            ...(questionData.type === "CHOICE" && questionData.options
              ? { options: questionData.options }
              : {}),
          },
        });
      }
    }

    const gameSessionRef = db.collection("gameSessions").doc();

    await gameSessionRef.set({
      questionnaireId,
      questions,
      status: "WAITING",
      createdBy: userId,
      startedAt: FieldValue.serverTimestamp(),
      isOpen: true,
    });

    res.json({ gameSessionId: gameSessionRef.id });
  } catch (error) {
    console.error("Error creating game session:", error);
    res.status(500).send("Error creating game session");
  }
});

// Obtener todas las sesiones del usuario
gameSessionsApi.get("/gameSessions", async (req, res) => {
  try {
    const userId = req.query.userId as string;

    if (!userId) {
      return res.status(400).send("Missing userId");
    }

    const snap = await db
      .collection("gameSessions")
      .where("createdBy", "==", userId)
      .get();

    const gameSessions = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: any, b: any) => {
        const aTime = a.startedAt?.toMillis() || 0;
        const bTime = b.startedAt?.toMillis() || 0;
        return bTime - aTime;
      });

    res.json(gameSessions);
  } catch (error) {
    console.error("Error getting game sessions:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Obtener una sesión específica (requiere autenticación del autor)
gameSessionsApi.get("/gameSessions/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.query.userId as string;

    const gameSessionSnap = await db.collection("gameSessions").doc(id).get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;

    // Verificar que el usuario sea el creador para ver respuestas
    if (userId && gameSessionData.createdBy !== userId) {
      return res.status(403).send("Unauthorized");
    }

    res.json({
      id: gameSessionSnap.id,
      ...gameSessionData,
    });
  } catch (error) {
    console.error("Error getting game session:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Actualizar estado de la sesión
gameSessionsApi.put("/gameSessions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status, userId } = req.body;

    if (!status || !userId) {
      return res.status(400).send("Missing data");
    }

    const gameSessionRef = db.collection("gameSessions").doc(id);
    const gameSessionSnap = await gameSessionRef.get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;

    // Verificar que el usuario sea el creador
    if (gameSessionData.createdBy !== userId) {
      return res.status(403).send("Unauthorized");
    }

    const updates: any = { status };

    if (status === "FINISHED") {
      updates.endedAt = FieldValue.serverTimestamp();
      updates.isOpen = false;
    }

    await gameSessionRef.update(updates);

    res.json({ success: true });
  } catch (error) {
    console.error("Error updating game session status:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Recopiar preguntas del cuestionario (solo en WAITING)
gameSessionsApi.put("/gameSessions/:id/refresh-questions", async (req, res) => {
  const { id } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).send("Missing userId");
  }

  try {
    const gameSessionRef = db.collection("gameSessions").doc(id);
    const gameSessionSnap = await gameSessionRef.get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;

    // Verificar que el usuario sea el creador
    if (gameSessionData.createdBy !== userId) {
      return res.status(403).send("Unauthorized");
    }

    // Solo se puede actualizar en estado WAITING
    if (gameSessionData.status !== "WAITING") {
      return res.status(400).send("Cannot refresh questions in current state");
    }

    // Obtener el cuestionario
    const questionnaireSnap = await db
      .collection("questionnaires")
      .doc(gameSessionData.questionnaireId)
      .get();

    if (!questionnaireSnap.exists) {
      return res.status(404).send("Questionnaire not found");
    }

    const questionnaire = questionnaireSnap.data()!;
    const questionIds = questionnaire.questionIds || [];
    const questions = [];

    for (const questionId of questionIds) {
      const questionSnap = await db
        .collection("questions")
        .doc(questionId)
        .get();
      if (questionSnap.exists) {
        const questionData = questionSnap.data()!;

        // Verificar que la pregunta pertenezca al mismo usuario
        if (questionData.createdBy !== userId) {
          console.warn(
            `Question ${questionId} does not belong to user ${userId}, skipping`,
          );
          continue;
        }

        questions.push({
          id: questionSnap.id,
          type: questionData.type,
          title: questionData.title,
          description: questionData.description,
          points: questionData.points,
          penaltySeconds: questionData.timeLimitSec || 0,
          validation: {
            type: questionData.type,
            expectedAnswer: questionData.expectedAnswer,
            ...(questionData.type === "CHOICE" && questionData.options
              ? { options: questionData.options }
              : {}),
          },
        });
      }
    }

    await gameSessionRef.update({ questions });

    res.json({ success: true, questionCount: questions.length });
  } catch (error) {
    console.error("Error refreshing questions:", error);
    res.status(500).send("Error refreshing questions");
  }
});

// Eliminar sesión (solo en WAITING)
gameSessionsApi.delete("/gameSessions/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).send("Missing userId");
  }

  const gameSessionRef = db.collection("gameSessions").doc(id);
  const gameSessionSnap = await gameSessionRef.get();

  if (!gameSessionSnap.exists) {
    return res.status(404).send("Game session not found");
  }

  const gameSessionData = gameSessionSnap.data()!;

  // Verificar que el usuario sea el creador
  if (gameSessionData.createdBy !== userId) {
    return res.status(403).send("Unauthorized");
  }

  // Solo se puede eliminar en estado WAITING
  if (gameSessionData.status !== "WAITING") {
    return res.status(400).send("Cannot delete session in current state");
  }

  await gameSessionRef.delete();

  res.json({ success: true });
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
  try {
    const { id: gameSessionId } = req.params;

    const snap = await db
      .collection("gameSessions")
      .doc(gameSessionId)
      .collection("players")
      .get();

    const ranking = snap.docs
      .map((doc) => doc.data())
      .filter((p) => p.finishedAt)
      .sort((a: any, b: any) => {
        const aTime = a.finishedAt?.toMillis() || 0;
        const bTime = b.finishedAt?.toMillis() || 0;
        return aTime - bTime;
      });

    res.json(ranking);
  } catch (error) {
    console.error("Error getting ranking:", error);
    res.status(500).send("Internal Server Error");
  }
});
