<script setup lang="ts">
import { RouterView } from 'vue-router';
import ErrorOverlay from '@/components/ErrorOverlay.vue';
</script>

<template>
  <ErrorOverlay />
  <RouterView />
</template>
