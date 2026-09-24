<template>
  <nav class="navbar navbar-expand navbar-dark bg-dark mb-4">
    <RouterLink to="/" class="navbar-brand ms-3">AgoraTask</RouterLink>
    <ul class="navbar-nav ms-auto">
      <li class="nav-item me-3" v-if="!isAuthenticated">
        <RouterLink to="/login" class="nav-link">Se connecter</RouterLink>
      </li>
      <li class="nav-item me-3" v-else>
        <a href="#" @click="logout" class="nav-link">Déconnexion</a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';
import { watch, onMounted, onBeforeUnmount, ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';

const store = useAuthStore();

const fullName = ref('');

const { token, isAuthenticated } = storeToRefs(store);

const { isUserAdmin } = store;

const route = useRoute();
const router = useRouter();

watch(route, async () => {
  token.value = store.getToken();
})

onMounted(async () => {
  window.addEventListener("storage", handleStorage);
});

onBeforeUnmount(() => {
  window.removeEventListener('storage', handleStorage);
});


function handleStorage(e) {
  if (e.key == 'jwt') {
    token.value = store.getToken();
  }
}

const logout = () => {
  store.disconnect();
  router.go(0);
}
</script>

<style scoped>
a.router-link-active,
a.router-link-exact-active {
  color: #f8c102 !important;
}

.dropdown-item {
  background-color: black;
  color: gray;
}

.dropdown-menu {
  background-color: black;
}
</style>
