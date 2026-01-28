<template>
  <div class="join-game-view">
    <div class="container">
      <HeaderLogo />

      <!-- Language Selector -->
      <div class="language-selector">
        <label for="language">{{ t.language.select }}:</label>
        <select id="language" v-model="selectedLanguage" @change="handleLanguageChange">
          <option value="en">{{ t.language.en }}</option>
          <option value="es">{{ t.language.es }}</option>
          <option value="fr">{{ t.language.fr }}</option>
        </select>
      </div>

      <div v-if="loading" class="loading">
        <p>{{ t.join.loading }}</p>
      </div>

      <div v-else-if="error" class="error-message">
        <h2>{{ t.join.error }}</h2>
        <p>{{ error }}</p>
        <router-link v-if="!gameSession" to="/" class="btn btn-primary">{{
          t.join.backToHome
        }}</router-link>
        <router-link v-else :to="`/game/${sessionId}/ranking`" class="btn btn-primary">
          {{ t.play.viewRanking }}
        </router-link>
      </div>

      <div v-else-if="gameSession" class="join-card">
        <h1>{{ t.join.joinGame }}</h1>

        <div class="session-info">
          <p class="info-text">
            <strong>{{ t.join.status }}:</strong>
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
            :disabled="joining || (showNameInput && !displayName.trim())"
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
import { useI18n, type Language } from '@/composables/useI18n';

const { t, language, setLanguage } = useI18n();
const selectedLanguage = ref<Language>(language.value);

const handleLanguageChange = () => {
  setLanguage(selectedLanguage.value);
};

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
      return;
    }

    if (session.status === 'FINISHED') {
      error.value = t.value.join.errors.sessionFinished;
      loading.value = false;
      return;
    }

    if (!session.isOpen) {
      error.value = t.value.join.errors.sessionClosed;
      loading.value = false;
      return;
    }

    // Verificar autenticación (puede ser null)
    const user = await getCurrentUser();

    console.log('User data:', user);

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

      console.log('User profile:', profile);
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
  } catch (err: any) {
    console.error('Error al cargar la sesión:', err);
    error.value = err.message || t.value.join.errors.loadError;
    loading.value = false;
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
  } catch (err: any) {
    console.error('Error al unirse:', err);
    alert('Error al unirse al juego: ' + (err.message || 'Error desconocido'));
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

.language-selector {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0.75rem;
  background: rgba(255, 255, 255, 0.9);
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);

  label {
    color: #4a5568;
    font-weight: 600;
    font-size: 0.875rem;
  }

  select {
    padding: 0.5rem 2rem 0.5rem 0.75rem;
    border: 2px solid #e2e8f0;
    border-radius: 6px;
    font-size: 0.875rem;
    font-weight: 500;
    color: #2d3748;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    appearance: none;
    background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%234a5568' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 0.5rem center;

    &:hover {
      border-color: #cbd5e0;
    }

    &:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
    }
  }
}

.loading,
.error-message {
  background: white;
  padding: 2rem;
  border-radius: 12px;
  text-align: center;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.error-message {
  h2 {
    color: #e53e3e;
    margin-bottom: 1rem;
  }

  p {
    margin-bottom: 1.5rem;
    color: #4a5568;
  }
}

.join-card {
  background: white;
  padding: 2.5rem;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);

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

.btn-success {
  background: #38a169;
  color: white;

  &:hover:not(:disabled) {
    background: #2f855a;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(56, 161, 105, 0.4);
  }
}

.btn-large {
  width: 100%;
  padding: 1rem;
  font-size: 1.125rem;
}
</style>
