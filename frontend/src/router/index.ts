import { createRouter, createWebHistory } from 'vue-router';
import JoinGame from '@/components/JoinGame.vue';
import GameSession from '@/components/GameSession.vue';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import LoginView from '@/views/LoginView.vue';
import RegisterView from '@/views/RegisterView.vue';
import HomeView from '@/views/HomeView.vue';


const routes = [
  { path: '/', component: HomeView },
  { path: '/join', component: JoinGame },
  { path: '/game/:sessionId', component: GameSession },
  {
    path: "/auth",
    component: AuthLayout,
    children: [
      {
        path: "login",
        component: LoginView,
      },
      {
        path: "register",
        component: RegisterView,
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
