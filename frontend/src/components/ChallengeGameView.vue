<template>
  <div class="challenge-game-view">
    <SuccessAnimation :show="showSuccess" />
    <ErrorAnimation :show="showErrorAnim" />

    <div class="container">
      <HeaderLogo />
      <BaseLoader v-model="loading" overlay :text="t.common.loading" :size="60" color="#10b981" />

      <!-- ───────────────────── WAITING lobby ───────────────────── -->
      <div v-if="!loading && phase === 'waiting'" class="challenge-card lobby-card">
        <div class="lobby-header">
          <div class="challenge-badge">⚡ Challenge</div>
          <h1>{{ gameSession?.title || t.challenge.lobby.title }}</h1>
          <p class="lobby-subtitle">{{ t.challenge.lobby.waitingForHost }}</p>
          <div class="pulse-indicator"></div>
        </div>

        <div v-if="Object.keys(players).length > 0" class="players-lobby-list">
          <h3>{{ t.challenge.lobby.players }} ({{ Object.keys(players).length }})</h3>
          <div
            v-for="[uid, player] in Object.entries(players)"
            :key="uid"
            class="lobby-player"
            :class="{ 'current-player': uid === currentUserId }"
          >
            <div class="player-avatar">{{ player.displayName.charAt(0).toUpperCase() }}</div>
            <span>{{ player.displayName }}</span>
            <span v-if="uid === currentUserId" class="you-badge">{{ t.ranking.you }}</span>
          </div>
        </div>

        <p v-else class="no-players-yet">{{ t.challenge.lobby.noPlayersYet }}</p>
      </div>

      <!-- ───────────────────── PLAYING — question ───────────────────── -->
      <div
        v-else-if="!loading && phase === 'playing' && currentQuestion"
        class="challenge-card question-card"
      >
        <!-- Timer bar -->
        <div class="timer-bar-wrapper">
          <div
            class="timer-bar-fill"
            :class="{ 'timer-warning': timerSecondsLeft <= 5 }"
            :style="{ width: timerPercent + '%' }"
          ></div>
        </div>

        <div class="question-header">
          <span class="question-counter">
            {{ t.play.question }} {{ challengeDoc!.currentQuestionIndex + 1 }} {{ t.play.of }}
            {{ totalQuestions }}
          </span>
          <span class="timer-display" :class="{ 'timer-warning': timerSecondsLeft <= 5 }">
            ⏱ {{ timerSecondsLeft }}s
          </span>
          <span class="question-points">{{ currentQuestion.points }} {{ t.play.points }}</span>
        </div>

        <h2 class="question-title">{{ currentQuestion.title }}</h2>
        <p v-if="currentQuestion.description" class="question-description">
          {{ currentQuestion.description }}
        </p>

        <form v-if="!hasAnswered" @submit.prevent="handleSubmitAnswer" class="answer-form">
          <TextQuestionAnswer
            v-if="currentQuestion.type === QUESTION_TYPES.TEXT"
            v-model="textNumberAnswer"
            :disabled="submitting || timerExpired"
          />
          <NumberQuestionAnswer
            v-else-if="currentQuestion.type === QUESTION_TYPES.NUMBER"
            v-model="textNumberAnswer"
            :disabled="submitting || timerExpired"
          />
          <ChoiceQuestionAnswer
            v-else-if="currentQuestion.type === QUESTION_TYPES.CHOICE"
            v-model="choiceAnswer"
            :options="choiceOptions"
            :disabled="submitting || timerExpired"
          />
          <OrderingQuestionAnswer
            v-else-if="currentQuestion.type === QUESTION_TYPES.ORDERING"
            v-model="orderingAnswer"
            :items="orderingItems"
            :disabled="submitting || timerExpired"
          />
          <BooleanQuestionAnswer
            v-else-if="currentQuestion.type === QUESTION_TYPES.BOOLEAN"
            v-model="booleanAnswer"
            :disabled="submitting || timerExpired"
          />

          <button
            type="submit"
            class="btn btn-primary btn-large"
            :disabled="submitting || timerExpired || !isAnswerValid"
          >
            {{ submitting ? t.challenge.playing.sending : t.challenge.playing.send }}
          </button>
        </form>

        <div v-else class="answered-waiting">
          <div class="answered-icon">✓</div>
          <p>{{ t.challenge.playing.answered }}</p>
          <p class="waiting-host">{{ t.challenge.playing.waitingForOthers }}</p>
        </div>

        <div v-if="timerExpired && !hasAnswered" class="time-up-banner">
          ⏰ {{ t.challenge.playing.timeUp }}
        </div>
      </div>

      <!-- ───────────────────── SHOWING RESULT ───────────────────── -->
      <div v-else-if="!loading && phase === 'showing_result'" class="challenge-card result-card">
        <div v-if="myLastAnswerCorrect === true" class="result-feedback correct">
          <div class="result-icon">🎉</div>
          <h2>{{ t.challenge.result.correct }}</h2>
          <p class="points-earned">+{{ currentQuestion?.points ?? 0 }} {{ t.play.points }}</p>
        </div>
        <div v-else-if="myLastAnswerCorrect === false" class="result-feedback incorrect">
          <div class="result-icon">❌</div>
          <h2>{{ t.challenge.result.incorrect }}</h2>
        </div>
        <div v-else class="result-feedback no-answer">
          <div class="result-icon">⏰</div>
          <h2>{{ t.challenge.result.noAnswer }}</h2>
        </div>

        <h3 class="scoreboard-title">{{ t.challenge.result.scoreboard }}</h3>
        <div class="scoreboard-list">
          <div
            v-for="(entry, index) in rankedPlayers"
            :key="entry.uid"
            class="scoreboard-entry"
            :class="{ 'current-player': entry.uid === currentUserId }"
          >
            <span class="rank">{{ index + 1 }}</span>
            <div class="player-avatar small">{{ entry.displayName.charAt(0).toUpperCase() }}</div>
            <span class="player-name">
              {{ entry.displayName }}
              <span v-if="entry.uid === currentUserId" class="you-badge">{{ t.ranking.you }}</span>
            </span>
            <span class="player-score">{{ entry.score }} {{ t.play.points }}</span>
          </div>
        </div>

        <p class="waiting-host">{{ t.challenge.result.waitingForNext }}</p>
      </div>

      <!-- ───────────────────── FINISHED ───────────────────── -->
      <div v-else-if="!loading && phase === 'finished'" class="challenge-card finished-card">
        <div class="trophy-icon">🏆</div>
        <h1>{{ t.challenge.finished.title }}</h1>
        <p>{{ t.challenge.finished.subtitle }}</p>
        <router-link :to="`/game/${sessionId}/ranking`" class="btn btn-primary btn-large">
          {{ t.challenge.finished.viewRanking }}
        </router-link>
      </div>

      <!-- no challenge doc and not loading: session is waiting for initialization -->
      <div v-else-if="!loading && !challengeDoc" class="challenge-card lobby-card">
        <div class="challenge-badge">⚡ Challenge</div>
        <h1>{{ gameSession?.title || t.challenge.lobby.title }}</h1>
        <p class="lobby-subtitle">{{ t.challenge.lobby.waitingForHost }}</p>
        <div class="pulse-indicator"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import {
  getPublicGameSession,
  subscribeToChallenge,
  submitChallengeAnswer,
} from '@/firebase/publicGame';
import { getCurrentUser } from '@/firebase/auth';
import type {
  GameSession,
  GameSessionChallenge,
  GameSessionQuestion,
} from '@shared/models/GameSession';
import { QUESTION_TYPES } from '@/constants/questionTypes';
import { useI18n } from '@/composables/useI18n';
import { useFeedbackAnimation } from '@/composables/useFeedbackAnimation';
import { useErrorHandler } from '@/composables/useErrorHandler';
import HeaderLogo from '@/components/layout/HeaderLogo.vue';
import BaseLoader from '@/components/BaseLoader.vue';
import SuccessAnimation from '@/components/animations/SuccessAnimation.vue';
import ErrorAnimation from '@/components/animations/ErrorAnimation.vue';
import TextQuestionAnswer from '@/components/questions/TextQuestionAnswer.vue';
import NumberQuestionAnswer from '@/components/questions/NumberQuestionAnswer.vue';
import ChoiceQuestionAnswer from '@/components/questions/ChoiceQuestionAnswer.vue';
import OrderingQuestionAnswer from '@/components/questions/OrderingQuestionAnswer.vue';
import BooleanQuestionAnswer from '@/components/questions/BooleanQuestionAnswer.vue';

const route = useRoute();
const { t } = useI18n();
const { showError: reportError } = useErrorHandler();
const {
  showSuccess,
  showError: showErrorAnim,
  triggerSuccess,
  triggerError,
} = useFeedbackAnimation();

const sessionId = computed(() => route.params.sessionId as string);

const loading = ref(true);
const gameSession = ref<GameSession | null>(null);
const challengeDoc = ref<GameSessionChallenge | null>(null);
const currentUserId = ref<string | null>(null);
const currentAnswer = ref<string | number | boolean | string[] | null>(null);
const submitting = ref(false);
const hasAnswered = ref(false);

let unsubscribeChallenge: (() => void) | null = null;
let timerInterval: ReturnType<typeof setInterval> | null = null;

// ── Timer state ──────────────────────────────────────────────────────────────
const timerSecondsLeft = ref(0);
const timerExpired = ref(false);

// ── Computed ─────────────────────────────────────────────────────────────────
const phase = computed<'waiting' | 'playing' | 'showing_result' | 'finished'>(() => {
  if (!challengeDoc.value) return 'waiting';
  return challengeDoc.value.status;
});

const players = computed<GameSessionChallenge['players']>(() => {
  return challengeDoc.value?.players ?? {};
});

const totalQuestions = computed(() => gameSession.value?.questions.length ?? 0);

const currentQuestion = computed<GameSessionQuestion | null>(() => {
  if (!challengeDoc.value || !gameSession.value) return null;
  return gameSession.value.questions[challengeDoc.value.currentQuestionIndex] ?? null;
});

const choiceOptions = computed(() => {
  if (!currentQuestion.value || currentQuestion.value.type !== 'CHOICE') return [];
  return currentQuestion.value.options ?? [];
});

const orderingItems = computed(() => {
  if (!currentQuestion.value || currentQuestion.value.type !== 'ORDERING') return [];
  return currentQuestion.value.items ?? [];
});

// Typed computed wrappers to satisfy each answer component's prop types
const textNumberAnswer = computed<string | number>({
  get: () => (currentAnswer.value as string | number) ?? '',
  set: (v: string | number) => {
    currentAnswer.value = v;
  },
});

const choiceAnswer = computed<string | number | string[]>({
  get: () => (currentAnswer.value as string | number | string[]) ?? '',
  set: (v: string | number | string[]) => {
    currentAnswer.value = v;
  },
});

const orderingAnswer = computed<string[]>({
  get: () => (Array.isArray(currentAnswer.value) ? (currentAnswer.value as string[]) : []),
  set: (v: string[]) => {
    currentAnswer.value = v;
  },
});

const booleanAnswer = computed<boolean | null>({
  get: () => (typeof currentAnswer.value === 'boolean' ? currentAnswer.value : null),
  set: (v: boolean | null) => {
    currentAnswer.value = v;
  },
});

const isAnswerValid = computed(() => {
  const q = currentQuestion.value;
  if (!q) return false;
  if (q.type === QUESTION_TYPES.ORDERING)
    return Array.isArray(currentAnswer.value) && (currentAnswer.value as string[]).length > 0;
  if (q.type === QUESTION_TYPES.BOOLEAN)
    return currentAnswer.value !== null && currentAnswer.value !== undefined;
  return (
    currentAnswer.value !== null && currentAnswer.value !== '' && currentAnswer.value !== undefined
  );
});

const timerPercent = computed(() => {
  const limit = currentQuestion.value?.penaltySeconds ?? 30;
  if (limit === 0) return 0;
  return Math.max(0, (timerSecondsLeft.value / limit) * 100);
});

const myLastAnswerCorrect = computed<boolean | undefined>(() => {
  if (!challengeDoc.value || !currentUserId.value) return undefined;
  const entry = challengeDoc.value.players[currentUserId.value];
  return entry?.lastAnswerCorrect;
});

const rankedPlayers = computed(() => {
  return Object.entries(players.value)
    .map(([uid, p]) => ({ uid, ...p }))
    .sort((a, b) => b.score - a.score);
});

// ── Timer logic ───────────────────────────────────────────────────────────────
function startTimer(timeLimitSec: number, questionStartSeconds: number) {
  clearTimer();
  timerExpired.value = false;

  function tick() {
    const nowSeconds = Date.now() / 1000;
    const elapsed = nowSeconds - questionStartSeconds;
    const remaining = Math.max(0, timeLimitSec - elapsed);
    timerSecondsLeft.value = Math.ceil(remaining);
    if (remaining <= 0) {
      timerExpired.value = true;
      clearTimer();
    }
  }

  tick();
  timerInterval = setInterval(tick, 500);
}

function clearTimer() {
  if (timerInterval !== null) {
    clearInterval(timerInterval);
    timerInterval = null;
  }
}

function resetAnswer(question: GameSessionQuestion | null) {
  if (!question) {
    currentAnswer.value = null;
    return;
  }
  if (question.type === QUESTION_TYPES.ORDERING) currentAnswer.value = [];
  else if (question.type === QUESTION_TYPES.BOOLEAN) currentAnswer.value = null;
  else currentAnswer.value = '';
}

// ── Watch phase transitions ───────────────────────────────────────────────────
watch(phase, (newPhase, _oldPhase) => {
  if (newPhase === 'playing') {
    hasAnswered.value = false;
    resetAnswer(currentQuestion.value);
    timerExpired.value = false;

    // Start timer using questionStartTime from challenge doc
    const qStartTime = challengeDoc.value?.questionStartTime;
    const timeLimitSec = currentQuestion.value?.penaltySeconds ?? 30;
    if (qStartTime && 'seconds' in qStartTime) {
      startTimer(timeLimitSec, qStartTime.seconds + qStartTime.nanoseconds / 1e9);
    } else {
      // Fallback: start from now (should not normally happen)
      startTimer(timeLimitSec, Date.now() / 1000);
    }
  } else {
    clearTimer();
  }

  // Check if already answered when first entering 'playing' phase
  if (newPhase === 'playing' && currentUserId.value && challengeDoc.value) {
    const myEntry = challengeDoc.value.players[currentUserId.value];
    if (myEntry?.answeredCurrentQuestion) {
      hasAnswered.value = true;
    }
  }
});

// Also check answered state on each challengeDoc update
watch(
  challengeDoc,
  doc => {
    if (doc?.status === 'playing' && currentUserId.value) {
      const myEntry = doc.players[currentUserId.value];
      if (myEntry?.answeredCurrentQuestion) {
        hasAnswered.value = true;
      }
    }
  },
  { deep: true }
);

// ── Submit answer ─────────────────────────────────────────────────────────────
async function handleSubmitAnswer() {
  if (submitting.value || hasAnswered.value || timerExpired.value || !isAnswerValid.value) return;

  submitting.value = true;
  try {
    const result = await submitChallengeAnswer(sessionId.value, currentAnswer.value!);
    hasAnswered.value = true;
    if (result.correct) {
      triggerSuccess();
    } else {
      triggerError();
    }
  } catch (err: unknown) {
    reportError((err as Error).message || t.value.play.errors.submitError);
  } finally {
    submitting.value = false;
  }
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
onMounted(async () => {
  try {
    const [session, user] = await Promise.all([
      getPublicGameSession(sessionId.value),
      getCurrentUser(),
    ]);

    gameSession.value = session;
    currentUserId.value = user?.uid ?? null;

    if (!session) {
      reportError(t.value.join.errors.sessionNotFound);
      loading.value = false;
      return;
    }

    // Subscribe to the challenge real-time doc
    unsubscribeChallenge = subscribeToChallenge(sessionId.value, doc => {
      challengeDoc.value = doc;

      // If entering playing phase for the first time via snapshot (component was already mounted)
      if (doc?.status === 'playing') {
        const q = session.questions[doc.currentQuestionIndex];
        const qStartTime = doc.questionStartTime;
        const timeLimitSec = q?.penaltySeconds ?? 30;
        if (
          qStartTime &&
          'seconds' in qStartTime &&
          timerInterval === null &&
          !timerExpired.value
        ) {
          startTimer(timeLimitSec, qStartTime.seconds + qStartTime.nanoseconds / 1e9);
        }
      }
    });
  } catch (err: unknown) {
    reportError((err as Error).message || t.value.join.errors.loadError);
  } finally {
    loading.value = false;
  }
});

onUnmounted(() => {
  unsubscribeChallenge?.();
  clearTimer();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.challenge-game-view {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  min-height: 100%;
  padding: 1rem 0;
  box-sizing: border-box;
}

.container {
  max-width: 600px;
  width: 100%;
  padding: 1rem;
  margin: auto;
}

.challenge-card {
  background: white;
  padding: 2rem;
  border-radius: 16px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.12);
  margin-top: 1.5rem;
}

/* Challenge badge */
.challenge-badge {
  display: inline-block;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  font-weight: 700;
  font-size: 0.875rem;
  padding: 0.3rem 0.9rem;
  border-radius: 50px;
  margin-bottom: 1rem;
  letter-spacing: 0.05em;
}

/* ── Lobby ── */
.lobby-card {
  text-align: center;

  h1 {
    font-size: 1.75rem;
    color: $text-strong;
    margin-bottom: 0.5rem;
  }
}

.lobby-subtitle {
  color: $text-secondary;
  font-size: 1rem;
  margin-bottom: 1.5rem;
}

.pulse-indicator {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: #10b981;
  margin: 0 auto 1.5rem;
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%,
  100% {
    transform: scale(1);
    opacity: 1;
  }
  50% {
    transform: scale(1.4);
    opacity: 0.6;
  }
}

.players-lobby-list {
  text-align: left;
  h3 {
    font-size: 1rem;
    color: $text-secondary;
    margin-bottom: 0.75rem;
  }
}

.lobby-player {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  border-radius: 8px;
  background: $bg-item;
  margin-bottom: 0.5rem;
  transition: background 0.2s;

  &.current-player {
    background: #ede9fe;
    border-left: 3px solid #6366f1;
  }
}

.player-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #6366f1, #8b5cf6);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  font-size: 1rem;
  flex-shrink: 0;

  &.small {
    width: 28px;
    height: 28px;
    font-size: 0.8rem;
  }
}

.you-badge {
  display: inline-block;
  background: #6366f1;
  color: white;
  font-size: 0.7rem;
  font-weight: 700;
  padding: 0.1rem 0.45rem;
  border-radius: 50px;
  margin-left: 0.25rem;
}

.no-players-yet {
  color: $text-secondary;
  font-style: italic;
  text-align: center;
  padding: 1rem 0;
}

/* ── Question ── */
.timer-bar-wrapper {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  margin-bottom: 1.25rem;
  overflow: hidden;
}

.timer-bar-fill {
  height: 100%;
  background: #10b981;
  border-radius: 4px;
  transition:
    width 0.5s linear,
    background 0.3s;

  &.timer-warning {
    background: #ef4444;
  }
}

.question-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1rem;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.question-counter {
  color: $text-secondary;
  font-size: 0.9rem;
}
.timer-display {
  font-size: 1rem;
  font-weight: 700;
  color: #10b981;
  &.timer-warning {
    color: #ef4444;
  }
}
.question-points {
  font-size: 0.9rem;
  color: #6366f1;
  font-weight: 600;
}
.question-title {
  font-size: 1.375rem;
  color: $text-strong;
  margin-bottom: 0.5rem;
}
.question-description {
  color: $text-secondary;
  margin-bottom: 1rem;
}

.answer-form {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.answered-waiting {
  text-align: center;
  padding: 2rem 0;

  .answered-icon {
    font-size: 3rem;
    color: #10b981;
    margin-bottom: 0.5rem;
  }

  p {
    color: $text-secondary;
  }
}

.waiting-host {
  color: $text-secondary;
  font-size: 0.875rem;
  text-align: center;
  margin-top: 0.5rem;
}

.time-up-banner {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #dc2626;
  padding: 0.75rem 1rem;
  border-radius: 8px;
  text-align: center;
  font-weight: 600;
  margin-top: 1rem;
}

/* ── Result ── */
.result-card {
  text-align: center;
}

.result-feedback {
  padding: 1.5rem;
  border-radius: 12px;
  margin-bottom: 1.5rem;

  .result-icon {
    font-size: 3rem;
    margin-bottom: 0.5rem;
  }

  h2 {
    font-size: 1.5rem;
    margin-bottom: 0.25rem;
  }

  &.correct {
    background: #f0fdf4;
  }
  &.incorrect {
    background: #fef2f2;
  }
  &.no-answer {
    background: #fefce8;
  }
}

.points-earned {
  font-size: 1.25rem;
  font-weight: 700;
  color: #10b981;
}

.scoreboard-title {
  font-size: 1rem;
  font-weight: 600;
  color: $text-secondary;
  text-align: left;
  margin-bottom: 0.75rem;
}

.scoreboard-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.scoreboard-entry {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.6rem 1rem;
  background: $bg-item;
  border-radius: 8px;

  &.current-player {
    background: #ede9fe;
    border-left: 3px solid #6366f1;
  }

  .rank {
    font-weight: 700;
    width: 1.5rem;
    color: $text-secondary;
  }
  .player-name {
    flex: 1;
    text-align: left;
  }
  .player-score {
    font-weight: 700;
    color: #6366f1;
  }
}

/* ── Finished ── */
.finished-card {
  text-align: center;

  .trophy-icon {
    font-size: 4rem;
    margin-bottom: 1rem;
  }

  h1 {
    font-size: 1.75rem;
    color: $text-strong;
    margin-bottom: 0.5rem;
  }

  p {
    color: $text-secondary;
    margin-bottom: 1.5rem;
  }
}
</style>
