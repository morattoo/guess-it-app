import express from "express";
import cors from "cors";
import { Firestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";
import { appCheckMiddleware } from "../middlewares/appCheck";

export function createQuestionnairesApi(db: Firestore) {
  const api = express();

  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);
  api.use(authMiddleware);

  // Crear nuevo cuestionario
  api.post("/questionnaires", async (req, res) => {
    try {
      const { questionnaire, userId } = req.body;

      if (!questionnaire || !userId || !questionnaire.title) {
        return res.status(400).send("Missing data");
      }

      const questionnaireRef = db.collection("questionnaires").doc();

      await questionnaireRef.set({
        title: questionnaire.title,
        questionIds: questionnaire.questionIds || [],
        createdBy: userId,
        createdAt: FieldValue.serverTimestamp(),
      });

      res.json({ questionnaireId: questionnaireRef.id });
    } catch (error) {
      console.error("Error creating questionnaire:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Obtener todos los cuestionarios del usuario
  api.get("/questionnaires", async (req, res) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).send("Missing userId");
      }

      const snap = await db
        .collection("questionnaires")
        .where("createdBy", "==", userId)
        .get();

      const questionnaires = snap.docs
        .map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
        .sort((a: any, b: any) => {
          const aTime = a.createdAt?.toMillis?.() || 0;
          const bTime = b.createdAt?.toMillis?.() || 0;
          return bTime - aTime;
        });

      res.json(questionnaires);
    } catch (error) {
      console.error("Error getting questionnaires:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Obtener un cuestionario específico
  api.get("/questionnaires/:id", async (req, res) => {
    try {
      const { id } = req.params;

      const questionnaireSnap = await db
        .collection("questionnaires")
        .doc(id)
        .get();

      if (!questionnaireSnap.exists) {
        return res.status(404).send("Questionnaire not found");
      }

      res.json({
        id: questionnaireSnap.id,
        ...questionnaireSnap.data(),
      });
    } catch (error) {
      console.error("Error getting questionnaire:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Actualizar un cuestionario
  api.put("/questionnaires/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const { updates, userId } = req.body;

      if (!updates || !userId) {
        return res.status(400).send("Missing data");
      }

      const questionnaireRef = db.collection("questionnaires").doc(id);
      const questionnaireSnap = await questionnaireRef.get();

      if (!questionnaireSnap.exists) {
        return res.status(404).send("Questionnaire not found");
      }

      const questionnaireData = questionnaireSnap.data()!;

      if (questionnaireData.createdBy !== userId) {
        return res.status(403).send("Unauthorized");
      }

      await questionnaireRef.update({
        ...updates,
        updatedAt: FieldValue.serverTimestamp(),
      });

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating questionnaire:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  // Eliminar un cuestionario
  api.delete("/questionnaires/:id", async (req, res) => {
    try {
      const { id } = req.params;
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).send("Missing userId");
      }

      const questionnaireRef = db.collection("questionnaires").doc(id);
      const questionnaireSnap = await questionnaireRef.get();

      if (!questionnaireSnap.exists) {
        return res.status(404).send("Questionnaire not found");
      }

      const questionnaireData = questionnaireSnap.data()!;

      if (questionnaireData.createdBy !== userId) {
        return res.status(403).send("Unauthorized");
      }

      await questionnaireRef.delete();

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting questionnaire:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return api;
}
