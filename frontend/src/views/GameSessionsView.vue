<template>
  <div class="game-sessions-view">
    <div class="header">
      <h2>Sesiones de Juego</h2>
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
        Nueva Sesión
      </router-link>
    </div>

    <div v-if="loading" class="loading">Cargando sesiones...</div>

    <div v-else-if="gameSessions.length === 0" class="empty-state">
      <p>No tienes sesiones de juego creadas.</p>
      <router-link to="/dashboard/game-session/new" class="btn-primary">
        Crear tu primera sesión
      </router-link>
    </div>

    <div v-else class="sessions-list">
      <div v-for="session in gameSessions" :key="session.id" class="session-card">
        <div class="session-header">
          <div class="session-info">
            <h3 class="session-title">Sesión {{ session.id?.substring(0, 8) }}</h3>
            <span class="status-badge" :class="`status-${session.status.toLowerCase()}`">
              {{ getStatusLabel(session.status) }}
            </span>
          </div>
          <span class="question-count">
            {{ session.questions.length }}
            {{ session.questions.length === 1 ? 'pregunta' : 'preguntas' }}
          </span>
        </div>

        <div class="session-details">
          <div class="detail-item">
            <span class="detail-label">Creada:</span>
            <span class="detail-value">{{ formatDate(session.startedAt) }}</span>
          </div>
          <div v-if="session.endedAt" class="detail-item">
            <span class="detail-label">Finalizada:</span>
            <span class="detail-value">{{ formatDate(session.endedAt) }}</span>
          </div>
          <div class="detail-item">
            <span class="detail-label">Inscripciones:</span>
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
              {{ session.isOpen ? 'Abiertas' : 'Cerradas' }}
            </span>
          </div>
        </div>

        <div class="session-actions">
          <button
            v-if="session.status === 'WAITING'"
            class="btn-icon"
            title="Editar"
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
            title="Iniciar"
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
            title="Finalizar sesión"
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
            v-if="session.status !== 'WAITING'"
            class="btn-icon btn-ranking"
            title="Ver ranking"
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
            v-if="session.status !== 'WAITING'"
            class="btn-icon btn-copy"
            title="Copiar enlace del juego"
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
            v-if="session.status === 'WAITING'"
            class="btn-icon btn-delete"
            title="Eliminar"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import {
  getGameSessionsByUser,
  deleteGameSession,
  updateGameSessionStatus,
  toggleGameSessionOpen,
} from '@/firebase/gameSession';
import { auth } from '@/firebase/auth';
import type { FirebaseTimestamp, GameSession } from '@shared/models/GameSession';

const router = useRouter();
const gameSessions = ref<GameSession[]>([]);
const loading = ref(true);

const loadGameSessions = async () => {
  try {
    const currentUser = auth.currentUser!;
    gameSessions.value = await getGameSessionsByUser(currentUser.uid);
  } catch (error) {
    console.error('Error al cargar sesiones:', error);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (sessionId: string) => {
  router.push(`/dashboard/game-session/${sessionId}`);
};

const handleStart = async (sessionId: string) => {
  if (!confirm('¿Iniciar esta sesión de juego? No podrás modificarla después.')) return;

  try {
    await updateGameSessionStatus(sessionId, 'RUNNING');
    await loadGameSessions();
  } catch (error) {
    console.error('Error al iniciar sesión:', error);
    alert('Error al iniciar la sesión');
  }
};

const handleFinish = async (sessionId: string) => {
  if (!confirm('¿Finalizar esta sesión de juego? Esta acción no se puede deshacer.')) return;

  try {
    await updateGameSessionStatus(sessionId, 'FINISHED');
    await loadGameSessions();
  } catch (error) {
    console.error('Error al finalizar sesión:', error);
    alert('Error al finalizar la sesión');
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
  } catch (error) {
    console.error('Error al cambiar estado de inscripciones:', error);
    alert('Error al cambiar estado de inscripciones');
    // Revertir el checkbox
    target.checked = !newValue;
  }
};

const handleDelete = async (sessionId: string) => {
  if (!confirm('¿Estás seguro de eliminar esta sesión?')) return;

  try {
    await deleteGameSession(sessionId);
    gameSessions.value = gameSessions.value.filter(s => s.id !== sessionId);
  } catch (error) {
    console.error('Error al eliminar sesión:', error);
    alert('Error al eliminar la sesión');
  }
};

const handleViewRanking = (sessionId: string) => {
  router.push(`/ranking/${sessionId}`);
};

const handleCopyLink = async (sessionId: string) => {
  const gameUrl = `${window.location.origin}/game/${sessionId}`;
  try {
    await navigator.clipboard.writeText(gameUrl);
    alert('¡Enlace copiado al portapapeles!');
  } catch (error) {
    console.error('Error al copiar enlace:', error);
    // Fallback para navegadores que no soportan clipboard API
    const textArea = document.createElement('textarea');
    textArea.value = gameUrl;
    document.body.appendChild(textArea);
    textArea.select();
    try {
      document.execCommand('copy');
      alert('¡Enlace copiado al portapapeles!');
    } catch (err) {
      alert('No se pudo copiar el enlace');
    }
    document.body.removeChild(textArea);
  }
};

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    WAITING: 'Esperando',
    RUNNING: 'En curso',
    FINISHED: 'Finalizada',
  };
  return labels[status] || status;
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

<style scoped>
.game-sessions-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h2 {
  margin: 0;
  color: #333;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #2f8cff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #1a7ae8;
}

.loading,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #2f8cff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1a7ae8;
}

.sessions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.session-card {
  position: relative;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.session-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
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
  gap: 0.5rem;
  flex: 1;
}

.session-title {
  margin: 0;
  font-size: 1.125rem;
  color: #333;
  font-family: monospace;
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

.question-count {
  padding: 0.25rem 0.75rem;
  background-color: #f5f5f5;
  color: #666;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

.session-details {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
}

.detail-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.875rem;
}

.detail-label {
  color: #999;
}

.detail-value {
  color: #333;
  font-weight: 500;
  display: flex;
  align-items: center;
  gap: 0.5rem;
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
  transition: 0.3s;
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
  transition: 0.3s;
  border-radius: 50%;
}

.toggle-switch input:checked + .toggle-slider {
  background-color: #4caf50;
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
  gap: 0.5rem;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.btn-icon:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.btn-play:hover {
  background-color: #e3f2ff;
  border-color: #2f8cff;
  color: #2f8cff;
}

.btn-finish:hover {
  background-color: #e8f5e9;
  border-color: #4caf50;
  color: #4caf50;
}

.btn-ranking:hover {
  background-color: #fff9e6;
  border-color: #fbbf24;
  color: #f59e0b;
}

.btn-copy:hover {
  background-color: #f0f4ff;
  border-color: #818cf8;
  color: #6366f1;
}

.btn-delete:hover {
  background-color: #fff5f5;
  border-color: #fcc;
  color: #d33;
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
