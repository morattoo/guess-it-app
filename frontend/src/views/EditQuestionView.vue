<template>
  <div class="edit-question-view">
    <h2>{{ t.editQuestion.title }}</h2>

    <div v-if="loading" class="loading">{{ t.editQuestion.loading }}</div>

    <div v-else-if="error" class="error">
      <p>{{ error }}</p>
      <button @click="router.push('/dashboard/questions-pool')" class="btn-primary">
        {{ t.editQuestion.backToPool }}
      </button>
    </div>

    <div v-else-if="question" class="question-form">
      <component
        :is="currentComponent"
        :initial-data="question"
        :is-edit="true"
        @submit="handleSubmit"
        @cancel="handleCancel"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import type { Question, QuestionDocument } from '@shared/models/Question';
import TextQuestionForm from '@/components/questions/TextQuestionForm.vue';
import NumberQuestionForm from '@/components/questions/NumberQuestionForm.vue';
import ChoiceQuestionForm from '@/components/questions/ChoiceQuestionForm.vue';
import OrderingQuestionForm from '@/components/questions/OrderingQuestionForm.vue';
import { getQuestion, updateQuestion } from '@/firebase/question';
import { auth } from '@/firebase/auth';
import { useI18n } from '@/composables/useI18n';

const router = useRouter();
const route = useRoute();
const { t } = useI18n();
const questionId = route.params.id as string;

const question = ref<QuestionDocument | null>(null);
const loading = ref(true);
const error = ref('');

const currentComponent = computed(() => {
  if (!question.value) return null;

  switch (question.value.type) {
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

onMounted(async () => {
  try {
    const fetchedQuestion = await getQuestion(questionId);

    if (!fetchedQuestion) {
      error.value = t.value.editQuestion.notFound;
      return;
    }

    // Verificar que el usuario sea el creador
    const currentUser = auth.currentUser!;
    if (fetchedQuestion.createdBy !== currentUser.uid) {
      error.value = t.value.editQuestion.noPermission;
      return;
    }

    question.value = fetchedQuestion;
  } catch (err) {
    error.value = t.value.editQuestion.loadError;
    console.error(err);
  } finally {
    loading.value = false;
  }
});

const handleSubmit = async (updatedQuestion: Question) => {
  try {
    await updateQuestion(questionId, updatedQuestion);
    router.push('/dashboard/questions-pool');
  } catch (err) {
    console.error('Error al actualizar la pregunta:', err);
    alert(t.value.editQuestion.updateError);
  }
};

const handleCancel = () => {
  router.push('/dashboard/questions-pool');
};
</script>

<style scoped>
.edit-question-view {
  max-width: 800px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 2rem;
  color: #333;
  margin: 0;
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

.question-form {
  margin-top: 1rem;
}
</style>
