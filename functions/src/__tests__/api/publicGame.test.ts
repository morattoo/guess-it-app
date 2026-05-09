// publicGame has no authMiddleware, only appCheck
jest.mock("firebase-admin/app-check", () => ({
  getAppCheck: jest.fn().mockReturnValue({
    verifyToken: jest.fn().mockResolvedValue({ appId: "mock" }),
  }),
}));

import request from "supertest";
import { buildMockDb } from "../helpers/mockDb";
import { createPublicGameApi } from "../../api/publicGame";

const APP_CHECK_HEADER = { "X-Firebase-AppCheck": "mock-token" };
const USER_ID = "player-abc";
const SESSION_ID = "gs1";

function buildSessionDb(extra: Record<string, unknown> = {}) {
  const questions = [
    {
      id: "q1",
      type: "TEXT",
      title: "Capital of France?",
      points: 10,
      penaltySeconds: 5,
      validation: { expectedAnswer: { text: "Paris", caseSensitive: false } },
    },
    {
      id: "q2",
      type: "NUMBER",
      title: "2+2?",
      points: 10,
      penaltySeconds: 0,
      validation: { expectedAnswer: { value: 4, tolerance: 0 } },
    },
  ];

  return buildMockDb({
    gameSessions: {
      [SESSION_ID]: {
        title: "Test Session",
        status: "RUNNING",
        isOpen: true,
        createdBy: "host-user",
        questionnaireId: "qn1",
        questions,
        players: [],
        mode: "LEARNING",
        ...extra,
      },
    },
  });
}

describe("PublicGame API", () => {
  // ─── GET /game/:id ──────────────────────────────────────────────────────────

  describe("GET /game/:id", () => {
    it("200: returns session info without validation answers", async () => {
      const db = buildSessionDb();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe(SESSION_ID);
      // validation should be stripped from questions
      res.body.questions.forEach((q: any) => {
        expect(q).not.toHaveProperty("validation");
      });
    });

    it("404: session not found", async () => {
      const db = buildMockDb({ gameSessions: {} });
      const app = createPublicGameApi(db as any);
      const res = await request(app).get("/game/ghost").set(APP_CHECK_HEADER);
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /game/:id/join ────────────────────────────────────────────────────

  describe("POST /game/:id/join", () => {
    it("200: player joins successfully", async () => {
      const db = buildSessionDb();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/join`)
        .set(APP_CHECK_HEADER)
        .send({ userId: USER_ID, displayName: "Alice" });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("403: cannot join a closed session", async () => {
      const db = buildSessionDb({ isOpen: false });
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/join`)
        .set(APP_CHECK_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(403);
    });

    it("403: cannot join a FINISHED session", async () => {
      const db = buildSessionDb({ status: "FINISHED" });
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/join`)
        .set(APP_CHECK_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(403);
    });

    it("400: missing userId", async () => {
      const db = buildSessionDb();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/join`)
        .set(APP_CHECK_HEADER)
        .send({});
      expect(res.status).toBe(400);
    });
  });

  // ─── POST /game/:id/players/:userId/start ────────────────────────────────────

  describe("POST /game/:id/players/:userId/start", () => {
    it("200: sets startedAt for first-time start", async () => {
      const db = buildSessionDb();
      // pre-create the player doc without startedAt
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: { userId: USER_ID, currentQuestionIndex: 0, score: 0 },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/start`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.alreadyStarted).toBe(false);
    });

    it("200: returns alreadyStarted=true if startedAt exists", async () => {
      const db = buildSessionDb();
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 0,
          score: 0,
          startedAt: { seconds: 1000, nanoseconds: 0 },
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/start`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.alreadyStarted).toBe(true);
    });

    it("403: cannot start on WAITING session", async () => {
      const db = buildSessionDb({ status: "WAITING" });
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: { userId: USER_ID, currentQuestionIndex: 0, score: 0 },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/start`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(403);
    });
  });

  // ─── GET /game/:id/players/:userId ───────────────────────────────────────────

  describe("GET /game/:id/players/:userId", () => {
    it("200: returns player progress", async () => {
      const db = buildSessionDb();
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: { userId: USER_ID, currentQuestionIndex: 1, score: 10 },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/players/${USER_ID}`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.score).toBe(10);
    });

    it("200: returns null for unknown player", async () => {
      const db = buildSessionDb();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/players/unknown`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body).toBeNull();
    });
  });

  // ─── POST /game/:id/players/:userId/answer ────────────────────────────────────

  describe("POST /game/:id/players/:userId/answer (LEARNING mode)", () => {
    function dbWithPlayer() {
      const db = buildSessionDb({ mode: "LEARNING" });
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 0,
          score: 0,
          totalPenaltySeconds: 0,
          startedAt: { seconds: 1000, nanoseconds: 0 },
        },
      };
      return db;
    }

    it("200: correct TEXT answer advances player", async () => {
      const db = dbWithPlayer();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 0, answer: "Paris" });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(true);
      expect(res.body.advanced).toBe(true);
    });

    it("200: incorrect answer in LEARNING stays on same question", async () => {
      const db = dbWithPlayer();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 0, answer: "London" });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(false);
      expect(res.body.advanced).toBe(false);
    });

    it("400: wrong question index", async () => {
      const db = dbWithPlayer(); // currentQuestionIndex is 0
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 1, answer: "Paris" });
      expect(res.status).toBe(400);
    });

    it("400: missing answer", async () => {
      const db = dbWithPlayer();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 0 });
      expect(res.status).toBe(400);
    });

    it("403: player has not started", async () => {
      const db = buildSessionDb({ mode: "LEARNING" });
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 0,
          score: 0,
          totalPenaltySeconds: 0,
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 0, answer: "Paris" });
      expect(res.status).toBe(403);
    });

    it("400: player has already finished", async () => {
      const db = buildSessionDb({ mode: "LEARNING" });
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 1,
          score: 10,
          totalPenaltySeconds: 0,
          startedAt: { seconds: 1000, nanoseconds: 0 },
          finishedAt: { seconds: 2000, nanoseconds: 0 },
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 1, answer: "Paris" });
      expect(res.status).toBe(400);
    });

    it("400: game session is already FINISHED", async () => {
      const db = buildSessionDb({ mode: "LEARNING", status: "FINISHED" });
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 0,
          score: 0,
          totalPenaltySeconds: 0,
          startedAt: { seconds: 1000, nanoseconds: 0 },
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 0, answer: "Paris" });
      expect(res.status).toBe(400);
    });
  });

  describe("POST /game/:id/players/:userId/answer (EVALUATION mode)", () => {
    function dbWithPlayer() {
      const db = buildSessionDb({ mode: "EVALUATION" });
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 0,
          score: 0,
          totalPenaltySeconds: 0,
          startedAt: { seconds: 1000, nanoseconds: 0 },
        },
      };
      return db;
    }

    it("200: incorrect answer in EVALUATION still advances", async () => {
      const db = dbWithPlayer();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .post(`/game/${SESSION_ID}/players/${USER_ID}/answer`)
        .set(APP_CHECK_HEADER)
        .send({ questionIndex: 0, answer: "Wrong city" });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(false);
      expect(res.body.advanced).toBe(true);
    });
  });

  // ─── GET /game/:id/ranking ────────────────────────────────────────────────────

  describe("GET /game/:id/ranking", () => {
    it("200: returns ranking sorted by score", async () => {
      const db = buildSessionDb();
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        p1: {
          userId: "p1",
          displayName: "Alice",
          score: 20,
          currentQuestionIndex: 2,
          startedAt: { seconds: 100 },
          finishedAt: { seconds: 200 },
          totalPenaltySeconds: 0,
        },
        p2: {
          userId: "p2",
          displayName: "Bob",
          score: 10,
          currentQuestionIndex: 2,
          startedAt: { seconds: 100 },
          finishedAt: { seconds: 150 },
          totalPenaltySeconds: 0,
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/ranking`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.players[0].score).toBeGreaterThanOrEqual(
        res.body.players[1]?.score ?? 0,
      );
    });
  });

  // ─── GET /game/:id/results ────────────────────────────────────────────────────

  describe("GET /game/:id/results", () => {
    function dbWithFinishedPlayer() {
      const db = buildSessionDb();
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          displayName: "Alice",
          currentQuestionIndex: 2, // equals total questions (2)
          score: 20,
          totalPenaltySeconds: 0,
          startedAt: { seconds: 1000, nanoseconds: 0 },
          finishedAt: { seconds: 2000, nanoseconds: 0 },
        },
      };
      return db;
    }

    it("200: returns questions with validation for a finished player (via finishedAt)", async () => {
      const db = dbWithFinishedPlayer();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/results?userId=${USER_ID}`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body.questions)).toBe(true);
      expect(res.body.questions).toHaveLength(2);
      // validation should be present
      res.body.questions.forEach((q: any) => {
        expect(q).toHaveProperty("validation");
        expect(q.validation).toHaveProperty("expectedAnswer");
      });
    });

    it("200: returns questions with validation when currentQuestionIndex >= total (no finishedAt)", async () => {
      const db = buildSessionDb();
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 2, // equals total
          score: 20,
          startedAt: { seconds: 1000, nanoseconds: 0 },
          // no finishedAt
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/results?userId=${USER_ID}`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.questions).toHaveLength(2);
    });

    it("400: missing userId query param", async () => {
      const db = buildSessionDb();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/results`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(400);
    });

    it("404: session not found", async () => {
      const db = buildMockDb({ gameSessions: {} });
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/ghost/results?userId=${USER_ID}`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(404);
    });

    it("404: player not found in session", async () => {
      const db = buildSessionDb();
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/results?userId=unknown-player`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(404);
    });

    it("403: player has not finished yet", async () => {
      const db = buildSessionDb();
      db._data[`gameSessions/${SESSION_ID}/players`] = {
        [USER_ID]: {
          userId: USER_ID,
          currentQuestionIndex: 1, // still on question 1 of 2
          score: 10,
          startedAt: { seconds: 1000, nanoseconds: 0 },
          // no finishedAt
        },
      };
      const app = createPublicGameApi(db as any);
      const res = await request(app)
        .get(`/game/${SESSION_ID}/results?userId=${USER_ID}`)
        .set(APP_CHECK_HEADER);
      expect(res.status).toBe(403);
    });
  });
});
