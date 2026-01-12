<template>
  <div class="auth-card">
    <h1 id="register-title">Register</h1>
    <p class="subtitle">Start creating your interactive quizzes</p>

    <form @submit.prevent="onSubmit" novalidate aria-labelledby="register-title">
      <div class="form-group">
        <label for="name-input">Nom</label>
        <input
          id="name-input"
          type="text"
          placeholder="Votre nom complet"
          v-model="name"
          autocomplete="name"
          required
          aria-required="true"
          aria-describedby="name-hint"
        />
        <span id="name-hint" class="hint">Minimum 2 caractères</span>
      </div>

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
          placeholder="Minimum 6 caractères"
          v-model="password"
          autocomplete="new-password"
          required
          aria-required="true"
          aria-describedby="password-hint"
        />
        <span id="password-hint" class="hint">Minimum 6 caractères</span>
      </div>

      <div class="form-group">
        <label for="confirm-password-input">Confirmer le mot de passe</label>
        <input
          id="confirm-password-input"
          type="password"
          placeholder="Confirmer le mot de passe"
          v-model="confirmPassword"
          autocomplete="new-password"
          required
          aria-required="true"
          :aria-invalid="confirmPassword && !passwordsMatch ? 'true' : 'false'"
          :aria-describedby="
            confirmPassword && !passwordsMatch ? 'password-match-error' : undefined
          "
        />
      </div>

      <div
        v-if="confirmPassword && !passwordsMatch"
        id="password-match-error"
        class="error"
        role="alert"
        aria-live="polite"
      >
        Les mots de passe ne correspondent pas
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
        <span v-if="!loading">Créer le compte</span>
        <span v-else>Création…</span>
      </button>
    </form>

    <p class="switch">
      Déjà un compte ?
      <router-link to="/auth/login">Se connecter</router-link>
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { register } from '@/firebase/auth';
import { createUserProfile } from '@/firebase/users';

const router = useRouter();

const name = ref('');
const email = ref('');
const password = ref('');
const confirmPassword = ref('');

const loading = ref(false);
const error = ref<string | null>(null);

const passwordsMatch = computed(() => password.value && password.value === confirmPassword.value);

const canSubmit = computed(
  () => name.value.length >= 2 && email.value && password.value.length >= 6 && passwordsMatch.value
);

const onSubmit = async () => {
  if (!canSubmit.value) return;

  loading.value = true;
  error.value = null;

  try {
    const cred = await register(email.value, password.value);

    await createUserProfile(cred.user.uid, {
      name: name.value,
      email: email.value,
    });

    router.push('/dashboard');
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Erreur lors de la création du compte';
  } finally {
    loading.value = false;
  }
};
</script>
<style scoped lang="scss">
@import '@/styles/forms';
</style>
