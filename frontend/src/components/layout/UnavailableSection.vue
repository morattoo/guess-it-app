<template>
  <div class="unavailable-section">
    <div class="unavailable-content">
      <div class="icon">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="80"
          height="80"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <circle cx="12" cy="12" r="10"></circle>
          <line x1="4.93" y1="4.93" x2="19.07" y2="19.07"></line>
        </svg>
      </div>
      <h2>{{ displayTitle }}</h2>
      <p>{{ displayMessage }}</p>
      <button v-if="showBackButton" @click="goBack" class="btn-back">
        {{ displayBackButton }}
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRouter } from 'vue-router';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();

interface Props {
  type?: 'default' | 'register';
  title?: string;
  message?: string;
  showBackButton?: boolean;
  backButtonText?: string;
}

const props = withDefaults(defineProps<Props>(), {
  type: 'default',
  title: '',
  message: '',
  showBackButton: true,
  backButtonText: '',
});

const router = useRouter();

// Use custom props or fall back to translations based on type
const displayTitle = computed(() => {
  if (props.title) return props.title;
  if (props.type === 'register') return t.value.auth.unavailableTitle;
  return t.value.unavailable.title;
});

const displayMessage = computed(() => {
  if (props.message) return props.message;
  if (props.type === 'register') return t.value.auth.unavailableMessage;
  return t.value.unavailable.message;
});

const displayBackButton = computed(() => {
  if (props.backButtonText) return props.backButtonText;
  if (props.type === 'register') return t.value.auth.backToLogin;
  return t.value.unavailable.backButton;
});

const goBack = () => {
  router.back();
};
</script>

<style scoped lang="scss">
.unavailable-section {
  display: flex;
  align-items: center;
  justify-content: center;
}

.unavailable-content {
  text-align: center;
  max-width: 500px;
  padding: 3rem 2rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
}

.icon {
  color: #dc3545;
  margin-bottom: 1.5rem;

  svg {
    opacity: 0.8;
  }
}

.btn-back {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  padding: 0.75rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 8px;
  cursor: pointer;
  transition:
    transform 0.2s,
    box-shadow 0.2s;

  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}
</style>
