<template>
  <div class="home">
    <section>
      <div class="intro">
        <h1>GuessIt!</h1>
        <p>Your ultimate guessing game experience.</p>
      </div>
      <div class="auth-links">
        <router-link to="/auth/register">Join Us</router-link>
        <router-link to="/auth/login">Already have an account? Log in</router-link>
      </div>
    </section>
  </div>
</template>
<script setup lang="ts"></script>

<style scoped>
.home {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  min-height: 100vh;
}

.intro {
  margin-bottom: 2rem;

  h1 {
    font-size: 2.5rem;
    margin: 0 0 1rem;
    color: #2f8cff;
  }

  p {
    font-size: 1.125rem;
    color: #666;
    margin: 0;
  }
}

.auth-links {
  display: flex;
  justify-content: center;
  flex-direction: column;
  gap: 1rem;

  a {
    padding: 0.75rem 1.5rem;
    border-radius: 8px;
    text-decoration: none;
    font-weight: 500;
    transition: all 0.2s;

    &:first-child {
      background-color: #2f8cff;
      color: white;

      &:hover {
        background-color: #1a7ae8;
      }
    }

    &:last-child {
      background-color: transparent;
      color: #2f8cff;
      border: 2px solid #2f8cff;

      &:hover {
        background-color: #e3f2ff;
      }
    }

    &:focus {
      outline: 2px solid #2f8cff;
      outline-offset: 2px;
    }
  }
}
</style>
