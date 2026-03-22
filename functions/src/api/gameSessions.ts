import express from "express";
import cors from "cors";
import { Firestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";
import { appCheckMiddleware } from "../middlewares/appCheck";
import { mapQuestionForSession } from "../services/questionMapper";
import { validateAnswer } from "../services/answerValidator";

const convertTimestamp = (timestamp: any) => {
  if (!timestamp) return null;
  if (timestamp.toDate) {
    return { seconds: timestamp.seconds, nanoseconds: timestamp.nanoseconds };
  }
  return timestamp;
};

export function createGameSessionsApi(db: Firestore) {
  const api = express();

  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);
  api.use(authMiddleware);

  // Crear nueva sesión de juego copiando las preguntas del cuestionario
  api.post("/gameSessions", async (req, res) => {
    const { questionnaireId, userId, mode, title } = req.body;

    if (!questionnaireId || !userId) {
      return res.status(400).send("Missing data");
    }

    if (!mode || !["EVALUATION", "LEARNING"].includes(mode)) {
      return res
        .status(400)
        .send("Missing or invalid mode. Must be EVALUATION or LEARNING");
    }

    if (!title || !title.trim()) {
      return res.status(400).send("Missing title");
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

        if (questionSnap.exists) {
          const questionData = questionSnap.data()!;

          // Verificar que la pregunta pertenezca al mismo usuario
          if (questionData.createdBy !== userId) {
            console.warn(
              `Question ${questionId} does not belong to user ${userId}, skipping`,
            );
            continue;
          }

          questions.push(
            mapQuestionForSession(questionSnap.id, questionData as any),
          );
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
        players: [],
        mode,
        title: title.trim(),
      });

      // Documento público liviano para escucha en tiempo real desde el cliente
      await db.collection("gameSessionsMeta").doc(gameSessionRef.id).set({
        status: "WAITING",
        isOpen: true,
      });

      res.json({ gameSessionId: gameSessionRef.id });
    } catch (error) {
      console.error("Error creating game session:", error);
      res.status(500).send(`Error creating game session: ${error}`);
    }
  });

  // Obtener todas las sesiones del usuario
  api.get("/gameSessions", async (req, res) => {
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
        .map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            startedAt: convertTimestamp(data.startedAt),
            endedAt: convertTimestamp(data.endedAt),
          };
        })
        .sort((a: any, b: any) => {
          const aTime = a.startedAt?.seconds ? a.startedAt.seconds * 1000 : 0;
          const bTime = b.startedAt?.seconds ? b.startedAt.seconds * 1000 : 0;
          return bTime - aTime;
        });

      res.json(gameSessions);
    } catch (error) {
      console.error("Error getting game sessions:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Obtener una sesión específica (requiere autenticación del autor)
  api.get("/gameSessions/:id", async (req, res) => {
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
        startedAt: convertTimestamp(gameSessionData.startedAt),
        endedAt: convertTimestamp(gameSessionData.endedAt),
      });
    } catch (error) {
      console.error("Error getting game session:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Actualizar estado de la sesión
  api.put("/gameSessions/:id/status", async (req, res) => {
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

      // Sincronizar metadata pública
      const metaUpdates: any = { status };
      if (status === "FINISHED") metaUpdates.isOpen = false;
      await db.collection("gameSessionsMeta").doc(id).update(metaUpdates);

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating game session status:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Actualizar isOpen de la sesión (toggle para abrir/cerrar inscripciones)
  api.put("/gameSessions/:id/toggle-open", async (req, res) => {
    try {
      const { id } = req.params;
      const { userId, isOpen } = req.body;

      if (!userId || typeof isOpen !== "boolean") {
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

      // No se puede abrir una sesión finalizada
      if (gameSessionData.status === "FINISHED" && isOpen) {
        return res.status(400).send("Cannot open a finished session");
      }

      await gameSessionRef.update({ isOpen });

      // Sincronizar metadata pública
      await db.collection("gameSessionsMeta").doc(id).update({ isOpen });

      res.json({ success: true, isOpen });
    } catch (error) {
      console.error("Error toggling game session open state:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Recopiar preguntas del cuestionario (solo en WAITING)
  api.put("/gameSessions/:id/refresh-questions", async (req, res) => {
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
        return res
          .status(400)
          .send("Cannot refresh questions in current state");
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

          if (questionData.createdBy !== userId) {
            console.warn(
              `Question ${questionId} does not belong to user ${userId}, skipping`,
            );
            continue;
          }

          questions.push(
            mapQuestionForSession(questionSnap.id, questionData as any),
          );
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
  api.delete("/gameSessions/:id", async (req, res) => {
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

    // Solo se puede eliminar en estado WAITING o FINISHED (no se pueden eliminar sesiones en curso)
    if (gameSessionData.status === "RUNNING") {
      return res.status(400).send("Cannot delete session in current state");
    }

    // Eliminar la subcollección de players antes de borrar el documento principal
    const playersSnap = await gameSessionRef.collection("players").get();
    const deletePlayersBatch = db.batch();
    playersSnap.docs.forEach((doc) => deletePlayersBatch.delete(doc.ref));
    await deletePlayersBatch.commit();

    await gameSessionRef.delete();

    // Eliminar metadata pública
    await db.collection("gameSessionsMeta").doc(id).delete();

    res.json({ success: true });
  });

  api.post("/gameSessions/:id/join", async (req, res) => {
    const { userId } = req.body;
    const { id: gameSessionId } = req.params;

    if (!userId) {
      return res.status(400).send("Missing userId");
    }

    try {
      // Vérifier que la session existe et est en cours
      const gameSessionSnap = await db
        .collection("gameSessions")
        .doc(gameSessionId)
        .get();

      if (!gameSessionSnap.exists) {
        return res.status(404).send("Game session not found");
      }

      const gameSessionData = gameSessionSnap.data()!;

      // Vérifier que le status est RUNNING
      if (gameSessionData.status !== "RUNNING") {
        return res.status(400).send("Game session is not running");
      }

      // Vérifier que la session est ouverte
      if (!gameSessionData.isOpen) {
        return res.status(400).send("Game session is closed");
      }

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
    } catch (error) {
      console.error("Error joining game session:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  api.post("/gameSessions/:id/validate-answer", async (req, res) => {
    const { userId, answer } = req.body;
    const { id: gameSessionId } = req.params;

    if (!userId || answer === undefined || answer === null) {
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

    // 2️⃣ Obtener sesión de juego y pregunta actual
    const gameSessionSnap = await db
      .collection("gameSessions")
      .doc(gameSessionId)
      .get();

    if (!gameSessionSnap.exists) {
      return res.status(404).send("Game session not found");
    }

    const gameSessionData = gameSessionSnap.data()!;
    const questions = gameSessionData.questions || [];
    const question = questions[currentIndex];

    if (!question) {
      return res.status(404).send("Question not found");
    }

    // 3️⃣ Validar respuesta
    const result = validateAnswer(question, answer);

    if (!result.ok) {
      return res.status(400).send(result.error);
    }

    if (!result.isCorrect) {
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

    if (nextIndex >= questions.length) {
      update.finishedAt = Date.now();
    }

    await playerRef.update(update);

    res.json({
      correct: true,
      currentQuestionIndex: nextIndex,
      finished: !!update.finishedAt,
    });
  });

  api.get("/gameSessions/:id/ranking", async (req, res) => {
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

  return api;
}
