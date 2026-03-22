// Mock Firebase Admin before any imports that trigger module-level calls
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
import { createQuestionsApi } from "../../api/questions";

const AUTH_HEADER = {
  Authorization: "Bearer mock-token",
  "X-Firebase-AppCheck": "mock-token",
};
const USER_ID = "user-123";

describe("Questions API", () => {
  // ─── POST /questions ────────────────────────────────────────────────────────

  describe("POST /questions", () => {
    it("201: creates question and returns questionId", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .post("/questions")
        .set(AUTH_HEADER)
        .send({
          question: { title: "What is 2+2?", type: "NUMBER" },
          userId: USER_ID,
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("questionId");
    });

    it("400: missing question body", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .post("/questions")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(400);
    });

    it("400: missing userId", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .post("/questions")
        .set(AUTH_HEADER)
        .send({ question: { title: "?" } });
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /questions ─────────────────────────────────────────────────────────

  describe("GET /questions", () => {
    it("200: returns list of questions for user", async () => {
      const db = buildMockDb({
        questions: {
          q1: { title: "Q1", createdBy: USER_ID, type: "TEXT" },
          q2: { title: "Q2", createdBy: "other-user", type: "TEXT" },
        },
      });
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .get("/questions")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("400: missing userId", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app).get("/questions").set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /questions/:id ─────────────────────────────────────────────────────

  describe("GET /questions/:id", () => {
    it("200: returns question by id", async () => {
      const db = buildMockDb({
        questions: { q1: { title: "Q1", createdBy: USER_ID } },
      });
      const app = createQuestionsApi(db as any);
      const res = await request(app).get("/questions/q1").set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("q1");
    });

    it("404: question not found", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .get("/questions/nonexistent")
        .set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /questions/:id ─────────────────────────────────────────────────────

  describe("PUT /questions/:id", () => {
    it("200: updates question successfully", async () => {
      const db = buildMockDb({
        questions: { q1: { title: "Old", createdBy: USER_ID } },
      });
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .put("/questions/q1")
        .set(AUTH_HEADER)
        .send({ updates: { title: "New" }, userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("403: different user cannot update", async () => {
      const db = buildMockDb({
        questions: { q1: { title: "Old", createdBy: "other-user" } },
      });
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .put("/questions/q1")
        .set(AUTH_HEADER)
        .send({ updates: { title: "Hack" }, userId: USER_ID });
      expect(res.status).toBe(403);
    });

    it("404: question not found", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .put("/questions/ghost")
        .set(AUTH_HEADER)
        .send({ updates: { title: "x" }, userId: USER_ID });
      expect(res.status).toBe(404);
    });

    it("400: missing updates or userId", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .put("/questions/q1")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(400);
    });
  });

  // ─── DELETE /questions/:id ───────────────────────────────────────────────────

  describe("DELETE /questions/:id", () => {
    it("200: deletes question", async () => {
      const db = buildMockDb({
        questions: { q1: { title: "Q1", createdBy: USER_ID } },
      });
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .delete("/questions/q1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("403: different user cannot delete", async () => {
      const db = buildMockDb({
        questions: { q1: { title: "Q1", createdBy: "other" } },
      });
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .delete("/questions/q1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(403);
    });

    it("404: question not found", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app)
        .delete("/questions/ghost")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(404);
    });

    it("400: missing userId", async () => {
      const db = buildMockDb();
      const app = createQuestionsApi(db as any);
      const res = await request(app).delete("/questions/q1").set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });
  });
});
