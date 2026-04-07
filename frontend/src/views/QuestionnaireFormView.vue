<template>
  <div class="questionnaire-form-view">
    <div class="questionnaire-form-view__header">
      <h2>{{ isEdit ? t.questionnaireForm.editTitle : t.questionnaireForm.createTitle }}</h2>
    </div>

    <div v-if="loading" class="loading">{{ t.questionnaireForm.loading }}</div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="router.push('/dashboard/questionnaires')" class="btn-primary">
        {{ t.questionnaireForm.backToList }}
      </button>
    </div>

    <div v-else class="form-container">
      <form @submit.prevent="handleSubmit">
        <div class="form-group">
          <label for="title">{{ t.questionnaireForm.titleLabel }}</label>
          <input
            id="title"
            v-model="form.title"
            type="text"
            :placeholder="t.questionnaireForm.titlePlaceholder"
            required
          />
        </div>

        <div class="form-group">
          <label
            >{{ t.questionnaireForm.selectedQuestions }} ({{ selectedQuestions.length }})</label
          >
          <div v-if="loadingQuestions" class="loading-questions">
            {{ t.questionnaireForm.loadingQuestions }}
          </div>
          <div v-else-if="availableQuestions.length === 0" class="no-questions">
            <p>{{ t.questionnaireForm.noQuestionsAvailable }}</p>
            <router-link to="/dashboard/question" class="btn-secondary">
              {{ t.questionnaireForm.createAQuestion }}
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
              <h4>{{ t.questionnaireForm.availableQuestions }}</h4>
              <div v-for="question in unselectedQuestions" :key="question.id" class="question-item">
                <div class="question-content">
                  <span class="question-type" :class="`type-${question.type.toLowerCase()}`">
                    {{ getTypeLabel(question.type) }}
                  </span>
                  <span class="question-title">{{ question.title }}</span>
                  <span class="question-points">{{ question.points }} pts</span>
                </div>
                <div class="question-actions">
                  <button type="button" class="btn-add-question" @click="addQuestion(question.id!)">
                    +
                  </button>
                </div>
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
            {{ t.common.cancel }}
          </button>
          <button type="submit" class="btn-primary" :disabled="!isFormValid">
            {{ isEdit ? t.questionnaireForm.update : t.questionnaireForm.create }}
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
import { useI18n } from '@/composables/useI18n';
import type { QuestionDocument } from '@shared/models/Question';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
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
  const types = t.value.questionsPool.questionTypes;
  const labels: Record<string, string> = {
    TEXT: types.text,
    NUMBER: types.number,
    CHOICE: types.choice,
    ORDERING: types.ordering,
  };
  return labels[type] || type;
};

const handleSubmit = async () => {
  if (!isFormValid.value) return;

  try {
    if (isEdit.value) {
      await updateQuestionnaire(questionnaireId, {
        title: form.value.title,
        questionIds: form.value.questionIds,
      });
    } else {
      await createQuestionnaire(form.value.title, form.value.questionIds);
    }

    router.push('/dashboard/questionnaires');
  } catch (err) {
    console.error('Error al guardar cuestionario:', err);
    alert(t.value.questionnaireForm.saveError);
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
        error.value = t.value.questionnaireForm.notFound;
        return;
      }

      if (questionnaire.createdBy !== currentUser.uid) {
        error.value = t.value.questionnaireForm.noPermission;
        return;
      }

      form.value.title = questionnaire.title;
      const availableIds = new Set(availableQuestions.value.map(q => q.id!));
      form.value.questionIds = questionnaire.questionIds.filter(id => availableIds.has(id));
    }
  } catch (err) {
    error.value = t.value.questionnaireForm.loadError;
    console.error(err);
  } finally {
    loading.value = false;
  }
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.questionnaire-form-view {
  @include page-view(900px);
  padding-top: 0;

  &__header {
    h2 {
      margin: 0 0 0.25rem;
      font-size: 1.5rem;
      font-weight: 700;
    }
  }
}

.loading,
.error {
  @include loading-state;
}

.error {
  color: $error-color;
}

.error p {
  margin-bottom: 1.5rem;
  font-size: $font-size-lg;
}

.form-container {
  @include form-container;
}

.form-group {
  @include form-group-base;
}

.form-group input[type='text'] {
  @include form-control-base;
}

.loading-questions,
.no-questions {
  text-align: center;
  padding: 2rem;
  color: $text-secondary;
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
  border: 1px solid $border-separator;
  border-radius: $border-radius;
  padding: 1rem;
}

.available-questions h4 {
  margin: 0 0 1rem 0;
  color: $text-secondary;
  font-size: $font-size-md;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.question-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: $spacing-sm;
  margin-bottom: $spacing-xs;
  background-color: $bg-item;
  border-radius: $border-radius;
  transition: all $transition-normal;
}

.question-actions {
  display: flex;
  align-items: center;
  justify-content: center;
}

.question-item:last-child {
  margin-bottom: 0;
}

.question-item:hover {
  background-color: $bg-hover;
}

.question-item.selected {
  background-color: $action-blue-light;
  cursor: default;
}

.question-content {
  display: flex;
  flex-direction: column;
  flex: 1;
}

// .question-type + .type-* colors are provided by _utilities.scss globally

.question-title {
  flex: 1;
  font-size: $font-size-md;
  color: $text-strong;
}

.question-points {
  font-size: $font-size-sm;
  color: $text-secondary;
  font-weight: 600;
}

.btn-add-question {
  width: 28px;
  height: 28px;
  flex-shrink: 0;
  padding: 0;
  box-sizing: border-box;
  border-radius: 14px;
  border: none;
  cursor: pointer;
  font-size: $font-size-lg;
  line-height: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all $transition-normal;
  background-color: $action-blue;
  color: white;

  &:hover {
    background-color: $action-blue-hover;
  }
}

.form-actions {
  @include form-actions;
}
</style>
