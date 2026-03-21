<template>
  <div class="filter-input-wrapper">
    <svg
      class="filter-icon"
      width="18"
      height="18"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M2 4.5A.5.5 0 0 1 2.5 4h15a.5.5 0 0 1 0 1h-15A.5.5 0 0 1 2 4.5ZM5 9.5A.5.5 0 0 1 5.5 9h9a.5.5 0 0 1 0 1h-9A.5.5 0 0 1 5 9.5ZM8 14.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z"
        fill="currentColor"
      />
    </svg>
    <input
      type="text"
      class="filter-input"
      :value="modelValue"
      :placeholder="placeholder || t.common.filterPlaceholder"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <button
      v-if="modelValue"
      class="clear-btn"
      :title="t.common.close"
      @click="$emit('update:modelValue', '')"
    >
      <svg
        width="14"
        height="14"
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <path
          d="M4 4L16 16M16 4L4 16"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </button>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

defineProps<{
  modelValue: string;
  placeholder?: string;
}>();

defineEmits<{
  'update:modelValue': [value: string];
}>();

const { t } = useI18n();
</script>

<style scoped lang="scss">
.filter-input-wrapper {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  background-color: #fff;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: 0.4rem 0.75rem;
  transition:
    border-color 0.2s,
    box-shadow 0.2s;

  &:focus-within {
    border-color: #2f8cff;
    box-shadow: 0 0 0 3px rgba(47, 140, 255, 0.15);
  }
}

.filter-icon {
  color: #999;
  flex-shrink: 0;
}

.filter-input {
  border: none;
  outline: none;
  font-size: 0.875rem;
  color: #333;
  background: transparent;
  flex: 1;

  &::placeholder {
    color: #bbb;
  }
}

.clear-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  background: none;
  border: none;
  cursor: pointer;
  color: #999;
  padding: 0;
  flex-shrink: 0;
  transition: color 0.2s;

  &:hover {
    color: #555;
  }
}

@media (max-width: 640px) {
  .filter-input {
    width: 100%;
  }
}
</style>
