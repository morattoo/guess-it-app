import express from "express";
import cors from "cors";
import { Firestore, FieldValue } from "firebase-admin/firestore";
import { authMiddleware, AuthRequest } from "../middlewares/auth";
import { appCheckMiddleware } from "../middlewares/appCheck";
import { convertTimestamp } from "../utils/timestamps";

export function createUsersApi(db: Firestore) {
  const api = express();

  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);
  api.use(authMiddleware);

  /**
   * Crear perfil de usuario
   * POST /users
   */
  api.post("/users", async (req: AuthRequest, res) => {
    const { uid, name, email } = req.body;
    const authenticatedUid = req.user?.uid;

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
  api.get("/users/:uid", async (req: AuthRequest, res) => {
    const { uid } = req.params;
    const authenticatedUid = req.user?.uid;

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
        createdAt: convertTimestamp(userData.createdAt),
      });
    } catch (error) {
      console.error("Error getting user profile:", error);
      res.status(500).send("Error getting user profile");
    }
  });

  return api;
}
