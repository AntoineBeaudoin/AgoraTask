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

    <!-- FILTRES -->
    <div class="filters">
      <button
        class="filter-btn"
        :class="{ 'active-filter': displayTitle === 'Employés actifs' }"
        @click="LoadUsers"
      >
        Employés actifs
      </button>

      <button
        class="filter-btn"
        :class="{ 'active-filter': displayTitle === 'Employés archivés' }"
        @click="ArchivedUsers"
      >
        Employés archivés
      </button>

      <button
        class="filter-btn"
        :class="{ 'active-filter': displayTitle === 'Tous les employés' }"
        @click="allUsers"
      >
        Tous les employés
      </button>
    </div>

    <!-- CONTENU PRINCIPAL -->
    <section class="employees-card">
      <div class="card-header">
        <div>
          <h2>{{ displayTitle }}</h2>
          <span class="result-count"> {{ displayedUsers.length }} résultat(s) </span>
        </div>
      </div>

      <!-- Aucun utilisateur -->
      <div v-if="displayedUsers.length === 0" class="empty-state">Aucun employé à afficher.</div>

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
              <td class="email">
                {{ user.courriel }}
              </td>

              <!-- RÔLE -->
              <td>
                <select
                  class="role-select"
                  :value="user.role"
                  :disabled="user.IsArchived"
                  @change="editUser(user.id, $event.target.value)"
                >
                  <option v-if="user.role === 'Role_En_Attente'" value="Role_En_Attente" disabled>
                    En attente
                  </option>

                  <option value="administrateur">Administrateur</option>

                  <option value="coordonnateur">Coordonnateur</option>

                  <option value="personnel_de_terrain">Personnel de terrain</option>
                </select>
              </td>

              <!-- STATUT -->
              <td>
                <span v-if="!user.IsArchived" class="status active-status"> Actif </span>

                <span v-else class="status archived-status"> Archivé </span>
              </td>

              <!-- ACTION -->
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
const displayedUsers = ref([])
onMounted(() => {
  LoadUsers()
})
function LoadUsers() {
  displayTitle.value = 'Employés actifs'
  apiFetch('/users?archived=false', { method: 'GET' })
    .then((data) => {
      displayedUsers.value = data.data.users
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des utilisateurs :', error)
    })
}
function ArchivedUsers() {
  displayTitle.value = 'Employés archivés'
  apiFetch('/users?archived=true', { method: 'GET' })
    .then((data) => {
      displayedUsers.value = data.data.users
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des utilisateurs :', error)
    })
}
function allUsers() {
  displayTitle.value = 'Tous les employés'
  apiFetch('/users', { method: 'GET' })
    .then((data) => {
      displayedUsers.value = data.data.users
    })
    .catch((error) => {
      console.error('Erreur lors du chargement des utilisateurs :', error)
    })
}
function editUser(userId, newRule) {
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
function archiveUser(userId, IsArchived) {
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
</script>
<style scoped>
/* ============================= */
/* PAGE */
/* ============================= */

.gestion-container {
  max-width: 1250px;
  margin: 0 auto;
  padding: 45px 30px;
  font-family: Arial, sans-serif;
}

/* ============================= */
/* HEADER */
/* ============================= */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  margin-bottom: 30px;
}

.page-header h1 {
  margin: 0 0 8px 0;

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

  border-radius: 20px;

  background-color: #f1f3f5;

  color: #495057;

  font-size: 14px;
  font-weight: 600;
}

/* ============================= */
/* FILTRES */
/* ============================= */

.filters {
  display: flex;

  gap: 12px;

  margin-bottom: 25px;

  flex-wrap: wrap;
}

.filter-btn {
  border: 1px solid #d9dee3;

  background-color: white;

  color: #495057;

  padding: 10px 19px;

  border-radius: 8px;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s,
    transform 0.1s;
}

.filter-btn:hover {
  background-color: #f3f5f7;
}

.filter-btn:active {
  transform: scale(0.97);
}

/* Bouton du filtre actuellement sélectionné */

.filter-btn.active-filter {
  background-color: #198754;

  color: white;

  border-color: #198754;
}

.filter-btn.active-filter:hover {
  background-color: #157347;

  border-color: #157347;
}

/* ============================= */
/* CARTE */
/* ============================= */

.employees-card {
  background-color: white;

  border: 1px solid #e3e6e9;

  border-radius: 12px;

  overflow: hidden;

  box-shadow: 0 3px 15px rgba(0, 0, 0, 0.06);
}

.card-header {
  padding: 22px 25px;

  border-bottom: 1px solid #e9ecef;
}

.card-header h2 {
  margin: 0 0 5px 0;

  font-size: 21px;
  font-weight: 650;

  color: #212529;
}

.result-count {
  font-size: 13px;

  color: #868e96;
}

/* ============================= */
/* TABLEAU */
/* ============================= */

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

  text-align: left;

  font-size: 12px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.04em;

  color: #6c757d;

  border-bottom: 1px solid #dee2e6;
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
  font-weight: 600;
}

.email {
  color: #6c757d;
}

/* ============================= */
/* SELECT RÔLE */
/* ============================= */

.role-select {
  min-width: 180px;

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

/* ============================= */
/* STATUT */
/* ============================= */

.status {
  display: inline-block;

  padding: 6px 11px;

  border-radius: 20px;

  font-size: 12px;
  font-weight: 650;
}

.active-status {
  background-color: #d1e7dd;

  color: #0f5132;
}

.archived-status {
  background-color: #e9ecef;

  color: #6c757d;
}

/* ============================= */
/* ACTIONS */
/* ============================= */

.action-btn {
  padding: 7px 13px;

  border-radius: 6px;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  background-color: white;

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

/* ============================= */
/* LISTE VIDE */
/* ============================= */

.empty-state {
  padding: 60px 20px;

  text-align: center;

  color: #868e96;

  font-size: 15px;
}

/* ============================= */
/* RESPONSIVE */
/* ============================= */

@media (max-width: 800px) {
  .gestion-container {
    padding: 30px 15px;
  }

  .page-header {
    flex-direction: column;

    align-items: flex-start;

    gap: 15px;
  }

  .filters {
    width: 100%;
  }

  .filter-btn {
    flex: 1;

    min-width: 150px;
  }

  .employees-table {
    min-width: 900px;
  }
}
</style>
