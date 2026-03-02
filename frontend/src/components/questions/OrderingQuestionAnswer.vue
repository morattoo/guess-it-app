<template>
  <div class="ordering-answer">
    <p class="ordering-hint">{{ hint }}</p>
    <div class="ordering-list">
      <div
        v-for="(item, index) in orderedItems"
        :key="item.id"
        class="ordering-item"
        :class="{ disabled }"
      >
        <span class="item-index">{{ index + 1 }}</span>
        <span class="item-label">{{ item.label }}</span>
        <div class="item-controls">
          <button
            type="button"
            class="btn-move"
            :disabled="disabled || index === 0"
            @click="move(index, -1)"
            title="Mover arriba"
          >
            ▲
          </button>
          <button
            type="button"
            class="btn-move"
            :disabled="disabled || index === orderedItems.length - 1"
            @click="move(index, 1)"
            title="Mover abajo"
          >
            ▼
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';

interface OrderingItem {
  id: string;
  label: string;
}

const props = defineProps<{
  modelValue: string[];
  items: OrderingItem[];
  disabled?: boolean;
  hint?: string;
}>();

const emit = defineEmits<{
  'update:modelValue': [value: string[]];
}>();

// Shuffled working copy of items
const orderedItems = ref<OrderingItem[]>([]);

onMounted(() => {
  // Shuffle items so players don't see them in original order
  const shuffled = [...props.items].sort(() => Math.random() - 0.5);
  orderedItems.value = shuffled;
  emit(
    'update:modelValue',
    shuffled.map(item => item.id)
  );
});

const move = (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= orderedItems.value.length) return;
  const items = [...orderedItems.value];
  [items[index], items[targetIndex]] = [items[targetIndex], items[index]];
  orderedItems.value = items;
  emit(
    'update:modelValue',
    items.map(item => item.id)
  );
};
</script>

<style scoped lang="scss">
.ordering-answer {
  margin-bottom: 1.5rem;

  .ordering-hint {
    font-size: 0.875rem;
    color: #718096;
    margin-bottom: 0.75rem;
  }

  .ordering-list {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .ordering-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.875rem 1rem;
    border: 2px solid #e2e8f0;
    border-radius: 8px;
    background: white;
    transition:
      border-color 0.2s,
      background 0.2s;

    &.disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }

    .item-index {
      min-width: 1.5rem;
      font-weight: 700;
      color: #667eea;
      font-size: 0.875rem;
      text-align: center;
    }

    .item-label {
      flex: 1;
      color: #2d3748;
      font-size: 1rem;
      user-select: none;
    }

    .item-controls {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .btn-move {
      padding: 0.2rem 0.45rem;
      background: #eef2ff;
      border: 1px solid #c3d0f0;
      border-radius: 4px;
      cursor: pointer;
      font-size: 0.7rem;
      color: #4c51bf;
      line-height: 1;
      transition: background 0.15s;

      &:hover:not(:disabled) {
        background: #dde4fb;
      }

      &:disabled {
        opacity: 0.3;
        cursor: not-allowed;
      }
    }
  }
}
</style>
