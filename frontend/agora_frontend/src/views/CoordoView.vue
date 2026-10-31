<template>
  <main class="container py-5">
    <h1 class="mb-4">Portail du coordonnnateur</h1>

    <div class="row g-4 mx-auto">
      <PortalPosteOption :col-md="6"/>
      <div class="col-md-6">
      <div class="card h-100 shadow-sm">
        <div class="card-body d-flex flex-column">
          <h3 class="card-title">Historique des tâches</h3>

          <p class="card-text">Consulter l'historique des tâches effectuées.</p>

          <RouterLink :to="{ name: 'history' }" class="btn btn-primary mt-auto">
            Voir l'historique
          </RouterLink>
        </div>
      </div>
    </div>
    </div>
  </main>
</template>

<script setup>
import PortalPosteOption from '@/components/postes/PortalPosteOption.vue';
</script>
