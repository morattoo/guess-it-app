<script setup lang="ts">
import HeaderLogo from '@/components/layout/HeaderLogo.vue';
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
</script>

<template>
  <div class="home">
    <HeaderLogo />

    <section class="home__container">
      <div class="intro">
        <img src="@/assets/logo.png" alt="Think battle" class="logo" />
        <p>{{ t.home.subtitle }}</p>
      </div>
      <div class="auth-links">
        <router-link to="/auth/register">{{ t.home.joinUs }}</router-link>
        <router-link to="/auth/login">{{ t.home.alreadyAccount }}</router-link>
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
  position: relative;

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

    img {
      margin: 0 auto;
    }

    p {
      font-size: $font-size-md;
      color: $text-secondary;
      margin: 0;
      text-align: center;
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
