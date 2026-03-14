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
        <ReorderingListForm v-model="form.items" />
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
import { ref, computed } from 'vue';
import type { OrderingQuestion } from '@shared/models/Question';
import ReorderingListForm from './ReorderingListForm.vue';

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

const isFormValid = computed(() => {
  return (
    form.value.title.trim() !== '' &&
    form.value.items.length >= 2 &&
    form.value.items.every(item => item.label.trim() !== '')
  );
});

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

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
}
</style>
