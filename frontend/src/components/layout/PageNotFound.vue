<template>
  <div class="page-not-found">
    <div class="not-found-content">
      <div class="error-code">404</div>
      <div class="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="120"
          height="120"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="12" y1="8" x2="12" y2="12"></line>
          <line x1="12" y1="16" x2="12.01" y2="16"></line>
        </svg>
      </div>
      <h1>{{ t.notFound.title }}</h1>
      <p>{{ t.notFound.message }}</p>
      <div class="actions">
        <button @click="goHome" class="btn-primary">{{ t.notFound.goHome }}</button>
        <button @click="goBack" class="btn-secondary">{{ t.notFound.goBack }}</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
const router = useRouter();

const goHome = () => {
  router.push('/');
};

const goBack = () => {
  router.back();
};
</script>

<style scoped lang="scss">
.page-not-found {
  display: flex;
  align-items: center;
  justify-content: center;
}

.not-found-content {
  text-align: center;
  max-width: 600px;
  padding: 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.error-code {
  font-size: 4rem;
  font-weight: 900;
  line-height: 1;
  margin-bottom: 1rem;
}

.icon {
  color: #ffc107;
  margin-bottom: 1.5rem;

  svg {
    opacity: 0.9;
  }
}

.actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  flex-wrap: wrap;
}

button {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  border: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;

  &:hover {
    background: #f8f9fa;
    transform: translateY(-2px);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
