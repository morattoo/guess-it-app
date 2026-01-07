<script setup lang="ts">
import { ref } from 'vue';
import { api } from '@/firebase/api';
import { useRouter } from 'vue-router';

const sessionId = ref('');
const router = useRouter();

async function join() {
  await api.joinSession(sessionId.value);
  router.push(`/game/${sessionId.value}`);
}
</script>

<template>
  <div>
    <h1>Join Game</h1>
    <input v-model="sessionId" placeholder="GameSession ID" />
    <button @click="join">Join</button>
  </div>
</template>
