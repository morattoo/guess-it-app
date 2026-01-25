<template>
  <div class="play-game-view">
    <div class="container">
      <HeaderLogo />

      <div v-if="loading" class="loading-card">
        <p>Cargando juego...</p>
      </div>

      <div v-else-if="error" class="error-card">
        <h2>Error</h2>
        <p>{{ error }}</p>
        <router-link :to="`/game/${sessionId}`" class="btn btn-primary"> Volver </router-link>
      </div>

      <!-- Pantalla inicial antes de comenzar -->
      <div v-else-if="!gameStarted" class="start-card">
        <h1>¡Listo para jugar!</h1>

        <div class="game-info">
          <div class="info-item">
            <span class="info-label">Total de preguntas:</span>
            <span class="info-value">{{ totalQuestions }}</span>
          </div>
          <div class="info-item">
            <span class="info-label">Tu puntaje actual:</span>
            <span class="info-value">{{ playerProgress?.score || 0 }} puntos</span>
          </div>
          <div v-if="playerProgress && playerProgress.currentQuestionIndex > 0" class="info-item">
            <span class="info-label">Progreso:</span>
            <span class="info-value">
              {{ playerProgress.currentQuestionIndex }} / {{ totalQuestions }}
            </span>
          </div>
        </div>

        <button @click="startGame" class="btn btn-primary btn-large">
          {{ playerProgress && playerProgress.currentQuestionIndex > 0 ? 'Continuar' : 'Comenzar' }}
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
            Pregunta {{ currentQuestionIndex + 1 }} de {{ totalQuestions }}
          </span>
          <span class="question-points">{{ currentQuestion.points }} puntos</span>
        </div>

        <h2 class="question-title">{{ currentQuestion.title }}</h2>

        <p v-if="currentQuestion.description" class="question-description">
          {{ currentQuestion.description }}
        </p>

        <!-- Formulario de respuesta según el tipo -->
        <form @submit.prevent="handleSubmitAnswer" class="answer-form">
          <!-- Pregunta de texto -->
          <div v-if="currentQuestion.type === 'TEXT'" class="form-group">
            <label for="answer">Tu respuesta:</label>
            <input
              id="answer"
              v-model="currentAnswer"
              type="text"
              class="form-input"
              placeholder="Escribe tu respuesta"
              required
              :disabled="submitting"
            />
          </div>

          <!-- Pregunta numérica -->
          <div v-else-if="currentQuestion.type === 'NUMBER'" class="form-group">
            <label for="answer">Tu respuesta:</label>
            <input
              id="answer"
              v-model.number="currentAnswer"
              type="number"
              step="any"
              class="form-input"
              placeholder="Ingresa un número"
              required
              :disabled="submitting"
            />
          </div>

          <!-- Pregunta de opción múltiple -->
          <div v-else-if="currentQuestion.type === 'CHOICE'" class="choice-options">
            <div
              v-for="(option, index) in getChoiceOptions()"
              :key="option.id"
              class="choice-option"
              :class="{ selected: currentAnswer === option.id }"
              @click="!submitting && (currentAnswer = option.id)"
            >
              <div class="option-radio">
                <input
                  type="radio"
                  :id="`option-${index}`"
                  :value="option.id"
                  v-model="currentAnswer"
                  :disabled="submitting"
                />
              </div>
              <label :for="`option-${index}`" class="option-label">
                {{ option.label }}
              </label>
            </div>
          </div>

          <!-- Feedback de respuesta -->
          <div v-if="feedbackMessage" :class="`feedback-message ${feedbackType}`">
            {{ feedbackMessage }}
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-large"
            :disabled="submitting || !currentAnswer"
          >
            {{ submitting ? 'Enviando...' : 'Enviar respuesta' }}
          </button>
        </form>
      </div>

      <!-- Juego completado -->
      <div v-else-if="gameCompleted" class="completed-card">
        <div class="trophy-icon">🏆</div>
        <h1>¡Juego completado!</h1>

        <router-link :to="`/game/${sessionId}/ranking`" class="btn btn-primary btn-large">
          Ver ranking
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

const route = useRoute();

const gameSession = ref<GameSession | null>(null);
const playerProgress = ref<PlayerProgress | null>(null);
const loading = ref(true);
const error = ref('');
const gameStarted = ref(false);
const gameCompleted = ref(false);

const currentAnswer = ref<string | number>('');
const submitting = ref(false);
const feedbackMessage = ref('');
const feedbackType = ref<'success' | 'error'>('success');

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
      error.value = 'La sesión de juego no existe.';
      loading.value = false;
      return;
    }

    if (!progress) {
      error.value = 'No te has unido a esta sesión. Por favor, únete primero.';
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
  } catch (err: any) {
    console.error('Error al cargar el juego:', err);
    error.value = err.message || 'Error al cargar el juego.';
    loading.value = false;
  }
});

const startGame = () => {
  gameStarted.value = true;
};

const getChoiceOptions = () => {
  if (!currentQuestion.value || currentQuestion.value.type !== 'CHOICE') {
    return [];
  }

  // Las opciones ahora vienen directamente en la pregunta (sin validation.options)
  return (currentQuestion.value as any).options || [];
};

const handleSubmitAnswer = async () => {
  if (submitting.value || !currentAnswer.value) return;

  try {
    submitting.value = true;
    feedbackMessage.value = '';

    const result = await submitPublicAnswer(
      sessionId.value,
      currentQuestionIndex.value,
      currentAnswer.value
    );

    if (result.correct) {
      feedbackType.value = 'success';
      feedbackMessage.value = '¡Correcto! 🎉';

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
        feedbackMessage.value = '';
      }
    } else {
      feedbackType.value = 'error';
      feedbackMessage.value = result.message || 'Respuesta incorrecta. Intenta de nuevo.';
    }

    submitting.value = false;
  } catch (err: any) {
    console.error('Error al enviar respuesta:', err);
    feedbackType.value = 'error';
    feedbackMessage.value = err.message || 'Error al enviar la respuesta.';
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

.loading-card,
.error-card,
.start-card,
.question-card,
.completed-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.loading-card,
.error-card {
  text-align: center;

  h2 {
    color: #e53e3e;
    margin-bottom: 1rem;
  }

  p {
    color: #4a5568;
    margin-bottom: 1.5rem;
  }
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

.answer-form {
  .form-group {
    margin-bottom: 1.5rem;

    label {
      display: block;
      margin-bottom: 0.5rem;
      color: #2d3748;
      font-weight: 600;
    }

    .form-input {
      width: 100%;
      padding: 0.875rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: #667eea;
      }

      &:disabled {
        background: #f7fafc;
        cursor: not-allowed;
      }
    }
  }

  .choice-options {
    margin-bottom: 1.5rem;

    .choice-option {
      display: flex;
      align-items: center;
      padding: 1rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      margin-bottom: 0.75rem;
      cursor: pointer;
      transition: all 0.2s;

      &:hover {
        border-color: #cbd5e0;
        background: #f7fafc;
      }

      &.selected {
        border-color: #667eea;
        background: #eef2ff;
      }

      .option-radio {
        margin-right: 1rem;

        input[type='radio'] {
          width: 20px;
          height: 20px;
          cursor: pointer;
        }
      }

      .option-label {
        flex: 1;
        color: #2d3748;
        font-size: 1rem;
        cursor: pointer;
        user-select: none;
      }
    }
  }

  .feedback-message {
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1rem;
    font-weight: 600;
    text-align: center;

    &.success {
      background: #c6f6d5;
      color: #22543d;
    }

    &.error {
      background: #fed7d7;
      color: #742a2a;
    }
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

.btn {
  padding: 0.75rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
  text-align: center;

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
}

.btn-primary {
  background: #667eea;
  color: white;

  &:hover:not(:disabled) {
    background: #5568d3;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }
}

.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
}
</style>
