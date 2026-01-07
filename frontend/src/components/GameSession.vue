<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/firebase/api';

const answer = ref('');
const isError = ref(false);

async function submit() {
  try {
    await api.submitAnswer('SESSION_ID', answer.value);
    answer.value = '';
    isError.value = false;
  } catch {
    isError.value = true;
  }
}
</script>

<template>
  <div>
    <h2>Question</h2>

    <input v-model="answer" />
    <button @click="submit">Send</button>

    <p v-if="isError">❌ Incorrect answer</p>
  </div>
</template>
