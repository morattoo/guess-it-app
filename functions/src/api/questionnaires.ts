import express from "express";
import cors from "cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";

const db = getFirestore();
export const questionnairesApi = express();

questionnairesApi.use(cors({ origin: true }));
questionnairesApi.use(express.json());
questionnairesApi.use(authMiddleware);

// Crear nuevo cuestionario
questionnairesApi.post("/questionnaires", async (req, res) => {
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
});

// Obtener todos los cuestionarios del usuario
questionnairesApi.get("/questionnaires", async (req, res) => {
  const userId = req.query.userId as string;

  if (!userId) {
    return res.status(400).send("Missing userId");
  }

  const snap = await db
    .collection("questionnaires")
    .where("createdBy", "==", userId)
    .orderBy("createdAt", "desc")
    .get();

  const questionnaires = snap.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));

  res.json(questionnaires);
});

// Obtener un cuestionario específico
questionnairesApi.get("/questionnaires/:id", async (req, res) => {
  const { id } = req.params;

  const questionnaireSnap = await db.collection("questionnaires").doc(id).get();

  if (!questionnaireSnap.exists) {
    return res.status(404).send("Questionnaire not found");
  }

  res.json({
    id: questionnaireSnap.id,
    ...questionnaireSnap.data(),
  });
});

// Actualizar un cuestionario
questionnairesApi.put("/questionnaires/:id", async (req, res) => {
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

  // Verificar que el usuario sea el creador
  if (questionnaireData.createdBy !== userId) {
    return res.status(403).send("Unauthorized");
  }

  await questionnaireRef.update({
    ...updates,
    updatedAt: FieldValue.serverTimestamp(),
  });

  res.json({ success: true });
});

// Eliminar un cuestionario
questionnairesApi.delete("/questionnaires/:id", async (req, res) => {
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

  // Verificar que el usuario sea el creador
  if (questionnaireData.createdBy !== userId) {
    return res.status(403).send("Unauthorized");
  }

  await questionnaireRef.delete();

  res.json({ success: true });
});
