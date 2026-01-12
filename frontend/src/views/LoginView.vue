<template>
  <div class="auth-card">
    <h1 id="login-title">Login</h1>
    <p class="subtitle">Connectez-vous à votre compte</p>

    <form @submit.prevent="onSubmit" novalidate aria-labelledby="login-title">
      <div class="form-group">
        <label for="email-input">Email</label>
        <input
          id="email-input"
          type="email"
          placeholder="exemple@email.com"
          v-model="email"
          autocomplete="email"
          required
          aria-required="true"
        />
      </div>

      <div class="form-group">
        <label for="password-input">Mot de passe</label>
        <input
          id="password-input"
          type="password"
          placeholder="Votre mot de passe"
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
        <span v-if="!loading">Se connecter</span>
        <span v-else>Connexion…</span>
      </button>
    </form>

    <p class="switch">
      Pas encore de compte ?
      <router-link to="/auth/register">Créer un compte</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { login } from '@/firebase/auth';

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
    error.value = err instanceof Error ? err.message : 'Erreur lors de la connexion';
  } finally {
    loading.value = false;
  }
};
</script>

<style scoped lang="scss">
@import '@/styles/forms';
</style>
