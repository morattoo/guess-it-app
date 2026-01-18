<script setup lang="ts">
import HeaderLogo from './HeaderLogo.vue';
</script>

<template>
  <div class="auth-layout">
    <header-logo />
    <section class="auth-layout__container">
      <router-view />
    </section>
  </div>
</template>

<style scoped lang="scss">
.auth-layout {
  display: flex;
  flex-direction: column;
  background-image: url('@/assets/bg-2.png');
  background-position: center bottom;
  background-repeat: no-repeat;
  height: 100%;
  width: 100%;

  &__container {
    flex: 1;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
  }
}
</style>
