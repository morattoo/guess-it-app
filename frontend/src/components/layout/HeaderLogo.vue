<script setup lang="ts">
import LanguageSelector from './LanguageSelector.vue';
</script>

<template>
  <header class="header-logo">
    <router-link to="/"
      ><img src="@/assets/logo-guessit.png" alt="GuessIt Logo" class="logo"
    /></router-link>
    <div class="language-selector-wrapper">
      <language-selector />
    </div>
  </header>
</template>

<style scoped lang="scss">
.header-logo {
  position: relative;
  .logo {
    width: 150px;
    height: auto;
    display: block;
    margin-left: auto;
    margin-right: auto;
  }

  .language-selector-wrapper {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 1;
  }
}
</style>
