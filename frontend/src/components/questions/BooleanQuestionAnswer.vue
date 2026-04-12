<template>
  <div class="boolean-options">
    <div
      class="boolean-option boolean-option--true"
      :class="{ selected: modelValue === true }"
      @click="!disabled && $emit('update:modelValue', true)"
    >
      <span class="boolean-icon">✓</span>
      <span class="boolean-label">{{ t.common.trueLabel }}</span>
    </div>

    <div
      class="boolean-option boolean-option--false"
      :class="{ selected: modelValue === false }"
      @click="!disabled && $emit('update:modelValue', false)"
    >
      <span class="boolean-icon">✗</span>
      <span class="boolean-label">{{ t.common.falseLabel }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

defineProps<{
  modelValue: boolean | null;
  disabled?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: boolean];
}>();
</script>

<style scoped lang="scss">
.boolean-options {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;

  .boolean-option {
    flex: 1;
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.65rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 50px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
    background: #f7fafc;

    &:hover:not(.selected) {
      border-color: #cbd5e0;
      background: #edf2f7;
    }

    &--true.selected {
      border-color: #38a169;
      background: #38a169;

      .boolean-icon,
      .boolean-label {
        color: white;
      }
    }

    &--false.selected {
      border-color: #e53e3e;
      background: #e53e3e;

      .boolean-icon,
      .boolean-label {
        color: white;
      }
    }

    .boolean-icon {
      font-size: 1rem;
      line-height: 1;
      color: #4a5568;
    }

    .boolean-label {
      font-size: 0.9rem;
      font-weight: 700;
      color: #4a5568;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
  }
}
</style>
