<template>
  <div>
    <h2>{{ t.dashboard.title }}</h2>
    <p>{{ t.dashboard.welcome }}</p>
  </div>
</template>
<script setup lang="ts">
import { useI18n } from '@/composables/useI18n';

const { t } = useI18n();
</script>
<style scoped lang="scss"></style>
