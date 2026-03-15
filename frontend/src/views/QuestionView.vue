<template>
  <div class="question-view">
    <h2>{{ t.createQuestion.title }}</h2>

    <div class="form-group">
      <label for="question-type">{{ t.createQuestion.typeLabel }}</label>
      <select id="question-type" v-model="selectedType" class="question-type-select">
        <option value="">{{ t.createQuestion.selectType }}</option>
        <option value="TEXT">{{ t.createQuestion.typeText }}</option>
        <option value="NUMBER">{{ t.createQuestion.typeNumber }}</option>
        <option value="CHOICE">{{ t.createQuestion.typeChoice }}</option>
        <option value="ORDERING">{{ t.createQuestion.typeOrdering }}</option>
      </select>
    </div>

    <div v-if="selectedType" class="question-form">
      <component :is="currentComponent" @submit="handleSubmit" @cancel="handleCancel" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import type { Question, QuestionType } from '@shared/models/Question';
import TextQuestionForm from '@/components/questions/TextQuestionForm.vue';
import NumberQuestionForm from '@/components/questions/NumberQuestionForm.vue';
import ChoiceQuestionForm from '@/components/questions/ChoiceQuestionForm.vue';
import OrderingQuestionForm from '@/components/questions/OrderingQuestionForm.vue';
import { createQuestion } from '@/firebase/question';
import { auth } from '@/firebase/auth';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const { t } = useI18n();
const selectedType = ref<QuestionType | ''>('');

const currentComponent = computed(() => {
  switch (selectedType.value) {
    case 'TEXT':
      return TextQuestionForm;
    case 'NUMBER':
      return NumberQuestionForm;
    case 'CHOICE':
      return ChoiceQuestionForm;
    case 'ORDERING':
      return OrderingQuestionForm;
    default:
      return null;
  }
});

const handleSubmit = async (question: Question) => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) {
      return;
    }

    await createQuestion(question, currentUser.uid);
    router.push('/dashboard/questions-pool');
  } catch (error) {
    throw new Error(`Error al crear la pregunta ${(error as Error).message}`);
  }
};

const handleCancel = () => {
  router.push('/dashboard/questions-pool');
};
</script>

<style scoped>
.question-view {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
}

h2 {
  margin-bottom: 2rem;
  color: #333;
}

.form-group {
  margin-bottom: 2rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  font-weight: 600;
  color: #333;
}

.question-type-select {
  width: 100%;
  padding: 0.75rem;
  font-size: 1rem;
  border: 1px solid #ddd;
  border-radius: 6px;
  background-color: white;
  cursor: pointer;
  transition: border-color 0.2s;
}

.question-type-select:focus {
  outline: none;
  border-color: #2f8cff;
  box-shadow: 0 0 0 3px rgba(47, 140, 255, 0.1);
}

.question-form {
  margin-top: 2rem;
}
</style>
