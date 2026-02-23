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
            stroke="#000000"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <h1>{{ t.ranking.title }}</h1>
    </header>

    <div v-if="loading" class="loading">
      <div class="spinner"></div>
      <p>{{ t.ranking.loadingRanking }}</p>
    </div>

    <div v-else-if="error" class="error-message" role="alert">
      {{ error }}
    </div>

    <div v-else class="ranking-content">
      <!-- Game Info -->
      <div class="game-info">
        <p class="session-status" :class="sessionStatus.toLowerCase()">
          <span class="status-dot"></span>
          {{ statusText }}
        </p>
        <p class="players-count">{{ players.length }} {{ t.ranking.participants }}</p>
      </div>

      <!-- Last Update Time -->
      <div v-if="lastUpdateTime" class="last-update">
        {{ t.ranking.lastUpdate }}: {{ lastUpdateTime }}
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
        {{ t.ranking.refresh }}
      </button>

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
                <span v-if="player.userId === currentUserId" class="you-badge">{{
                  t.ranking.you
                }}</span>
              </h3>
              <span
                class="status-badge"
                :class="player.finishedAt ? 'finished' : 'playing'"
                :aria-label="player.finishedAt ? 'Finalizado' : 'Jugando'"
              >
                {{ player.finishedAt ? t.ranking.finished : t.ranking.playing }}
              </span>
            </div>

            <div class="player-stats">
              <div class="stat">
                <span class="stat-label">{{ t.ranking.points }}</span>
                <span class="stat-value points">{{ player.score }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">{{ t.ranking.currentQuestion }}</span>
                <span class="stat-value">{{ player.currentQuestionIndex }}</span>
              </div>
              <div class="stat">
                <span class="stat-label">{{ t.ranking.time }}</span>
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
          <p>{{ t.ranking.noPlayers }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCurrentUser } from '@/firebase/auth';
import { getPublicRanking } from '@/firebase/publicGame';
import { useI18n } from '@/composables/useI18n';
import type { RankingPlayer } from '@shared/models/GameSession';

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const sessionId = route.params.sessionId as string;

const players = ref<RankingPlayer[]>([]);
const sessionStatus = ref('');
const totalQuestions = ref(0);
const loading = ref(true);
const error = ref<string | null>(null);
const currentUserId = ref<string | null>(null);
const lastUpdateTime = ref<string>('');

const statusText = computed(() => {
  if (sessionStatus.value === 'WAITING') return t.value.ranking.statusWaiting;
  if (sessionStatus.value === 'RUNNING') return t.value.ranking.statusRunning;
  return t.value.ranking.statusFinished;
});

const rankedPlayers = computed(() => players.value);

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) {
    return '0:00';
  }
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatLastUpdate = (timestamp: number): string => {
  const date = new Date(timestamp);
  return date.toLocaleTimeString();
};

const loadRanking = async () => {
  try {
    loading.value = true;
    error.value = null;

    // Get current user
    const user = await getCurrentUser();
    currentUserId.value = user?.uid || null;

    // Load ranking from API
    const rankingData = await getPublicRanking(sessionId);

    if (!rankingData) {
      error.value = t.value.ranking.errors.sessionNotFound;
      return;
    }

    // Update state
    sessionStatus.value = rankingData.status;
    totalQuestions.value = rankingData.totalQuestions;
    players.value = rankingData.players;
    lastUpdateTime.value = formatLastUpdate(rankingData.timestamp);

    loading.value = false;
  } catch (err) {
    console.error('Error loading ranking:', err);
    error.value = t.value.ranking.errors.loadError;
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
</script>

<style scoped lang="scss">
.ranking-view {
  display: flex;
  flex-direction: column;
  overflow: hidden;
  overflow-y: auto;
  padding: 1rem;
  margin-bottom: 2rem;
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
    background: transparent;
    border: none;
    cursor: pointer;
    transition: opacity 0.2s;
    padding: 0;

    &:hover {
      opacity: 0.7;
    }

    &:focus {
      outline: 2px solid #667eea;
      outline-offset: 2px;
    }
  }

  h1 {
    margin: 0;
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

.last-update {
  padding: 0.75rem 1rem;
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  border-radius: 8px;
  margin-bottom: 0.5rem;
  text-align: center;
  font-size: 0.875rem;
  opacity: 0.9;
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
