import type { Ref } from 'vue';

export type ReorderableItem = {
  id: string;
  label: string;
};

export function useReorderableList(items: Ref<ReorderableItem[]>) {
  function moveItem(index: number, direction: -1 | 1) {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= items.value.length) return;

    const next = [...items.value];
    [next[index], next[targetIndex]] = [next[targetIndex]!, next[index]!];
    items.value = next;
  }

  function addItem() {
    items.value = [...items.value, { id: crypto.randomUUID(), label: '' }];
  }

  function removeItem(index: number) {
    items.value = items.value.filter((_, i) => i !== index);
  }

  return { moveItem, addItem, removeItem };
}
