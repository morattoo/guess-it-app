import express from "express";
import cors from "cors";
import { Firestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";
import { appCheckMiddleware } from "../middlewares/appCheck";

export function createQuestionsApi(db: Firestore) {
  const api = express();

  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);
  api.use(authMiddleware);

  // Crear nueva pregunta
  api.post("/questions", async (req, res) => {
    try {
      const { question, userId } = req.body;

      if (!question || !userId) {
        return res.status(400).send("Missing data");
      }

      const questionRef = db.collection("questions").doc();

      await questionRef.set({
        ...question,
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ questionId: questionRef.id });
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Obtener todas las preguntas del usuario
  api.get("/questions", async (req, res) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).send("Missing userId");
      }

      const snap = await db
        .collection("questions")
        .where("createdBy", "==", userId)
        .get();

      const questions = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      res.json(questions);
    } catch (error) {
      console.error("Error getting questions:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Obtener una pregunta específica
  api.get("/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const questionSnap = await db.collection("questions").doc(id).get();

      if (!questionSnap.exists) {
        return res.status(404).send("Question not found");
      }

      res.json({
        id: questionSnap.id,
        ...questionSnap.data(),
      });
    } catch (error) {
      console.error("Error getting question:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Actualizar una pregunta
  api.put("/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { updates, userId } = req.body;

      if (!updates || !userId) {
        return res.status(400).send("Missing data");
      }

      const questionRef = db.collection("questions").doc(id);
      const questionSnap = await questionRef.get();

      if (!questionSnap.exists) {
        return res.status(404).send("Question not found");
      }

      const questionData = questionSnap.data()!;

      if (questionData.createdBy !== userId) {
        return res.status(403).send("Unauthorized");
      }

      await questionRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Eliminar una pregunta
  api.delete("/questions/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).send("Missing userId");
      }

      const questionRef = db.collection("questions").doc(id);
      const questionSnap = await questionRef.get();

      if (!questionSnap.exists) {
        return res.status(404).send("Question not found");
      }

      const questionData = questionSnap.data()!;

      if (questionData.createdBy !== userId) {
        return res.status(403).send("Unauthorized");
      }

      await questionRef.delete();

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return api;
}
