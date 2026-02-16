<template>
  <div class="choice-options">
    <div
      v-for="(option, index) in options"
      :key="option.id"
      class="choice-option"
      :class="{ selected: modelValue === option.id }"
      @click="!disabled && $emit('update:modelValue', option.id)"
    >
      <div class="option-radio">
        <input
          type="radio"
          :id="`option-${index}`"
          :value="option.id"
          :checked="modelValue === option.id"
          @change="$emit('update:modelValue', option.id)"
          :disabled="disabled"
        />
      </div>
      <label :for="`option-${index}`" class="option-label">
        {{ option.label }}
      </label>
    </div>
  </div>
</template>

<script setup lang="ts">
interface ChoiceOption {
  id: string;
  label: string;
}

defineProps<{
  modelValue: string | number;
  options: ChoiceOption[];
  disabled?: boolean;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();
</script>

<style scoped lang="scss">
.choice-options {
  margin-bottom: 1.5rem;

  .choice-option {
    display: flex;
    align-items: center;
    padding: 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    margin-bottom: 0.75rem;
    cursor: pointer;
    transition: all 0.2s;

    &:hover:not(:has(input:disabled)) {
      border-color: #cbd5e0;
      background: #f7fafc;
    }

    &.selected {
      border-color: #667eea;
      background: #eef2ff;
    }

    .option-radio {
      margin-right: 1rem;

      input[type='radio'] {
        width: 20px;
        height: 20px;
        cursor: pointer;

        &:disabled {
          cursor: not-allowed;
        }
      }
    }

    .option-label {
      flex: 1;
      color: #2d3748;
      font-size: 1rem;
      cursor: pointer;
      user-select: none;
    }
  }
}
</style>
