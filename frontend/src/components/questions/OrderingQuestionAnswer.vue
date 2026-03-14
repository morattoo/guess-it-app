<template>
  <div class="ordering-answer">
    <p class="ordering-hint">{{ hint }}</p>
    <ReorderingList :items="orderedItems" :disabled="disabled" @update="handleUpdateModelValue" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ReorderingList from './ReorderingList.vue';

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
</style>
