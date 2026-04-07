---
description: "Use when creating or editing Express API routes or middlewares in functions/src/api/ or functions/src/middlewares/. Covers the API factory pattern, middleware stack order, input validation, ownership checks, and HTTP status codes."
applyTo: "functions/src/api/**,functions/src/middlewares/**"
---

# Firebase Cloud Functions API Rules

## API Factory Pattern

Every API file exports a factory function. Never create an Express app at module level:

```typescript
import express from "express";
import cors from "cors";
import type { Firestore } from "firebase-admin/firestore";
import { appCheckMiddleware } from "../middlewares/appCheck";
import { authMiddleware, type AuthRequest } from "../middlewares/auth";

export function createGameSessionsApi(db: Firestore) {
  const api = express();

  // ⚠️ Middleware order is fixed — do not change it
  api.use(cors({ origin: true }));
  api.use(express.json());
  api.use(appCheckMiddleware);
  api.use(authMiddleware);

  // routes...

  return api;
}
```

## Middleware Stack — Fixed Order

```
cors → express.json() → appCheckMiddleware → authMiddleware
```

Never add business logic before `authMiddleware`. After it, `req.user.uid` is always defined.

## Input Validation — Check Before Firestore

Validate required fields and types before any Firestore read or write:

```typescript
api.post("/gameSessions", async (req: AuthRequest, res) => {
  const { questionnaireId, mode } = req.body as {
    questionnaireId?: string;
    mode?: string;
  };

  if (!questionnaireId || !mode) {
    res.status(400).json({ error: "questionnaireId and mode are required" });
    return;
  }

  const validModes = ["EVALUATION", "LEARNING"];
  if (!validModes.includes(mode)) {
    res
      .status(400)
      .json({ error: `mode must be one of ${validModes.join(", ")}` });
    return;
  }

  // Now safe to touch Firestore
});
```

## Ownership Verification — Always Before Write/Delete

After reading the resource from Firestore, verify the caller owns it:

```typescript
const doc = await db.collection("questionnaires").doc(id).get();

if (!doc.exists) {
  res.status(404).json({ error: "Not found" });
  return;
}

const data = doc.data();
if (data?.userId !== req.user!.uid) {
  res.status(403).json({ error: "Forbidden" });
  return;
}

// Safe to mutate/delete
```

## HTTP Status Code Reference

| Situation                       | Status |
| ------------------------------- | ------ |
| Missing/invalid body fields     | `400`  |
| Missing or invalid auth token   | `401`  |
| Caller doesn't own the resource | `403`  |
| Resource not found              | `404`  |
| Unexpected error                | `500`  |

## Services Layer

Business logic (validation, calculation, mapping) belongs in `functions/src/services/`, not in API routes. Services must be pure functions with no Firestore or Express dependencies.

```typescript
// ✅ In API route — call service, handle result
import { validateAnswer } from "../services/answerValidator";

const result = validateAnswer(question, req.body.answer);
if (!result.ok) {
  res.status(400).json({ error: result.error });
  return;
}
```

## Error Handling

Wrap async route handlers to prevent unhandled rejections:

```typescript
api.get("/gameSessions/:id", async (req: AuthRequest, res) => {
  try {
    // ...
  } catch (err) {
    console.error("Unexpected error in GET /gameSessions/:id", err);
    res.status(500).json({ error: "Internal server error" });
  }
});
```
