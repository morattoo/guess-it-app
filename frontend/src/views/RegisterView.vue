<template>
  <div class="auth-card">
    <h1>Register</h1>
    <p class="subtitle">Start creating your interactive quizzes</p>

    <input type="text" placeholder="Nom" v-model="name" autocomplete="name" />
    <input type="email" placeholder="Email" v-model="email" autocomplete="email" />

    <input
      type="password"
      placeholder="Mot de passe (6+ caractères)"
      v-model="password"
      autocomplete="new-password"
    />

    <input
      type="password"
      placeholder="Confirmer le mot de passe"
      v-model="confirmPassword"
      autocomplete="new-password"
    />

    <p v-if="confirmPassword && !passwordsMatch" class="error">
      Les mots de passe ne correspondent pas
    </p>

    <p v-if="error" class="error">
      {{ error }}
    </p>

    <button class="primary" :disabled="!canSubmit || loading" @click="onSubmit">
      <span v-if="!loading">Créer le compte</span>
      <span v-else>Création…</span>
    </button>

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
<style scoped>
.auth-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.subtitle {
  font-size: 14px;
  color: #666;
  margin-bottom: 4px;
}

input {
  padding: 12px;
  font-size: 16px;
  border-radius: 6px;
  border: 1px solid #ddd;
}

button.primary {
  margin-top: 8px;
  padding: 12px;
  font-size: 16px;
  border-radius: 6px;
  border: none;
  background: #2f8cff;
  color: white;
  cursor: pointer;
}

button.primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.error {
  font-size: 13px;
  color: #d33;
}

.switch {
  text-align: center;
  font-size: 14px;
}
</style>
