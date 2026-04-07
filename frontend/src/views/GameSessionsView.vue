<template>
  <div class="game-sessions-view">
    <div class="header">
      <h2>{{ t.gameSessions.title }}</h2>

      <router-link to="/dashboard/game-session/new" class="btn-add">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 4V16M4 10H16"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        {{ t.gameSessions.newSession }}
      </router-link>
    </div>
    <FilterInput class="game-sessions-view__filter" v-model="searchText" />

    <div v-if="loading" class="loading">{{ t.gameSessions.loading }}</div>

    <div v-else-if="gameSessions.length === 0" class="empty-state">
      <p>{{ t.gameSessions.noSessions }}</p>
      <router-link to="/dashboard/game-session/new" class="btn-primary">
        {{ t.gameSessions.createFirst }}
      </router-link>
    </div>

    <div v-else class="sessions-list">
      <div v-for="session in filteredGameSessions" :key="session.id" class="session-card">
        <div class="session-header">
          <div class="session-info">
            <h3 class="session-title">
              {{ session.title || `${t.gameSessions.sessionId} ${session.id?.substring(0, 8)}` }}
            </h3>
            <div class="session-badges">
              <span class="status-badge" :class="`status-${session.status.toLowerCase()}`">
                {{ getStatusLabel(session.status) }}
              </span>
              <span
                v-if="session.mode"
                class="mode-badge"
                :class="`mode-${session.mode.toLowerCase()}`"
              >
                {{
                  session.mode === 'EVALUATION'
                    ? t.gameSessions.modeEvaluation
                    : t.gameSessions.modeLearning
                }}
              </span>
            </div>
          </div>
          <span class="question-count">
            {{ session.questions.length }}
            {{
              session.questions.length === 1 ? t.gameSessions.question : t.gameSessions.questions
            }}
          </span>
        </div>

        <div class="session-details">
          <div class="detail-item">
            <span class="detail-label">{{ t.gameSessions.created }}</span>
            <span class="detail-value">{{ formatDate(session.startedAt) }}</span>
          </div>
          <div v-if="session.endedAt" class="detail-item">
            <span class="detail-label">{{ t.gameSessions.finished }}</span>
            <span class="detail-value">{{ formatDate(session.endedAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">{{ t.gameSessions.registrations }}</span>
            <span class="detail-value">
              <label class="toggle-switch">
                <input
                  type="checkbox"
                  :checked="session.isOpen"
                  @change="handleToggleOpen(session.id!, $event)"
                  :disabled="session.status === 'FINISHED'"
                />
                <span class="toggle-slider"></span>
              </label>
              {{ session.isOpen ? t.gameSessions.open : t.gameSessions.closed }}
            </span>
          </div>
        </div>

        <div class="session-actions">
          <button
            v-if="session.status === 'WAITING'"
            class="btn-icon"
            :title="t.gameSessions.actions.edit"
            @click="handleEdit(session.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2L18 6L6 18H2V14L14 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            v-if="session.status === 'WAITING'"
            class="btn-icon btn-play"
            :title="t.gameSessions.actions.start"
            @click="handleStart(session.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M5 3L19 10L5 17V3Z" fill="currentColor" />
            </svg>
          </button>
          <button
            v-if="session.status !== 'FINISHED'"
            class="btn-icon btn-finish"
            :title="t.gameSessions.actions.finish"
            @click="handleFinish(session.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M16 4L7 13L3 9"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            class="btn-icon btn-ranking"
            :title="t.gameSessions.actions.ranking"
            @click="handleViewRanking(session.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9 2L11 8H17L12 12L14 18L9 14L4 18L6 12L1 8H7L9 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            class="btn-icon btn-copy"
            :title="t.gameSessions.actions.copyLink"
            @click="handleCopyLink(session.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 13C10.93 13 11.395 13 11.776 12.869C12.376 12.66 12.86 12.176 13.069 11.576C13.2 11.195 13.2 10.73 13.2 9.8V6.2C13.2 5.27 13.2 4.805 13.069 4.424C12.86 3.824 12.376 3.34 11.776 3.131C11.395 3 10.93 3 10 3H6.4C5.47 3 5.005 3 4.624 3.131C4.024 3.34 3.54 3.824 3.331 4.424C3.2 4.805 3.2 5.27 3.2 6.2V9.8C3.2 10.73 3.2 11.195 3.331 11.576C3.54 12.176 4.024 12.66 4.624 12.869C5.005 13 5.47 13 6.4 13H10Z"
                stroke="currentColor"
                stroke-width="2"
              />
              <path
                d="M6.8 13V13.8C6.8 14.73 6.8 15.195 6.931 15.576C7.14 16.176 7.624 16.66 8.224 16.869C8.605 17 9.07 17 10 17H13.6C14.53 17 14.995 17 15.376 16.869C15.976 16.66 16.46 16.176 16.669 15.576C16.8 15.195 16.8 14.73 16.8 13.8V10.2C16.8 9.27 16.8 8.805 16.669 8.424C16.46 7.824 15.976 7.34 15.376 7.131C14.995 7 14.53 7 13.6 7H13"
                stroke="currentColor"
                stroke-width="2"
              />
            </svg>
          </button>
          <button
            v-if="session.status === 'WAITING' || session.status === 'FINISHED'"
            class="btn-icon btn-delete"
            :title="t.gameSessions.actions.delete"
            @click="handleDelete(session.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 5H17M8 3H12M8 9V15M12 9V15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M5 5L6 17H14L15 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getGameSessionsByUser,
  deleteGameSession,
  updateGameSessionStatus,
  toggleGameSessionOpen,
} from '@/firebase/gameSession';
import { auth } from '@/firebase/auth';
import type { FirebaseTimestamp, GameSession } from '@shared/models/GameSession';
import { useI18n } from '@/composables/useI18n';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { useConfirmDialog } from '@/composables/useConfirmDialog';
import { useToast } from '@/composables/useToast';
import { formatError } from '@/utils/errorUtils';
import FilterInput from '@/components/FilterInput.vue';

const { t } = useI18n();
const router = useRouter();
const { showError } = useErrorHandler();
const { confirm } = useConfirmDialog();
const { success, error: showToastError } = useToast();
const gameSessions = ref<GameSession[]>([]);
const loading = ref(true);
const searchText = ref('');

const filteredGameSessions = computed(() => {
  const query = searchText.value.trim().toLowerCase();
  if (!query) return gameSessions.value;
  return gameSessions.value.filter(s => {
    const statusLabel = getStatusLabel(s.status).toLowerCase();
    const title = (s.title || '').toLowerCase();
    return title.includes(query) || statusLabel.includes(query);
  });
});

const loadGameSessions = async () => {
  try {
    const currentUser = auth.currentUser!;
    gameSessions.value = await getGameSessionsByUser(currentUser.uid);
  } catch (_error: unknown) {
    const errorMessage = formatError(_error, t.value.gameSessions.alerts.loadError);
    showError(errorMessage, {
      returnUrl: '/dashboard',
    });
  } finally {
    loading.value = false;
  }
};

const handleEdit = (sessionId: string) => {
  router.push(`/dashboard/game-session/${sessionId}`);
};

const handleStart = async (sessionId: string) => {
  const confirmed = await confirm(t.value.gameSessions.confirmations.start, {
    confirmButtonClass: 'btn-primary',
  });

  if (!confirmed) return;

  try {
    await updateGameSessionStatus(sessionId, 'RUNNING');
    await loadGameSessions();
  } catch (_error: unknown) {
    const errorMessage = formatError(_error, t.value.gameSessions.alerts.startError);
    showError(errorMessage);
  }
};

const handleFinish = async (sessionId: string) => {
  const confirmed = await confirm(t.value.gameSessions.confirmations.finish, {
    confirmButtonClass: 'btn-warning',
  });

  if (!confirmed) return;

  try {
    await updateGameSessionStatus(sessionId, 'FINISHED');
    await loadGameSessions();
  } catch (_error: unknown) {
    const errorMessage = formatError(_error, t.value.gameSessions.alerts.finishError);
    showError(errorMessage);
  }
};

const handleToggleOpen = async (sessionId: string, event: Event) => {
  const target = event.target as HTMLInputElement;
  const newValue = target.checked;

  try {
    await toggleGameSessionOpen(sessionId, newValue);
    // Actualizar localmente
    const session = gameSessions.value.find(s => s.id === sessionId);
    if (session) {
      session.isOpen = newValue;
    }
  } catch (_error: unknown) {
    const errorMessage = formatError(_error, t.value.gameSessions.alerts.toggleError);
    showError(errorMessage);
    // Revertir el checkbox
    target.checked = !newValue;
  }
};

const handleDelete = async (sessionId: string) => {
  const confirmed = await confirm(t.value.gameSessions.confirmations.delete, {
    confirmButtonClass: 'btn-danger',
  });

  if (!confirmed) return;

  try {
    await deleteGameSession(sessionId);
    gameSessions.value = gameSessions.value.filter(s => s.id !== sessionId);
  } catch (_error: unknown) {
    const errorMessage = formatError(_error, t.value.gameSessions.alerts.deleteError);
    showError(errorMessage);
  }
};

const handleViewRanking = (sessionId: string) => {
  router.push(`/game/${sessionId}/ranking`);
};

const handleCopyLink = async (sessionId: string) => {
  const gameUrl = `${window.location.origin}/game/${sessionId}`;
  try {
    await navigator.clipboard.writeText(gameUrl);
    success(t.value.gameSessions.alerts.linkCopied);
  } catch (_error: unknown) {
    // Fallback para navegadores que no soportan clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = gameUrl;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      success(t.value.gameSessions.alerts.linkCopied);
    } catch (_err: unknown) {
      showToastError(t.value.gameSessions.alerts.linkCopyError);
    }
    document.body.removeChild(textArea);
  }
};

const getStatusLabel = (status: string) => {
  const statusMap: Record<string, string> = {
    WAITING: t.value.gameSessions.status.waiting,
    RUNNING: t.value.gameSessions.status.running,
    FINISHED: t.value.gameSessions.status.finished,
  };
  return statusMap[status] || status;
};

const formatDate = (timestamp: FirebaseTimestamp) => {
  if (!timestamp || !timestamp.seconds) return '';

  const date = new Date(timestamp.seconds * 1000);

  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

onMounted(() => {
  loadGameSessions();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.game-sessions-view {
  @include page-view(1200px);
}

.game-sessions-view__filter {
  margin-bottom: 1rem;
}

.header {
  @include page-header;
}

.loading,
.empty-state {
  @include loading-state;
}

.empty-state p {
  margin-bottom: 1.5rem;
  font-size: $font-size-lg;
}

.sessions-list {
  @include cards-grid(320px);
}

.session-card {
  @include card-base;
  @include card-hover;
}

.session-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  flex: 1;
}

.session-title {
  margin: 0;
  font-size: $font-size-lg;
  color: $text-strong;
  font-family: monospace;
}

.session-badges {
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
  align-items: center;
}

.question-count {
  @include badge-base;
  background-color: #f5f5f5;
  color: $text-secondary;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  padding-top: 1rem;
  border-top: 1px solid $border-separator;
  margin-bottom: $spacing-xs;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: $font-size-md;
}

.detail-label {
  color: $text-muted;
}

.detail-value {
  color: $text-strong;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: $spacing-xs;
}

/* Toggle Switch */
.toggle-switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
  margin: 0;
}

.toggle-switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: $transition-normal;
  border-radius: 20px;
}

.toggle-slider:before {
  position: absolute;
  content: '';
  height: 14px;
  width: 14px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: $transition-normal;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: $status-finished-color;
}

.toggle-switch input:checked + .toggle-slider:before {
  transform: translateX(20px);
}

.toggle-switch input:disabled + .toggle-slider {
  opacity: 0.5;
  cursor: not-allowed;
}

.session-actions {
  display: flex;
  flex-wrap: wrap;
  gap: $spacing-xs;
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .btn-add {
    justify-content: center;
  }

  .sessions-list {
    grid-template-columns: 1fr;
  }
}
</style>
