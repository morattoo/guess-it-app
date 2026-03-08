<template>
  <div class="ordering-answer">
    <p class="ordering-hint">{{ hint }}</p>
    <!-- <div class="ordering-list" ref="listRef">
      <div
        v-for="(item, index) in orderedItems"
        :key="item.id"
        :data-item-id="item.id"
        class="ordering-item"
        :class="{ disabled, 'item-moved': lastMovedIds.includes(item.id) }"
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
            class="btn-move --down"
            :disabled="disabled || index === orderedItems.length - 1"
            @click="move(index, 1)"
            title="Mover abajo"
          >
            ▼
          </button>
        </div>
      </div>
    </div> -->
    <ReorderingList :items="orderedItems" :disabled="disabled" @update="handleUpdateModelValue" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import ReorderingList from './ReorderingList.vue';

const lastMovedIds = ref<string[]>([]);
const listRef = ref<HTMLElement | null>(null);

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

const handleUpdateModelValue = (ids: string[]) => {
  emit('update:modelValue', ids);
};

onMounted(() => {
  // Shuffle items so players don't see them in original order
  const shuffled = [...props.items].sort(() => Math.random() - 0.5);
  orderedItems.value = shuffled;
  emit(
    'update:modelValue',
    shuffled.map(item => item.id)
  );
});

const move = async (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= orderedItems.value.length) return;

  const items = orderedItems.value;
  const movedId = items[index]!.id;
  const displacedId = items[targetIndex]!.id;

  // Step 1: snapshot each item's current Y position before any DOM change
  const rectsBefore = new Map<string, number>();
  if (listRef.value) {
    for (const child of listRef.value.children) {
      const id = (child as HTMLElement).dataset['itemId'];
      if (id) rectsBefore.set(id, child.getBoundingClientRect().top);
    }
  }

  // Step 2: clear highlight + swap in a single reactive flush
  lastMovedIds.value = [];
  [items[index], items[targetIndex]] = [items[targetIndex]!, items[index]!];
  emit(
    'update:modelValue',
    items.map(item => item.id)
  );
  await nextTick();

  // Step 3: FLIP — animate each item from its old Y to its new Y
  if (listRef.value) {
    for (const child of listRef.value.children) {
      const id = (child as HTMLElement).dataset['itemId'];
      if (id && rectsBefore.has(id)) {
        const dy = rectsBefore.get(id)! - child.getBoundingClientRect().top;
        if (Math.abs(dy) > 1) {
          child.animate([{ transform: `translateY(${dy}px)` }, { transform: 'translateY(0)' }], {
            duration: 350,
            easing: 'cubic-bezier(0.25, 0.8, 0.25, 1)',
          });
        }
      }
    }
  }

  // Step 4: add highlight class after the FLIP has started
  await nextTick();
  lastMovedIds.value = [movedId, displacedId];
  setTimeout(() => {
    lastMovedIds.value = [];
  }, 900);
};
</script>

<style scoped>
.ordering-answer {
  margin-bottom: 1.5rem;
}

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
  transition: border-color 0.2s;
}

.ordering-item.disabled {
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
}

.btn-move:hover:not(:disabled) {
  background: #dde4fb;
}

.btn-move:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.btn-move.--down {
  margin-top: 1rem;
}

/* TransitionGroup removed — FLIP handled via Web Animations API in script */

/* Highlight pulse on the moved item */
@keyframes item-moved-pulse {
  0% {
    background-color: white;
    box-shadow: none;
  }
  20% {
    background-color: #eef2ff;
    box-shadow: 0 0 0 2px #667eea55;
  }
  70% {
    background-color: #eef2ff;
    box-shadow: 0 0 0 2px #667eea55;
  }
  100% {
    background-color: white;
    box-shadow: none;
  }
}

.ordering-item.item-moved {
  animation: item-moved-pulse 0.9s ease forwards;
}
</style>
