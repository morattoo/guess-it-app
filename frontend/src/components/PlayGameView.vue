<template>
  <div class="play-game-view">
    <SuccessAnimation :show="showSuccess" />
    <ErrorAnimation :show="showError" />

    <div class="container">
      <HeaderLogo />
      <BaseLoader v-model="loading" overlay :text="t.play.loading" :size="60" color="#10b981" />

      <!-- Pantalla inicial antes de comenzar -->
      <div v-if="!gameStarted" class="start-card">
        <h1>{{ t.play.readyToPlay }}</h1>

        <div class="game-info">
          <div class="info-item">
            <span class="info-label">{{ t.play.totalQuestions }}:</span>
            <span class="info-value">{{ totalQuestions }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">{{ t.play.yourCurrentScore }}:</span>
            <span class="info-value">{{ playerProgress?.score || 0 }} {{ t.play.points }}</span>
          </div>
          <div v-if="playerProgress && playerProgress.currentQuestionIndex > 0" class="info-item">
            <span class="info-label">{{ t.play.progress }}:</span>
            <span class="info-value">
              {{ playerProgress.currentQuestionIndex }} / {{ totalQuestions }}
            </span>
          </div>
        </div>

        <button @click="startGame" class="btn btn-primary btn-large">
          {{
            playerProgress && playerProgress.currentQuestionIndex > 0
              ? t.play.continue
              : t.play.start
          }}
        </button>
      </div>

      <!-- Juego en progreso -->
      <div v-else-if="currentQuestion" class="question-card">
        <div class="progress-bar">
          <div
            class="progress-fill"
            :style="{ width: `${(currentQuestionIndex / totalQuestions) * 100}%` }"
          ></div>
        </div>

        <div class="question-header">
          <span class="question-number">
            {{ t.play.question }} {{ currentQuestionIndex + 1 }} {{ t.play.of }}
            {{ totalQuestions }}
          </span>
          <span class="question-points">{{ currentQuestion.points }} {{ t.play.points }}</span>
        </div>

        <h2 class="question-title">{{ currentQuestion.title }}</h2>

        <p v-if="currentQuestion.description" class="question-description">
          {{ currentQuestion.description }}
        </p>

        <!-- Formulario de respuesta según el tipo -->
        <form @submit.prevent="handleSubmitAnswer" class="answer-form">
          <!-- Pregunta de texto -->
          <TextQuestionAnswer
            v-if="currentQuestion.type === QUESTION_TYPES.TEXT"
            v-model="currentAnswer"
            :disabled="submitting"
          />

          <!-- Pregunta numérica -->
          <NumberQuestionAnswer
            v-else-if="currentQuestion.type === QUESTION_TYPES.NUMBER"
            v-model="currentAnswer"
            :disabled="submitting"
          />

          <!-- Pregunta de opción múltiple -->
          <ChoiceQuestionAnswer
            v-else-if="currentQuestion.type === QUESTION_TYPES.CHOICE"
            v-model="currentAnswer"
            :options="getChoiceOptions()"
            :disabled="submitting"
          />

          <button
            type="submit"
            class="btn btn-primary btn-large"
            :disabled="submitting || !currentAnswer"
          >
            {{ submitting ? t.play.sending : t.play.sendAnswer }}
          </button>
        </form>
      </div>

      <!-- Juego completado -->
      <div v-else-if="gameCompleted" class="completed-card">
        <div class="trophy-icon">🏆</div>
        <h1>{{ t.play.gameCompleted }}</h1>

        <router-link :to="`/game/${sessionId}/ranking`" class="btn btn-primary btn-large">
          {{ t.play.viewRanking }}
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import {
  getPublicGameSession,
  getPublicPlayerProgress,
  submitPublicAnswer,
} from '@/firebase/publicGame';
import type { GameSession, GameSessionQuestion, PlayerProgress } from '@shared/models/GameSession';
import HeaderLogo from '@/components/layout/HeaderLogo.vue';
import { useI18n } from '@/composables/useI18n';
import BaseLoader from './BaseLoader.vue';
import { useErrorHandler } from '@/composables/useErrorHandler';
import SuccessAnimation from '@/components/animations/SuccessAnimation.vue';
import ErrorAnimation from '@/components/animations/ErrorAnimation.vue';
import { useFeedbackAnimation } from '@/composables/useFeedbackAnimation';
import TextQuestionAnswer from '@/components/questions/TextQuestionAnswer.vue';
import NumberQuestionAnswer from '@/components/questions/NumberQuestionAnswer.vue';
import ChoiceQuestionAnswer from '@/components/questions/ChoiceQuestionAnswer.vue';
import { QUESTION_TYPES } from '@/constants/questionTypes';

const { showError: showErrorOverlay } = useErrorHandler();
const { showSuccess, showError, triggerSuccess, triggerError } = useFeedbackAnimation();

const { t } = useI18n();
const route = useRoute();

const gameSession = ref<GameSession | null>(null);
const playerProgress = ref<PlayerProgress | null>(null);
const loading = ref(true);
const error = ref('');
const gameStarted = ref(false);
const gameCompleted = ref(false);

const currentAnswer = ref<string | number>('');
const submitting = ref(false);

const sessionId = computed(() => route.params.sessionId as string);

const totalQuestions = computed(() => gameSession.value?.questions.length || 0);

const currentQuestionIndex = computed(() => playerProgress.value?.currentQuestionIndex || 0);

const currentQuestion = computed((): GameSessionQuestion | null => {
  if (!gameSession.value || !playerProgress.value) return null;
  const index = playerProgress.value.currentQuestionIndex;
  return gameSession.value.questions[index] || null;
});

onMounted(async () => {
  try {
    // Cargar la sesión y el progreso del jugador
    const [session, progress] = await Promise.all([
      getPublicGameSession(sessionId.value),
      getPublicPlayerProgress(sessionId.value),
    ]);

    if (!session) {
      error.value = t.value.play.errors.sessionNotFound;
      showErrorOverlay(error.value, {
        returnButtonText: t.value.common.close,
        returnUrl: `/`,
      });
      loading.value = false;
      return;
    }

    if (!progress) {
      error.value = t.value.play.errors.notJoined;
      showErrorOverlay(error.value, {
        returnButtonText: t.value.join.joinGame,
        returnUrl: `/game/${sessionId.value}`,
      });
      loading.value = false;
      return;
    }

    gameSession.value = session;
    playerProgress.value = progress;

    // Verificar si ya completó todas las preguntas
    if (progress.currentQuestionIndex >= session.questions.length) {
      gameCompleted.value = true;
    }

    loading.value = false;
  } catch (err: unknown) {
    error.value = (err as Error).message || t.value.play.errors.loadError;
    showErrorOverlay(error.value, {
      returnButtonText: t.value.common.close,
      returnUrl: `/`,
    });
    loading.value = false;
  }
});

const startGame = () => {
  gameStarted.value = true;
};

const getChoiceOptions = () => {
  if (!currentQuestion.value || currentQuestion.value.type !== QUESTION_TYPES.CHOICE) {
    return [];
  }

  // Las opciones ahora vienen directamente en la pregunta (sin validation.options)
  return currentQuestion.value.options || [];
};

const handleSubmitAnswer = async () => {
  if (submitting.value || !currentAnswer.value) return;

  try {
    submitting.value = true;

    const result = await submitPublicAnswer(
      sessionId.value,
      currentQuestionIndex.value,
      currentAnswer.value
    );

    if (result.correct) {
      // Mostrar animación de éxito
      triggerSuccess(1500);

      // Actualizar el progreso
      if (playerProgress.value) {
        playerProgress.value.currentQuestionIndex++;
        playerProgress.value.score += currentQuestion.value?.points || 0;
      }

      // Esperar un momento para mostrar el feedback
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Verificar si completó todas las preguntas
      if (
        playerProgress.value &&
        playerProgress.value.currentQuestionIndex >= totalQuestions.value
      ) {
        gameCompleted.value = true;
      } else {
        // Pasar a la siguiente pregunta
        currentAnswer.value = '';
      }
    } else {
      // Mostrar animación de error
      triggerError(1500);

      // Esperar un momento antes de permitir reintentar
      await new Promise(resolve => setTimeout(resolve, 1500));
    }

    submitting.value = false;
  } catch (err: unknown) {
    const errorMsg = (err as Error).message || t.value.play.errors.submitError;
    showErrorOverlay(errorMsg);
    submitting.value = false;
  }
};
</script>

<style scoped lang="scss">
.play-game-view {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
}

.container {
  max-width: 700px;
  margin: 0 auto;
}

.start-card,
.question-card,
.completed-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-top: 1.5rem;
}

.start-card {
  text-align: center;

  h1 {
    color: #2d3748;
    margin-bottom: 2rem;
    font-size: 2rem;
  }

  .game-info {
    background: #f7fafc;
    padding: 1.5rem;
    border-radius: 8px;
    margin-bottom: 2rem;

    .info-item {
      display: flex;
      justify-content: space-between;
      margin: 0.75rem 0;

      .info-label {
        color: #4a5568;
        font-weight: 500;
      }

      .info-value {
        color: #2d3748;
        font-weight: 600;
      }
    }
  }
}

.question-card {
  .progress-bar {
    width: 100%;
    height: 8px;
    background: #e2e8f0;
    border-radius: 4px;
    overflow: hidden;
    margin-bottom: 1.5rem;

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }
  }

  .question-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 1rem;

    .question-number {
      color: #718096;
      font-size: 0.875rem;
      font-weight: 500;
    }

    .question-points {
      background: #667eea;
      color: white;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
    }
  }

  .question-title {
    color: #2d3748;
    font-size: 1.5rem;
    margin-bottom: 1rem;
  }

  .question-description {
    color: #4a5568;
    margin-bottom: 1.5rem;
    line-height: 1.6;
  }
}

.completed-card {
  text-align: center;

  .trophy-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h1 {
    color: #2d3748;
    margin-bottom: 2rem;
    font-size: 2rem;
  }

  .final-stats {
    display: flex;
    justify-content: space-around;
    margin-bottom: 2rem;
    padding: 1.5rem;
    background: #f7fafc;
    border-radius: 8px;

    .stat-item {
      display: flex;
      flex-direction: column;
      align-items: center;

      .stat-value {
        font-size: 2rem;
        font-weight: 700;
        color: #667eea;
        margin-bottom: 0.5rem;
      }

      .stat-label {
        font-size: 0.875rem;
        color: #718096;
      }
    }
  }
}
</style>
