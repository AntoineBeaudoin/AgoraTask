<template>
  <div :class="`col-md-${colMd}`">
    <div class="card h-100 shadow-sm">
      <div class="card-body d-flex flex-column">
        <h3 class="card-title">Gestion des postes de travail</h3>

        <p class="card-text">
          Créer, modifier et attribuer des postes de travail à des employés.
        </p>

        <RouterLink
          :to="{ name: 'GestionPostes' }"
          class="btn btn-primary mt-auto"
        >
          Gérer les postes de travail
        </RouterLink>
      </div>
    </div>
  </div>
</template>

<script setup>
import { RouterLink } from 'vue-router'

defineProps({
  colMd: {
    type: [Number, String],
    default: 4
  }
})
</script>
