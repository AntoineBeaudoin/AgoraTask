<template>
  <main class="gestion-container">
    <!-- EN-TÊTE -->
    <div class="page-header">
      <div>
        <h1>Gestion des employés</h1>
        <p>Consultez les employés, modifiez leurs rôles et gérez leur archivage.</p>
      </div>

      <div class="employee-count">{{ displayedUsers.length }} employé(s)</div>
    </div>

    <!-- FILTRE ACTIFS / ARCHIVÉS / TOUS -->
    <div class="status-filters">
      <button
        class="status-filter-btn"
        :class="{ active: displayTitle === 'Employés actifs' }"
        @click="LoadUsers"
      >
        Employés actifs
      </button>

      <button
        class="status-filter-btn"
        :class="{ active: displayTitle === 'Employés archivés' }"
        @click="ArchivedUsers"
      >
        Employés archivés
      </button>

      <button
        class="status-filter-btn"
        :class="{ active: displayTitle === 'Tous les employés' }"
        @click="allUsers"
      >
        Tous les employés
      </button>
    </div>

    <!-- CARTE PRINCIPALE -->
    <section class="employees-card">
      <!-- TITRE -->
      <div class="card-header">
        <div>
          <h2>{{ displayTitle }}</h2>

          <span class="result-count"> {{ displayedUsers.length }} résultat(s) </span>
        </div>
      </div>

      <!-- FILTRE PAR RÔLE -->
      <div class="role-filters">
        <span class="role-label"> Filtrer par rôle : </span>

        <button
          class="role-filter-btn"
          :class="{ active: displayedRole === 'all' }"
          @click="filterUsersByRole('all')"
        >
          Tous
        </button>

        <button
          class="role-filter-btn"
          :class="{ active: displayedRole === 'administrateur' }"
          @click="filterUsersByRole('administrateur')"
        >
          Administrateurs
        </button>

        <button
          class="role-filter-btn"
          :class="{ active: displayedRole === 'coordonnateur' }"
          @click="filterUsersByRole('coordonnateur')"
        >
          Coordonnateurs
        </button>

        <button
          class="role-filter-btn"
          :class="{ active: displayedRole === 'personnel_de_terrain' }"
          @click="filterUsersByRole('personnel_de_terrain')"
        >
          Personnel de terrain
        </button>
      </div>

      <!-- AUCUN UTILISATEUR -->
      <div v-if="displayedUsers.length === 0" class="empty-state">
        Aucun employé ne correspond aux filtres sélectionnés.
      </div>

      <!-- TABLEAU -->
      <div v-else class="table-wrapper">
        <table class="employees-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Courriel</th>
              <th>Rôle</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in displayedUsers" :key="user.id">
              <!-- NOM -->
              <td class="user-name">
                {{ user.nom }}
              </td>

              <!-- PRÉNOM -->
              <td>
                {{ user.prenom }}
              </td>

              <!-- COURRIEL -->
              <td class="user-email">
                {{ user.courriel }}
              </td>

              <!-- MODIFICATION DU RÔLE -->
              <td>
                <div class="role-editor">
                  <select
                    v-model="pendingRoles[user.id]"
                    class="role-select"
                    :disabled="user.IsArchived"
                  >
                    <option v-if="user.role === 'Role_En_Attente'" value="Role_En_Attente" disabled>
                      En attente
                    </option>

                    <option value="administrateur">Administrateur</option>

                    <option value="coordonnateur">Coordonnateur</option>

                    <option value="personnel_de_terrain">Personnel de terrain</option>
                  </select>

                  <button
                    class="confirm-role-btn"
                    :disabled="user.IsArchived || pendingRoles[user.id] === user.role"
                    @click="editUser(user.id, pendingRoles[user.id])"
                  >
                    Confirmer
                  </button>
                </div>
              </td>

              <!-- STATUT -->
              <td>
                <span v-if="!user.IsArchived" class="status-badge active-status"> Actif </span>

                <span v-else class="status-badge archived-status"> Archivé </span>
              </td>

              <!-- ARCHIVAGE -->
              <td>
                <button
                  v-if="!user.IsArchived"
                  class="action-btn archive-btn"
                  @click="archiveUser(user.id, true)"
                >
                  Archiver
                </button>

                <button v-else class="action-btn restore-btn" @click="archiveUser(user.id, false)">
                  Réactiver
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>
<script setup>
import { ref } from 'vue'
import { onMounted } from 'vue'
import { apiFetch } from '../utils/api.js'
let displayTitle = ref('Employés actifs')
let displayedRole = ref('personnel_de_terrain')
let pendingRoles = ref({})
const displayedUsers = ref([])
const loadedUsers = ref([])
onMounted(() => {
  LoadUsers()
})
async function LoadUsers() {
  displayTitle.value = 'Employés actifs'
  apiFetch('/users?archived=false', { method: 'GET' })
    .then((data) => {
      loadedUsers.value = data.data.users
      ApplyRoleFilter()
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des utilisateurs :', error)
    })
}
async function ArchivedUsers() {
  displayTitle.value = 'Employés archivés'
  apiFetch('/users?archived=true', { method: 'GET' })
    .then((data) => {
      loadedUsers.value = data.data.users
      ApplyRoleFilter()
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des utilisateurs :', error)
    })
}
async function allUsers() {
  displayTitle.value = 'Tous les employés'
  apiFetch('/users', { method: 'GET' })
    .then((data) => {
      loadedUsers.value = data.data.users
      ApplyRoleFilter()
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des utilisateurs :', error)
    })
}
async function editUser(userId, newRule) {
  apiFetch('/users/Edit_Rule/', {
    method: 'PATCH',
    body: JSON.stringify({
      userId: userId,
      newRole: newRule,
    }),
  })
    .then((data) => {
      console.log("Règle de l'utilisateur modifiée avec succès :", data)
      LoadUsers() // Recharger la liste des utilisateurs après la modification
    })
    .catch((error) => {
      console.error("Erreur lors de la modification de la règle de l'utilisateur :", error)
    })
}
async function archiveUser(userId, IsArchived) {
  apiFetch('/users/Archive_User', {
    method: 'PATCH',
    body: JSON.stringify({
      userId: userId,
      IsArchived: IsArchived,
    }),
  })
    .then((data) => {
      console.log('Utilisateur archivé avec succès :', data)
      LoadUsers() // Recharger la liste des utilisateurs après l'archivage
    })
    .catch((error) => {
      console.error("Erreur lors de l'archivage de l'utilisateur :", error)
    })
}
function ApplyRoleFilter() {
  if (displayedRole.value === 'all') {
    displayedUsers.value = loadedUsers.value
  } else {
    displayedUsers.value = loadedUsers.value.filter((user) => user.role === displayedRole.value)
  }

  loadedUsers.value.forEach((user) => {
    if (pendingRoles.value[user.id] === undefined) {
      pendingRoles.value[user.id] = user.role
    }
  })
}
function filterUsersByRole(role) {
  displayedRole.value = role
  ApplyRoleFilter()
}
</script>
<style scoped>
/* =========================
   PAGE
========================= */

.gestion-container {
  max-width: 1200px;

  margin: 0 auto;

  padding: 55px 30px;
}

/* =========================
   EN-TÊTE
========================= */

.page-header {
  display: flex;

  justify-content: space-between;
  align-items: center;

  gap: 20px;

  margin-bottom: 28px;
}

.page-header h1 {
  margin: 0 0 7px 0;

  font-size: 32px;
  font-weight: 700;

  color: #212529;
}

.page-header p {
  margin: 0;

  color: #6c757d;

  font-size: 15px;
}

.employee-count {
  padding: 9px 16px;

  background-color: #f1f3f5;

  border-radius: 999px;

  color: #495057;

  font-size: 14px;
  font-weight: 600;
}

/* =========================
   FILTRES DE STATUT
========================= */

.status-filters {
  display: flex;

  flex-wrap: wrap;

  gap: 10px;

  margin-bottom: 25px;
}

.status-filter-btn {
  padding: 10px 18px;

  border: 1px solid #ced4da;
  border-radius: 8px;

  background-color: white;

  color: #343a40;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.status-filter-btn:hover {
  background-color: #f1f3f5;
}

.status-filter-btn.active {
  background-color: #198754;

  border-color: #198754;

  color: white;
}

.status-filter-btn.active:hover {
  background-color: #157347;
}

/* =========================
   CARTE
========================= */

.employees-card {
  overflow: hidden;

  background-color: white;

  border: 1px solid #e2e6ea;
  border-radius: 12px;

  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.06);
}

.card-header {
  padding: 22px 25px 13px;
}

.card-header h2 {
  margin: 0 0 5px;

  font-size: 21px;
  font-weight: 700;

  color: #212529;
}

.result-count {
  color: #868e96;

  font-size: 13px;
}

/* =========================
   FILTRE PAR RÔLE
========================= */

.role-filters {
  display: flex;

  align-items: center;

  flex-wrap: wrap;

  gap: 8px;

  padding: 14px 25px 18px;

  border-bottom: 1px solid #e9ecef;

  background-color: #fafafa;
}

.role-label {
  margin-right: 5px;

  color: #6c757d;

  font-size: 13px;
  font-weight: 600;
}

.role-filter-btn {
  padding: 7px 13px;

  border: 1px solid #ced4da;
  border-radius: 999px;

  background-color: white;

  color: #495057;

  font-size: 13px;
  font-weight: 500;

  cursor: pointer;

  transition: 0.2s;
}

.role-filter-btn:hover {
  background-color: #e9ecef;
}

.role-filter-btn.active {
  background-color: #198754;

  border-color: #198754;

  color: white;
}

/* =========================
   TABLEAU
========================= */

.table-wrapper {
  width: 100%;

  overflow-x: auto;
}

.employees-table {
  width: 100%;

  border-collapse: collapse;
}

.employees-table thead {
  background-color: #f8f9fa;
}

.employees-table th {
  padding: 14px 20px;

  border-bottom: 1px solid #dee2e6;

  color: #6c757d;

  font-size: 12px;
  font-weight: 700;

  text-align: left;

  text-transform: uppercase;

  letter-spacing: 0.04em;
}

.employees-table td {
  padding: 16px 20px;

  border-bottom: 1px solid #eeeeee;

  color: #343a40;

  font-size: 14px;

  vertical-align: middle;
}

.employees-table tbody tr {
  transition: background-color 0.15s;
}

.employees-table tbody tr:hover {
  background-color: #fafafa;
}

.employees-table tbody tr:last-child td {
  border-bottom: none;
}

.user-name {
  font-weight: 700;
}

.user-email {
  color: #6c757d;
}

/* =========================
   MODIFICATION DU RÔLE
========================= */

.role-editor {
  display: flex;

  align-items: center;

  gap: 8px;
}

.role-select {
  min-width: 175px;

  padding: 8px 10px;

  border: 1px solid #ced4da;
  border-radius: 6px;

  background-color: white;

  color: #343a40;

  font-size: 14px;

  cursor: pointer;
}

.role-select:focus {
  outline: none;

  border-color: #198754;

  box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.12);
}

.role-select:disabled {
  background-color: #f1f3f5;

  color: #868e96;

  cursor: not-allowed;
}

/* BOUTON CONFIRMER */

.confirm-role-btn {
  padding: 8px 11px;

  border: 1px solid #198754;
  border-radius: 6px;

  background-color: #198754;

  color: white;

  font-size: 12px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.confirm-role-btn:hover:not(:disabled) {
  background-color: #157347;

  border-color: #157347;
}

.confirm-role-btn:disabled {
  background-color: #e9ecef;

  border-color: #dee2e6;

  color: #adb5bd;

  cursor: not-allowed;
}

/* =========================
   STATUT
========================= */

.status-badge {
  display: inline-block;

  padding: 6px 11px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 600;
}

.active-status {
  background-color: #d1e7dd;

  color: #0f5132;
}

.archived-status {
  background-color: #e9ecef;

  color: #6c757d;
}

/* =========================
   ARCHIVAGE
========================= */

.action-btn {
  padding: 7px 13px;

  border-radius: 6px;

  background-color: white;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition: 0.2s;
}

.archive-btn {
  border: 1px solid #dc3545;

  color: #dc3545;
}

.archive-btn:hover {
  background-color: #dc3545;

  color: white;
}

.restore-btn {
  border: 1px solid #198754;

  color: #198754;
}

.restore-btn:hover {
  background-color: #198754;

  color: white;
}

/* =========================
   AUCUN RÉSULTAT
========================= */

.empty-state {
  padding: 55px 20px;

  text-align: center;

  color: #868e96;

  font-size: 15px;
}

/* =========================
   RESPONSIVE
========================= */

@media (max-width: 900px) {
  .gestion-container {
    padding: 35px 15px;
  }

  .page-header {
    flex-direction: column;

    align-items: flex-start;
  }

  .status-filters {
    width: 100%;
  }

  .role-editor {
    min-width: 290px;
  }

  .employees-table {
    min-width: 1050px;
  }
}
</style>
