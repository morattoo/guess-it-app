<template>
  <div class="question-form">
    <h3>Pregunta de Ordenamiento</h3>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="title">Título *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="¿Ordena los planetas del más cercano al más lejano del Sol?"
          required
        />
      </div>

      <div class="form-group">
        <label for="description">Descripción</label>
        <textarea
          id="description"
          v-model="form.description"
          rows="3"
          placeholder="Información adicional sobre la pregunta"
        ></textarea>
      </div>

      <div class="form-row">
        <div class="form-group">
          <label for="points">Puntos *</label>
          <input
            id="points"
            v-model.number="form.points"
            type="number"
            min="1"
            placeholder="100"
            required
          />
        </div>

        <div class="form-group">
          <label for="timeLimit">Tiempo Límite (segundos)</label>
          <input
            id="timeLimit"
            v-model.number="form.timeLimitSec"
            type="number"
            min="0"
            placeholder="30"
          />
        </div>
      </div>

      <div class="form-group">
        <label>Elementos (en el orden correcto) *</label>
        <p class="field-hint">
          Escribe los elementos en el orden correcto. Los jugadores verán los elementos en orden
          aleatorio y deberán organizarlos.
        </p>
        <TransitionGroup tag="div" name="item-list" class="items-list">
          <div
            v-for="(item, index) in form.items"
            :key="item.id"
            class="item-row"
            :class="{ 'item-moved': lastMovedIds.includes(item.id) }"
          >
            <span class="item-position">{{ index + 1 }}</span>
            <input
              v-model="item.label"
              type="text"
              :placeholder="`Elemento ${index + 1}`"
              required
            />
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
                :disabled="index === form.items.length - 1"
                @click="moveItem(index, 1)"
                title="Mover abajo"
              >
                ▼
              </button>
              <button
                v-if="form.items.length > 2"
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

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="cancel">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="!isFormValid || isSubmitting">
          {{ isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar Pregunta' : 'Crear Pregunta' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick } from 'vue';
import type { OrderingQuestion } from '@shared/models/Question';

const props = defineProps<{
  initialData?: OrderingQuestion;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: OrderingQuestion];
  cancel: [];
}>();

const initialOrdering = props.initialData;

const form = ref({
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  points: props.initialData?.points || 1,
  timeLimitSec: props.initialData?.timeLimitSec,
  items: initialOrdering?.items
    ? initialOrdering.items.map(item => ({ ...item }))
    : [
        { id: crypto.randomUUID(), label: '' },
        { id: crypto.randomUUID(), label: '' },
      ],
});

const isSubmitting = ref(false);
const lastMovedIds = ref<string[]>([]);

const isFormValid = computed(() => {
  return (
    form.value.title.trim() !== '' &&
    form.value.items.length >= 2 &&
    form.value.items.every(item => item.label.trim() !== '')
  );
});

const addItem = () => {
  form.value.items.push({ id: crypto.randomUUID(), label: '' });
};

const removeItem = (index: number) => {
  form.value.items.splice(index, 1);
};

const moveItem = async (index: number, direction: -1 | 1) => {
  const targetIndex = index + direction;
  if (targetIndex < 0 || targetIndex >= form.value.items.length) return;

  const items = form.value.items;
  const movedId = items[index]!.id;
  const displacedId = items[targetIndex]!.id;

  // Step 1: clear highlight and flush — browser sees class removed
  lastMovedIds.value = [];
  await nextTick();

  // Step 2: swap and flush — TransitionGroup triggers FLIP here
  [items[index], items[targetIndex]] = [items[targetIndex]!, items[index]!];
  await nextTick();

  // Step 3: add highlight — guaranteed fresh start, no prior class on the element
  lastMovedIds.value = [movedId, displacedId];
  setTimeout(() => {
    lastMovedIds.value = [];
  }, 900);
};

const submitForm = () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  const question: OrderingQuestion = {
    type: 'ORDERING',
    title: form.value.title,
    description: form.value.description || undefined,
    points: form.value.points,
    timeLimitSec: form.value.timeLimitSec,
    items: form.value.items.map(item => ({ id: item.id, label: item.label })),
    expectedAnswer: {
      order: form.value.items.map(item => item.id),
    },
  };

  emit('submit', question);
};

const cancel = () => {
  emit('cancel');
};
</script>

<style scoped>
.question-form {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  margin-bottom: 1.5rem;
  color: #333;
  margin: 0;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
}

.field-hint {
  font-size: 0.8rem;
  color: #718096;
  margin-bottom: 0.75rem;
}

.form-group input[type='text'],
.form-group input[type='number'],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  color: #333;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

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

/* Highlight pulse on the moved item */
@keyframes item-moved-pulse {
  0% {
    background-color: transparent;
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
    background-color: transparent;
    box-shadow: none;
  }
}

.item-row.item-moved {
  border-radius: 6px;
  animation: item-moved-pulse 0.9s ease forwards;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}
</style>
