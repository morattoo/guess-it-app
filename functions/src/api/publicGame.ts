import express from "express";
import cors from "cors";
import { Firestore, FieldValue, Timestamp } from "firebase-admin/firestore";
import { appCheckMiddleware } from "../middlewares/appCheck";
import { validateAnswer } from "../services/answerValidator";
import { convertTimestamp } from "../utils/timestamps";

export function createPublicGameApi(db: Firestore) {
  const api = express();

  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);

  // NO usa authMiddleware - es público

  /**
   * Obtener información pública de una sesión (sin respuestas correctas)
   */
  api.get("/game/:id", async (req, res) => {
    const { id } = req.params;

    try {
      const gameSessionSnap = await db.collection("gameSessions").doc(id).get();

      if (!gameSessionSnap.exists) {
        return res.status(404).send("Game session not found");
      }

      const gameSessionData = gameSessionSnap.data()!;

      // Remover las respuestas correctas de las preguntas
      const questionsWithoutAnswers = gameSessionData.questions.map(
        (q: any) => {
          const cleanQuestion: any = {
            id: q.id,
            type: q.type,
            title: q.title,
            description: q.description,
            points: q.points,
            penaltySeconds: q.penaltySeconds,
          };

          // Para preguntas de opción múltiple, incluir las opciones pero no la respuesta
          if (q.type === "CHOICE") {
            cleanQuestion.options = q.options ?? [];
          }

          // Para preguntas de ordenamiento, incluir los ítems (sin revelar el orden correcto)
          if (q.type === "ORDERING") {
            cleanQuestion.items = q.items ?? [];
          }

          return cleanQuestion;
        },
      );

      res.json({
        id: gameSessionSnap.id,
        questionnaireId: gameSessionData.questionnaireId,
        questions: questionsWithoutAnswers,
        status: gameSessionData.status,
        createdBy: gameSessionData.createdBy,
        startedAt: convertTimestamp(gameSessionData.startedAt),
        endedAt: convertTimestamp(gameSessionData.endedAt),
        isOpen: gameSessionData.isOpen,
        mode: gameSessionData.mode || "LEARNING",
        title: gameSessionData.title || "",
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
  api.post("/game/:id/join", async (req, res) => {
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
        return res
          .status(403)
          .send("Game session is not accepting new players");
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
   * Marcar inicio de juego para un jugador (solo primera vez)
   */
  api.post("/game/:id/players/:userId/start", async (req, res) => {
    const { id: gameSessionId, userId } = req.params;

    try {
      const gameSessionSnap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .get();

      if (!gameSessionSnap.exists) {
        return res.status(404).send("Game session not found");
      }

      const gameSessionData = gameSessionSnap.data()!;

      if (!gameSessionData.isOpen) {
        return res
          .status(403)
          .send("Game session is not accepting new players");
      }

      if (gameSessionData.status === "FINISHED") {
        return res.status(403).send("Game session has finished");
      }

      if (gameSessionData.status === "WAITING") {
        return res.status(403).send("Game session is not ready to start");
      }

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

      if (playerData.startedAt) {
        return res.json({
          success: true,
          alreadyStarted: true,
          startedAt: convertTimestamp(playerData.startedAt),
        });
      }

      const now = Timestamp.now();

      await playerRef.update({
        startedAt: now,
      });

      return res.json({
        success: true,
        alreadyStarted: false,
        startedAt: convertTimestamp(now),
      });
    } catch (error) {
      console.error("Error starting game for player:", error);
      return res.status(500).send("Error starting game for player");
    }
  });

  /**
   * Obtener el progreso de un jugador
   */
  api.get("/game/:id/players/:userId", async (req, res) => {
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

      const playerData = playerSnap.data()!;
      res.json({
        ...playerData,
        startedAt: convertTimestamp(playerData.startedAt),
        finishedAt: convertTimestamp(playerData.finishedAt),
        lastAnswerAt: convertTimestamp(playerData.lastAnswerAt),
      });
    } catch (error) {
      console.error("Error getting player progress:", error);
      res.status(500).send("Error getting player progress");
    }
  });

  /**
   * Validar respuesta del jugador
   */
  api.post("/game/:id/players/:userId/answer", async (req, res) => {
    const { id: gameSessionId, userId } = req.params;
    const { questionIndex, answer } = req.body;

    if (
      answer === undefined ||
      answer === null ||
      questionIndex === undefined
    ) {
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

      if (!playerData.startedAt) {
        return res.status(403).send("Game has not been started by player");
      }

      // Verificar que el jugador no haya terminado ya
      if (playerData.finishedAt) {
        return res.status(400).send("Player has already finished the game");
      }

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

      // Verificar que la sesión no haya terminado
      if (gameSessionData.status === "FINISHED") {
        return res.status(400).send("Game session is already finished");
      }

      const question = gameSessionData.questions[questionIndex];

      if (!question) {
        return res.status(404).send("Question not found");
      }

      // Validar la respuesta según el tipo
      const validationResult = validateAnswer(question, answer);

      if (!validationResult.ok) {
        return res.status(400).send(validationResult.error);
      }

      const isCorrect = validationResult.isCorrect;
      const sessionMode: string = gameSessionData.mode || "LEARNING";
      const penaltySeconds = question.penaltySeconds || 0;

      if (!isCorrect) {
        if (sessionMode === "EVALUATION") {
          // EVALUATION: avanzar aunque sea incorrecto, agregar penalización
          const nextIndex = questionIndex + 1;
          const updates: any = {
            currentQuestionIndex: nextIndex,
            totalPenaltySeconds:
              (playerData.totalPenaltySeconds || 0) + penaltySeconds,
            lastAnswerAt: FieldValue.serverTimestamp(),
          };

          if (nextIndex >= gameSessionData.questions.length) {
            updates.finishedAt = FieldValue.serverTimestamp();
          }

          await playerRef.update(updates);

          return res.json({
            correct: false,
            message: "INCORRECT_ANSWER",
            advanced: true,
            nextQuestionIndex: nextIndex,
            finished: nextIndex >= gameSessionData.questions.length,
          });
        } else {
          // LEARNING: quedarse en la misma pregunta, agregar penalización
          await playerRef.update({
            totalPenaltySeconds:
              (playerData.totalPenaltySeconds || 0) + penaltySeconds,
            lastAnswerAt: FieldValue.serverTimestamp(),
          });

          return res.json({
            correct: false,
            message: "INCORRECT_ANSWER",
            advanced: false,
          });
        }
      }

      // Respuesta correcta: avanzar y sumar score siempre
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
        advanced: true,
        nextQuestionIndex: nextIndex,
        finished: nextIndex >= gameSessionData.questions.length,
      });
    } catch (error) {
      console.error("Error validating answer:", error);
      res.status(500).send(`Error validating answer: ${error}`);
    }
  });

  /**
   * Enviar respuesta en modo Challenge
   * El jugador responde la pregunta actual; el host controla la transición entre preguntas.
   */
  api.post("/game/:id/challenge/answer", async (req, res) => {
    const { id: gameSessionId } = req.params;
    const { userId, answer } = req.body;

    if (!userId || answer === undefined || answer === null) {
      return res.status(400).send("Missing data");
    }

    try {
      const challengeRef = db
        .collection("gameSessionChallenge")
        .doc(gameSessionId);
      const challengeSnap = await challengeRef.get();

      if (!challengeSnap.exists) {
        return res.status(404).send("Challenge not found");
      }

      const challengeData = challengeSnap.data()!;

      if (challengeData.status !== "playing") {
        return res.status(400).send("Challenge is not in playing state");
      }

      const playerEntry = (challengeData.players || {})[userId] as
        | {
            displayName: string;
            score: number;
            answeredCurrentQuestion: boolean;
          }
        | undefined;

      if (!playerEntry) {
        return res.status(404).send("Player not found in challenge");
      }

      if (playerEntry.answeredCurrentQuestion) {
        return res
          .status(400)
          .send("Player has already answered this question");
      }

      const currentQuestionIndex = challengeData.currentQuestionIndex as number;

      // Get the question with validation data
      const gameSessionSnap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .get();

      if (!gameSessionSnap.exists) {
        return res.status(404).send("Game session not found");
      }

      const gameSessionData = gameSessionSnap.data()!;
      const question = gameSessionData.questions[currentQuestionIndex];

      if (!question) {
        return res.status(404).send("Question not found");
      }

      const validationResult = validateAnswer(question, answer);

      if (!validationResult.ok) {
        return res.status(400).send(validationResult.error);
      }

      const isCorrect = validationResult.isCorrect;
      const pointsEarned = isCorrect ? question.points : 0;
      const newScore = (playerEntry.score || 0) + pointsEarned;

      // Update player entry in challenge doc using dot-notation to avoid overwriting other players
      await challengeRef.update({
        [`players.${userId}.answeredCurrentQuestion`]: true,
        [`players.${userId}.lastAnswerCorrect`]: isCorrect,
        [`players.${userId}.score`]: newScore,
      });

      res.json({ correct: isCorrect, score: newScore });
    } catch (error) {
      console.error("Error submitting challenge answer:", error);
      res.status(500).send("Error submitting challenge answer");
    }
  });

  /**
   * Obtener ranking de la sesión con información completa
   */
  api.get("/game/:id/ranking", async (req, res) => {
    const { id: gameSessionId } = req.params;

    try {
      // Obtener la sesión de juego para información adicional
      const gameSessionSnap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .get();

      if (!gameSessionSnap.exists) {
        return res.status(404).send("Game session not found");
      }

      const gameSessionData = gameSessionSnap.data()!;
      const totalQuestions = gameSessionData.questions.length;

      // Obtener todos los jugadores
      const playersSnap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .collection("players")
        .get();

      // Calcular información detallada de cada jugador
      const players = playersSnap.docs.map((doc) => {
        const data = doc.data();

        // Calcular tiempo total
        let totalTime = 0;
        if (data.startedAt && data.startedAt.seconds) {
          const startTime = data.startedAt.seconds * 1000;
          const endTime = data.finishedAt
            ? data.finishedAt.seconds * 1000
            : Date.now();
          const elapsedSeconds = (endTime - startTime) / 1000;
          const penalty = data.totalPenaltySeconds || 0;
          totalTime = Math.max(0, elapsedSeconds + penalty);
        }

        // Calcular porcentaje de progreso
        const progressPercentage =
          totalQuestions > 0
            ? Math.round(
                ((data.currentQuestionIndex + 1) / totalQuestions) * 100,
              )
            : 0;

        return {
          userId: doc.id,
          displayName: data.displayName || "Jugador Anónimo",
          score: data.score || 0,
          totalPenaltySeconds: data.totalPenaltySeconds || 0,
          finishedAt: convertTimestamp(data.finishedAt),
          startedAt: convertTimestamp(data.startedAt),
          currentQuestionIndex: data.currentQuestionIndex || 0,
          totalTime,
          progressPercentage,
        };
      });

      // Ordenar ranking
      const ranking = players.sort((a, b) => {
        // Primero por score descendente
        if (b.score !== a.score) return b.score - a.score;

        // Si tienen el mismo score, por tiempo ascendente (menos tiempo es mejor)
        if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;

        // Si tienen el mismo tiempo, los que terminaron primero
        if (a.finishedAt && !b.finishedAt) return -1;
        if (!a.finishedAt && b.finishedAt) return 1;

        return 0;
      });

      res.json({
        sessionId: gameSessionSnap.id,
        status: gameSessionData.status,
        totalQuestions,
        players: ranking,
        timestamp: Date.now(),
      });
    } catch (error) {
      console.error("Error getting ranking:", error);
      res.status(500).send(`Error getting ranking: ${error}`);
    }
  });

  /**
   * Obtener las respuestas correctas de la sesión (solo para jugadores que ya terminaron)
   */
  api.get("/game/:id/results", async (req, res) => {
    const { id: gameSessionId } = req.params;
    const { userId } = req.query;

    if (!userId || typeof userId !== "string") {
      return res.status(400).send("Missing userId query parameter");
    }

    try {
      const [gameSessionSnap, playerSnap] = await Promise.all([
        db.collection("gameSessions").doc(gameSessionId).get(),
        db
          .collection("gameSessions")
          .doc(gameSessionId)
          .collection("players")
          .doc(userId)
          .get(),
      ]);

      if (!gameSessionSnap.exists) {
        return res.status(404).send("Game session not found");
      }

      if (!playerSnap.exists) {
        return res.status(404).send("Player not found");
      }

      const gameSessionData = gameSessionSnap.data()!;
      const playerData = playerSnap.data()!;
      const totalQuestions = gameSessionData.questions.length;

      // Solo jugadores que completaron todas las preguntas pueden ver los resultados
      const hasFinished =
        !!playerData.finishedAt ||
        playerData.currentQuestionIndex >= totalQuestions;

      if (!hasFinished) {
        return res.status(403).send("Player has not finished the game yet");
      }

      const questions = gameSessionData.questions.map((q: any) => {
        const summaryQuestion: any = {
          id: q.id,
          type: q.type,
          title: q.title,
          description: q.description,
          points: q.points,
          validation: q.validation,
        };

        if (q.type === "CHOICE") {
          summaryQuestion.options = q.options ?? [];
        }

        if (q.type === "ORDERING") {
          summaryQuestion.items = q.items ?? [];
        }

        return summaryQuestion;
      });

      return res.json({ questions });
    } catch (error) {
      console.error("Error getting game results:", error);
      return res.status(500).send(`Error getting game results: ${error}`);
    }
  });

  return api;
}
