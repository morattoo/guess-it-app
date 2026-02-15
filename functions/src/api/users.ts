import express from "express";
import cors from "cors";
import { getFirestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { appCheckMiddleware } from "../middlewares/appCheck";

const db = getFirestore();
export const usersApi = express();

usersApi.use(cors({ origin: true }));
usersApi.use(express.json());
usersApi.use(appCheckMiddleware);
usersApi.use(authMiddleware);

/**
 * Crear perfil de usuario
 * POST /users
 */
usersApi.post("/users", async (req: AuthRequest, res) => {
  const { uid, name, email } = req.body;
  const authenticatedUid = req.user?.uid;

  // Verificar que el usuario solo pueda crear su propio perfil
  if (!authenticatedUid || authenticatedUid !== uid) {
    return res
      .status(403)
      .send("Unauthorized: You can only create your own profile");
  }

  if (!uid || !name || !email) {
    return res.status(400).send("Missing required fields: uid, name, email");
  }

  try {
    await db.collection("users").doc(uid).set({
      name,
      email,
      createdAt: FieldValue.serverTimestamp(),
    });

    res.json({ success: true, uid });
  } catch (error) {
    console.error("Error creating user profile:", error);
    res.status(500).send("Error creating user profile");
  }
});

/**
 * Obtener perfil de usuario
 * GET /users/:uid
 */
usersApi.get("/users/:uid", async (req: AuthRequest, res) => {
  const { uid } = req.params;
  const authenticatedUid = req.user?.uid;

  // Verificar que el usuario solo pueda obtener su propio perfil
  if (!authenticatedUid || authenticatedUid !== uid) {
    return res
      .status(403)
      .send("Unauthorized: You can only access your own profile");
  }

  try {
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return res.status(404).send("User profile not found");
    }

    const userData = userDoc.data()!;
    res.json({
      name: userData.name,
      email: userData.email,
      createdAt: userData.createdAt,
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).send("Error getting user profile");
  }
});
