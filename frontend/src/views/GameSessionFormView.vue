<template>
  <div class="game-session-form-view">
    <div class="game-session-form-view__header">
      <h2>{{ isEdit ? t.gameSessions.editTitle : t.gameSessions.newTitle }}</h2>
    </div>

    <BaseLoader v-model="loading" overlay :text="t.common.loading" :size="60" color="#10b981" />

    <div v-if="!loading" class="form-container">
      <form @submit.prevent="handleSubmit">
        <div v-if="!isEdit" class="form-group">
          <label>{{ t.gameSessions.sessionTitleLabel }}</label>
          <input
            v-model="sessionTitle"
            type="text"
            class="form-control"
            :placeholder="t.gameSessions.sessionTitlePlaceholder"
            required
          />
        </div>

        <div v-if="!isEdit" class="form-group">
          <label>{{ t.gameSessions.modeSelectorLabel }}</label>
          <div class="mode-options">
            <div
              v-for="option in modeOptions"
              :key="option.value"
              class="mode-option"
              :class="{ selected: selectedMode === option.value }"
              @click="selectedMode = option.value"
            >
              <div class="mode-option-header">
                <span class="mode-badge" :class="`mode-${option.value.toLowerCase()}`">
                  {{ option.label }}
                </span>
              </div>
              <p class="mode-description">{{ option.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="!isEdit" class="form-group">
          <label>{{ t.gameSessions.selectQuestionnaireLabel }}</label>
          <div v-if="loadingQuestionnaires" class="loading-questionnaires">
            {{ t.gameSessions.loadingQuestionnaires }}
          </div>
          <div v-else-if="questionnaires.length === 0" class="no-questionnaires">
            <p>{{ t.gameSessions.noQuestionnaires }}</p>
            <router-link to="/dashboard/questionnaire/new" class="btn-secondary">
              {{ t.gameSessions.createQuestionnaire }}
            </router-link>
          </div>
          <div v-else class="questionnaires-list">
            <div
              v-for="q in questionnaires"
              :key="q.id"
              class="questionnaire-option"
              :class="{ selected: selectedQuestionnaireId === q.id }"
              @click="selectedQuestionnaireId = q.id"
            >
              <div class="questionnaire-info">
                <span class="questionnaire-title">{{ q.title }}</span>
                <span class="questionnaire-count">
                  {{ q.questionIds.length }}
                  {{
                    q.questionIds.length === 1 ? t.gameSessions.question : t.gameSessions.questions
                  }}
                </span>
              </div>
              <div class="radio-indicator" v-if="selectedQuestionnaireId === q.id">✓</div>
            </div>
          </div>
        </div>

        <div v-if="isEdit && gameSession" class="session-info">
          <div class="info-card">
            <h3>{{ t.gameSessions.sessionInfoTitle }}</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">{{ t.gameSessions.statusLabel }}</span>
                <span class="status-badge" :class="`status-${gameSession.status.toLowerCase()}`">
                  {{ getStatusLabel(gameSession.status) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t.gameSessions.questionsLabel }}</span>
                <span class="info-value">{{ gameSession.questions.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">{{ t.gameSessions.created }}</span>
                <span class="info-value">{{ formatDate(gameSession.startedAt) }}</span>
              </div>
            </div>
          </div>

          <div v-if="gameSession.status === 'WAITING'" class="refresh-section">
            <p class="hint">
              {{ t.gameSessions.refreshHint }}
            </p>
            <button
              type="button"
              class="btn-secondary"
              @click="handleRefreshQuestions"
              :disabled="refreshing"
            >
              {{ refreshing ? t.gameSessions.refreshing : t.gameSessions.refreshQuestions }}
            </button>
          </div>

          <div class="questions-preview">
            <h4>{{ t.gameSessions.questionsInSession }}</h4>
            <div class="questions-list">
              <div
                v-for="(question, index) in gameSession.questions"
                :key="question.id"
                class="question-preview"
              >
                <span class="question-number">{{ index + 1 }}</span>
                <span class="question-title">{{ question.title }}</span>
                <span class="question-points">{{ question.points }} {{ t.gameSessions.pts }}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="router.push('/dashboard/game-sessions')"
          >
            {{ t.common.back }}
          </button>
          <button
            v-if="!isEdit"
            type="submit"
            class="btn-primary"
            :disabled="!selectedQuestionnaireId || !selectedMode || !sessionTitle.trim()"
          >
            {{ t.gameSessions.createSession }}
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  createGameSession,
  getGameSession,
  refreshGameSessionQuestions,
} from '@/firebase/gameSession';
import { getQuestionnairesByUser } from '@/firebase/questionnaire';
import { auth } from '@/firebase/auth';
import type { FirebaseTimestamp, GameSession, GameSessionMode } from '@shared/models/GameSession';
import type { Questionnaire } from '@shared/models/Questionnaire';
import { useI18n } from '@/composables/useI18n';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { formatError } from '@/utils/errorUtils';
import BaseLoader from '@/components/BaseLoader.vue';

const { showError } = useErrorHandler();

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const sessionId = route.params.id as string;
const isEdit = computed(() => sessionId && sessionId !== 'new');

const questionnaires = ref<Questionnaire[]>([]);
const selectedQuestionnaireId = ref('');
const selectedMode = ref<GameSessionMode | ''>('');
const sessionTitle = ref('');
const gameSession = ref<GameSession | null>(null);
const loading = ref(false);
const loadingQuestionnaires = ref(true);
const refreshing = ref(false);

const modeOptions = computed(() => [
  {
    value: 'EVALUATION' as GameSessionMode,
    label: t.value.gameSessions.modeEvaluation,
    description: t.value.gameSessions.modeEvaluationDesc,
  },
  {
    value: 'LEARNING' as GameSessionMode,
    label: t.value.gameSessions.modeLearning,
    description: t.value.gameSessions.modeLearningDesc,
  },
]);

const getStatusLabel = (status: string) => {
  const s = t.value.gameSessions.status;
  const labels: Record<string, string> = {
    WAITING: s.waiting,
    RUNNING: s.running,
    FINISHED: s.finished,
  };
  return labels[status] || status;
};

const formatDate = (timestamp: FirebaseTimestamp) => {
  if (!timestamp) return '';

  const date = new Date(timestamp.seconds * 1000);

  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const handleRefreshQuestions = async () => {
  if (!confirm(t.value.gameSessions.confirmations.refresh)) return;

  refreshing.value = true;
  try {
    const count = await refreshGameSessionQuestions(sessionId);
    alert(t.value.gameSessions.alerts.questionsUpdated.replace('{count}', String(count)));
    // Recargar la sesión
    if (gameSession.value) {
      gameSession.value = await getGameSession(sessionId);
    }
  } catch (err) {
    showError(formatError(err, t.value.gameSessions.alerts.refreshError));
  } finally {
    refreshing.value = false;
  }
};

const handleSubmit = async () => {
  if (!selectedQuestionnaireId.value || !selectedMode.value || !sessionTitle.value.trim()) return;

  try {
    const currentUser = auth.currentUser!;
    await createGameSession(
      selectedQuestionnaireId.value,
      currentUser.uid,
      selectedMode.value as 'EVALUATION' | 'LEARNING',
      sessionTitle.value.trim()
    );
    router.push('/dashboard/game-sessions');
  } catch (err) {
    showError(formatError(err, t.value.gameSessions.alerts.createError));
  }
};

onMounted(async () => {
  try {
    const currentUser = auth.currentUser!;

    if (isEdit.value) {
      loading.value = true;
      const session = await getGameSession(sessionId);

      if (!session) {
        showError(t.value.gameSessions.alerts.sessionNotFound);
        return;
      }

      if (session.createdBy !== currentUser.uid) {
        showError(t.value.gameSessions.alerts.noPermission);
        return;
      }

      gameSession.value = session;
    } else {
      // Cargar cuestionarios para crear nueva sesión
      questionnaires.value = await getQuestionnairesByUser(currentUser.uid);
      loadingQuestionnaires.value = false;
    }
  } catch (err) {
    showError(formatError(err, t.value.gameSessions.alerts.loadDataError));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.game-session-form-view {
  @include page-view(900px);
  padding-top: 0;

  &__header {
    h2 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      font-weight: 700;
    }
  }
}

.form-container {
  @include form-container;
}

.form-group {
  @include form-group-base;
}

.form-group label {
  font-size: 0.9375rem;
}

.loading-questionnaires,
.no-questionnaires {
  text-align: center;
  padding: 2rem;
  color: $text-secondary;
}

.no-questionnaires p {
  margin-bottom: 1rem;
}

.questionnaires-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.questionnaire-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: $bg-item;
  border: 2px solid $border-separator;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-normal;
}

.questionnaire-option:hover {
  background-color: $bg-hover;
  border-color: #ccc;
}

.questionnaire-option.selected {
  background-color: $action-blue-light;
  border-color: $action-blue;
}

.questionnaire-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.questionnaire-title {
  font-weight: 600;
  color: $text-strong;
}

.questionnaire-count {
  font-size: $font-size-md;
  color: $text-secondary;
  padding: $spacing-xxs $spacing-sm;
  background-color: white;
  border-radius: 12px;
}

.radio-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: $action-blue;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: $font-size-md;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background-color: $bg-item;
  border-radius: $border-radius-md;
}

.info-card h3 {
  margin: 0 0 1rem 0;
  color: $text-strong;
  font-size: $font-size-lg;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: $spacing-xxs;
}

.info-label {
  font-size: $font-size-sm;
  color: $text-muted;
}

.info-value {
  font-weight: 600;
  color: $text-strong;
}

// .status-badge + .status-* colors are provided by _utilities.scss globally

.refresh-section {
  padding: 1rem;
  background-color: #fffbf0;
  border-left: 4px solid $status-waiting-color;
  border-radius: $border-radius-sm;
}

.refresh-section .hint {
  margin: 0 0 1rem 0;
  color: $text-secondary;
  font-size: $font-size-md;
}

.questions-preview h4 {
  margin: 0 0 1rem 0;
  color: $text-strong;
  font-size: $font-size-base;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: $spacing-xs;
  max-height: 300px;
  overflow-y: auto;
}

.question-preview {
  display: flex;
  align-items: center;
  gap: $spacing-sm;
  padding: $spacing-sm;
  background-color: $bg-item;
  border-radius: $border-radius;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: $action-blue;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: $font-size-md;
  flex-shrink: 0;
}

.question-title {
  flex: 1;
  font-size: $font-size-md;
  color: $text-strong;
}

.question-points {
  font-size: $font-size-sm;
  color: $text-secondary;
  font-weight: 600;
}

.form-actions {
  @include form-actions;
}

@media (max-width: 640px) {
  .info-grid {
    grid-template-columns: 1fr;
  }
}

.mode-options {
  display: flex;
  flex-direction: column;
  gap: $spacing-sm;
}

.mode-option {
  padding: 1rem;
  border: 2px solid $border-separator;
  border-radius: $border-radius-md;
  cursor: pointer;
  transition: all $transition-normal;
  background: $bg-item;
}

.mode-option:hover {
  border-color: #ccc;
  background: $bg-hover;
}

.mode-option.selected {
  border-color: $action-blue;
  background: $action-blue-light;
}

.mode-option-header {
  margin-bottom: 0.4rem;
}

// .mode-badge + .mode-* colors are provided by _utilities.scss globally

.mode-description {
  font-size: $font-size-md;
  color: #555;
  margin: 0;
}

.form-control {
  @include form-control-base;
}
</style>
