<template>
  <div class="ranking-view">
    <header class="ranking-header">
      <button class="back-btn" @click="goBack" aria-label="Volver">
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <h1>Ranking de Jugadores</h1>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>Cargando ranking...</p>
    </div>

    <div v-else-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <div v-else class="ranking-content">
      <!-- Game Info -->
      <div class="game-info">
        <p class="session-status" :class="sessionStatus">
          <span class="status-dot"></span>
          {{ statusText }}
        </p>
        <p class="players-count">{{ players.length }} participantes</p>
      </div>

      <!-- Ranking List -->
      <div class="ranking-list" role="list">
        <div
          v-for="(player, index) in rankedPlayers"
          :key="player.userId"
          class="player-card"
          :class="{
            'is-current-user': player.userId === currentUserId,
            'is-finished': player.finishedAt,
            'podium-first': index === 0,
            'podium-second': index === 1,
            'podium-third': index === 2,
          }"
          role="listitem"
        >
          <!-- Position Badge -->
          <div class="position-badge">
            <span v-if="index < 3" class="medal">
              <svg
                v-if="index === 0"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#FFD700"
                  stroke="#FFA500"
                  stroke-width="2"
                />
              </svg>
              <svg
                v-else-if="index === 1"
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#C0C0C0"
                  stroke="#A8A8A8"
                  stroke-width="2"
                />
              </svg>
              <svg
                v-else
                width="32"
                height="32"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
                  fill="#CD7F32"
                  stroke="#B87333"
                  stroke-width="2"
                />
              </svg>
            </span>
            <span v-else class="position-number">{{ index + 1 }}</span>
          </div>

          <!-- Player Info -->
          <div class="player-info">
            <div class="player-header">
              <h3 class="player-name">
                {{ player.displayName || `Jugador ${player.userId.slice(0, 6)}` }}
                <span v-if="player.userId === currentUserId" class="you-badge">Tú</span>
              </h3>
              <span
                class="status-badge"
                :class="player.finishedAt ? 'finished' : 'playing'"
                :aria-label="player.finishedAt ? 'Finalizado' : 'Jugando'"
              >
                {{ player.finishedAt ? '✓ Finalizado' : '⏱ Jugando' }}
              </span>
            </div>

            <div class="player-stats">
              <div class="stat">
                <span class="stat-label">Puntos</span>
                <span class="stat-value points">{{ player.score }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Preguntas</span>
                <span class="stat-value">{{ player.currentQuestionIndex + 1 }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">Tiempo</span>
                <span class="stat-value time">{{ formatTime(player.totalTime) }}</span>
              </div>
              <div v-if="player.totalPenaltySeconds > 0" class="stat">
                <span class="stat-label">Penalización</span>
                <span class="stat-value penalty">+{{ player.totalPenaltySeconds }}s</span>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-bar">
              <div class="progress-fill" :style="{ width: player.progressPercentage + '%' }"></div>
            </div>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="players.length === 0" class="empty-state">
          <p>No hay jugadores todavía</p>
        </div>
      </div>

      <!-- Refresh Button -->
      <button class="refresh-btn" @click="refreshRanking" :disabled="loading">
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          :class="{ spinning: loading }"
        >
          <path
            d="M1 4V10H7M23 20V14H17M20.49 9A9 9 0 0 0 5.64 5.64L1 10M23 14L18.36 18.36A9 9 0 0 1 3.51 15"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
        Actualizar ranking
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { collection, doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '@/firebase/init';
import { getCurrentUser } from '@/firebase/auth';
import type { PlayerProgress, GameSession } from '@shared/models/GameSession';

const route = useRoute();
const router = useRouter();
const sessionId = route.params.sessionId as string;

const players = ref<
  (PlayerProgress & { displayName?: string; totalTime: number; progressPercentage: number })[]
>([]);
const gameSession = ref<GameSession | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);
const currentUserId = ref<string | null>(null);
let unsubscribe: (() => void) | null = null;

const sessionStatus = computed(() => {
  if (!gameSession.value) return '';
  return gameSession.value.status.toLowerCase();
});

const statusText = computed(() => {
  if (!gameSession.value) return '';
  const statusMap = {
    WAITING: 'Esperando inicio',
    RUNNING: 'En progreso',
    FINISHED: 'Finalizado',
  };
  return statusMap[gameSession.value.status] || gameSession.value.status;
});

const rankedPlayers = computed(() => {
  return [...players.value].sort((a, b) => {
    // Primero por score descendente
    if (b.score !== a.score) return b.score - a.score;

    // Si tienen el mismo score, por tiempo ascendente (menos tiempo es mejor)
    if (a.totalTime !== b.totalTime) return a.totalTime - b.totalTime;

    // Si tienen el mismo tiempo, los que terminaron primero
    if (a.finishedAt && !b.finishedAt) return -1;
    if (!a.finishedAt && b.finishedAt) return 1;

    return 0;
  });
});

const formatTime = (seconds: number): string => {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const calculateTotalTime = (player: PlayerProgress): number => {
  const startTime = convertFirebaseTimestamp(player.startedAt);
  const endTime = player.finishedAt ? convertFirebaseTimestamp(player.finishedAt) : Date.now();

  const elapsedSeconds = (endTime - startTime) / 1000;
  return elapsedSeconds + player.totalPenaltySeconds;
};

const convertFirebaseTimestamp = (timestamp: any): number => {
  if (timestamp instanceof Date) return timestamp.getTime();
  if (typeof timestamp === 'number') return timestamp;
  if (timestamp?._seconds) return timestamp._seconds * 1000;
  return Date.now();
};

const calculateProgress = (player: PlayerProgress): number => {
  if (!gameSession.value) return 0;
  const totalQuestions = gameSession.value.questions.length;
  if (totalQuestions === 0) return 0;
  return Math.round(((player.currentQuestionIndex + 1) / totalQuestions) * 100);
};

const loadRanking = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Get current user
    const user = await getCurrentUser();
    currentUserId.value = user?.uid || null;

    // Load game session
    const sessionDoc = await getDoc(doc(db, 'gameSessions', sessionId));
    if (!sessionDoc.exists()) {
      error.value = 'Sesión de juego no encontrada';
      return;
    }
    gameSession.value = { id: sessionDoc.id, ...sessionDoc.data() } as GameSession;

    // Load players with real-time updates
    const playersRef = collection(db, 'gameSessions', sessionId, 'players');

    // Set up real-time listener
    unsubscribe = onSnapshot(
      playersRef,
      snapshot => {
        players.value = snapshot.docs.map(doc => {
          const data = doc.data() as PlayerProgress;
          return {
            ...data,
            displayName: data.userId, // TODO: Fetch actual user names
            totalTime: calculateTotalTime(data),
            progressPercentage: calculateProgress(data),
          };
        });
        loading.value = false;
      },
      err => {
        console.error('Error loading players:', err);
        error.value = 'Error al cargar el ranking';
        loading.value = false;
      }
    );
  } catch (err) {
    console.error('Error loading ranking:', err);
    error.value = 'Error al cargar el ranking';
    loading.value = false;
  }
};

const refreshRanking = () => {
  loadRanking();
};

const goBack = () => {
  router.back();
};

onMounted(() => {
  loadRanking();
});

onUnmounted(() => {
  if (unsubscribe) {
    unsubscribe();
  }
});
</script>

<style scoped lang="scss">
.ranking-view {
  display: flex;
  flex-direction: column;
}

.ranking-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: rgba(255, 255, 255, 0.2);
    border: none;
    border-radius: 50%;
    color: white;
    cursor: pointer;
    transition: background 0.2s;

    &:hover {
      background: rgba(255, 255, 255, 0.3);
    }

    &:focus {
      outline: 2px solid white;
      outline-offset: 2px;
    }
  }

  h1 {
    margin: 0;
    color: white;
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.loading,
.error-message {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 1rem;
  color: white;
  text-align: center;
}

.spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-top-color: white;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.ranking-content {
  flex: 1;
}

.game-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.15);
  backdrop-filter: blur(10px);
  border-radius: 12px;
  margin-bottom: 1.5rem;
  color: white;

  .session-status {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin: 0;
    font-weight: 600;

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: white;
    }

    &.running .status-dot {
      background: #4ade80;
      animation: pulse 2s infinite;
    }

    &.finished .status-dot {
      background: #60a5fa;
    }
  }

  .players-count {
    margin: 0;
    font-size: 0.875rem;
    opacity: 0.9;
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}

.ranking-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 2rem;
}

.player-card {
  display: flex;
  gap: 1rem;
  padding: 1.25rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &.is-current-user {
    border: 2px solid #667eea;
    background: linear-gradient(135deg, #f8f9ff 0%, #fff 100%);
  }

  &.podium-first {
    background: linear-gradient(135deg, #fffbeb 0%, #fff 100%);
    border: 2px solid #fbbf24;
  }

  &.podium-second {
    background: linear-gradient(135deg, #f5f5f5 0%, #fff 100%);
    border: 2px solid #9ca3af;
  }

  &.podium-third {
    background: linear-gradient(135deg, #fff5f0 0%, #fff 100%);
    border: 2px solid #f97316;
  }
}

.position-badge {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;

  .position-number {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    background: #e5e7eb;
    color: #374151;
    font-weight: 700;
    font-size: 1.125rem;
    border-radius: 50%;
  }
}

.player-info {
  flex: 1;
  min-width: 0;
}

.player-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 0.5rem;
  margin-bottom: 0.75rem;

  .player-name {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 600;
    color: #1f2937;
    display: flex;
    align-items: center;
    gap: 0.5rem;

    .you-badge {
      display: inline-block;
      padding: 0.125rem 0.5rem;
      background: #667eea;
      color: white;
      font-size: 0.75rem;
      font-weight: 600;
      border-radius: 4px;
    }
  }

  .status-badge {
    padding: 0.25rem 0.75rem;
    font-size: 0.75rem;
    font-weight: 600;
    border-radius: 12px;
    white-space: nowrap;

    &.finished {
      background: #d1fae5;
      color: #065f46;
    }

    &.playing {
      background: #fef3c7;
      color: #92400e;
    }
  }
}

.player-stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(70px, 1fr));
  gap: 0.75rem;
  margin-bottom: 0.75rem;

  .stat {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;

    .stat-label {
      font-size: 0.75rem;
      color: #6b7280;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1rem;
      font-weight: 700;
      color: #1f2937;

      &.points {
        color: #667eea;
      }

      &.time {
        color: #f59e0b;
      }

      &.penalty {
        color: #ef4444;
      }
    }
  }
}

.progress-bar {
  width: 100%;
  height: 4px;
  background: #e5e7eb;
  border-radius: 2px;
  overflow: hidden;

  .progress-fill {
    height: 100%;
    background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
    transition: width 0.3s ease;
  }
}

.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  color: white;
  font-size: 1.125rem;
  opacity: 0.8;
}

.refresh-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  width: 100%;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s;

  &:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    border-color: rgba(255, 255, 255, 0.5);
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  svg.spinning {
    animation: spin 1s linear infinite;
  }
}

@media (min-width: 640px) {
  .ranking-view {
    max-width: 768px;
    margin: 0 auto;
    padding: 2rem;
  }

  .ranking-header h1 {
    font-size: 2rem;
  }

  .player-stats {
    grid-template-columns: repeat(4, 1fr);
  }
}
</style>
