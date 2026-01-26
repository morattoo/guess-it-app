<template>
  <div class="question-form">
    <h3>Pregunta de Texto</h3>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="title">Título *</label>
        <textarea
          id="title"
          v-model="form.title"
          type="text"
          placeholder="¿Cuál es la capital de Francia?"
          required
        ></textarea>
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
        <label for="expectedAnswer">Respuesta Esperada *</label>
        <input
          id="expectedAnswer"
          v-model="form.expectedAnswer"
          type="text"
          placeholder="París"
          required
        />
      </div>

      <div class="form-group">
        <label class="checkbox-label">
          <input v-model="form.caseSensitive" type="checkbox" />
          Distinguir mayúsculas/minúsculas
        </label>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="cancel">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="isSubmitting">
          {{ isSubmitting ? 'Guardando...' : isEdit ? 'Actualizar Pregunta' : 'Crear Pregunta' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import type { TextQuestion, Question } from '@shared/models/Question';

const props = defineProps<{
  initialData?: Question;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: TextQuestion];
  cancel: [];
}>();

const initialText = props.initialData as TextQuestion | undefined;

const form = ref({
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  points: props.initialData?.points || 1,
  timeLimitSec: props.initialData?.timeLimitSec || 0,
  expectedAnswer: initialText?.expectedAnswer.text || '',
  caseSensitive: initialText?.expectedAnswer.caseSensitive || false,
});

const isSubmitting = ref(false);

const isFormValid = computed(() => {
  return (
    form.value.title &&
    form.value.timeLimitSec !== undefined &&
    form.value.points &&
    form.value.expectedAnswer !== undefined
  );
});

const submitForm = () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  const question: TextQuestion = {
    type: 'TEXT',
    title: form.value.title,
    description: form.value.description || undefined,
    points: form.value.points,
    timeLimitSec: form.value.timeLimitSec,
    expectedAnswer: {
      text: form.value.expectedAnswer,
      caseSensitive: form.value.caseSensitive,
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

.form-group input[type='text'],
.form-group input[type='number'],
.form-group textarea {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group textarea {
  resize: vertical;
  font-family: inherit;
}

.form-group input:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #2f8cff;
  box-shadow: 0 0 0 3px rgba(47, 140, 255, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: normal;
  cursor: pointer;
}

.checkbox-label input[type='checkbox'] {
  width: auto;
  cursor: pointer;
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-primary,
.btn-secondary {
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 6px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background-color: #2f8cff;
  color: white;
}

.btn-primary:hover {
  background-color: #1a7ae8;
}

.btn-secondary {
  background-color: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background-color: #e0e0e0;
}

@media (max-width: 640px) {
  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
