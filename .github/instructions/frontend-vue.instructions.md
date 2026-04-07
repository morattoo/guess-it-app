---
description: "Use when writing or editing Vue components, views, or composables in frontend/src/. Covers Vue 3 Composition API patterns, composable conventions, error handling with useErrorHandler, and Firebase API usage."
applyTo: "frontend/src/**"
---

# Frontend Vue 3 Rules

## Composition API Only

Always use `<script setup lang="ts">`. Never use Options API or `defineComponent`.

```vue
<script setup lang="ts">
import { ref, computed } from "vue";
import type { GameSession } from "@shared/models/GameSession";

const sessions = ref<GameSession[]>([]);
const hasItems = computed(() => sessions.value.length > 0);
</script>
```

## Error Handling — Always Use `useErrorHandler`

Never show raw errors to the user. Route all errors through `useErrorHandler`:

```typescript
import { useErrorHandler } from "@/composables/useErrorHandler";

const { showError } = useErrorHandler();

async function loadData() {
  try {
    sessions.value = await getGameSessionsByUser();
  } catch (err) {
    showError("Failed to load game sessions", { title: "Load Error" });
  }
}
```

For navigation alongside errors, also pass `returnUrl` and `returnButtonText`.

## Firebase Calls — Through `frontend/src/firebase/` Only

Never call `fetch` directly in components or views. Always use the typed wrappers:

```typescript
// ✅ Correct — uses wrapper in frontend/src/firebase/
import { createGameSession } from "@/firebase/gameSession";

// ❌ Wrong — direct fetch in a component
const res = await fetch(`${API_URL}/gameSessions`, { ... });
```

If no wrapper exists for the endpoint you need, add one to the appropriate file in `frontend/src/firebase/`.

## Composables — Shared Reactive State

For shared state across components, use module-level `ref` inside a composable (not `provide/inject`):

```typescript
// composables/useToast.ts
const toast = ref<ToastState>({ show: false, message: "" });

export function useToast() {
  const show = (message: string) => {
    toast.value = { show: true, message };
  };
  const hide = () => {
    toast.value = { ...toast.value, show: false };
  };
  return { toast, show, hide };
}
```

## Internationalization

All user-facing strings must use `useI18n`:

```typescript
import { useI18n } from "@/composables/useI18n";
const { t } = useI18n();
// In template: {{ t("key.path") }}
```

## Toast Notifications — `useToast`

Use `useToast` for transient feedback (success, info) and `useErrorHandler` for fatal errors.

## Path Aliases

- `@/*` → `frontend/src/*`
- `@shared/*` → `shared/*`

Always use aliases over relative `../../` paths.
