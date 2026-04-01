import express from "express";
import cors from "cors";
import { Firestore } from "firebase-admin/firestore";
import { authMiddleware } from "../middlewares/auth";
import { appCheckMiddleware } from "../middlewares/appCheck";

export type DashboardData = {
  activeSessions: ActiveSessionSummary[];
  totalQuestionnaires: number;
  totalQuestions: number;
};

export type ActiveSessionSummary = {
  id: string;
  title: string;
  status: "WAITING" | "RUNNING";
  totalPlayers: number;
  finishedPlayers: number;
  totalQuestions: number;
};

export function createDashboardApi(db: Firestore) {
  const api = express();

  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);
  api.use(authMiddleware);

  // GET /dashboard?userId=xxx
  api.get("/dashboard", async (req, res) => {
    try {
      const userId = req.query.userId as string;

      if (!userId) {
        return res.status(400).send("Missing userId");
      }

      // Fetch active sessions (WAITING or RUNNING) created by this user
      const sessionsSnap = await db
        .collection("gameSessions")
        .where("createdBy", "==", userId)
        .where("status", "in", ["WAITING", "RUNNING"])
        .get();

      // For each active session, count how many players have finished
      const activeSessionsPromises = sessionsSnap.docs.map(async (doc) => {
        const data = doc.data();
        const totalPlayers: number = (data.players || []).length;

        // Count players with a finishedAt timestamp in the sub-collection
        const playersSnap = await db
          .collection("gameSessions")
          .doc(doc.id)
          .collection("players")
          .where("finishedAt", "!=", null)
          .get();

        const finishedPlayers = playersSnap.size;

        return {
          id: doc.id,
          title: data.title || doc.id,
          status: data.status as "WAITING" | "RUNNING",
          totalPlayers,
          finishedPlayers,
          totalQuestions: (data.questions || []).length,
        } satisfies ActiveSessionSummary;
      });

      const activeSessions = await Promise.all(activeSessionsPromises);

      // Count questionnaires and questions owned by this user
      const [questionnairesSnap, questionsSnap] = await Promise.all([
        db
          .collection("questionnaires")
          .where("createdBy", "==", userId)
          .count()
          .get(),
        db
          .collection("questions")
          .where("createdBy", "==", userId)
          .count()
          .get(),
      ]);

      const data: DashboardData = {
        activeSessions,
        totalQuestionnaires: questionnairesSnap.data().count,
        totalQuestions: questionsSnap.data().count,
      };

      res.json(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      res.status(500).send("Internal Server Error");
    }
  });

  return api;
}
