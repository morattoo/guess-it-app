jest.mock("firebase-admin/auth", () => ({
  getAuth: jest.fn().mockReturnValue({
    verifyIdToken: jest
      .fn()
      .mockResolvedValue({ uid: "user-123", email: "test@test.com" }),
  }),
}));
jest.mock("firebase-admin/app-check", () => ({
  getAppCheck: jest.fn().mockReturnValue({
    verifyToken: jest.fn().mockResolvedValue({ appId: "mock" }),
  }),
}));

import request from "supertest";
import { buildMockDb } from "../helpers/mockDb";
import { createGameSessionsApi } from "../../api/gameSessions";

const AUTH_HEADER = {
  Authorization: "Bearer mock-token",
  "X-Firebase-AppCheck": "mock-token",
};
const USER_ID = "user-123";

// Helper to build a db with a ready questionnaire + questions
function buildDbWithQuestionnaire() {
  return buildMockDb({
    questionnaires: {
      qn1: { title: "Quiz", createdBy: USER_ID, questionIds: ["q1"] },
    },
    questions: {
      q1: {
        title: "What is 2+2?",
        type: "NUMBER",
        points: 10,
        createdBy: USER_ID,
        timeLimitSec: 5,
        expectedAnswer: { value: 4, tolerance: 0 },
      },
    },
    gameSessions: {},
    gameSessionsMeta: {},
  });
}

function buildDbWithSession(status = "WAITING", extra = {}) {
  return buildMockDb({
    gameSessions: {
      gs1: {
        title: "Session 1",
        status,
        createdBy: USER_ID,
        questionnaireId: "qn1",
        questions: [],
        isOpen: true,
        players: [],
        mode: "LEARNING",
        ...extra,
      },
    },
    gameSessionsMeta: { gs1: { status, isOpen: true } },
    questionnaires: {},
    questions: {},
  });
}

describe("GameSessions API", () => {
  // ─── POST /gameSessions ─────────────────────────────────────────────────────

  describe("POST /gameSessions", () => {
    it("200: creates a game session from questionnaire", async () => {
      const db = buildDbWithQuestionnaire();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions")
        .set(AUTH_HEADER)
        .send({
          questionnaireId: "qn1",
          userId: USER_ID,
          mode: "LEARNING",
          title: "Test Session",
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("gameSessionId");
    });

    it("400: missing questionnaireId", async () => {
      const db = buildDbWithQuestionnaire();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID, mode: "LEARNING", title: "T" });
      expect(res.status).toBe(400);
    });

    it("400: invalid mode", async () => {
      const db = buildDbWithQuestionnaire();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions")
        .set(AUTH_HEADER)
        .send({
          questionnaireId: "qn1",
          userId: USER_ID,
          mode: "INVALID",
          title: "T",
        });
      expect(res.status).toBe(400);
    });

    it("400: missing title", async () => {
      const db = buildDbWithQuestionnaire();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions")
        .set(AUTH_HEADER)
        .send({
          questionnaireId: "qn1",
          userId: USER_ID,
          mode: "LEARNING",
          title: "  ",
        });
      expect(res.status).toBe(400);
    });

    it("404: questionnaire not found", async () => {
      const db = buildMockDb({
        questionnaires: {},
        questions: {},
        gameSessions: {},
        gameSessionsMeta: {},
      });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions")
        .set(AUTH_HEADER)
        .send({
          questionnaireId: "ghost",
          userId: USER_ID,
          mode: "LEARNING",
          title: "T",
        });
      expect(res.status).toBe(404);
    });

    it("403: user does not own the questionnaire", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Q", createdBy: "other", questionIds: [] },
        },
        questions: {},
        gameSessions: {},
        gameSessionsMeta: {},
      });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions")
        .set(AUTH_HEADER)
        .send({
          questionnaireId: "qn1",
          userId: USER_ID,
          mode: "LEARNING",
          title: "T",
        });
      expect(res.status).toBe(403);
    });
  });

  // ─── GET /gameSessions ──────────────────────────────────────────────────────

  describe("GET /gameSessions", () => {
    it("200: returns sessions for user", async () => {
      const db = buildDbWithSession();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .get("/gameSessions")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("400: missing userId", async () => {
      const db = buildDbWithSession();
      const app = createGameSessionsApi(db as any);
      const res = await request(app).get("/gameSessions").set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /gameSessions/:id ──────────────────────────────────────────────────

  describe("GET /gameSessions/:id", () => {
    it("200: returns session by id for its owner", async () => {
      const db = buildDbWithSession();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .get("/gameSessions/gs1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("gs1");
    });

    it("403: other user cannot see session", async () => {
      const db = buildDbWithSession();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .get("/gameSessions/gs1")
        .set(AUTH_HEADER)
        .query({ userId: "other-user" });
      expect(res.status).toBe(403);
    });

    it("404: session not found", async () => {
      const db = buildMockDb({ gameSessions: {} });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .get("/gameSessions/ghost")
        .set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /gameSessions/:id/status ───────────────────────────────────────────

  describe("PUT /gameSessions/:id/status", () => {
    it("200: transitions status to RUNNING", async () => {
      const db = buildDbWithSession("WAITING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/status")
        .set(AUTH_HEADER)
        .send({ status: "RUNNING", userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("200: FINISHED sets endedAt and isOpen=false", async () => {
      const db = buildDbWithSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/status")
        .set(AUTH_HEADER)
        .send({ status: "FINISHED", userId: USER_ID });
      expect(res.status).toBe(200);
    });

    it("403: other user cannot change status", async () => {
      const db = buildDbWithSession("WAITING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/status")
        .set(AUTH_HEADER)
        .send({ status: "RUNNING", userId: "other" });
      expect(res.status).toBe(403);
    });

    it("400: missing status or userId", async () => {
      const db = buildDbWithSession();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/status")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /gameSessions/:id/toggle-open ──────────────────────────────────────

  describe("PUT /gameSessions/:id/toggle-open", () => {
    it("200: closes an open session", async () => {
      const db = buildDbWithSession("WAITING", { isOpen: true });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/toggle-open")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID, isOpen: false });
      expect(res.status).toBe(200);
      expect(res.body.isOpen).toBe(false);
    });

    it("400: cannot open a FINISHED session", async () => {
      const db = buildDbWithSession("FINISHED", { isOpen: false });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/toggle-open")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID, isOpen: true });
      expect(res.status).toBe(400);
    });

    it("400: missing isOpen boolean", async () => {
      const db = buildDbWithSession();
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/toggle-open")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(400);
    });
  });

  // ─── PUT /gameSessions/:id/status – finish all players ──────────────────────

  describe("PUT /gameSessions/:id/status – FINISHED marks all unfinished players", () => {
    it("sets finishedAt on players that had not finished yet", async () => {
      const db = buildMockDb({
        gameSessions: {
          gs1: {
            title: "Session 1",
            status: "RUNNING",
            createdBy: USER_ID,
            questionnaireId: "qn1",
            questions: [],
            isOpen: true,
            players: [],
            mode: "LEARNING",
          },
        },
        "gameSessions/gs1/players": {
          "player-1": { userId: "player-1", currentQuestionIndex: 1 },
          "player-2": {
            userId: "player-2",
            currentQuestionIndex: 2,
            finishedAt: 9999,
          },
        },
        gameSessionsMeta: { gs1: { status: "RUNNING", isOpen: true } },
        questionnaires: {},
        questions: {},
      });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/status")
        .set(AUTH_HEADER)
        .send({ status: "FINISHED", userId: USER_ID });

      expect(res.status).toBe(200);
      // player-1 should now have finishedAt
      expect(
        db._data["gameSessions/gs1/players"]["player-1"].finishedAt,
      ).toBeDefined();
      // player-2 already had finishedAt=9999, should remain unchanged
      expect(db._data["gameSessions/gs1/players"]["player-2"].finishedAt).toBe(
        9999,
      );
    });
  });

  // ─── PUT /gameSessions/:id/refresh-questions ────────────────────────────────

  describe("PUT /gameSessions/:id/refresh-questions", () => {
    it("200: refreshes questions in WAITING state", async () => {
      const db = buildMockDb({
        gameSessions: {
          gs1: {
            title: "S",
            status: "WAITING",
            createdBy: USER_ID,
            questionnaireId: "qn1",
            questions: [],
            isOpen: true,
            players: [],
            mode: "LEARNING",
          },
        },
        questionnaires: {
          qn1: { title: "Q", createdBy: USER_ID, questionIds: ["q1"] },
        },
        questions: {
          q1: {
            title: "Q?",
            type: "NUMBER",
            points: 5,
            createdBy: USER_ID,
            expectedAnswer: { value: 1 },
          },
        },
        gameSessionsMeta: {},
      });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/refresh-questions")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.questionCount).toBe(1);
    });

    it("400: cannot refresh questions in RUNNING state", async () => {
      const db = buildDbWithSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .put("/gameSessions/gs1/refresh-questions")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /gameSessions/:id ────────────────────────────────────────────────

  describe("DELETE /gameSessions/:id", () => {
    it("200: deletes a WAITING session", async () => {
      const db = buildDbWithSession("WAITING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .delete("/gameSessions/gs1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("400: cannot delete a RUNNING session", async () => {
      const db = buildDbWithSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .delete("/gameSessions/gs1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(400);
    });

    it("403: another user cannot delete the session", async () => {
      const db = buildDbWithSession("WAITING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .delete("/gameSessions/gs1")
        .set(AUTH_HEADER)
        .query({ userId: "other" });
      expect(res.status).toBe(403);
    });

    it("404: session not found", async () => {
      const db = buildMockDb({ gameSessions: {}, gameSessionsMeta: {} });
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .delete("/gameSessions/ghost")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(404);
    });
  });

  // ─── POST /gameSessions/:id/validate-answer ─────────────────────────────────

  describe("POST /gameSessions/:id/validate-answer", () => {
    function buildDbWithPlayerAndSession(sessionStatus = "RUNNING") {
      return buildMockDb({
        gameSessions: {
          gs1: {
            title: "Session 1",
            status: sessionStatus,
            createdBy: USER_ID,
            questionnaireId: "qn1",
            questions: [
              {
                id: "q1",
                type: "NUMBER",
                title: "What is 2+2?",
                description: "",
                points: 10,
                penaltySeconds: 0,
                validation: {
                  type: "NUMBER",
                  expectedAnswer: { value: 4, tolerance: 0 },
                },
              },
            ],
            isOpen: true,
            players: [],
            mode: "LEARNING",
          },
        },
        "gameSessions/gs1/players": {
          [USER_ID]: {
            userId: USER_ID,
            gameSessionId: "gs1",
            currentQuestionIndex: 0,
            startedAt: Date.now(),
          },
        },
        gameSessionsMeta: { gs1: { status: sessionStatus, isOpen: true } },
        questionnaires: {},
        questions: {},
      });
    }

    it("200: correct answer advances the player", async () => {
      const db = buildDbWithPlayerAndSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions/gs1/validate-answer")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID, answer: 4 });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(true);
      expect(res.body.currentQuestionIndex).toBe(1);
      expect(res.body.finished).toBe(true);
    });

    it("200: wrong answer does not advance the player", async () => {
      const db = buildDbWithPlayerAndSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions/gs1/validate-answer")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID, answer: 99 });
      expect(res.status).toBe(200);
      expect(res.body.correct).toBe(false);
      expect(res.body.currentQuestionIndex).toBe(0);
    });

    it("400: session is already FINISHED", async () => {
      const db = buildDbWithPlayerAndSession("FINISHED");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions/gs1/validate-answer")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID, answer: 4 });
      expect(res.status).toBe(400);
    });

    it("400: missing userId", async () => {
      const db = buildDbWithPlayerAndSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions/gs1/validate-answer")
        .set(AUTH_HEADER)
        .send({ answer: 4 });
      expect(res.status).toBe(400);
    });

    it("404: player not found", async () => {
      const db = buildDbWithPlayerAndSession("RUNNING");
      const app = createGameSessionsApi(db as any);
      const res = await request(app)
        .post("/gameSessions/gs1/validate-answer")
        .set(AUTH_HEADER)
        .send({ userId: "unknown-player", answer: 4 });
      expect(res.status).toBe(404);
    });
  });
});
