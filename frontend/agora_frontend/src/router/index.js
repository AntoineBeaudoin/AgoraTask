import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth.js'
import { useErrorStore } from '@/stores/Error.js'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import EmployeView from '@/views/EmployeView.vue'
import CoordoView from '@/views/CoordoView.vue'
import AdminView from '@/views/AdminView.vue'
import GestionEmployesView from '@/views/GestionEmployesView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/about',
      name: 'about',
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: {
        title: 'Se connecter',
        redirectIfAuth: true,
      },
    },
    {
      path: '/admin',
      name: 'admin',
      component: AdminView,
      meta: { title: 'Portail administrateur', requireAuth: true, role: 'administrateur' },
    },
    {
      path: '/coordo',
      name: 'coordo',
      component: CoordoView,
      meta: { title: 'Portail coordonnateur', requireAuth: true, role: 'coordonnateur' },
    },
    {
      path: '/employe',
      name: 'employe',
      component: EmployeView,
      meta: { title: 'Portail employé', requireAuth: true, role: 'personnel_de_terrain' },
    },
    {
      path: '/GestionEmployes',
      name: 'GestionEmployes',
      component: GestionEmployesView,
      meta: { title: 'Gestion des employés', requireAuth: true, role: 'administrateur' },
    },
    {
      path: '/error',
      name: 'error',
      component: () => import('../views/GlobalErrorView.vue'),
    },
    //404
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../views/GlobalErrorView.vue'),
      meta: { title: 'Page introuvable' },
    },
  ],

  scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition)
        } else {
          resolve({ left: 0, top: 0 })
        }
      }, 500)
    })
  },
})

router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  const logged = authStore.isTokenValid()

  if (to.name === 'login' && logged) {
    const role = authStore.getRole()

    const portals = {
      administrateur: 'admin',
      coordonnateur: 'coordo',
      personnel_de_terrain: 'employe',
    }

    return next({ name: portals[role] || 'employe' })
  }

  if (to.meta.requireAuth && !logged) {
    return next({
      name: 'login',
      query: { redirect: to.fullPath },
    })
  }

  if (to.meta.role && authStore.getRole() !== to.meta.role) {
    return next({ name: 'home' })
  }
  if (to.name === 'not-found') {
    const errorStore = useErrorStore()
    errorStore.setError(404, "cette page n'existe pas ou a été supprimée.")
  }

  next()
})

router.afterEach((to, from) => {
  const errorStore = useErrorStore()
  if (to.meta?.title) {
    document.title = to.meta.title
  }
  if (from.name === 'error' && to.name !== 'error') {
    errorStore.clearError()
  }
})

export default router
