import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import DashboardLayout from '@/components/layout/DashboardLayout.vue';

const routes = [
  { path: '/', component: HomeView },
  { path: '/join', component: () => import('@/components/JoinGame.vue') },
  { path: '/game/:sessionId', component: () => import('@/components/GameSession.vue') },
  {
    path: '/auth',
    component: AuthLayout,
    children: [
      {
        path: 'login',
        component: () => import('@/views/LoginView.vue'),
      },
      {
        path: 'register',
        component: () => import('@/views/RegisterView.vue'),
      },
    ],
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    children: [
      {
        path: '',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'questions-pool',
        component: () => import('@/views/QuestionsPoolView.vue'),
      },
    ],
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});
