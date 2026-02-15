<script setup lang="ts">
import LanguageSelector from './LanguageSelector.vue';
</script>

<template>
  <header class="header-logo">
    <router-link to="/"
      ><img src="@/assets/logo-guessit.png" alt="GuessIt Logo" class="logo"
    /></router-link>
    <language-selector />
  </header>
</template>

<style scoped lang="scss">
.header-logo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  position: relative;

  .logo {
    width: 150px;
    height: auto;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }
}
</style>
