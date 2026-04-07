# GuessIt – Project Guidelines

## Project Structure

Monorepo with three layers that share types via `shared/`:

| Folder       | Stack                            | Role                        |
| ------------ | -------------------------------- | --------------------------- |
| `frontend/`  | Vue 3, Vite, TypeScript, SASS    | SPA client                  |
| `functions/` | Node 24, Express, Firebase Admin | Cloud Functions API         |
| `shared/`    | Pure TypeScript                  | Models shared across layers |

## Build & Test Commands

```bash
# Frontend
cd frontend && npm run dev          # Dev server
cd frontend && npm run build        # Type-check + Vite build
cd frontend && npm run lint         # ESLint

# Functions
cd functions && npm run build       # tsc → lib/
cd functions && npm test            # Jest (ts-jest)

# Firebase emulators (from root)
firebase emulators:start
```

**Always run `cd functions && npm test` after modifying any file in `functions/src/api/` or `functions/src/services/`.**

## TypeScript: No `any`

- **Never use `any`** — use `unknown` with type narrowing, proper interfaces, or discriminated unions.
- Models are in `shared/models/`; import them via `@shared/models/`.
- Both `frontend/` and `functions/` are compiled with `"strict": true`.
- See [`.github/instructions/typescript.instructions.md`](.github/instructions/typescript.instructions.md) for full rules and examples.

## Path Aliases

| Alias       | Resolves to      |
| ----------- | ---------------- |
| `@/*`       | `frontend/src/*` |
| `@shared/*` | `shared/*`       |

## Architecture Conventions

- **Services layer** (`functions/src/services/`) — pure functions, no Firestore, no Express. Fully unit-testable.
- **API layer** (`functions/src/api/`) — Express factory `createXxxApi(db: Firestore)`, applies middlewares in order: `cors → json → appCheckMiddleware → authMiddleware`.
- **Composables** (`frontend/src/composables/`) — Vue 3 Composition API only, reactive shared state via `ref/computed`.
- **Firebase calls** in frontend go through the wrapper in `frontend/src/firebase/` (never call `fetch` directly in components/views).

## Shared Models & Discriminated Unions

Questions use a discriminated union on `type`:

```typescript
// Correct — narrow before accessing type-specific fields
if (question.type === "TEXT") {
  const text = question.expectedAnswer.text; // ✅ type-safe
}
```

## Defensive Practices

- Always validate required body fields in API endpoints before touching Firestore.
- Always verify ownership (e.g., the resource's `userId` must match `req.user.uid`) before write/delete operations.
- Return `401` for auth failures, `403` for ownership failures, `400` for validation failures, `500` for unexpected errors.
