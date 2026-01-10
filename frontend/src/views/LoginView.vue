<template>
  <div class="login-card">
    <h1>Login</h1>

    <input type="email" placeholder="Email" />
    <input type="password" placeholder="Password" />

    <button>Login</button>
  </div>
</template>

<style scoped>
.login-card {
  width: 100%;
  max-width: 360px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
</style>
