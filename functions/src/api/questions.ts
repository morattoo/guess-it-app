import express from "express";
import cors from "cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";

const db = getFirestore();
export const questionsApi = express();

questionsApi.use(cors({ origin: true }));
questionsApi.use(express.json());
questionsApi.use(authMiddleware);

// Crear nueva pregunta
questionsApi.post("/questions", async (req, res) => {
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
questionsApi.get("/questions", async (req, res) => {
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
        const aTime = a.createdAt?.toMillis() || 0;
        const bTime = b.createdAt?.toMillis() || 0;
        return bTime - aTime;
      });

    res.json(questions);
  } catch (error) {
    console.error("Error getting questions:", error);
    res.status(500).send("Internal Server Error");
  }
});

// Obtener una pregunta específica
questionsApi.get("/questions/:id", async (req, res) => {
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
questionsApi.put("/questions/:id", async (req, res) => {
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

    // Verificar que el usuario sea el creador
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
questionsApi.delete("/questions/:id", async (req, res) => {
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

    // Verificar que el usuario sea el creador
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
