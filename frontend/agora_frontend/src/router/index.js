import { createRouter, createWebHistory } from 'vue-router'
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
      meta: {
        title: "Se connecter",
        redirectIfAuth: true,
       }
    },
    {
      path: "/admin",
      name: "admin",
      component: AdminView,
      meta: { title: "Portail administrateur", requireAuth: true, role: "administrateur" }
    },
    {
      path: "/coordo",
      name: "coordo",
      component: CoordoView,
      meta: { title: "Portail coordonnateur", requireAuth: true, role: "coordonnateur" }
    },
    {
      path: "/employe",
      name: "employe",
      component: EmployeView,
      meta: { title: "Portail employé", requireAuth: true, role: "personnel_de_terrain"}
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
  const authStore = useAuthStore();
  const logged = authStore.isTokenValid();

  if (to.name === "login" && logged) {
    const role = authStore.getRole();

    const portals = {
      administrateur: "admin",
      coordonnateur: "coordo",
      personnel_de_terrain: "employe"
    };

    return next({ name: portals[role] || "home" });
  }

  if (to.meta.requireAuth && !logged) {
    return next({
      name: "login",
      query: { redirect: to.fullPath }
    });
  }

  if (to.meta.role && authStore.getRole() !== to.meta.role) {
    return next({ name: "home" });
  }

  next();
});


router.afterEach((to) => {
  if (to.meta?.title) {
    document.title = to.meta.title;
  }
});

export default router
