---
description: "Use when creating, editing, or running tests in the functions/ backend. Covers Jest + ts-jest setup, mock patterns for Firebase Admin SDK, supertest for API endpoints, and naming conventions."
applyTo: "functions/src/**"
---

# Backend Testing Rules

**After modifying any file in `functions/src/api/` or `functions/src/services/`, always run:**

```bash
cd functions && npm test
```

Fix all test failures before considering the task done.

## Test Structure

Tests live in `functions/src/__tests__/` mirroring the source tree:

```
functions/src/__tests__/
  services/      ← unit tests for functions/src/services/
  api/           ← integration tests for functions/src/api/
  helpers/       ← shared test utilities (mockDb, etc.)
```

## Service Tests — Pure Unit Tests

Services are pure functions. No mocks needed unless they call external deps.

```typescript
import { validateAnswer } from "../../services/answerValidator";

describe("validateAnswer", () => {
  it("returns ok:true for a correct TEXT answer", () => {
    const question = {
      type: "TEXT",
      expectedAnswer: { text: "Paris", caseSensitive: false },
    };
    const result = validateAnswer(question as StoredQuestion, {
      text: "paris",
    });
    expect(result).toEqual({ ok: true, isCorrect: true });
  });

  it("returns ok:false for unknown question type", () => {
    const result = validateAnswer(
      { type: "UNKNOWN" } as unknown as StoredQuestion,
      {},
    );
    expect(result.ok).toBe(false);
  });
});
```

## API Tests — supertest + Mocked Firebase Admin

Use `supertest` to test Express API factories. Mock Firebase Admin at the module level.

```typescript
import request from "supertest";
import { createGameSessionsApi } from "../../api/gameSessions";
import { buildMockDb } from "../helpers/mockDb";

// Mock Firebase Admin BEFORE importing API modules
jest.mock("firebase-admin/auth", () => ({
  getAuth: () => ({
    verifyIdToken: jest.fn().mockResolvedValue({ uid: "user-1" }),
  }),
}));
jest.mock("firebase-admin/app-check", () => ({
  getAppCheck: () => ({
    verifyToken: jest.fn().mockResolvedValue({ appId: "app-1" }),
  }),
}));

describe("POST /gameSessions", () => {
  it("returns 400 when questionnaireId is missing", async () => {
    const db = buildMockDb({});
    const app = createGameSessionsApi(db as unknown as Firestore);

    const res = await request(app)
      .post("/gameSessions")
      .set("Authorization", "Bearer valid-token")
      .set("X-Firebase-AppCheck", "valid-token")
      .send({ userId: "user-1" }); // missing questionnaireId

    expect(res.status).toBe(400);
  });
});
```

## Mock Firestore — `buildMockDb`

Use the helper in `functions/src/__tests__/helpers/mockDb.ts`:

```typescript
const db = buildMockDb({
  questionnaires: {
    "questionnaire-1": { userId: "user-1", title: "My Quiz" },
  },
});
```

## Arrange / Act / Assert Pattern

Structure every test in three clear sections:

```typescript
it("returns 403 when user does not own the questionnaire", async () => {
  // Arrange
  const db = buildMockDb({
    questionnaires: { "q-1": { userId: "other-user" } },
  });
  const app = createQuestionnairesApi(db as unknown as Firestore);

  // Act
  const res = await request(app)
    .delete("/questionnaires/q-1")
    .set("Authorization", "Bearer token");

  // Assert
  expect(res.status).toBe(403);
});
```

## Coverage

Jest collects coverage from `src/api/**/*.ts` and `src/services/**/*.ts`. Aim to cover:

- Happy path
- Missing/invalid input (400)
- Auth failure (401)
- Ownership failure (403)
- Not-found cases (404)
