---
description: "Use when writing or editing TypeScript or Vue files. Enforces strict type safety: no `any`, discriminated unions, unknown narrowing, shared models. Covers type patterns for all layers (frontend, functions, shared)."
applyTo: "**/*.ts,**/*.vue"
---

# TypeScript Rules

Both `frontend/` and `functions/` use `"strict": true`. Never weaken this.

## Never use `any`

| Instead of `any`… | Use…                                                 |
| ----------------- | ---------------------------------------------------- |
| Unknown input     | `unknown` + type narrowing                           |
| Dynamic shape     | A proper interface or union type                     |
| External data     | Validate at the boundary, then cast to a typed model |
| Generic util      | A generic `<T>` parameter                            |

```typescript
// ❌ Wrong
function process(data: any) {
  return data.value;
}

// ✅ Correct
function process(data: unknown): string {
  if (typeof data === "object" && data !== null && "value" in data) {
    return String((data as { value: unknown }).value);
  }
  throw new Error("Invalid data");
}
```

## Shared Models

Import all domain types from `@shared/models/`:

```typescript
import type { Question } from "@shared/models/Question";
import type { GameSession } from "@shared/models/GameSession";
```

Never redefine types that already exist in `shared/`. Check there first.

## Discriminated Unions — Always Narrow First

`Question` is a union discriminated by `type`. Access type-specific fields only after narrowing:

```typescript
// ❌ Wrong
const answer = question.expectedAnswer.text; // may not exist

// ✅ Correct
if (question.type === "TEXT") {
  const answer = question.expectedAnswer.text; // type-safe
}
```

Use exhaustive switches with a `never` check for new variants:

```typescript
function getLabel(q: Question): string {
  switch (q.type) {
    case "TEXT":
      return "Text";
    case "NUMBER":
      return "Number";
    case "CHOICE":
      return "Choice";
    case "ORDERING":
      return "Ordering";
    default: {
      const _exhaustive: never = q;
      return _exhaustive;
    }
  }
}
```

## Result / Union Types for Errors (Services)

Service functions return `{ ok: true; ... } | { ok: false; error: string }` — never throw:

```typescript
type ValidationResult =
  | { ok: true; isCorrect: boolean }
  | { ok: false; error: string };

export function validateAnswer(
  question: StoredQuestion,
  answer: unknown,
): ValidationResult {
  if (question.type === "TEXT") {
    // ...
    return { ok: true, isCorrect: true };
  }
  return { ok: false, error: "Unknown question type" };
}
```

## `noUnusedLocals` & `noUnusedParameters`

Prefix intentionally unused variables with `_`:

```typescript
// ✅ Allowed unused parameter
function handler(_req: Request, res: Response) { ... }
```

## Type Assertions

Avoid `as unknown as T` double casts. If needed only when crossing an untyped boundary (e.g., Firebase SDK returns), add a comment explaining why:

```typescript
// Firebase Admin returns `unknown` for custom claims — shape is guaranteed by our token minting
const claims = decodedToken.email as string;
```
