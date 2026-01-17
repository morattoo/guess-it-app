"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionnairesApi = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../middlewares/auth");
const db = (0, firestore_1.getFirestore)();
exports.questionnairesApi = (0, express_1.default)();
exports.questionnairesApi.use((0, cors_1.default)({ origin: true }));
exports.questionnairesApi.use(express_1.default.json());
exports.questionnairesApi.use(auth_1.authMiddleware);
// Crear nuevo cuestionario
exports.questionnairesApi.post("/questionnaires", async (req, res) => {
    const { questionnaire, userId } = req.body;
    if (!questionnaire || !userId || !questionnaire.title) {
        return res.status(400).send("Missing data");
    }
    const questionnaireRef = db.collection("questionnaires").doc();
    await questionnaireRef.set({
        title: questionnaire.title,
        questionIds: questionnaire.questionIds || [],
        createdBy: userId,
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    res.json({ questionnaireId: questionnaireRef.id });
});
// Obtener todos los cuestionarios del usuario
exports.questionnairesApi.get("/questionnaires", async (req, res) => {
    const userId = req.query.userId;
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
exports.questionnairesApi.get("/questionnaires/:id", async (req, res) => {
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
exports.questionnairesApi.put("/questionnaires/:id", async (req, res) => {
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
    const questionnaireData = questionnaireSnap.data();
    // Verificar que el usuario sea el creador
    if (questionnaireData.createdBy !== userId) {
        return res.status(403).send("Unauthorized");
    }
    await questionnaireRef.update({
        ...updates,
        updatedAt: firestore_1.FieldValue.serverTimestamp(),
    });
    res.json({ success: true });
});
// Eliminar un cuestionario
exports.questionnairesApi.delete("/questionnaires/:id", async (req, res) => {
    const { id } = req.params;
    const userId = req.query.userId;
    if (!userId) {
        return res.status(400).send("Missing userId");
    }
    const questionnaireRef = db.collection("questionnaires").doc(id);
    const questionnaireSnap = await questionnaireRef.get();
    if (!questionnaireSnap.exists) {
        return res.status(404).send("Questionnaire not found");
    }
    const questionnaireData = questionnaireSnap.data();
    // Verificar que el usuario sea el creador
    if (questionnaireData.createdBy !== userId) {
        return res.status(403).send("Unauthorized");
    }
    await questionnaireRef.delete();
    res.json({ success: true });
});
//# sourceMappingURL=questionnaires.js.map