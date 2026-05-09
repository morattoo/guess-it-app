<template>
  <teleport to="body">
    <transition name="dialog-fade">
      <div v-if="show" class="summary-overlay" @click.self="emit('close')">
        <div class="summary-container">
          <div class="summary-header">
            <h3 class="summary-title">{{ t.play.summary.title }}</h3>
            <button class="close-btn" @click="emit('close')" :aria-label="t.play.summary.close">
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18M6 6l12 12"
                  stroke="currentColor"
                  stroke-width="2"
                  stroke-linecap="round"
                />
              </svg>
            </button>
          </div>

          <div v-if="loading" class="summary-loading">
            <div class="spinner"></div>
            <span>{{ t.play.summary.loading }}</span>
          </div>

          <div v-else class="accordion">
            <div v-for="(question, index) in questions" :key="question.id" class="accordion-item">
              <button
                class="accordion-header"
                @click="toggleItem(index)"
                :aria-expanded="openIndex === index"
              >
                <div class="accordion-header-content">
                  <span class="question-number">{{ index + 1 }}</span>
                  <span class="question-title">{{ question.title }}</span>
                  <span class="question-points">{{ question.points }} pts</span>
                </div>
                <svg
                  class="chevron"
                  :class="{ 'chevron-open': openIndex === index }"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path
                    d="M6 9l6 6 6-6"
                    stroke="currentColor"
                    stroke-width="2"
                    stroke-linecap="round"
                    stroke-linejoin="round"
                  />
                </svg>
              </button>

              <transition name="accordion-expand">
                <div v-if="openIndex === index" class="accordion-body">
                  <p v-if="question.description" class="question-description">
                    {{ question.description }}
                  </p>
                  <div class="correct-answer">
                    <span class="answer-label">{{ t.play.summary.correctAnswer }}:</span>
                    <span class="answer-value">{{ getCorrectAnswerDisplay(question) }}</span>
                  </div>
                </div>
              </transition>
            </div>
          </div>

          <div class="summary-footer">
            <button class="btn btn-secondary" @click="emit('close')">
              {{ t.play.summary.close }}
            </button>
          </div>
        </div>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useI18n } from '@/composables/useI18n';
import type { GameSummaryQuestion } from '@shared/models/GameSession';

defineProps<{
  show: boolean;
  loading: boolean;
  questions: GameSummaryQuestion[];
}>();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const { t } = useI18n();

const openIndex = ref<number | null>(null);

function toggleItem(index: number) {
  openIndex.value = openIndex.value === index ? null : index;
}

function getCorrectAnswerDisplay(question: GameSummaryQuestion): string {
  const { validation } = question;

  switch (validation.type) {
    case 'TEXT':
      return validation.expectedAnswer.text;

    case 'NUMBER': {
      const { value, tolerance } = validation.expectedAnswer;
      if (tolerance && tolerance > 0) {
        return `${value} ± ${tolerance}`;
      }
      return String(value);
    }

    case 'CHOICE': {
      const optionId = validation.expectedAnswer.optionId;
      const option = question.options?.find(o => o.id === optionId);
      return option?.label ?? optionId;
    }

    case 'ORDERING': {
      const orderedIds = validation.expectedAnswer.order;
      const items = question.items ?? [];
      const labels = orderedIds.map(id => {
        const item = items.find(i => i.id === id);
        return item?.label ?? id;
      });
      return labels.join(' → ');
    }

    case 'BOOLEAN':
      return validation.expectedAnswer.booleanValue
        ? t.value.play.summary.booleanTrue
        : t.value.play.summary.booleanFalse;

    default: {
      const _exhaustive: never = validation;
      return String(_exhaustive);
    }
  }
}
</script>

<style scoped lang="scss">
.summary-overlay {
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9998;
  padding: 1rem;
  backdrop-filter: blur(2px);
}

.summary-container {
  background-color: white;
  border-radius: 12px;
  max-width: 560px;
  width: 100%;
  max-height: 85vh;
  display: flex;
  flex-direction: column;
  box-shadow:
    0 20px 25px -5px rgba(0, 0, 0, 0.1),
    0 10px 10px -5px rgba(0, 0, 0, 0.04);
}

.summary-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #e2e8f0;
  flex-shrink: 0;
}

.summary-title {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 700;
  color: #2d3748;
}

.close-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #718096;
  border-radius: 6px;
  padding: 0.25rem;
  transition:
    color 0.15s,
    background-color 0.15s;

  &:hover {
    color: #2d3748;
    background-color: #f7fafc;
  }
}

.summary-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 3rem;
  color: #718096;

  .spinner {
    width: 36px;
    height: 36px;
    border: 3px solid #e2e8f0;
    border-top-color: #667eea;
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
}

.accordion {
  overflow-y: auto;
  flex: 1;
  padding: 0.5rem 0;
}

.accordion-item {
  border-bottom: 1px solid #f0f4f8;

  &:last-child {
    border-bottom: none;
  }
}

.accordion-header {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.875rem 1.5rem;
  background: none;
  border: none;
  cursor: pointer;
  text-align: left;
  transition: background-color 0.15s;

  &:hover {
    background-color: #f7fafc;
  }
}

.accordion-header-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
  min-width: 0;
}

.question-number {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  min-width: 24px;
  background: #667eea;
  color: white;
  border-radius: 50%;
  font-size: 0.75rem;
  font-weight: 700;
}

.question-title {
  flex: 1;
  font-size: 0.9rem;
  font-weight: 500;
  color: #2d3748;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.question-points {
  font-size: 0.75rem;
  color: #718096;
  white-space: nowrap;
}

.chevron {
  flex-shrink: 0;
  color: #a0aec0;
  transition: transform 0.2s ease;

  &.chevron-open {
    transform: rotate(180deg);
  }
}

.accordion-body {
  padding: 0 1.5rem 1rem;
  overflow: hidden;
}

.question-description {
  font-size: 0.875rem;
  color: #718096;
  margin-bottom: 0.75rem;
  line-height: 1.5;
}

.correct-answer {
  display: flex;
  align-items: baseline;
  gap: 0.5rem;
  background: #f0fff4;
  border: 1px solid #c6f6d5;
  border-radius: 8px;
  padding: 0.625rem 0.875rem;
}

.answer-label {
  font-size: 0.8rem;
  font-weight: 600;
  color: #276749;
  white-space: nowrap;
}

.answer-value {
  font-size: 0.9rem;
  color: #22543d;
  font-weight: 500;
  word-break: break-word;
}

.summary-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
}

// Transitions
.dialog-fade-enter-active,
.dialog-fade-leave-active {
  transition: opacity 0.2s ease;

  .summary-container {
    transition: transform 0.2s ease;
  }
}

.dialog-fade-enter-from,
.dialog-fade-leave-to {
  opacity: 0;

  .summary-container {
    transform: scale(0.95) translateY(-8px);
  }
}

.accordion-expand-enter-active,
.accordion-expand-leave-active {
  transition:
    max-height 0.25s ease,
    opacity 0.2s ease;
  max-height: 400px;
  overflow: hidden;
}

.accordion-expand-enter-from,
.accordion-expand-leave-to {
  max-height: 0;
  opacity: 0;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
