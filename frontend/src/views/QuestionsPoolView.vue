<template>
  <div class="questions-pool-view">
    <div class="header">
      <h2>{{ t.questionsPool.title }}</h2>

      <router-link to="/dashboard/question" class="btn-add">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10 4V16M4 10H16"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
          />
        </svg>
        {{ t.questionsPool.createQuestion }}
      </router-link>
    </div>
    <FilterInput class="questions-pool-view__filter" v-model="searchText" />
    <div v-if="loading" class="loading">{{ t.questionsPool.loading }}</div>

    <div v-else-if="questions.length === 0" class="empty-state">
      <p>{{ t.questionsPool.noQuestions }}</p>
      <router-link to="/dashboard/question" class="btn-primary">{{
        t.questionsPool.createFirst
      }}</router-link>
    </div>

    <div v-else class="questions-list">
      <div v-for="question in filteredQuestions" :key="question.id" class="question-card">
        <div class="question-header">
          <span class="question-type" :class="`type-${question.type.toLowerCase()}`">
            {{ getTypeLabel(question.type) }}
          </span>
          <span class="question-points">{{ question.points }} pts</span>
        </div>

        <h3 class="question-title">{{ question.title }}</h3>

        <p v-if="question.description" class="question-description">
          {{ question.description }}
        </p>

        <div class="question-footer"></div>

        <div class="question-actions">
          <button class="btn-icon" :title="t.common.edit" @click="handleEdit(question.id!)">
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M14 2L18 6L6 18H2V14L14 2Z"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
          <button
            class="btn-icon btn-delete"
            :title="t.common.delete"
            @click="handleDelete(question.id!)"
          >
            <svg
              width="18"
              height="18"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3 5H17M8 3H12M8 9V15M12 9V15"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
              />
              <path
                d="M5 5L6 17H14L15 5"
                stroke="currentColor"
                stroke-width="2"
                stroke-linecap="round"
                stroke-linejoin="round"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getQuestionsByUser, deleteQuestion } from '@/firebase/question';
import { auth } from '@/firebase/auth';
import { useI18n } from '@/composables/useI18n';
import type { QuestionDocument } from '@shared/models/Question';
import FilterInput from '@/components/FilterInput.vue';

const router = useRouter();
const { t } = useI18n();
const questions = ref<QuestionDocument[]>([]);
const loading = ref(true);
const searchText = ref('');

const filteredQuestions = computed(() => {
  const query = searchText.value.trim().toLowerCase();
  if (!query) return questions.value;
  return questions.value.filter(q => {
    const typeLabel = getTypeLabel(q.type).toLowerCase();
    return (
      q.title.toLowerCase().includes(query) ||
      (q.description?.toLowerCase().includes(query) ?? false) ||
      typeLabel.includes(query)
    );
  });
});

const loadQuestions = async () => {
  try {
    const currentUser = auth.currentUser;
    if (!currentUser) return;

    questions.value = await getQuestionsByUser(currentUser.uid);
  } catch (error) {
    console.error('Error al cargar preguntas:', error);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (questionId: string) => {
  router.push(`/dashboard/question/${questionId}`);
};

const handleDelete = async (questionId: string) => {
  if (!confirm(t.value.questionsPool.confirmDelete)) return;

  try {
    await deleteQuestion(questionId);
    questions.value = questions.value.filter(q => q.id !== questionId);
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    alert(t.value.questionsPool.deleteError);
  }
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

onMounted(() => {
  loadQuestions();
});
</script>

<style scoped lang="scss">
@import '@/styles/variables';
@import '@/styles/mixins';

.questions-pool-view {
  @include page-view(1200px);

  &__filter {
    margin-bottom: 1rem;
  }
}

.header {
  @include page-header;
}

.loading,
.empty-state {
  @include loading-state;
}

.empty-state p {
  margin-bottom: 1.5rem;
  font-size: $font-size-lg;
}

.questions-list {
  @include cards-grid(320px);
}

.question-card {
  @include card-base;
  @include card-hover;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

// .question-type + .type-* colors are provided by _utilities.scss globally

.question-points {
  font-weight: 600;
  color: $text-secondary;
  font-size: $font-size-md;
}

.question-title {
  margin: 0 0 0.75rem 0;
  font-size: $font-size-lg;
  color: $text-strong;
  line-height: 1.4;
}

.question-description {
  margin: 0 0 1rem 0;
  color: $text-secondary;
  font-size: $font-size-md;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.question-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 1rem;
  border-top: 1px solid $border-separator;
  font-size: $font-size-sm;
  color: $text-muted;
}

.time-limit {
  display: flex;
  align-items: center;
  gap: $spacing-xxs;
}

.question-actions {
  display: flex;
  justify-content: flex-end;

  .btn-icon {
    margin-left: $spacing-xs;
  }
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .questions-list {
    grid-template-columns: 1fr;
  }
}
</style>
