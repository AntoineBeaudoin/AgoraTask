import { createRouter, createWebHistory } from 'vue-router'
import { storeToRefs } from 'pinia'
import { useAuthStore } from '@/stores/auth.js'
import HomeView from '../views/HomeView.vue'
import LoginView from '@/views/LoginView.vue'
import EmployeView from '@/views/EmployeView.vue'
import CoordoView from '@/views/CoordoView.vue'
import AdminView from '@/views/AdminView.vue'

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
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: "/login",
      name: "login",
      component: LoginView,
      meta: { title: "Se connecter" }
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { title: "Portail administrateur", requireAuth: true, requireAdmin: true }
    },
    {
      path: "/coordo",
      name: "coordo",
      component: CoordoView,
      meta: { title: "Portail coordonnateur", requireAuth: true, requireCoordo: true }
    },
    {
      path: "/employe",
      name: "employe",
      component: EmployeView,
      meta: { title: "Portail employé", requireAuth: true, requireCoordo: true }
    },
  ],

    scrollBehavior(to, from, savedPosition) {
    return new Promise((resolve) => {
      setTimeout(() => {
        if (savedPosition) {
          resolve(savedPosition);
        }
        else {
          resolve({ left: 0, top: 0 })
        }
      }, 500)
    })
  },
});

router.beforeEach((to, from, next) => {
  const isLogged = localStorage.getItem("jwt");
  const authStore = useAuthStore();
  const { errorMessage } = storeToRefs(authStore);
  if (to.meta?.requireAuth && !isLogged) {
    errorMessage.value = "";
    next({ name: 'login', query: { redirect: to.fullPath } });
  }
  else if (to.meta?.requireAdmin && !authStore.isUserAdmin()) {
    router.push("/");
  }
  else {
    next();
  }
});


router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title;
  }
});

export default router
