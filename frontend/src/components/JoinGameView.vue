<template>
  <div class="join-game-view">
    <div class="container">
      <HeaderLogo />
      <BaseLoader v-model="loading" overlay :text="t.join.loading" :size="60" color="#10b981" />
      <div v-if="gameSession" class="join-card">
        <h1>{{ t.join.joinGame }}</h1>

        <div class="session-info">
          <p class="info-text">
            <strong>{{ t.join.status }}: </strong>
            <span :class="`status-${gameSession.status.toLowerCase()}`">
              {{ statusText }}
            </span>
          </p>
          <p class="info-text">
            <strong>{{ t.join.questions }}:</strong> {{ gameSession.questions.length }}
          </p>
        </div>

        <form v-if="!hasJoined" @submit.prevent="handleJoin" class="join-form">
          <div v-if="showNameInput" class="form-group">
            <label for="displayName">{{ t.join.enterName }}</label>
            <input
              id="displayName"
              v-model="displayName"
              type="text"
              class="form-input"
              :placeholder="t.join.yourName"
              required
              maxlength="50"
            />
          </div>

          <div v-else class="welcome-message">
            <p>
              {{ t.join.welcome }}, <strong>{{ currentUserName }}</strong>
            </p>
          </div>

          <button
            type="submit"
            class="btn btn-primary btn-large"
            :disabled="
              gameSession.status === 'WAITING' || joining || (showNameInput && !displayName.trim())
            "
          >
            {{ joining ? t.join.joining : t.join.joinButton }}
          </button>
        </form>

        <div v-else class="joined-message">
          <div class="success-icon">✓</div>
          <h2>{{ t.join.joinedSuccess }}</h2>
          <p>{{ t.join.getReadyToPlay }}</p>
          <button @click="goToPlay" class="btn btn-success btn-large">{{ t.join.goToPlay }}</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import { getCurrentUser } from '@/firebase/auth';
import {
  getPublicGameSession,
  joinPublicGameSession,
  getPublicPlayerProgress,
} from '@/firebase/publicGame';
import type { GameSession } from '@shared/models/GameSession';
import HeaderLogo from '@/components/layout/HeaderLogo.vue';
import { getUserProfile } from '@/firebase/users';
import { useI18n } from '@/composables/useI18n';
import BaseLoader from '@/components/BaseLoader.vue';
import { useErrorHandler } from '@/composables/useErrorHandler';
const { showError } = useErrorHandler();

const { t } = useI18n();
const router = useRouter();
const route = useRoute();

const gameSession = ref<GameSession | null>(null);
const loading = ref(true);
const error = ref('');
const displayName = ref('');
const currentUserName = ref('');
const showNameInput = ref(false);
const joining = ref(false);
const hasJoined = ref(false);

const sessionId = computed(() => route.params.sessionId as string);

const statusText = computed(() => {
  if (!gameSession.value) return '';
  const status = gameSession.value.status;
  if (status === 'WAITING') return t.value.join.statusWaiting;
  if (status === 'RUNNING') return t.value.join.statusRunning;
  return t.value.join.statusFinished;
});

onMounted(async () => {
  try {
    // Cargar la sesión (sin necesidad de autenticación)
    const session = await getPublicGameSession(sessionId.value);

    gameSession.value = session;

    if (!session) {
      error.value = t.value.join.errors.sessionNotFound;
      loading.value = false;
      showError(error.value);
      return;
    }

    if (session.status === 'FINISHED') {
      error.value = t.value.join.errors.sessionFinished;
      loading.value = false;
      showError(error.value, {
        returnUrl: `/game/${sessionId.value}/ranking`,
        returnButtonText: t.value.join.goToRanking,
      });
      return;
    }

    if (!session.isOpen) {
      error.value = t.value.join.errors.sessionClosed;
      loading.value = false;
      showError(error.value);
      return;
    }

    // Verificar autenticación (puede ser null)
    const user = await getCurrentUser();

    if (!user) {
      // Usuario no autenticado, mostrar input de nombre
      showNameInput.value = true;
    } else if (user.isAnonymous && !user.displayName) {
      // Usuario anónimo sin nombre
      showNameInput.value = true;
    } else if (user.isAnonymous && user.displayName) {
      // Usuario anónimo con nombre válido
      currentUserName.value = user.displayName;
      showNameInput.value = false;
    } else {
      // Usuario autenticado con nombre
      const profile = await getUserProfile(user.uid);
      currentUserName.value = profile?.name || 'Jugador';
      showNameInput.value = false;
    }

    // Verificar si ya se unió (solo si hay usuario)
    if (user) {
      const progress = await getPublicPlayerProgress(sessionId.value);
      if (progress) {
        hasJoined.value = true;
      }
    }

    loading.value = false;
  } catch (err: unknown) {
    error.value = (err as Error).message || t.value.join.errors.loadError;
    loading.value = false;
    showError(error.value);
  }
});

const handleJoin = async () => {
  if (joining.value) return;

  try {
    joining.value = true;

    const nameToUse = showNameInput.value ? displayName.value.trim() : currentUserName.value;

    // Esta función maneja la autenticación anónima automáticamente si es necesario
    await joinPublicGameSession(sessionId.value, nameToUse);

    hasJoined.value = true;
    joining.value = false;
  } catch (err: unknown) {
    alert('Error al unirse al juego: ' + ((err as Error).message || 'Error desconocido'));
    joining.value = false;
  }
};

const goToPlay = () => {
  router.push(`/game/${sessionId.value}/play`);
};
</script>

<style scoped lang="scss">
.join-game-view {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.container {
  max-width: 500px;
  width: 100%;
}

.join-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  margin-top: 1rem;

  h1 {
    text-align: center;
    color: #2d3748;
    margin-bottom: 1.5rem;
    font-size: 1.875rem;
  }
}

.session-info {
  background: #f7fafc;
  padding: 1rem;
  border-radius: 8px;
  margin-bottom: 1.5rem;

  .info-text {
    margin: 0.5rem 0;
    color: #4a5568;

    strong {
      color: #2d3748;
    }
  }
}

.status-waiting {
  color: #d69e2e;
  font-weight: 600;
}

.status-running {
  color: #38a169;
  font-weight: 600;
}

.status-finished {
  color: #718096;
  font-weight: 600;
}

.join-form {
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
      padding: 0.75rem;
      border: 2px solid #e2e8f0;
      border-radius: 8px;
      font-size: 1rem;
      transition: border-color 0.2s;

      &:focus {
        outline: none;
        border-color: #667eea;
      }
    }
  }

  .welcome-message {
    background: #f7fafc;
    padding: 1rem;
    border-radius: 8px;
    margin-bottom: 1.5rem;
    text-align: center;

    p {
      margin: 0;
      color: #4a5568;
      font-size: 1.125rem;

      strong {
        color: #667eea;
      }
    }
  }
}

.joined-message {
  text-align: center;
  padding: 1rem 0;

  .success-icon {
    width: 60px;
    height: 60px;
    background: #38a169;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 2rem;
    margin: 0 auto 1rem;
  }

  h2 {
    color: #2d3748;
    margin-bottom: 0.5rem;
  }

  p {
    color: #718096;
    margin-bottom: 1.5rem;
  }
}
</style>
