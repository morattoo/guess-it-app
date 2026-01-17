<template>
  <div class="question-form">
    <h3>Pregunta Numérica</h3>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="title">Título *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="¿En qué año comenzó la Segunda Guerra Mundial?"
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

      <div class="form-row">
        <div class="form-group">
          <label for="expectedValue">Valor Esperado *</label>
          <input
            id="expectedValue"
            v-model.number="form.expectedValue"
            type="number"
            step="any"
            placeholder="1939"
            required
          />
        </div>

        <div class="form-group">
          <label for="tolerance">Tolerancia</label>
          <input
            id="tolerance"
            v-model.number="form.tolerance"
            type="number"
            step="any"
            min="0"
            placeholder="0"
          />
          <small class="hint">Margen de error aceptado (ej: ±2)</small>
        </div>
      </div>

      <div class="info-box">
        <p><strong>Ejemplo:</strong></p>
        <p>
          Si la respuesta es <strong>{{ form.expectedValue || 100 }}</strong> con tolerancia
          <strong>{{ form.tolerance || 0 }}</strong
          >, se aceptarán respuestas entre
          <strong>{{ (form.expectedValue || 100) - (form.tolerance || 0) }}</strong> y
          <strong>{{ (form.expectedValue || 100) + (form.tolerance || 0) }}</strong
          >.
        </p>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="cancel">Cancelar</button>
        <button type="submit" class="btn-primary">
          {{ isEdit ? 'Actualizar Pregunta' : 'Crear Pregunta' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { NumberQuestion, Question } from '@shared/models/Question';

const props = defineProps<{
  initialData?: Question;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: NumberQuestion];
  cancel: [];
}>();

const initialNumber = props.initialData as NumberQuestion | undefined;

const form = ref({
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  points: props.initialData?.points || 1,
  timeLimitSec: props.initialData?.timeLimitSec,
  expectedValue: initialNumber?.expectedAnswer.value,
  tolerance: initialNumber?.expectedAnswer.tolerance,
});

const submitForm = () => {
  if (form.value.expectedValue === undefined) return;

  const question: NumberQuestion = {
    type: 'NUMBER',
    title: form.value.title,
    description: form.value.description || undefined,
    points: form.value.points,
    timeLimitSec: form.value.timeLimitSec,
    expectedAnswer: {
      value: form.value.expectedValue,
      tolerance: form.value.tolerance,
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

.hint {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #666;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.info-box {
  padding: 1rem;
  background-color: #e3f2ff;
  border-left: 3px solid #2f8cff;
  border-radius: 6px;
  margin-bottom: 1.5rem;
}

.info-box p {
  margin: 0.25rem 0;
  font-size: 0.875rem;
  color: #333;
}

.info-box strong {
  color: #2f8cff;
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
