import { createRouter, createWebHistory } from 'vue-router';
import JoinGame from '@/components/JoinGame.vue';
import GameSession from '@/components/GameSession.vue';

const routes = [
  { path: '/', component: JoinGame },
  { path: '/game/:sessionId', component: GameSession },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
