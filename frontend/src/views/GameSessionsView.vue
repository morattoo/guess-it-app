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
            <span class="detail-label">Abierta:</span>
            <span class="detail-value">{{ session.isOpen ? 'Sí' : 'No' }}</span>
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
        <div>
          <router-link v-if="session.status !== 'WAITING'" :to="`/game/${session.id}`"
            >Watch game</router-link
          >
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

const getStatusLabel = (status: string) => {
  const labels: Record<string, string> = {
    WAITING: 'Esperando',
    RUNNING: 'En curso',
    FINISHED: 'Finalizada',
  };
  return labels[status] || status;
};

const formatDate = (timestamp: FirebaseTimestamp) => {
  if (!timestamp) return '';

  let date: Date;
  if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (
    typeof timestamp === 'object' &&
    'toDate' in timestamp &&
    typeof timestamp.toDate === 'function'
  ) {
    date = timestamp.toDate();
  } else if (typeof timestamp === 'object' && '_seconds' in timestamp) {
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
  font-size: 0.875rem;
}

.detail-label {
  color: #999;
}

.detail-value {
  color: #333;
  font-weight: 500;
}

.session-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.session-card:hover .session-actions {
  opacity: 1;
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

  .session-actions {
    opacity: 1;
  }
}
</style>
