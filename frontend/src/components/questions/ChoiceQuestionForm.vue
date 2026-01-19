<template>
  <div class="question-form">
    <h3>Pregunta de Selección</h3>

    <form @submit.prevent="submitForm">
      <div class="form-group">
        <label for="title">Título *</label>
        <input
          id="title"
          v-model="form.title"
          type="text"
          placeholder="¿Cuál es el planeta más cercano al Sol?"
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
        <label>Opciones *</label>
        <div class="options-list">
          <div v-for="(option, index) in form.options" :key="option.id" class="option-item">
            <input
              v-model="option.label"
              type="text"
              :placeholder="`Opción ${index + 1}`"
              required
            />
            <label class="radio-label">
              <input
                v-model="form.correctOptionId"
                type="radio"
                :value="option.id"
                name="correct-option"
              />
              Correcta
            </label>
            <button
              v-if="form.options.length > 2"
              type="button"
              class="btn-remove"
              @click="removeOption(index)"
            >
              ✕
            </button>
          </div>
        </div>
        <button type="button" class="btn-add-option" @click="addOption">+ Agregar Opción</button>
      </div>

      <div class="form-actions">
        <button type="button" class="btn-secondary" @click="cancel">Cancelar</button>
        <button type="submit" class="btn-primary" :disabled="!isFormValid">
          {{ isEdit ? 'Actualizar Pregunta' : 'Crear Pregunta' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import type { ChoiceQuestion, Question } from '@shared/models/Question';

const props = defineProps<{
  initialData?: Question;
  isEdit?: boolean;
}>();

const emit = defineEmits<{
  submit: [question: ChoiceQuestion];
  cancel: [];
}>();

const initialChoice = props.initialData as ChoiceQuestion | undefined;

const form = ref({
  title: props.initialData?.title || '',
  description: props.initialData?.description || '',
  points: props.initialData?.points || 1,
  timeLimitSec: props.initialData?.timeLimitSec,
  options: initialChoice?.options || [
    { id: crypto.randomUUID(), label: '' },
    { id: crypto.randomUUID(), label: '' },
  ],
  correctOptionId: initialChoice?.expectedAnswer.optionId || '',
});

const isFormValid = computed(() => {
  return (
    form.value.title &&
    form.value.description &&
    form.value.options.every(opt => opt.label.trim()) &&
    form.value.correctOptionId
  );
});

const addOption = () => {
  form.value.options.push({
    id: crypto.randomUUID(),
    label: '',
  });
};

const removeOption = (index: number) => {
  const removedOption = form.value.options[index];
  form.value.options.splice(index, 1);

  // Si se elimina la opción correcta, limpiar la selección
  if (removedOption && form.value.correctOptionId === removedOption.id) {
    form.value.correctOptionId = '';
  }
};

const submitForm = () => {
  if (!isFormValid.value) return;

  const question: ChoiceQuestion = {
    type: 'CHOICE',
    title: form.value.title,
    description: form.value.description || undefined,
    points: form.value.points,
    timeLimitSec: form.value.timeLimitSec,
    options: form.value.options.map(opt => ({
      id: opt.id,
      label: opt.label,
    })),
    expectedAnswer: {
      optionId: form.value.correctOptionId,
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

.options-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  margin-bottom: 1rem;
}

.option-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.75rem;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.option-item input[type='text'] {
  flex: 1;
  padding: 0.5rem;
  margin: 0;
}

.radio-label {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  white-space: nowrap;
  font-weight: normal;
  font-size: 0.875rem;
  cursor: pointer;
}

.radio-label input[type='radio'] {
  cursor: pointer;
}

.btn-remove {
  padding: 0.25rem 0.5rem;
  background-color: #fee;
  color: #d33;
  border: 1px solid #fcc;
  border-radius: 4px;
  cursor: pointer;
  font-size: 1rem;
  transition: all 0.2s;
}

.btn-remove:hover {
  background-color: #fcc;
}

.btn-add-option {
  padding: 0.75rem 1rem;
  background-color: #f5f5f5;
  color: #666;
  border: 1px dashed #ddd;
  border-radius: 6px;
  cursor: pointer;
  font-size: 0.875rem;
  font-weight: 600;
  transition: all 0.2s;
  width: 100%;
}

.btn-add-option:hover {
  background-color: #e0e0e0;
  border-color: #ccc;
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

.btn-primary:hover:not(:disabled) {
  background-color: #1a7ae8;
}

.btn-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
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

  .option-item {
    flex-wrap: wrap;
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
