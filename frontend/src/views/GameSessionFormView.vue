<template>
  <div class="game-session-form-view">
    <h2>{{ isEdit ? 'Editar Sesión' : 'Nueva Sesión de Juego' }}</h2>

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="router.push('/dashboard/game-sessions')" class="btn-primary">
        Volver a sesiones
      </button>
    </div>

    <div v-else class="form-container">
      <form @submit.prevent="handleSubmit">
        <div v-if="!isEdit" class="form-group">
          <label>Selecciona un Cuestionario *</label>
          <div v-if="loadingQuestionnaires" class="loading-questionnaires">
            Cargando cuestionarios...
          </div>
          <div v-else-if="questionnaires.length === 0" class="no-questionnaires">
            <p>No tienes cuestionarios creados.</p>
            <router-link to="/dashboard/questionnaire/new" class="btn-secondary">
              Crear un cuestionario
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
                  {{ q.questionIds.length === 1 ? 'pregunta' : 'preguntas' }}
                </span>
              </div>
              <div class="radio-indicator" v-if="selectedQuestionnaireId === q.id">✓</div>
            </div>
          </div>
        </div>

        <div v-if="isEdit && gameSession" class="session-info">
          <div class="info-card">
            <h3>Información de la Sesión</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Estado:</span>
                <span class="status-badge" :class="`status-${gameSession.status.toLowerCase()}`">
                  {{ getStatusLabel(gameSession.status) }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Preguntas:</span>
                <span class="info-value">{{ gameSession.questions.length }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Creada:</span>
                <span class="info-value">{{ formatDate(gameSession.startedAt) }}</span>
              </div>
            </div>
          </div>

          <div v-if="gameSession.status === 'WAITING'" class="refresh-section">
            <p class="hint">
              Puedes actualizar las preguntas del cuestionario si este ha sido modificado.
            </p>
            <button
              type="button"
              class="btn-secondary"
              @click="handleRefreshQuestions"
              :disabled="refreshing"
            >
              {{ refreshing ? 'Actualizando...' : 'Actualizar Preguntas' }}
            </button>
          </div>

          <div class="questions-preview">
            <h4>Preguntas en esta sesión:</h4>
            <div class="questions-list">
              <div
                v-for="(question, index) in gameSession.questions"
                :key="question.id"
                class="question-preview"
              >
                <span class="question-number">{{ index + 1 }}</span>
                <span class="question-title">{{ question.title }}</span>
                <span class="question-points">{{ question.points }} pts</span>
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
            Cancelar
          </button>
          <button
            v-if="!isEdit"
            type="submit"
            class="btn-primary"
            :disabled="!selectedQuestionnaireId"
          >
            Crear Sesión
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
import type { GameSession } from '@shared/models/GameSession';
import type { Questionnaire } from '@shared/models/Questionnaire';

const router = useRouter();
const route = useRoute();
const sessionId = route.params.id as string;
const isEdit = computed(() => sessionId && sessionId !== 'new');

const questionnaires = ref<Questionnaire[]>([]);
const selectedQuestionnaireId = ref('');
const gameSession = ref<GameSession | null>(null);
const loading = ref(false);
const loadingQuestionnaires = ref(true);
const refreshing = ref(false);
const error = ref('');

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    WAITING: 'Esperando',
    RUNNING: 'En curso',
    FINISHED: 'Finalizada',
  };
  return labels[status] || status;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';

  let date: Date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp._seconds !== undefined) {
    // Formato JSON de Firestore desde API
    date = new Date(timestamp._seconds * 1000);
  } else {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

const handleRefreshQuestions = async () => {
  if (!confirm('¿Actualizar las preguntas de esta sesión?')) return;

  refreshing.value = true;
  try {
    const count = await refreshGameSessionQuestions(sessionId);
    alert(`${count} preguntas actualizadas`);
    // Recargar la sesión
    if (gameSession.value) {
      gameSession.value = await getGameSession(sessionId);
    }
  } catch (err) {
    console.error('Error al actualizar preguntas:', err);
    alert('Error al actualizar las preguntas');
  } finally {
    refreshing.value = false;
  }
};

const handleSubmit = async () => {
  if (!selectedQuestionnaireId.value) return;

  try {
    const currentUser = auth.currentUser!;
    await createGameSession(selectedQuestionnaireId.value, currentUser.uid);
    router.push('/dashboard/game-sessions');
  } catch (err) {
    console.error('Error al crear sesión:', err);
    alert('Error al crear la sesión de juego');
  }
};

onMounted(async () => {
  try {
    const currentUser = auth.currentUser!;

    if (isEdit.value) {
      loading.value = true;
      const session = await getGameSession(sessionId);

      if (!session) {
        error.value = 'Sesión no encontrada';
        return;
      }

      if (session.createdBy !== currentUser.uid) {
        error.value = 'No tienes permiso para ver esta sesión';
        return;
      }

      gameSession.value = session;
    } else {
      // Cargar cuestionarios para crear nueva sesión
      questionnaires.value = await getQuestionnairesByUser(currentUser.uid);
      loadingQuestionnaires.value = false;
    }
  } catch (err) {
    error.value = 'Error al cargar datos';
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.game-session-form-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
  color: #333;
}

.loading,
.error {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.error {
  color: #d33;
}

.error p {
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}

.form-container {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.75rem;
  font-weight: 600;
  color: #333;
  font-size: 0.9375rem;
}

.loading-questionnaires,
.no-questionnaires {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-questionnaires p {
  margin-bottom: 1rem;
}

.questionnaires-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.questionnaire-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1rem;
  background-color: #f9f9f9;
  border: 2px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s;
}

.questionnaire-option:hover {
  background-color: #f0f0f0;
  border-color: #ccc;
}

.questionnaire-option.selected {
  background-color: #e3f2ff;
  border-color: #2f8cff;
}

.questionnaire-info {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
}

.questionnaire-title {
  font-weight: 600;
  color: #333;
}

.questionnaire-count {
  font-size: 0.875rem;
  color: #666;
  padding: 0.25rem 0.75rem;
  background-color: white;
  border-radius: 12px;
}

.radio-indicator {
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #2f8cff;
  color: white;
  border-radius: 50%;
  font-weight: bold;
  font-size: 0.875rem;
}

.session-info {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-card {
  padding: 1.5rem;
  background-color: #f9f9f9;
  border-radius: 8px;
}

.info-card h3 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1.125rem;
}

.info-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.8125rem;
  color: #999;
}

.info-value {
  font-weight: 600;
  color: #333;
}

.status-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  display: inline-block;
  width: fit-content;
}

.status-waiting {
  background-color: #fff3e0;
  color: #ff8c00;
}

.status-running {
  background-color: #e3f2ff;
  color: #2f8cff;
}

.status-finished {
  background-color: #e8f5e9;
  color: #4caf50;
}

.refresh-section {
  padding: 1rem;
  background-color: #fffbf0;
  border-left: 4px solid #ff8c00;
  border-radius: 4px;
}

.refresh-section .hint {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.875rem;
}

.questions-preview h4 {
  margin: 0 0 1rem 0;
  color: #333;
  font-size: 1rem;
}

.questions-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  max-height: 300px;
  overflow-y: auto;
}

.question-preview {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  background-color: #2f8cff;
  color: white;
  border-radius: 50%;
  font-weight: 600;
  font-size: 0.875rem;
  flex-shrink: 0;
}

.question-title {
  flex: 1;
  font-size: 0.875rem;
  color: #333;
}

.question-points {
  font-size: 0.8125rem;
  color: #666;
  font-weight: 600;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
  text-decoration: none;
  display: inline-block;
}

.btn-primary {
  background-color: #2f8cff;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #1a7ae8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #e0e0e0;
}

.btn-secondary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}
</style>
