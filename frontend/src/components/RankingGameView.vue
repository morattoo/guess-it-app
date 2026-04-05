<template>
  <div class="ranking-view">
    <!-- ── HEADER ── -->
    <header class="ranking-header">
      <button class="back-btn" @click="goBack" aria-label="Volver">
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path
            d="M19 12H5M5 12L12 19M5 12L12 5"
            stroke="currentColor"
            stroke-width="2.5"
            stroke-linecap="round"
            stroke-linejoin="round"
          />
        </svg>
      </button>
      <h1>{{ t.ranking.title }}</h1>
    </header>

    <!-- ── LOADING ── -->
    <BaseLoader v-if="loading" v-model="loading" :text="t.ranking.loadingRanking" :overlay="true" />

    <!-- ── MAIN CONTENT ── -->
    <div v-else class="ranking-content">
      <!-- STATUS BAR (always on top) -->
      <div class="status-bar">
        <div class="status-bar__left">
          <p class="session-status" :class="sessionStatus.toLowerCase()">
            <span class="status-dot"></span>
            {{ statusText }}
          </p>
          <p class="participants-count">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
              <path
                d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <circle cx="9" cy="7" r="4" stroke="currentColor" stroke-width="2" />
              <path
                d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
            </svg>
            {{ players.length }} {{ t.ranking.participants }}
          </p>
        </div>
        <div class="status-bar__right">
          <button class="btn-success --refresh" @click="refreshRanking" :disabled="loading">
            <span>
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
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
            </span>
            <span v-if="lastUpdateTime" class="last-update">
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
                <path
                  d="M12 6v6l4 2"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
              {{ lastUpdateTime }}
            </span>
          </button>
        </div>
      </div>

      <!-- EMPTY STATE -->
      <div v-if="players.length === 0" class="empty-state">
        <p>{{ t.ranking.noPlayers }}</p>
      </div>

      <template v-else>
        <!-- ── PODIUM (top 3) ── -->
        <div class="podium-section">
          <div class="podium-stage">
            <!-- 2nd place -->
            <div class="podium-col podium-col--2" v-if="podiumPlayers[1]">
              <div class="podium-player-info">
                <div class="podium-avatar podium-avatar--silver">
                  {{ getInitials(podiumPlayers[1].displayName) }}
                </div>
                <p class="podium-name">{{ getShortName(podiumPlayers[1].displayName) }}</p>
                <p class="podium-score">{{ podiumPlayers[1].score.toLocaleString() }}</p>
                <div class="podium-meta">
                  <span>{{ podiumPlayers[1].currentQuestionIndex }}/{{ totalQuestions }}</span>
                  <span>⏱ {{ formatTime(podiumPlayers[1].totalTime) }}</span>
                </div>
              </div>
              <div class="podium-block podium-block--2">
                <span class="podium-rank-num">2</span>
              </div>
            </div>

            <!-- 1st place -->
            <div class="podium-col podium-col--1" v-if="podiumPlayers[0]">
              <div class="podium-crown">🏆</div>
              <div class="podium-player-info">
                <div class="podium-avatar podium-avatar--gold">
                  {{ getInitials(podiumPlayers[0].displayName) }}
                </div>
                <p class="podium-name podium-name--gold">
                  {{ getShortName(podiumPlayers[0].displayName) }}
                </p>
                <p class="podium-score podium-score--gold">
                  {{ podiumPlayers[0].score.toLocaleString() }}
                </p>
                <div class="podium-meta podium-meta--gold">
                  <span>{{ podiumPlayers[0].currentQuestionIndex }}/{{ totalQuestions }}</span>
                  <span>⏱ {{ formatTime(podiumPlayers[0].totalTime) }}</span>
                </div>
              </div>
              <div class="podium-block podium-block--1">
                <span class="podium-rank-num">1</span>
              </div>
            </div>

            <!-- 3rd place -->
            <div class="podium-col podium-col--3" v-if="podiumPlayers[2]">
              <div class="podium-player-info">
                <div class="podium-avatar podium-avatar--bronze">
                  {{ getInitials(podiumPlayers[2].displayName) }}
                </div>
                <p class="podium-name">{{ getShortName(podiumPlayers[2].displayName) }}</p>
                <p class="podium-score">{{ podiumPlayers[2].score.toLocaleString() }}</p>
                <div class="podium-meta">
                  <span>{{ podiumPlayers[2].currentQuestionIndex }}/{{ totalQuestions }}</span>
                  <span>⏱ {{ formatTime(podiumPlayers[2].totalTime) }}</span>
                </div>
              </div>
              <div class="podium-block podium-block--3">
                <span class="podium-rank-num">3</span>
              </div>
            </div>
          </div>
        </div>

        <!-- ── CONTENDERS ── -->
        <div class="contenders-section" v-if="contenders.length > 0">
          <div class="contenders-header">
            <h2 class="contenders-title">CONTENDERS</h2>
          </div>
          <div
            v-for="(player, idx) in contenders"
            :key="player.userId"
            class="contender-card"
            :class="{ 'is-current-user': player.userId === currentUserId }"
            :style="{ animationDelay: `${0.8 + idx * 0.1}s` }"
          >
            <span class="contender-rank">{{ podiumPlayers.length + idx + 1 }}</span>
            <div class="contender-avatar">{{ getInitials(player.displayName) }}</div>
            <div class="contender-info">
              <p class="contender-name">
                {{ player.displayName }}
                <span v-if="player.userId === currentUserId" class="you-badge">{{
                  t.ranking.you
                }}</span>
              </p>
              <p class="contender-questions">
                {{ player.currentQuestionIndex }}/{{ totalQuestions }}
                {{ t.ranking.currentQuestion }}
              </p>
              <div class="progress-bar">
                <div
                  class="progress-fill"
                  :style="{ width: player.progressPercentage + '%' }"
                ></div>
              </div>
            </div>
            <div class="contender-stats">
              <p class="contender-score">
                {{ player.score.toLocaleString() }}<span class="pts"> pts</span>
              </p>
              <p class="contender-time">⏱ {{ formatTime(player.totalTime) }}</p>
              <span
                class="contender-status-badge"
                :class="player.finishedAt ? 'finished' : 'playing'"
              >
                {{ player.finishedAt ? t.ranking.finished : t.ranking.playing }}
              </span>
            </div>
          </div>
        </div>
      </template>
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
import BaseLoader from './BaseLoader.vue';

import { useErrorHandler } from '@/composables/useErrorHandler';
const { showError } = useErrorHandler();

const { t } = useI18n();

const route = useRoute();
const router = useRouter();
const sessionId = route.params.sessionId as string;

const players = ref<RankingPlayer[]>([]);
const sessionStatus = ref('');
const totalQuestions = ref(0);
const loading = ref(true);
const currentUserId = ref<string | null>(null);
const lastUpdateTime = ref<string>('');

const statusText = computed(() => {
  if (sessionStatus.value === 'WAITING') return t.value.ranking.statusWaiting;
  if (sessionStatus.value === 'RUNNING') return t.value.ranking.statusRunning;
  return t.value.ranking.statusFinished;
});

const rankedPlayers = computed(() => players.value);
const podiumPlayers = computed(() => rankedPlayers.value.slice(0, 3));
const contenders = computed(() => rankedPlayers.value.slice(3));

const getInitials = (name: string): string => {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) return (parts[0][0]! + parts[1][0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase();
};

const getShortName = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  if (parts.length >= 2 && parts[0] && parts[1]) return `${parts[0]} ${parts[1][0]!}.`;
  return name;
};

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

const formatLastUpdate = (timestamp: number): string => {
  return new Date(timestamp).toLocaleTimeString();
};

const loadRanking = async () => {
  try {
    loading.value = true;

    const user = await getCurrentUser();
    currentUserId.value = user?.uid || null;

    const rankingData = await getPublicRanking(sessionId);

    if (!rankingData) {
      showError(t.value.ranking.errors.sessionNotFound);
      return;
    }

    sessionStatus.value = rankingData.status;
    totalQuestions.value = rankingData.totalQuestions;
    players.value = rankingData.players;
    lastUpdateTime.value = formatLastUpdate(rankingData.timestamp);
    loading.value = false;
  } catch (_err) {
    showError(t.value.ranking.errors.loadError);
    loading.value = false;
  }
};

const refreshRanking = () => loadRanking();
const goBack = () => router.back();

onMounted(() => loadRanking());
</script>

<style scoped lang="scss">
// ── Animations ──────────────────────────────────────────────────
@keyframes riseUp {
  from {
    transform: translateY(90px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes fadeSlideUp {
  from {
    transform: translateY(18px);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.35;
  }
}

@keyframes glowPulse {
  0%,
  100% {
    box-shadow: 0 0 12px rgba(255, 215, 0, 0.5);
  }
  50% {
    box-shadow: 0 0 24px rgba(255, 215, 0, 0.9);
  }
}

// ── Layout ──────────────────────────────────────────────────────
.ranking-view {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 1rem;
  padding-bottom: calc(2rem + env(safe-area-inset-bottom, 0px));
  box-sizing: border-box;
}

// ── Header ──────────────────────────────────────────────────────
.ranking-header {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  margin-bottom: 1rem;

  .back-btn {
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid rgb(94, 94, 94);
    border-radius: 10px;
    cursor: pointer;
    transition: background 0.2s;
    padding: 0;

    &:hover {
      background: rgba(255, 255, 255, 0.25);
    }
    &:focus {
      outline: 2px solid #a78bfa;
      outline-offset: 2px;
    }
  }

  h1 {
    margin: 0;
    font-size: 1.4rem;
    font-weight: 800;
    letter-spacing: -0.02em;
  }
}

// ── Ranking content ──────────────────────────────────────────────
.ranking-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

// ── Status Bar ───────────────────────────────────────────────────
.status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: rgb(241, 241, 241);
  backdrop-filter: blur(12px);
  border-radius: 8px;
  flex-wrap: wrap;

  &__left,
  &__right {
    display: flex;
    align-items: center;
    flex-direction: column;
    gap: 0.6rem;
    flex-wrap: wrap;
  }
}

.session-status {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  margin: 0;
  font-size: 0.75rem;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0.25rem;
  border-radius: 6px;

  .status-dot {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: #9ca3af;
    flex-shrink: 0;
  }

  &.running {
    background: #d1e1fa;
    color: #4a97de;

    .status-dot {
      background: #4a97de;
      animation: pulse 1.5s ease-in-out infinite;
      box-shadow: 0 0 6px #4a8fde;
    }
  }

  &.finished {
    background: #d1fae5;
    color: #065f46;

    .status-dot {
      background: #065f46;
    }
  }

  &.waiting {
    background: #fef3c7;
    color: #b45309;

    .status-dot {
      background: #fbbf24;
      animation: pulse 2s ease-in-out infinite;
    }
  }
}

.participants-count {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.75rem;
}

.last-update {
  display: flex;
  align-items: center;
  gap: 0.3rem;
  margin: 0;
  font-size: 0.68rem;
}

.--refresh {
  flex-direction: column;
  padding: 0.8rem;
}

// ── Podium ───────────────────────────────────────────────────────
.podium-section {
  padding-top: 0.5rem;
}

.podium-stage {
  display: flex;
  align-items: flex-end;
  justify-content: center;
  gap: 0.5rem;
}

.podium-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
  max-width: 115px;
  animation: riseUp 0.75s cubic-bezier(0.22, 1, 0.36, 1) both;

  &--1 {
    animation-delay: 0.55s;
  }
  &--2 {
    animation-delay: 0.2s;
  }
  &--3 {
    animation-delay: 0.38s;
  }
}

.podium-crown {
  font-size: 1.4rem;
  margin-bottom: 0.2rem;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.podium-player-info {
  text-align: center;
  width: 100%;
  padding: 0 2px;
  margin-bottom: 0.5rem;
}

.podium-avatar {
  width: 46px;
  height: 46px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.35);
  font-size: 0.95rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  margin: 0 auto 0.3rem;

  &--gold {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #ffe066 0%, #f59e0b 100%);
    border-color: #ffd700;
    color: #7a4f00;
    font-size: 1.1rem;
    box-shadow: 0 0 14px rgba(255, 215, 0, 0.55);
    animation: glowPulse 2s ease-in-out infinite;
  }

  &--silver {
    background: linear-gradient(135deg, #e2e8f0 0%, #94a3b8 100%);
    border-color: #cbd5e1;
    color: #334155;
  }

  &--bronze {
    background: linear-gradient(135deg, #d4956a 0%, #9f5a2a 100%);
    border-color: #cd7f32;
    color: #3e1f00;
  }
}

.podium-name {
  margin: 0 0 0.1rem;
  font-size: 0.72rem;
  font-weight: 700;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 100%;

  &--gold {
    font-size: 0.82rem;
    text-shadow: 0 0 8px rgba(255, 215, 0, 0.5);
  }
}

.podium-score {
  margin: 0 0 0.2rem;
  font-size: 1rem;
  font-weight: 800;
  line-height: 1;
}

.podium-meta {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.08rem;
  font-size: 0.62rem;
}

.podium-block {
  width: 100%;
  border-radius: 10px 10px 3px 3px;
  display: flex;
  align-items: center;
  justify-content: center;

  &--1 {
    height: 110px;
    background: linear-gradient(180deg, #ffd700 0%, #f59e0b 100%);
    box-shadow:
      0 -4px 18px rgba(255, 215, 0, 0.35),
      inset 0 1px 0 rgba(255, 255, 255, 0.3);
  }

  &--2 {
    height: 80px;
    background: linear-gradient(180deg, #e2e8f0 0%, #94a3b8 100%);
    box-shadow:
      0 -3px 12px rgba(148, 163, 184, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.4);
  }

  &--3 {
    height: 60px;
    background: linear-gradient(180deg, #d4956a 0%, #9f5a2a 100%);
    box-shadow:
      0 -3px 12px rgba(212, 149, 106, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.15);
  }
}

.podium-rank-num {
  font-size: 1.6rem;
  font-weight: 900;
  color: rgba(0, 0, 0, 0.25);
  letter-spacing: -0.03em;
  user-select: none;
}

// ── Contenders ───────────────────────────────────────────────────
.contenders-section {
  flex: 1;
}

.contenders-header {
  padding: 0.25rem 0 0.6rem;
}

.contenders-title {
  margin: 0;
  font-size: 0.7rem;
  font-weight: 800;
  color: rgba(255, 255, 255, 0.45);
  letter-spacing: 0.12em;
}

.contender-card {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  padding: 0.8rem 0.9rem;
  background: white;
  border-radius: 14px;
  margin-bottom: 0.65rem;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  animation: fadeSlideUp 0.5s cubic-bezier(0.22, 1, 0.36, 1) both;

  &.is-current-user {
    border: 2px solid #7c3aed;
    background: linear-gradient(135deg, #f5f3ff 0%, #fff 100%);
  }
}

.contender-rank {
  flex-shrink: 0;
  width: 25px;
  height: 25px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f3f4f6;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
  color: #6b7280;
}

.contender-avatar {
  flex-shrink: 0;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: linear-gradient(135deg, #ffffff 0%, #c1c1c1 100%);
  font-size: 0.8rem;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
}

.contender-info {
  flex: 1;
  min-width: 0;
}

.contender-name {
  margin: 0 0 0.1rem;
  font-size: 0.875rem;
  font-weight: 700;
  color: #1f2937;
  display: flex;
  align-items: center;
  gap: 0.35rem;
  flex-wrap: wrap;
}

.you-badge {
  display: inline-block;
  padding: 0.1rem 0.4rem;
  background: #7c3aed;
  font-size: 0.62rem;
  font-weight: 700;
  border-radius: 4px;
  flex-shrink: 0;
}

.contender-questions {
  margin: 0 0 0.3rem;
  font-size: 0.67rem;
  color: #9ca3af;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.03em;
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
    border-radius: 2px;
    transition: width 0.5s ease;
  }
}

.contender-stats {
  flex-shrink: 0;
  text-align: right;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.15rem;
}

.contender-score {
  margin: 0;
  font-size: 0.95rem;
  font-weight: 800;
  color: #1f2937;
  white-space: nowrap;
  line-height: 1;

  .pts {
    font-size: 0.68rem;
    color: #6b7280;
    font-weight: 600;
  }
}

.contender-time {
  margin: 0;
  font-size: 0.72rem;
  color: #f59e0b;
  font-weight: 600;
}

.contender-status-badge {
  font-size: 0.62rem;
  font-weight: 600;
  padding: 0.1rem 0.4rem;
  border-radius: 4px;

  &.finished {
    background: #d1fae5;
    color: #065f46;
  }

  &.playing {
    background: #fef3c7;
    color: #92400e;
  }
}

// ── Empty ─────────────────────────────────────────────────────────
.empty-state {
  padding: 3rem 1rem;
  text-align: center;
  font-size: 1rem;
  color: rgba(255, 255, 255, 0.65);
}

// ── Responsive ───────────────────────────────────────────────────
@media (min-width: 640px) {
  .ranking-view {
    max-width: 768px;
    margin: 0 auto;
    padding: 2rem;
  }

  .ranking-header h1 {
    font-size: 1.75rem;
  }

  .podium-col {
    max-width: 150px;
  }

  .podium-avatar--gold {
    width: 64px;
    height: 64px;
  }

  .podium-block--1 {
    height: 130px;
  }
  .podium-block--2 {
    height: 95px;
  }
  .podium-block--3 {
    height: 72px;
  }
}
</style>
