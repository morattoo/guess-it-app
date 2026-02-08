<script setup lang="ts">
import { RouterView } from 'vue-router';
import ErrorOverlay from '@/components/ErrorOverlay.vue';
import ConfirmDialog from '@/components/ConfirmDialog.vue';
import ToastNotification from '@/components/ToastNotification.vue';
</script>

<template>
  <ErrorOverlay />
  <ConfirmDialog />
  <ToastNotification />
  <RouterView />
</template>
