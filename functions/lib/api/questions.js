"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.questionsApi = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const firestore_1 = require("firebase-admin/firestore");
const auth_1 = require("../middlewares/auth");
const db = (0, firestore_1.getFirestore)();
exports.questionsApi = (0, express_1.default)();
exports.questionsApi.use((0, cors_1.default)({ origin: true }));
exports.questionsApi.use(express_1.default.json());
exports.questionsApi.use(auth_1.authMiddleware);
// Crear nueva pregunta
exports.questionsApi.post("/questions", async (req, res) => {
    try {
        const { question, userId } = req.body;
        if (!question || !userId) {
            return res.status(400).send("Missing data");
        }
        const questionRef = db.collection("questions").doc();
        await questionRef.set({
            ...question,
            createdBy: userId,
            createdAt: firestore_1.FieldValue.serverTimestamp(),
        });
        res.json({ questionId: questionRef.id });
    }
    catch (error) {
        console.error("Error creating question:", error);
        res.status(500).send("Internal Server Error");
    }
});
// Obtener todas las preguntas del usuario
exports.questionsApi.get("/questions", async (req, res) => {
    try {
        const userId = req.query.userId;
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
            .sort((a, b) => {
            const aTime = a.createdAt?.toMillis() || 0;
            const bTime = b.createdAt?.toMillis() || 0;
            return bTime - aTime;
        });
        res.json(questions);
    }
    catch (error) {
        console.error("Error getting questions:", error);
        res.status(500).send("Internal Server Error");
    }
});
// Obtener una pregunta específica
exports.questionsApi.get("/questions/:id", async (req, res) => {
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
    }
    catch (error) {
        console.error("Error getting question:", error);
        res.status(500).send("Internal Server Error");
    }
});
// Actualizar una pregunta
exports.questionsApi.put("/questions/:id", async (req, res) => {
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
        const questionData = questionSnap.data();
        // Verificar que el usuario sea el creador
        if (questionData.createdBy !== userId) {
            return res.status(403).send("Unauthorized");
        }
        await questionRef.update({
            ...updates,
            updatedAt: firestore_1.FieldValue.serverTimestamp(),
        });
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error updating question:", error);
        res.status(500).send("Internal Server Error");
    }
});
// Eliminar una pregunta
exports.questionsApi.delete("/questions/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.query.userId;
        if (!userId) {
            return res.status(400).send("Missing userId");
        }
        const questionRef = db.collection("questions").doc(id);
        const questionSnap = await questionRef.get();
        if (!questionSnap.exists) {
            return res.status(404).send("Question not found");
        }
        const questionData = questionSnap.data();
        // Verificar que el usuario sea el creador
        if (questionData.createdBy !== userId) {
            return res.status(403).send("Unauthorized");
        }
        await questionRef.delete();
        res.json({ success: true });
    }
    catch (error) {
        console.error("Error deleting question:", error);
        res.status(500).send("Internal Server Error");
    }
});
//# sourceMappingURL=questions.js.map