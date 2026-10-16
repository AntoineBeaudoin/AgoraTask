<template>
  <main class="container py-5">
    <h1 class="mb-4 text-center">Portail du coordonnnateur</h1>

    <div class="row g-4 mx-auto">

      <div class="col-md-4 mx-auto d-block">
        <div class="card h-100 shadow-sm">
          <div class="card-body d-flex flex-column">
            <h3 class="card-title">Gestion des postes de travail</h3>

            <p class="card-text">Créer, modifier et attribuer des postes de travail à des employés.</p>

            <RouterLink :to="{ name: 'GestionPostes' }" class="btn btn-primary mt-auto">
              Gérer les postes de travail
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
