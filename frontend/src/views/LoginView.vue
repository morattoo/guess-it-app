<template>
  <div class="auth-card">
    <h1 id="login-title">{{ t.auth.login }}</h1>
    <p class="subtitle">{{ t.auth.loginSubtitle }}</p>

    <form @submit.prevent="onSubmit" novalidate aria-labelledby="login-title">
      <div class="form-group">
        <label for="email-input">{{ t.auth.email }}</label>
        <input
          id="email-input"
          type="email"
          :placeholder="t.auth.emailPlaceholder"
          v-model="email"
          autocomplete="email"
          required
          aria-required="true"
        />
      </div>

      <div class="form-group">
        <label for="password-input">{{ t.auth.password }}</label>
        <input
          id="password-input"
          type="password"
          :placeholder="t.auth.passwordPlaceholder"
          v-model="password"
          autocomplete="current-password"
          required
          aria-required="true"
        />
      </div>

      <div v-if="error" class="error" role="alert" aria-live="assertive">
        {{ error }}
      </div>

      <button
        type="submit"
        class="primary"
        :disabled="!canSubmit || loading"
        :aria-busy="loading ? 'true' : 'false'"
      >
        <span v-if="!loading">{{ t.auth.loginButton }}</span>
        <span v-else>{{ t.auth.loggingIn }}</span>
      </button>
    </form>

    <p class="switch">
      {{ t.auth.noAccount }}
      <router-link to="/auth/register">{{ t.auth.createAccount }}</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/firebase/auth';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
const router = useRouter();

const email = ref('');
const password = ref('');
const loading = ref(false);
const error = ref<string | null>(null);

const canSubmit = computed(() => email.value && password.value.length >= 6);

const onSubmit = async () => {
  if (!canSubmit.value) return;

  loading.value = true;
  error.value = null;

  try {
    await login(email.value, password.value);
    router.push('/dashboard');
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : t.value.auth.loginError;
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/forms';
</style>
