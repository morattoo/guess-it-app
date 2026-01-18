<script setup lang="ts">
import HeaderLogo from '@/components/layout/HeaderLogo.vue';
</script>

<template>
  <div class="home">
    <HeaderLogo />
    <section class="home__container">
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

<style scoped lang="scss">
@import '@/styles/variables';

.home {
  display: flex;
  flex-direction: column;
  background-image: url('@/assets/bg-1.png');
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

  .intro {
    margin-bottom: $spacing-lg;

    h1 {
      font-size: $font-size-xl;
      margin: 0 0 $spacing-sm;
      color: $title-color;
      text-align: center;
    }

    p {
      font-size: $font-size-md;
      color: $text-secondary;
      margin: 0;
    }
  }

  .auth-links {
    display: flex;
    justify-content: center;
    flex-direction: column;
    gap: $spacing-sm;

    a {
      padding: $button-padding;
      border-radius: $border-radius;
      text-decoration: none;
      font-weight: 500;
      transition: all $transition-fast;
      text-align: center;

      &:first-child {
        background-color: $action-blue;
        color: white;

        &:hover {
          background-color: $action-blue-hover;
        }
      }

      &:last-child {
        background-color: transparent;
        color: $action-blue;
        border: $border-width solid $action-blue;

        &:hover {
          background-color: $action-blue-light;
        }
      }

      &:focus {
        outline: $border-width solid $action-blue;
        outline-offset: $border-width;
      }
    }
  }
}
</style>
