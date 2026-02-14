<template>
  <teleport to="body">
    <div v-if="errorState.show" class="error-overlay">
      <div class="error-container">
        <div class="error-icon">
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
            <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
            <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" />
          </svg>
        </div>

        <h2 class="error-title">{{ errorState.title || t.errorOverlay.title }}</h2>

        <p class="error-message">{{ errorState.message || t.errorOverlay.defaultMessage }}</p>

        <p v-if="errorState.showSupport" class="error-support">
          {{ t.errorOverlay.contactSupport }}
        </p>

        <div class="error-actions">
          <button v-if="errorState.returnUrl" class="btn-primary" @click="handleReturn">
            {{ errorState.returnButtonText || t.errorOverlay.goBack }}
          </button>
          <button v-else class="btn-primary" @click="handleClose">
            {{ t.common.close }}
          </button>
        </div>
      </div>
    </div>
  </teleport>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from '@/composables/useI18n';
import { useErrorHandler } from '@/composables/useErrorHandler';

const { t } = useI18n();
const router = useRouter();
const { errorState, closeError } = useErrorHandler();

const handleReturn = () => {
  if (errorState.value.returnUrl) {
    router.push(errorState.value.returnUrl);
  }
  closeError();
};

const handleClose = () => {
  closeError();
};
</script>

<style scoped>
.error-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  padding: 1rem;
  backdrop-filter: blur(4px);
}

.error-container {
  background-color: white;
  border-radius: 12px;
  padding: 3rem 2rem;
  max-width: 500px;
  width: 100%;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
  animation: slideIn 0.3s ease-out;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.error-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1.5rem;
  color: #dc2626;
}

.error-icon svg {
  width: 64px;
  height: 64px;
}

.error-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
}

.error-message {
  font-size: 1rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1rem 0;
}

.error-support {
  font-size: 0.875rem;
  color: #9ca3af;
  margin: 0 0 2rem 0;
  font-style: italic;
}

.error-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

.btn-primary {
  padding: 0.75rem 2rem;
  background-color: #2f8cff;
  color: white;
  border: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 1rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1a7ae8;
}

.btn-primary:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(47, 140, 255, 0.3);
}

@media (max-width: 640px) {
  .error-container {
    padding: 2rem 1.5rem;
  }

  .error-title {
    font-size: 1.25rem;
  }

  .error-message {
    font-size: 0.9375rem;
  }

  .error-actions {
    flex-direction: column;
  }

  .btn-primary {
    width: 100%;
  }
}
</style>
