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
import { createUsersApi } from "../../api/users";

const AUTH_HEADER = {
  Authorization: "Bearer mock-token",
  "X-Firebase-AppCheck": "mock-token",
};
const USER_ID = "user-123";

describe("Users API", () => {
  // ─── POST /users ─────────────────────────────────────────────────────────────

  describe("POST /users", () => {
    it("200: creates user profile", async () => {
      const db = buildMockDb();
      const app = createUsersApi(db as any);
      const res = await request(app)
        .post("/users")
        .set(AUTH_HEADER)
        .send({ uid: USER_ID, name: "Alice", email: "alice@test.com" });
      expect(res.status).toBe(200);
      expect(res.body).toEqual({ success: true, uid: USER_ID });
    });

    it("403: cannot create profile for another user", async () => {
      const db = buildMockDb();
      const app = createUsersApi(db as any);
      // The auth mock returns uid "user-123", but the request body has a different uid
      const res = await request(app)
        .post("/users")
        .set(AUTH_HEADER)
        .send({ uid: "attacker-uid", name: "Hacker", email: "hack@test.com" });
      expect(res.status).toBe(403);
    });

    it("400: missing required fields", async () => {
      const db = buildMockDb();
      const app = createUsersApi(db as any);
      const res = await request(app)
        .post("/users")
        .set(AUTH_HEADER)
        .send({ uid: USER_ID, name: "Alice" }); // missing email
      expect(res.status).toBe(400);
    });
  });

  // ─── GET /users/:uid ─────────────────────────────────────────────────────────

  describe("GET /users/:uid", () => {
    it("200: returns own user profile", async () => {
      const db = buildMockDb({
        users: {
          [USER_ID]: { name: "Alice", email: "alice@test.com" },
        },
      });
      const app = createUsersApi(db as any);
      const res = await request(app).get(`/users/${USER_ID}`).set(AUTH_HEADER);
      expect(res.status).toBe(200);
      expect(res.body.name).toBe("Alice");
    });

    it("403: cannot access another user's profile", async () => {
      const db = buildMockDb({
        users: {
          "other-user": { name: "Bob", email: "bob@test.com" },
        },
      });
      const app = createUsersApi(db as any);
      const res = await request(app).get("/users/other-user").set(AUTH_HEADER);
      expect(res.status).toBe(403);
    });

    it("404: profile not found", async () => {
      const db = buildMockDb();
      const app = createUsersApi(db as any);
      const res = await request(app).get(`/users/${USER_ID}`).set(AUTH_HEADER);
      expect(res.status).toBe(404);
    });
  });
});
