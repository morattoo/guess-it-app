<template>
  <div class="question-form">
    <h3>Pregunta de Verdadero/Falso</h3>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="title">Título *</label>
        <textarea
          id="title"
          v-model="form.title"
          placeholder="¿La Tierra es el tercer planeta del sistema solar?"
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
        <label>Respuesta Correcta *</label>
        <div class="boolean-options">
          <label class="boolean-option" :class="{ selected: form.expectedAnswer === true }">
            <input
              v-model="form.expectedAnswer"
              type="radio"
              :value="true"
              name="expected-answer"
            />
            <span class="boolean-icon">✓</span>
            {{ t.common.trueLabel }}
          </label>
          <label class="boolean-option" :class="{ selected: form.expectedAnswer === false }">
            <input
              v-model="form.expectedAnswer"
              type="radio"
              :value="false"
              name="expected-answer"
            />
            <span class="boolean-icon">✗</span>
            {{ t.common.falseLabel }}
          </label>
        </div>
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
import { useI18n } from '@/composables/useI18n';
import type { BooleanQuestion, Question } from '@shared/models/Question';

const { t } = useI18n();

const props = defineProps<{
  initialData?: Question;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: BooleanQuestion];
  cancel: [];
}>();

const initialBoolean = props.initialData as BooleanQuestion | undefined;

const form = ref({
  title: props.initialData?.title ?? '',
  description: props.initialData?.description ?? '',
  points: props.initialData?.points ?? 1,
  timeLimitSec: props.initialData?.timeLimitSec,
  expectedAnswer: initialBoolean?.expectedAnswer.booleanValue ?? (null as boolean | null),
});

const isSubmitting = ref(false);

const isFormValid = computed(() => {
  return (
    form.value.title.trim() !== '' && form.value.points > 0 && form.value.expectedAnswer !== null
  );
});

const submitForm = () => {
  if (!isFormValid.value || isSubmitting.value) return;

  isSubmitting.value = true;

  const question: BooleanQuestion = {
    type: 'BOOLEAN',
    title: form.value.title,
    description: form.value.description || undefined,
    points: form.value.points,
    timeLimitSec: form.value.timeLimitSec,
    expectedAnswer: {
      booleanValue: form.value.expectedAnswer as boolean,
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

.boolean-options {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.boolean-option {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 1rem;
  border: 2px solid #e2e8f0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 1rem;
  font-weight: 600;
  transition: all 0.2s;
  user-select: none;

  input[type='radio'] {
    display: none;
  }

  &:hover {
    border-color: #cbd5e0;
    background: #f7fafc;
  }

  &.selected {
    border-color: #667eea;
    background: #eef2ff;
    color: #4c51bf;
  }

  .boolean-icon {
    font-size: 1.25rem;
  }
}

.form-actions {
  display: flex;
  gap: 1rem;
  justify-content: flex-end;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e0e0e0;
}

.btn-primary {
  background: #2f8cff;
  color: white;
  border: none;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover:not(:disabled) {
    background: #1a7ae0;
  }

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

.btn-secondary {
  background: white;
  color: #333;
  border: 1px solid #ddd;
  padding: 0.75rem 1.5rem;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;

  &:hover {
    background: #f5f5f5;
  }
}

@media (max-width: 640px) {
  .form-row,
  .boolean-options {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column-reverse;
  }
}
</style>
