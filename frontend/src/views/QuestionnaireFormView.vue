<template>
  <div class="questionnaire-form-view">
    <h2>{{ isEdit ? 'Editar Cuestionario' : 'Crear Cuestionario' }}</h2>

    <div v-if="loading" class="loading">Cargando...</div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="router.push('/dashboard/questionnaires')" class="btn-primary">
        Volver a cuestionarios
      </button>
    </div>

    <div v-else class="form-container">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">Título del Cuestionario *</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            placeholder="Ej: Historia Universal"
            required
          />
        </div>

        <div class="form-group">
          <label>Preguntas Seleccionadas ({{ selectedQuestions.length }})</label>
          <div v-if="loadingQuestions" class="loading-questions">
            Cargando preguntas disponibles...
          </div>
          <div v-else-if="availableQuestions.length === 0" class="no-questions">
            <p>No tienes preguntas creadas.</p>
            <router-link to="/dashboard/question" class="btn-secondary">
              Crear una pregunta
            </router-link>
          </div>
          <div v-else class="questions-selector">
            <div class="selected-questions" v-if="selectedQuestions.length > 0">
              <div
                v-for="question in selectedQuestions"
                :key="question.id"
                class="question-item selected"
              >
                <div class="question-content">
                  <span class="question-type" :class="`type-${question.type.toLowerCase()}`">
                    {{ getTypeLabel(question.type) }}
                  </span>
                  <span class="question-title">{{ question.title }}</span>
                  <span class="question-points">{{ question.points }} pts</span>
                </div>
                <button type="button" class="btn-remove" @click="removeQuestion(question.id!)">
                  ✕
                </button>
              </div>
            </div>

            <div class="available-questions">
              <h4>Preguntas Disponibles</h4>
              <div
                v-for="question in unselectedQuestions"
                :key="question.id"
                class="question-item"
                @click="addQuestion(question.id!)"
              >
                <div class="question-content">
                  <span class="question-type" :class="`type-${question.type.toLowerCase()}`">
                    {{ getTypeLabel(question.type) }}
                  </span>
                  <span class="question-title">{{ question.title }}</span>
                  <span class="question-points">{{ question.points }} pts</span>
                </div>
                <button type="button" class="btn-add-question">+</button>
              </div>
            </div>
          </div>
        </div>

        <div class="form-actions">
          <button
            type="button"
            class="btn-secondary"
            @click="router.push('/dashboard/questionnaires')"
          >
            Cancelar
          </button>
          <button type="submit" class="btn-primary" :disabled="!isFormValid">
            {{ isEdit ? 'Actualizar' : 'Crear' }} Cuestionario
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import {
  createQuestionnaire,
  getQuestionnaire,
  updateQuestionnaire,
} from '@/firebase/questionnaire';
import { getQuestionsByUser } from '@/firebase/question';
import { auth } from '@/firebase/auth';
import type { QuestionDocument } from '@shared/models/Question';

const router = useRouter();
const route = useRoute();
const questionnaireId = route.params.id as string;
const isEdit = computed(() => questionnaireId && questionnaireId !== 'new');

const form = ref({
  title: '',
  questionIds: [] as string[],
});

const availableQuestions = ref<QuestionDocument[]>([]);
const loading = ref(false);
const loadingQuestions = ref(true);
const error = ref('');

const selectedQuestions = computed(() => {
  return form.value.questionIds
    .map(id => availableQuestions.value.find(q => q.id === id))
    .filter(Boolean) as QuestionDocument[];
});

const unselectedQuestions = computed(() => {
  return availableQuestions.value.filter(q => !form.value.questionIds.includes(q.id!));
});

const isFormValid = computed(() => {
  return form.value.title.trim() && form.value.questionIds.length > 0;
});

const addQuestion = (questionId: string) => {
  if (!form.value.questionIds.includes(questionId)) {
    form.value.questionIds.push(questionId);
  }
};

const removeQuestion = (questionId: string) => {
  form.value.questionIds = form.value.questionIds.filter(id => id !== questionId);
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    TEXT: 'Texto',
    NUMBER: 'Número',
    CHOICE: 'Selección',
  };
  return labels[type] || type;
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    const currentUser = auth.currentUser!;

    if (isEdit.value) {
      await updateQuestionnaire(questionnaireId, {
        title: form.value.title,
        questionIds: form.value.questionIds,
      });
    } else {
      await createQuestionnaire(form.value.title, form.value.questionIds, currentUser.uid);
    }

    router.push('/dashboard/questionnaires');
  } catch (err) {
    console.error('Error al guardar cuestionario:', err);
    alert('Error al guardar el cuestionario');
  }
};

onMounted(async () => {
  try {
    const currentUser = auth.currentUser!;

    // Cargar preguntas disponibles
    availableQuestions.value = await getQuestionsByUser(currentUser.uid);
    loadingQuestions.value = false;

    // Si es edición, cargar datos del cuestionario
    if (isEdit.value) {
      loading.value = true;
      const questionnaire = await getQuestionnaire(questionnaireId);

      if (!questionnaire) {
        error.value = 'Cuestionario no encontrado';
        return;
      }

      if (questionnaire.createdBy !== currentUser.uid) {
        error.value = 'No tienes permiso para editar este cuestionario';
        return;
      }

      form.value.title = questionnaire.title;
      form.value.questionIds = questionnaire.questionIds;
    }
  } catch (err) {
    error.value = 'Error al cargar datos';
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped>
.questionnaire-form-view {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
  color: #333;
}

.loading,
.error {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.error {
  color: #d33;
}

.error p {
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}

.form-container {
  background-color: white;
  padding: 2rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
  font-size: 0.875rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  box-sizing: border-box;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #2f8cff;
  box-shadow: 0 0 0 3px rgba(47, 140, 255, 0.1);
}

.loading-questions,
.no-questions {
  text-align: center;
  padding: 2rem;
  color: #666;
}

.no-questions p {
  margin-bottom: 1rem;
}

.questions-selector {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.selected-questions,
.available-questions {
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  padding: 1rem;
}

.available-questions h4 {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.875rem;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  background-color: #f9f9f9;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.question-item:last-child {
  margin-bottom: 0;
}

.question-item:hover {
  background-color: #f0f0f0;
}

.question-item.selected {
  background-color: #e3f2ff;
  cursor: default;
}

.question-content {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.question-type {
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.7rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.type-text {
  background-color: #e3f2ff;
  color: #2f8cff;
}

.type-number {
  background-color: #fff3e0;
  color: #ff8c00;
}

.type-choice {
  background-color: #f3e5f5;
  color: #9c27b0;
}

.question-title {
  flex: 1;
  font-size: 0.875rem;
  color: #333;
}

.question-points {
  font-size: 0.8125rem;
  color: #666;
  font-weight: 600;
}

.btn-add-question,
.btn-remove {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  font-size: 1.125rem;
  transition: all 0.2s;
}

.btn-add-question {
  background-color: #2f8cff;
  color: white;
}

.btn-add-question:hover {
  background-color: #1a7ae8;
}

.btn-remove {
  background-color: #fee;
  color: #d33;
}

.btn-remove:hover {
  background-color: #fcc;
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
  text-decoration: none;
  display: inline-block;
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
  .form-actions {
    flex-direction: column-reverse;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }
}
</style>
