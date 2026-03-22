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
import { createQuestionnairesApi } from "../../api/questionnaires";

const AUTH_HEADER = {
  Authorization: "Bearer mock-token",
  "X-Firebase-AppCheck": "mock-token",
};
const USER_ID = "user-123";

describe("Questionnaires API", () => {
  // ─── POST /questionnaires ───────────────────────────────────────────────────

  describe("POST /questionnaires", () => {
    it("200: creates questionnaire and returns questionnaireId", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .post("/questionnaires")
        .set(AUTH_HEADER)
        .send({
          questionnaire: { title: "My Quiz", questionIds: [] },
          userId: USER_ID,
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty("questionnaireId");
    });

    it("400: missing title", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .post("/questionnaires")
        .set(AUTH_HEADER)
        .send({ questionnaire: {}, userId: USER_ID });
      expect(res.status).toBe(400);
    });

    it("400: missing questionnaire", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .post("/questionnaires")
        .set(AUTH_HEADER)
        .send({ userId: USER_ID });
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /questionnaires ────────────────────────────────────────────────────

  describe("GET /questionnaires", () => {
    it("200: returns list for user", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Quiz A", createdBy: USER_ID, questionIds: [] },
          qn2: { title: "Quiz B", createdBy: "other", questionIds: [] },
        },
      });
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .get("/questionnaires")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
    });

    it("400: missing userId", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app).get("/questionnaires").set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /questionnaires/:id ────────────────────────────────────────────────

  describe("GET /questionnaires/:id", () => {
    it("200: returns questionnaire by id", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Quiz A", createdBy: USER_ID, questionIds: [] },
        },
      });
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .get("/questionnaires/qn1")
        .set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.id).toBe("qn1");
    });

    it("404: not found", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .get("/questionnaires/ghost")
        .set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });
  });

  // ─── PUT /questionnaires/:id ────────────────────────────────────────────────

  describe("PUT /questionnaires/:id", () => {
    it("200: updates questionnaire", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Old", createdBy: USER_ID, questionIds: [] },
        },
      });
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .put("/questionnaires/qn1")
        .set(AUTH_HEADER)
        .send({ updates: { title: "New" }, userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("403: different user cannot update", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Old", createdBy: "other", questionIds: [] },
        },
      });
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .put("/questionnaires/qn1")
        .set(AUTH_HEADER)
        .send({ updates: { title: "Hack" }, userId: USER_ID });
      expect(res.status).toBe(403);
    });

    it("404: not found", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .put("/questionnaires/ghost")
        .set(AUTH_HEADER)
        .send({ updates: { title: "x" }, userId: USER_ID });
      expect(res.status).toBe(404);
    });
  });

  // ─── DELETE /questionnaires/:id ─────────────────────────────────────────────

  describe("DELETE /questionnaires/:id", () => {
    it("200: deletes questionnaire", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Q", createdBy: USER_ID, questionIds: [] },
        },
      });
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .delete("/questionnaires/qn1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
    });

    it("403: different user cannot delete", async () => {
      const db = buildMockDb({
        questionnaires: {
          qn1: { title: "Q", createdBy: "other", questionIds: [] },
        },
      });
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .delete("/questionnaires/qn1")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(403);
    });

    it("404: not found", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .delete("/questionnaires/ghost")
        .set(AUTH_HEADER)
        .query({ userId: USER_ID });
      expect(res.status).toBe(404);
    });

    it("400: missing userId", async () => {
      const db = buildMockDb();
      const app = createQuestionnairesApi(db as any);
      const res = await request(app)
        .delete("/questionnaires/qn1")
        .set(AUTH_HEADER);
      expect(res.status).toBe(400);
    });
  });
});
