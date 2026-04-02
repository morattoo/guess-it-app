<template>
  <div class="dashboard-view">
    <div class="dashboard-header">
      <h2>{{ t.dashboard.title }}</h2>
      <p class="dashboard-subtitle">{{ t.dashboard.welcome }}</p>
    </div>

    <div v-if="loading" class="dashboard-loading">
      {{ t.dashboard.stats.loading }}
    </div>

    <template v-else>
      <!-- Summary cards -->
      <div class="summary-cards">
        <div class="summary-card">
          <span class="summary-card__value">{{ data?.totalQuestionnaires ?? 0 }}</span>
          <span class="summary-card__label">{{ t.dashboard.stats.totalQuestionnaires }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-card__value">{{ data?.totalQuestions ?? 0 }}</span>
          <span class="summary-card__label">{{ t.dashboard.stats.totalQuestions }}</span>
        </div>
        <div class="summary-card">
          <span class="summary-card__value">{{ data?.activeSessions.length ?? 0 }}</span>
          <span class="summary-card__label">{{ t.dashboard.stats.activeSessions }}</span>
        </div>
      </div>

      <!-- Active sessions -->
      <section class="active-sessions">
        <h3 class="section-title">{{ t.dashboard.stats.activeSessions }}</h3>

        <div v-if="!data?.activeSessions.length" class="empty-state">
          {{ t.dashboard.stats.noActiveSessions }}
        </div>

        <div v-else class="sessions-grid">
          <div v-for="session in data!.activeSessions" :key="session.id" class="session-card">
            <div class="session-card__header">
              <span class="session-card__title">{{ session.title }}</span>
              <span
                class="status-badge"
                :class="session.status === 'RUNNING' ? 'status-running' : 'status-waiting'"
              >
                {{
                  session.status === 'RUNNING'
                    ? t.dashboard.stats.statusRunning
                    : t.dashboard.stats.statusWaiting
                }}
              </span>
            </div>

            <div class="session-card__stats">
              <div class="stat-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="10" cy="7" r="3" stroke="currentColor" stroke-width="2" />
                  <path
                    d="M3 17C3 14 6 12 10 12C14 12 17 14 17 17"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span class="stat-label">{{ t.dashboard.stats.players }}</span>
                <span class="stat-value">
                  {{ session.finishedPlayers }}
                  <span class="stat-total">/ {{ session.totalPlayers }}</span>
                  <span class="stat-sub">{{ t.dashboard.stats.finished }}</span>
                </span>
              </div>
              <div class="stat-item">
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 20 20"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M3 5H17M3 10H17M3 15H11"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                  />
                </svg>
                <span class="stat-label">{{ t.dashboard.stats.questions }}</span>
                <span class="stat-value">{{ session.totalQuestions }}</span>
              </div>
            </div>

            <div class="session-card__progress">
              <div class="progress-bar" :style="{ width: progressPercent(session) + '%' }"></div>
            </div>

            <router-link :to="`/dashboard/game-sessions`" class="session-card__link">
              {{ t.dashboard.stats.viewSession }}
            </router-link>
          </div>
        </div>
      </section>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from '@/composables/useI18n';
import { getDashboardData, type DashboardData } from '@/firebase/dashboard';
import { auth } from '@/firebase/auth';
import { useErrorHandler } from '@/composables/useErrorHandler';
import { formatError } from '@/utils/errorUtils';

const { t } = useI18n();
const { showError } = useErrorHandler();

const loading = ref(true);
const data = ref<DashboardData | null>(null);

const progressPercent = (session: DashboardData['activeSessions'][number]) => {
  if (!session.totalPlayers) return 0;
  return Math.round((session.finishedPlayers / session.totalPlayers) * 100);
};

onMounted(async () => {
  try {
    const user = auth.currentUser;
    if (!user) return;
    data.value = await getDashboardData(user.uid);
  } catch (err) {
    showError(formatError(err, t.value.dashboard.stats.loadError));
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
.dashboard-view {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 1rem;
}

.dashboard-header {
  h2 {
    margin: 0 0 0.25rem;
    font-size: 1.5rem;
    font-weight: 700;
  }
}

.dashboard-subtitle {
  margin: 0;
  color: var(--text-secondary, #6b7280);
  font-size: 0.9rem;
}

.dashboard-loading {
  color: var(--text-secondary, #6b7280);
  font-size: 0.9rem;
}

/* Summary cards */
.summary-cards {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
  gap: 1rem;
}

.summary-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 0.25rem;

  &__value {
    font-size: 2rem;
    font-weight: 700;
    line-height: 1;
    color: var(--accent, #6366f1);
  }

  &__label {
    font-size: 0.8rem;
    color: var(--text-secondary, #6b7280);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
}

/* Section */
.section-title {
  margin: 0 0 1rem;
  font-size: 1rem;
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.empty-state {
  color: var(--text-secondary, #6b7280);
  font-size: 0.9rem;
}

/* Sessions grid */
.sessions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1rem;
}

.session-card {
  background: var(--surface, #ffffff);
  border: 1px solid var(--border, #e5e7eb);
  border-radius: 12px;
  padding: 1.25rem;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;

  &__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 0.5rem;
  }

  &__title {
    font-weight: 600;
    font-size: 0.95rem;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  &__stats {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  &__progress {
    height: 6px;
    background: var(--border, #e5e7eb);
    border-radius: 999px;
    overflow: hidden;
  }

  &__link {
    font-size: 0.8rem;
    color: var(--accent, #6366f1);
    text-decoration: none;
    font-weight: 500;
    align-self: flex-end;

    &:hover {
      text-decoration: underline;
    }
  }
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
  color: var(--text-secondary, #6b7280);

  svg {
    flex-shrink: 0;
    opacity: 0.6;
  }
}

.stat-label {
  flex: 1;
}

.stat-value {
  font-weight: 600;
  color: var(--text-primary, #111827);
}

.stat-total {
  font-weight: 400;
  color: var(--text-secondary, #6b7280);
}

.stat-sub {
  font-size: 0.75rem;
  font-weight: 400;
  color: var(--text-secondary, #6b7280);
  margin-left: 0.2rem;
}

.progress-bar {
  height: 100%;
  background: var(--accent, #6366f1);
  border-radius: 999px;
  transition: width 0.4s ease;
}

/* Status badges */
.status-badge {
  font-size: 0.7rem;
  font-weight: 600;
  padding: 0.2rem 0.5rem;
  border-radius: 999px;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.status-running {
  background: #dcfce7;
  color: #15803d;
}

.status-waiting {
  background: #fef9c3;
  color: #854d0e;
}
</style>
