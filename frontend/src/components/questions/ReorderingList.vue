<template>
  <div class="reorder-list">
    <TransitionGroup name="list" tag="div">
      <div v-for="(item, index) in localItems" :key="item.id" class="list-item">
        <span>{{ index + 1 }}</span>
        <span class="label">
          {{ item.label }}
        </span>

        <div class="actions">
          <button @click.prevent="moveUp(index)" :disabled="index === 0">↑</button>

          <button @click.prevent="moveDown(index)" :disabled="index === localItems.length - 1">
            ↓
          </button>
        </div>
      </div>
    </TransitionGroup>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

type Item = {
  id: string;
  label: string;
};

const props = defineProps<{
  items: Item[];
}>();

const emit = defineEmits<{
  (e: 'update', ids: string[]): void;
}>();

const localItems = ref<Item[]>([]);

watch(
  () => props.items,
  value => {
    localItems.value = [...value];
  },
  { immediate: true }
);

function emitOrder() {
  emit(
    'update',
    localItems.value.map(i => i.id)
  );
}

function moveUp(index: number) {
  if (index === 0) return;

  const items = [...localItems.value];

  [items[index - 1], items[index]] = [items[index]!, items[index - 1]!];

  localItems.value = items;
  emitOrder();
}

function moveDown(index: number) {
  if (index === localItems.value.length - 1) return;

  const items = [...localItems.value];

  [items[index + 1], items[index]] = [items[index]!, items[index + 1]!];

  localItems.value = items;
  emitOrder();
}
</script>

<style scoped lang="scss">
.reorder-list {
  width: 100%;
}

.list-item {
  display: flex;
  justify-content: space-between;
  align-items: center;

  padding: 10px 14px;
  margin-bottom: 8px;

  background: #f4f6f8;
  border-radius: 8px;

  font-size: 14px;

  transition: transform 0.25s ease;
}

.label {
  flex: 1;
  margin-left: 12px;
  color: #333;
}

.actions {
  display: flex;
  gap: 4px;

  button {
    border: none;
    background: #e2e8f0;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;

    &:disabled {
      opacity: 0.4;
      cursor: default;
    }

    &:hover:not(:disabled) {
      background: #cbd5e1;
    }
  }
}

/* animation */
.list-move {
  transition: transform 0.25s ease;
}

.list-enter-active,
.list-leave-active {
  transition: all 0.25s ease;
}

.list-enter-from,
.list-leave-to {
  opacity: 0;
  transform: translateY(10px);
}
</style>
