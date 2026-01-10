<template>
  <div class="auth-card">
    <h1>Créer un compte</h1>
    <p class="subtitle">
      Crée ton compte pour commencer à créer des quiz
    </p>

    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Mot de passe" />
    <input type="password" placeholder="Confirmer le mot de passe" />

    <button class="primary">Créer le compte</button>

    <p class="switch">
      Déjà un compte ?
      <router-link to="/auth/login">Se connecter</router-link>
    </p>
  </div>
</template>

<style scoped>
.auth-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.subtitle {
  font-size: 14px;
  color: #666;
}

.primary {
  margin-top: 8px;
}

.switch {
  font-size: 14px;
  text-align: center;
}
</style>
