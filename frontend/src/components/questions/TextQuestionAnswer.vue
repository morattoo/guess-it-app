<template>
  <div class="form-group">
    <label for="text-answer">{{ t.play.yourAnswer }}:</label>
    <input
      id="text-answer"
      :value="modelValue"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
      type="text"
      class="form-input"
      :placeholder="t.play.writeAnswer"
      required
      :disabled="disabled"
    />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

defineProps<{
  modelValue: string | number;
  disabled?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped lang="scss">
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
    padding: 0.875rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    font-size: 1rem;
    transition: border-color 0.2s;

    &:focus {
      outline: none;
      border-color: #667eea;
    }

    &:disabled {
      background: #f7fafc;
      cursor: not-allowed;
    }
  }
}
</style>
