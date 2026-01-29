import express from "express";
import cors from "cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { appCheckMiddleware } from "../middlewares/appCheck";

const db = getFirestore();
export const publicGameApi = express();

publicGameApi.use(cors({ origin: true }));
publicGameApi.use(express.json());
publicGameApi.use(appCheckMiddleware);

// NO usa authMiddleware - es público

/**
 * Obtener información pública de una sesión (sin respuestas correctas)
 */
publicGameApi.get("/game/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const gameSessionSnap = await db.collection("gameSessions").doc(id).get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;

    // Remover las respuestas correctas de las preguntas
    const questionsWithoutAnswers = gameSessionData.questions.map((q: any) => {
      const cleanQuestion: any = {
        id: q.id,
        type: q.type,
        title: q.title,
        description: q.description,
        points: q.points,
        penaltySeconds: q.penaltySeconds,
      };

      // Para preguntas de opción múltiple, incluir las opciones pero no la respuesta
      if (q.type === "CHOICE" && q.validation?.options) {
        cleanQuestion.options = q.validation.options;
      }

      return cleanQuestion;
    });

    res.json({
      id: gameSessionSnap.id,
      questionnaireId: gameSessionData.questionnaireId,
      questions: questionsWithoutAnswers,
      status: gameSessionData.status,
      createdBy: gameSessionData.createdBy,
      startedAt: gameSessionData.startedAt,
      endedAt: gameSessionData.endedAt,
      isOpen: gameSessionData.isOpen,
    });
  } catch (error) {
    console.error("Error getting game session:", error);
    res.status(500).send("Error getting game session");
  }
});

/**
 * Unirse a una sesión de juego (crear progreso del jugador)
 * Requiere userId y displayName en el body
 */
publicGameApi.post("/game/:id/join", async (req, res) => {
  const { id: gameSessionId } = req.params;
  const { userId, displayName } = req.body;

  if (!userId) {
    return res.status(400).send("Missing userId");
  }

  try {
    // Verificar que la sesión existe y está abierta
    const gameSessionSnap = await db
      .collection("gameSessions")
      .doc(gameSessionId)
      .get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;

    if (!gameSessionData.isOpen) {
      return res.status(403).send("Game session is not accepting new players");
    }

    if (gameSessionData.status === "FINISHED") {
      return res.status(403).send("Game session has finished");
    }

    // Crear o actualizar el progreso del jugador
    const playerRef = db
      .collection("gameSessions")
      .doc(gameSessionId)
      .collection("players")
      .doc(userId);

    const playerSnap = await playerRef.get();

    if (playerSnap.exists) {
      // Ya existe, solo actualizar displayName si cambió
      if (displayName) {
        await playerRef.update({ displayName });
      }
    } else {
      // Crear nuevo progreso
      await playerRef.set({
        userId,
        displayName: displayName || "Jugador Anónimo",
        currentQuestionIndex: 0,
        score: 0,
        totalPenaltySeconds: 0,
        startedAt: FieldValue.serverTimestamp(),
      });

      // Agregar el userId al array players del documento principal de la sesión
      await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .update({
          players: FieldValue.arrayUnion(userId),
        });
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Error joining game:", error);
    res.status(500).send("Error joining game");
  }
});

/**
 * Obtener el progreso de un jugador
 */
publicGameApi.get("/game/:id/players/:userId", async (req, res) => {
  const { id: gameSessionId, userId } = req.params;

  try {
    const playerSnap = await db
      .collection("gameSessions")
      .doc(gameSessionId)
      .collection("players")
      .doc(userId)
      .get();

    if (!playerSnap.exists) {
      // Retornar null en lugar de 404 para indicar que el jugador no se ha unido
      return res.json(null);
    }

    res.json({
      ...playerSnap.data(),
    });
  } catch (error) {
    console.error("Error getting player progress:", error);
    res.status(500).send("Error getting player progress");
  }
});

/**
 * Validar respuesta del jugador
 */
publicGameApi.post("/game/:id/players/:userId/answer", async (req, res) => {
  const { id: gameSessionId, userId } = req.params;
  const { questionIndex, answer } = req.body;

  if (answer === undefined || answer === null || questionIndex === undefined) {
    return res.status(400).send("Missing data");
  }

  try {
    // Obtener progreso del jugador
    const playerRef = db
      .collection("gameSessions")
      .doc(gameSessionId)
      .collection("players")
      .doc(userId);

    const playerSnap = await playerRef.get();

    if (!playerSnap.exists) {
      return res.status(404).send("Player not found");
    }

    const playerData = playerSnap.data()!;

    // Verificar que el índice de la pregunta coincida
    if (playerData.currentQuestionIndex !== questionIndex) {
      return res.status(400).send("Invalid question index");
    }

    // Obtener la sesión y la pregunta
    const gameSessionSnap = await db
      .collection("gameSessions")
      .doc(gameSessionId)
      .get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;
    const question = gameSessionData.questions[questionIndex];

    if (!question) {
      return res.status(404).send("Question not found");
    }

    // Validar la respuesta según el tipo
    let isCorrect = false;
    const validation = question.validation;

    switch (question.type) {
      case "TEXT":
        const expectedText = validation.expectedAnswer.text;
        const caseSensitive = validation.expectedAnswer.caseSensitive || false;
        const answerText = String(answer).trim();
        isCorrect = caseSensitive
          ? expectedText === answerText
          : expectedText.toLowerCase() === answerText.toLowerCase();
        break;

      case "NUMBER":
        const expectedValue = validation.expectedAnswer.value;
        const tolerance = validation.expectedAnswer.tolerance || 0;
        const answerNumber = Number(answer);
        isCorrect = Math.abs(answerNumber - expectedValue) <= tolerance;
        break;

      case "CHOICE":
        const expectedOptionId = validation.expectedAnswer.optionId;
        isCorrect = String(answer) === String(expectedOptionId);
        break;

      default:
        return res.status(400).send("Unsupported question type");
    }

    if (!isCorrect) {
      // Respuesta incorrecta, agregar penalización pero no avanzar
      const penaltySeconds = question.penaltySeconds || 0;
      await playerRef.update({
        totalPenaltySeconds:
          (playerData.totalPenaltySeconds || 0) + penaltySeconds,
        lastAnswerAt: FieldValue.serverTimestamp(),
      });

      return res.json({
        correct: false,
        message: "INCORRECT_ANSWER",
      });
    }

    // Respuesta correcta, avanzar y actualizar puntaje
    const nextIndex = questionIndex + 1;
    const updates: any = {
      currentQuestionIndex: nextIndex,
      score: (playerData.score || 0) + question.points,
      lastAnswerAt: FieldValue.serverTimestamp(),
    };

    // Si terminó todas las preguntas
    if (nextIndex >= gameSessionData.questions.length) {
      updates.finishedAt = FieldValue.serverTimestamp();
    }

    await playerRef.update(updates);

    res.json({
      correct: true,
      message: "CORRECT_ANSWER",
      nextQuestionIndex: nextIndex,
      finished: nextIndex >= gameSessionData.questions.length,
    });
  } catch (error) {
    console.error("Error validating answer:", error);
    res.status(500).send(`Error validating answer: ${error}`);
  }
});

/**
 * Obtener ranking de la sesión
 */
publicGameApi.get("/game/:id/ranking", async (req, res) => {
  const { id: gameSessionId } = req.params;

  try {
    const playersSnap = await db
      .collection("gameSessions")
      .doc(gameSessionId)
      .collection("players")
      .get();

    const ranking = playersSnap.docs
      .map((doc) => {
        const data = doc.data();
        return {
          userId: doc.id,
          displayName: data.displayName,
          score: data.score,
          totalPenaltySeconds: data.totalPenaltySeconds,
          finishedAt: data.finishedAt,
          currentQuestionIndex: data.currentQuestionIndex,
        };
      })
      .sort((a, b) => {
        // Primero ordenar por score (descendente)
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        // Si tienen el mismo score, ordenar por penaltySeconds (ascendente)
        return a.totalPenaltySeconds - b.totalPenaltySeconds;
      });

    res.json(ranking);
  } catch (error) {
    console.error("Error getting ranking:", error);
    res.status(500).send(`Error getting ranking: ${error}`);
  }
});
