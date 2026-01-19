<template>
  <div class="questionnaires-view">
    <div class="header">
      <h2>Mis Cuestionarios</h2>
      <router-link to="/dashboard/questionnaire/new" class="btn-add">
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
        Crear Cuestionario
      </router-link>
    </div>

    <div v-if="loading" class="loading">Cargando cuestionarios...</div>

    <div v-else-if="questionnaires.length === 0" class="empty-state">
      <p>No tienes cuestionarios creados aún.</p>
      <router-link to="/dashboard/questionnaire/new" class="btn-primary">
        Crear tu primer cuestionario
      </router-link>
    </div>

    <div v-else class="questionnaires-list">
      <div
        v-for="questionnaire in questionnaires"
        :key="questionnaire.id"
        class="questionnaire-card"
      >
        <div class="questionnaire-header">
          <h3 class="questionnaire-title">{{ questionnaire.title }}</h3>
          <span class="question-count">
            {{ questionnaire.questionIds.length }}
            {{ questionnaire.questionIds.length === 1 ? 'pregunta' : 'preguntas' }}
          </span>
        </div>

        <div class="questionnaire-footer">
          <span class="created-date">
            {{ formatDate(questionnaire.createdAt) }}
          </span>
        </div>

        <div class="questionnaire-actions">
          <button class="btn-icon" title="Editar" @click="handleEdit(questionnaire.id)">
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
            title="Eliminar"
            @click="handleDelete(questionnaire.id)"
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
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getQuestionnairesByUser, deleteQuestionnaire } from '@/firebase/questionnaire';
import { auth } from '@/firebase/auth';
import type { Questionnaire } from '@shared/models/Questionnaire';

const router = useRouter();
const questionnaires = ref<Questionnaire[]>([]);
const loading = ref(true);

const loadQuestionnaires = async () => {
  try {
    const currentUser = auth.currentUser!;
    questionnaires.value = await getQuestionnairesByUser(currentUser.uid);
  } catch (error) {
    console.error('Error al cargar cuestionarios:', error);
  } finally {
    loading.value = false;
  }
};

const handleEdit = (questionnaireId: string) => {
  router.push(`/dashboard/questionnaire/${questionnaireId}`);
};

const handleDelete = async (questionnaireId: string) => {
  if (!confirm('¿Estás seguro de eliminar este cuestionario?')) return;

  try {
    await deleteQuestionnaire(questionnaireId);
    questionnaires.value = questionnaires.value.filter(q => q.id !== questionnaireId);
  } catch (error) {
    console.error('Error al eliminar cuestionario:', error);
    alert('Error al eliminar el cuestionario');
  }
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
  loadQuestionnaires();
});
</script>

<style scoped>
.questionnaires-view {
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

.questionnaires-list {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 1.5rem;
}

.questionnaire-card {
  position: relative;
  background-color: white;
  padding: 1.5rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition:
    transform 0.2s,
    box-shadow 0.2s;
}

.questionnaire-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.questionnaire-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 1rem;
  gap: 1rem;
}

.questionnaire-title {
  margin: 0;
  font-size: 1.25rem;
  color: #333;
  line-height: 1.4;
  flex: 1;
}

.question-count {
  padding: 0.25rem 0.75rem;
  background-color: #e3f2ff;
  color: #2f8cff;
  border-radius: 12px;
  font-size: 0.8125rem;
  font-weight: 600;
  white-space: nowrap;
}

.questionnaire-footer {
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  font-size: 0.8125rem;
  color: #999;
}

.questionnaire-actions {
  position: absolute;
  bottom: 1rem;
  right: 1rem;
  display: flex;
  gap: 0.5rem;
  opacity: 0;
  transition: opacity 0.2s;
}

.questionnaire-card:hover .questionnaire-actions {
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

  .questionnaires-list {
    grid-template-columns: 1fr;
  }

  .questionnaire-actions {
    opacity: 1;
  }
}
</style>
