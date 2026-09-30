<template>
  <main class="container py-5">
    <h1 class="mb-4">Portail administrateur</h1>

    <div class="row g-4">
      <div class="col-md-6">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h3 class="card-title">Gestion des tâches</h3>

            <p class="card-text">Créer, modifier et attribuer les tâches.</p>

            <a href="#" class="btn btn-primary mt-auto"> Gérer les tâches </a>
          </div>
        </div>
      </div>

      <div class="col-md-6">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h3 class="card-title">Gestion des employés</h3>

            <p class="card-text">Consulter et gérer les comptes des employés.</p>

            <RouterLink :to="{ name: 'GestionEmployes' }" class="btn btn-primary mt-auto">
              Gérer les employés
            </RouterLink>
          </div>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup>
import { RouterLink } from 'vue-router'
</script>
