<template>
  <div>
    <TransitionGroup tag="div" name="item-list" class="items-list">
      <div v-for="(item, index) in localItems" :key="item.id" class="item-row">
        <span class="item-position">{{ index + 1 }}</span>
        <input v-model="item.label" type="text" :placeholder="`Elemento ${index + 1}`" required />
        <div class="item-controls">
          <button
            type="button"
            class="btn-move"
            :disabled="index === 0"
            @click="moveItem(index, -1)"
            title="Mover arriba"
          >
            ▲
          </button>
          <button
            type="button"
            class="btn-move"
            :disabled="index === localItems.length - 1"
            @click="moveItem(index, 1)"
            title="Mover abajo"
          >
            ▼
          </button>
          <button
            v-if="localItems.length > minItems"
            type="button"
            class="btn-remove"
            @click="removeItem(index)"
            title="Eliminar"
          >
            ✕
          </button>
        </div>
      </div>
    </TransitionGroup>
    <button type="button" class="btn-add-option" @click="addItem">+ Agregar Elemento</button>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { useReorderableList } from '@/composables/useReorderableList';
import type { ReorderableItem } from '@/composables/useReorderableList';

const props = withDefaults(
  defineProps<{
    modelValue: ReorderableItem[];
    minItems?: number;
  }>(),
  { minItems: 2 }
);

const emit = defineEmits<{
  'update:modelValue': [items: ReorderableItem[]];
}>();

const localItems = ref<ReorderableItem[]>(props.modelValue.map(i => ({ ...i })));

watch(
  localItems,
  val => {
    emit(
      'update:modelValue',
      val.map(i => ({ ...i }))
    );
  },
  { deep: true }
);

const { moveItem, addItem, removeItem } = useReorderableList(localItems);
</script>

<style scoped>
.items-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.item-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.item-position {
  min-width: 1.5rem;
  font-weight: 700;
  color: #667eea;
  text-align: center;
  font-size: 0.875rem;
}

.item-row input {
  flex: 1;
  padding: 0.6rem 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 0.95rem;
  color: #333;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.item-row input:focus {
  outline: none;
  border-color: #667eea;
}

.item-controls {
  display: flex;
  gap: 0.25rem;
}

.btn-move {
  padding: 0.35rem 0.5rem;
  background: #eef2ff;
  border: 1px solid #c3d0f0;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #4c51bf;
  transition: background 0.15s;
}

.btn-move:hover:not(:disabled) {
  background: #dde4fb;
}

.btn-move:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.btn-remove {
  padding: 0.35rem 0.5rem;
  background: #fff5f5;
  border: 1px solid #fed7d7;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.75rem;
  color: #c53030;
  transition: background 0.15s;
}

.btn-remove:hover {
  background: #fee2e2;
}

.btn-add-option {
  padding: 0.5rem 1rem;
  background: transparent;
  border: 1px dashed #667eea;
  border-radius: 6px;
  color: #667eea;
  cursor: pointer;
  font-size: 0.875rem;
  transition: all 0.2s;
  width: 100%;
}

.btn-add-option:hover {
  background: #eef2ff;
}

/* TransitionGroup: smooth FLIP movement */
.item-list-move {
  transition: transform 0.35s cubic-bezier(0.25, 0.8, 0.25, 1);
}
</style>
