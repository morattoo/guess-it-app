import { createRouter, createWebHistory } from 'vue-router';
import HomeView from '@/views/HomeView.vue';
import AuthLayout from '@/components/layout/AuthLayout.vue';
import DashboardLayout from '@/components/layout/DashboardLayout.vue';
import PageNotFound from '@/components/layout/PageNotFound.vue';
import UnavailableSection from '@/components/layout/UnavailableSection.vue';
import { getCurrentUser } from '@/firebase/auth';

const routes = [
  { path: '/', component: HomeView },
  { path: '/game/:sessionId', component: () => import('@/components/JoinGameView.vue') },
  { path: '/game/:sessionId/play', component: () => import('@/components/PlayGameView.vue') },
  { path: '/game/:sessionId/ranking', component: () => import('@/components/RankingGameView.vue') },
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
        component: UnavailableSection,
        props: {
          title: 'Registro temporalmente deshabilitado',
          message:
            'El registro de nuevos usuarios está temporalmente deshabilitado. Por favor, inténtalo más tarde o contacta al administrador.',
          showBackButton: true,
          backButtonText: 'Volver al inicio de sesión',
        },
      },
      // Descomentarizar esta línea cuando quieras reactivar el registro:
      // { path: 'register', component: () => import('@/views/RegisterView.vue') },
    ],
  },
  {
    path: '/dashboard',
    component: DashboardLayout,
    meta: { requiresAuth: true },
    children: [
      {
        path: '',
        component: () => import('@/views/DashboardView.vue'),
      },
      {
        path: 'questions-pool',
        component: () => import('@/views/QuestionsPoolView.vue'),
      },
      {
        path: 'question',
        component: () => import('@/views/QuestionView.vue'),
      },
      {
        path: 'question/:id',
        component: () => import('@/views/EditQuestionView.vue'),
      },
      {
        path: 'questionnaires',
        component: () => import('@/views/QuestionnairesView.vue'),
      },
      {
        path: 'questionnaire/:id',
        component: () => import('@/views/QuestionnaireFormView.vue'),
      },
      {
        path: 'game-sessions',
        component: () => import('@/views/GameSessionsView.vue'),
      },
      {
        path: 'game-session/:id',
        component: () => import('@/views/GameSessionFormView.vue'),
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: PageNotFound,
  },
];

export const router = createRouter({
  history: createWebHistory(),
  routes,
});

// Navigation guard para proteger rutas que requieren autenticación
router.beforeEach(async (to, _from, next) => {
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth);

  if (requiresAuth) {
    const user = await getCurrentUser();
    if (user) {
      next();
    } else {
      next({ path: '/auth/login', query: { redirect: to.fullPath } });
    }
  } else {
    next();
  }
});
