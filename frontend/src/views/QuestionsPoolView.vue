<template>
  <div class="questions-pool-view">
    <div class="header">
      <h2>Mis Preguntas</h2>
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
        Crear Pregunta
      </router-link>
    </div>

    <div v-if="loading" class="loading">Cargando preguntas...</div>

    <div v-else-if="questions.length === 0" class="empty-state">
      <p>No tienes preguntas creadas aún.</p>
      <router-link to="/dashboard/question" class="btn-primary"
        >Crear tu primera pregunta</router-link
      >
    </div>

    <div v-else class="questions-list">
      <div v-for="question in questions" :key="question.id" class="question-card">
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

        <div class="question-footer">
          <span v-if="question.timeLimitSec" class="time-limit">
            ⏱️ {{ question.timeLimitSec }}s
          </span>
          <span class="created-date">
            {{ formatDate(question.createdAt) }}
          </span>
        </div>

        <div class="question-actions">
          <button class="btn-icon" title="Editar">
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
          <button class="btn-icon btn-delete" title="Eliminar" @click="handleDelete(question.id!)">
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
import { ref, onMounted } from 'vue';
import { getQuestionsByUser, deleteQuestion } from '@/firebase/question';
import { auth } from '@/firebase/auth';
import type { QuestionDocument } from '@shared/models/Question';

const questions = ref<QuestionDocument[]>([]);
const loading = ref(true);

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

const handleDelete = async (questionId: string) => {
  if (!confirm('¿Estás seguro de eliminar esta pregunta?')) return;

  try {
    await deleteQuestion(questionId);
    questions.value = questions.value.filter(q => q.id !== questionId);
  } catch (error) {
    console.error('Error al eliminar pregunta:', error);
    alert('Error al eliminar la pregunta');
  }
};

const getTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    TEXT: 'Texto',
    NUMBER: 'Número',
    CHOICE: 'Selección',
  };
  return labels[type] || type;
};

const formatDate = (timestamp: any) => {
  if (!timestamp) return '';

  let date: Date;
  if (timestamp.toDate) {
    date = timestamp.toDate();
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else if (typeof timestamp === 'number') {
    date = new Date(timestamp);
  } else {
    return '';
  }

  return new Intl.DateTimeFormat('es-ES', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(date);
};

onMounted(() => {
  loadQuestions();
});
</script>

<style scoped>
.questions-pool-view {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

h2 {
  margin: 0;
  color: #333;
}

.btn-add {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background-color: #2f8cff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  font-size: 0.9375rem;
  transition: background-color 0.2s;
}

.btn-add:hover {
  background-color: #1a7ae8;
}

.loading,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  color: #666;
}

.empty-state p {
  margin-bottom: 1.5rem;
  font-size: 1.125rem;
}

.btn-primary {
  display: inline-block;
  padding: 0.75rem 1.5rem;
  background-color: #2f8cff;
  color: white;
  text-decoration: none;
  border-radius: 6px;
  font-weight: 600;
  transition: background-color 0.2s;
}

.btn-primary:hover {
  background-color: #1a7ae8;
}

.questions-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.question-card {
  position: relative;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.question-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.question-type {
  padding: 0.25rem 0.75rem;
  border-radius: 4px;
  font-size: 0.75rem;
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

.question-points {
  font-weight: 600;
  color: #666;
  font-size: 0.875rem;
}

.question-title {
  margin: 0 0 0.75rem 0;
  font-size: 1.125rem;
  color: #333;
  line-height: 1.4;
}

.question-description {
  margin: 0 0 1rem 0;
  color: #666;
  font-size: 0.875rem;
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
  border-top: 1px solid #e0e0e0;
  font-size: 0.8125rem;
  color: #999;
}

.time-limit {
  display: flex;
  align-items: center;
  gap: 0.25rem;
}

.question-actions {
  position: absolute;
  top: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.question-card:hover .question-actions {
  opacity: 1;
}

.btn-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  padding: 0;
  background-color: white;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
  color: #666;
}

.btn-icon:hover {
  background-color: #f5f5f5;
  border-color: #ccc;
}

.btn-delete:hover {
  background-color: #fff5f5;
  border-color: #fcc;
  color: #d33;
}

@media (max-width: 640px) {
  .header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .btn-add {
    justify-content: center;
  }

  .questions-list {
    grid-template-columns: 1fr;
  }

  .question-actions {
    opacity: 1;
  }
}
</style>
