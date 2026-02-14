<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="dialogState.show" class="confirm-overlay" @click.self="handleCancel">
        <div class="confirm-container">
          <div class="confirm-icon">
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" />
              <path d="M12 8V12" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
              <circle cx="12" cy="16" r="0.5" fill="currentColor" stroke="currentColor" />
            </svg>
          </div>

          <h3 class="confirm-title">
            {{ dialogState.title || t.confirmDialog.defaultTitle }}
          </h3>

          <p class="confirm-message">
            {{ dialogState.message || t.confirmDialog.defaultMessage }}
          </p>

          <div class="confirm-actions">
            <button class="btn-secondary" @click="handleCancel">
              {{ dialogState.cancelText || t.confirmDialog.cancel }}
            </button>
            <button :class="dialogState.confirmButtonClass" @click="handleConfirm">
              {{ dialogState.confirmText || t.confirmDialog.confirm }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';
import { useConfirmDialog } from '@/composables/useConfirmDialog';

const { t } = useI18n();
const { dialogState, handleConfirm, handleCancel } = useConfirmDialog();
</script>

<style scoped>
.confirm-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.confirm-container {
  background-color: white;
  border-radius: 12px;
  padding: 2rem;
  max-width: 450px;
  width: 100%;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
  text-align: center;
}

.confirm-icon {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
  color: #f59e0b;
}

.confirm-icon svg {
  width: 48px;
  height: 48px;
}

.confirm-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.confirm-message {
  font-size: 0.9375rem;
  color: #6b7280;
  line-height: 1.6;
  margin: 0 0 1.5rem 0;
}

.confirm-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: center;
}

/* Transiciones */
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;
}

.dialog-fade-enter-active .confirm-container,
.dialog-fade-leave-active .confirm-container {
  transition: transform 0.2s ease;
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;
}

.dialog-fade-enter-from .confirm-container,
.dialog-fade-leave-to .confirm-container {
  transform: scale(0.95);
}

@media (max-width: 640px) {
  .confirm-container {
    padding: 1.5rem;
  }

  .confirm-title {
    font-size: 1.125rem;
  }

  .confirm-message {
    font-size: 0.875rem;
  }

  .confirm-actions {
    flex-direction: column-reverse;
  }
}
</style>
