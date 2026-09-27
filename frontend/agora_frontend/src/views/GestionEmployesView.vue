<template>
  <main class="gestion-container">
    <!-- TITRE GLOBAL DE LA PAGE -->
    <header class="page-header">
      <div class="page-heading">
        <h1>Gestion des utilisateurs</h1>

        <p>Gérez les comptes, les rôles et l'accès des employés.</p>
      </div>

      <button class="create-user-btn" @click="toggleCreateForm">
        {{ showCreateForm ? 'Fermer' : '+ Créer un compte' }}
      </button>
    </header>

    <!-- FORMULAIRE DE CRÉATION -->
    <div v-if="showCreateForm" class="create-user-card">
      <div class="create-form-header">
        <h2>Créer un compte</h2>

        <p>Ajoutez un nouvel utilisateur et attribuez-lui un rôle.</p>
      </div>

      <form class="create-user-form" @submit.prevent="createAccount">
        <div class="form-grid">
          <!-- PRÉNOM -->
          <div class="form-field">
            <label for="prenom"> Prénom </label>

            <input
              id="prenom"
              v-model.trim="newUser.prenom"
              type="text"
              placeholder="Prénom"
              :class="{ 'input-error': createErrors.prenom }"
            />

            <span v-if="createErrors.prenom" class="field-error">
              {{ createErrors.prenom }}
            </span>
          </div>

          <!-- NOM -->
          <div class="form-field">
            <label for="nom"> Nom </label>

            <input
              id="nom"
              v-model.trim="newUser.nom"
              type="text"
              placeholder="Nom"
              :class="{ 'input-error': createErrors.nom }"
            />

            <span v-if="createErrors.nom" class="field-error">
              {{ createErrors.nom }}
            </span>
          </div>

          <!-- COURRIEL -->
          <div class="form-field">
            <label for="courriel"> Courriel </label>

            <input
              id="courriel"
              v-model.trim="newUser.courriel"
              type="email"
              placeholder="utilisateur@exemple.com"
              :class="{ 'input-error': createErrors.courriel }"
            />

            <span v-if="createErrors.courriel" class="field-error">
              {{ createErrors.courriel }}
            </span>
          </div>

          <!-- RÔLE -->
          <div class="form-field">
            <label for="role"> Rôle </label>

            <select id="role" v-model="newUser.role" :class="{ 'input-error': createErrors.role }">
              <option value="personnel_de_terrain">Personnel de terrain</option>

              <option value="coordonnateur">Coordonnateur</option>

              <option value="administrateur">Administrateur</option>
            </select>

            <span v-if="createErrors.role" class="field-error">
              {{ createErrors.role }}
            </span>
          </div>

          <!-- MOT DE PASSE -->
          <div class="form-field full-width">
            <label for="mdp"> Mot de passe </label>

            <input
              id="mdp"
              v-model="newUser.mdp"
              type="password"
              placeholder="Mot de passe initial"
              :class="{ 'input-error': createErrors.mdp }"
            />

            <span v-if="createErrors.mdp" class="field-error">
              {{ createErrors.mdp }}
            </span>

            <span v-else class="password-help">
              Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.
            </span>
          </div>
        </div>

        <!-- ERREUR SERVEUR / GÉNÉRALE -->
        <div v-if="createErrors.general" class="general-error">
          {{ createErrors.general }}
        </div>

        <!-- ACTIONS -->
        <div class="create-actions">
          <button type="button" class="cancel-create-btn" @click="toggleCreateForm">Annuler</button>

          <button type="submit" class="submit-create-btn">Créer le compte</button>
        </div>
      </form>
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

    <!-- LISTE DES EMPLOYÉS -->
    <section class="employees-card">
      <div class="card-header">
        <div>
          <h2>{{ displayTitle }}</h2>

          <p class="card-subtitle">
            Gérez les utilisateurs correspondant aux filtres sélectionnés.
          </p>
        </div>

        <div class="employee-count">{{ displayedUsers.length }} résultat(s)</div>
      </div>

      <!-- tes filtres par rôle ici -->
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
import { onMounted, reactive } from 'vue'
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
// ===============================
// CRÉATION D'UN COMPTE
// ===============================

const showCreateForm = ref(false)

const newUser = ref({
  nom: '',
  prenom: '',
  courriel: '',
  mdp: '',
  role: 'personnel_de_terrain',
})

const createErrors = reactive({
  nom: '',
  prenom: '',
  courriel: '',
  mdp: '',
  role: '',
  general: '',
})

function resetCreateErrors() {
  createErrors.nom = ''
  createErrors.prenom = ''
  createErrors.courriel = ''
  createErrors.mdp = ''
  createErrors.role = ''
  createErrors.general = ''
}

function resetCreateForm() {
  newUser.value = {
    nom: '',
    prenom: '',
    courriel: '',
    mdp: '',
    role: 'personnel_de_terrain',
  }

  resetCreateErrors()
}

function toggleCreateForm() {
  showCreateForm.value = !showCreateForm.value

  if (!showCreateForm.value) {
    resetCreateForm()
  }
}

function validateCreateForm() {
  resetCreateErrors()

  let isValid = true

  // NOM
  if (!newUser.value.nom.trim()) {
    createErrors.nom = 'Le nom est requis.'
    isValid = false
  }

  // PRÉNOM
  if (!newUser.value.prenom.trim()) {
    createErrors.prenom = 'Le prénom est requis.'
    isValid = false
  }

  // COURRIEL
  if (!newUser.value.courriel.trim()) {
    createErrors.courriel = 'Le courriel est requis.'
    isValid = false
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

    if (!emailRegex.test(newUser.value.courriel)) {
      createErrors.courriel = 'Veuillez entrer une adresse courriel valide.'

      isValid = false
    }
  }

  // MOT DE PASSE
  if (!newUser.value.mdp) {
    createErrors.mdp = 'Le mot de passe est requis.'
    isValid = false
  } else {
    const mdpRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/

    if (!mdpRegex.test(newUser.value.mdp)) {
      createErrors.mdp =
        'Minimum 8 caractères, avec une majuscule, une minuscule, un chiffre et un caractère spécial.'

      isValid = false
    }
  }

  // RÔLE
  const rolesValides = ['administrateur', 'coordonnateur', 'personnel_de_terrain']

  if (!rolesValides.includes(newUser.value.role)) {
    createErrors.role = 'Veuillez sélectionner un rôle valide.'
    isValid = false
  }

  return isValid
}

function createAccount() {
  // Si le formulaire n'est pas valide :
  // aucune requête n'est envoyée
  if (!validateCreateForm()) {
    return
  }

  apiFetch('/api/account/register', {
    method: 'POST',

    body: JSON.stringify({
      nom: newUser.value.nom,
      prenom: newUser.value.prenom,
      courriel: newUser.value.courriel,
      mdp: newUser.value.mdp,
      role: newUser.value.role,
    }),
  })
    .then((data) => {
      if (data.status !== 201) {
        createErrors.general =
          data.status + ' : ' + data.message || 'Impossible de créer le compte.'

        return
      }

      console.log('Compte créé :', data)

      // Réinitialisation
      resetCreateForm()

      // Retour à la liste active
      LoadUsers()

      // Fermer le formulaire
      showCreateForm.value = false
    })

    .catch((error) => {
      console.error('Erreur lors de la création du compte :', error)

      createErrors.general = 'Une erreur est survenue lors de la création du compte.'
    })
}
</script>
<style scoped>
/* =========================================================
   PAGE GLOBALE
========================================================= */

.gestion-container {
  width: 100%;
  max-width: 1200px;

  margin: 0 auto;

  padding: 70px 32px 100px;
}

/* =========================================================
   TITRE GLOBAL DE LA PAGE
========================================================= */

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;

  gap: 40px;

  margin-bottom: 48px;
}

.page-heading {
  flex: 1;
}

.page-heading h1 {
  margin: 0 0 10px;

  color: #212529;

  font-size: 36px;
  font-weight: 750;

  letter-spacing: -0.5px;
}

.page-heading p {
  margin: 0;

  color: #6c757d;

  font-size: 15px;
  line-height: 1.5;
}

/* =========================================================
   BOUTON CRÉER UN COMPTE

   Couleur volontairement différente des filtres verts.
   C'est l'action principale de la page.
========================================================= */

.create-user-btn {
  flex-shrink: 0;

  padding: 11px 20px;

  border: 1px solid #212529;
  border-radius: 8px;

  background-color: #212529;

  color: white;

  font-size: 14px;
  font-weight: 650;

  cursor: pointer;

  transition:
    background-color 0.2s,
    border-color 0.2s,
    transform 0.15s,
    box-shadow 0.2s;
}

.create-user-btn:hover {
  background-color: #343a40;

  border-color: #343a40;

  transform: translateY(-1px);

  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.12);
}

/* =========================================================
   FORMULAIRE DE CRÉATION
========================================================= */

.create-user-card {
  margin-top: -15px;
  margin-bottom: 42px;

  padding: 28px;

  background-color: white;

  border: 1px solid #e1e5e8;
  border-radius: 14px;

  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.055);
}

.create-form-header {
  margin-bottom: 26px;
}

.create-form-header h2 {
  margin: 0 0 7px;

  color: #212529;

  font-size: 23px;
  font-weight: 700;
}

.create-form-header p {
  margin: 0;

  color: #6c757d;

  font-size: 14px;
}

/* =========================================================
   CHAMPS DU FORMULAIRE
========================================================= */

.create-user-form {
  width: 100%;
}

.form-grid {
  display: grid;

  grid-template-columns: repeat(2, minmax(0, 1fr));

  gap: 22px;
}

.form-field {
  display: flex;
  flex-direction: column;

  gap: 8px;
}

.form-field.full-width {
  grid-column: 1 / -1;
}

.form-field label {
  color: #343a40;

  font-size: 13px;
  font-weight: 650;
}

.form-field input,
.form-field select {
  width: 100%;

  min-height: 43px;

  padding: 10px 12px;

  border: 1px solid #ced4da;
  border-radius: 7px;

  background-color: white;

  color: #343a40;

  font-size: 14px;

  transition:
    border-color 0.2s,
    box-shadow 0.2s;
}

.form-field input:focus,
.form-field select:focus {
  outline: none;

  border-color: #198754;

  box-shadow: 0 0 0 3px rgba(25, 135, 84, 0.12);
}

.password-help {
  color: #868e96;

  font-size: 12px;
}

/* =========================================================
   BOUTONS DU FORMULAIRE
========================================================= */

.create-actions {
  display: flex;
  justify-content: flex-end;

  gap: 10px;

  margin-top: 28px;
}

.cancel-create-btn,
.submit-create-btn {
  padding: 10px 17px;

  border-radius: 7px;

  font-size: 14px;
  font-weight: 650;

  cursor: pointer;

  transition: 0.2s;
}

.cancel-create-btn {
  border: 1px solid #ced4da;

  background-color: white;

  color: #495057;
}

.cancel-create-btn:hover {
  background-color: #f1f3f5;
}

.submit-create-btn {
  border: 1px solid #212529;

  background-color: #212529;

  color: white;
}

.submit-create-btn:hover {
  background-color: #343a40;

  border-color: #343a40;
}

/* =========================================================
   MESSAGES DU FORMULAIRE
========================================================= */

.create-error,
.create-success {
  margin-top: 20px;

  padding: 11px 14px;

  border-radius: 7px;

  font-size: 13px;
}

.create-error {
  background-color: #f8d7da;

  color: #842029;
}

.create-success {
  background-color: #d1e7dd;

  color: #0f5132;
}

/* =========================================================
   FILTRES ACTIFS / ARCHIVÉS / TOUS

   On laisse volontairement une bonne séparation
   entre le header et la liste.
========================================================= */

.status-filters {
  display: flex;
  flex-wrap: wrap;

  gap: 11px;

  margin-bottom: 32px;
}

.status-filter-btn {
  padding: 10px 19px;

  border: 1px solid #d4d9de;
  border-radius: 8px;

  background-color: white;

  color: #495057;

  font-size: 14px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s,
    border-color 0.2s,
    color 0.2s,
    transform 0.15s;
}

.status-filter-btn:hover {
  background-color: #f4f5f6;
}

.status-filter-btn:active {
  transform: scale(0.98);
}

.status-filter-btn.active {
  background-color: #198754;

  border-color: #198754;

  color: white;
}

.status-filter-btn.active:hover {
  background-color: #157347;

  border-color: #157347;
}

/* =========================================================
   GRANDE CARTE DE LA LISTE
========================================================= */

.employees-card {
  margin-top: 8px;

  overflow: hidden;

  background-color: white;

  border: 1px solid #e1e5e8;
  border-radius: 14px;

  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.055);
}

/* =========================================================
   EN-TÊTE DE LA CARTE
========================================================= */

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;

  gap: 30px;

  padding: 27px 26px 24px;

  border-bottom: 1px solid #f0f1f2;
}

.card-header h2 {
  margin: 0 0 7px;

  color: #212529;

  font-size: 22px;
  font-weight: 700;
}

.card-subtitle {
  margin: 0;

  color: #8a9096;

  font-size: 13px;
}

.employee-count {
  flex-shrink: 0;

  padding: 8px 14px;

  border-radius: 999px;

  background-color: #f1f3f5;

  color: #495057;

  font-size: 13px;
  font-weight: 650;
}

/* =========================================================
   FILTRES PAR RÔLE
========================================================= */

.role-filters {
  display: flex;
  align-items: center;
  flex-wrap: wrap;

  gap: 9px;

  padding: 20px 26px;

  background-color: #fafbfc;

  border-bottom: 1px solid #e9ecef;
}

.role-label {
  margin-right: 5px;

  color: #6c757d;

  font-size: 13px;
  font-weight: 650;
}

.role-filter-btn {
  padding: 7px 14px;

  border: 1px solid #d5dbe0;
  border-radius: 999px;

  background-color: white;

  color: #495057;

  font-size: 13px;
  font-weight: 500;

  cursor: pointer;

  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;
}

.role-filter-btn:hover {
  background-color: #f0f2f4;
}

.role-filter-btn.active {
  background-color: #198754;

  border-color: #198754;

  color: white;

  font-weight: 600;
}

.role-filter-btn.active:hover {
  background-color: #157347;

  border-color: #157347;
}

/* =========================================================
   TABLEAU
========================================================= */

.table-wrapper {
  width: 100%;

  overflow-x: auto;
}

.employees-table {
  width: 100%;

  border-collapse: collapse;

  background-color: white;
}

.employees-table thead {
  background-color: #f8f9fa;
}

.employees-table th {
  padding: 15px 20px;

  border-bottom: 1px solid #dee2e6;

  color: #6c757d;

  font-size: 12px;
  font-weight: 700;

  text-align: left;

  text-transform: uppercase;

  letter-spacing: 0.04em;

  white-space: nowrap;
}

.employees-table td {
  padding: 17px 20px;

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

  word-break: break-word;
}

/* =========================================================
   ÉDITION DU RÔLE
========================================================= */

.role-editor {
  display: flex;
  align-items: center;

  gap: 9px;
}

.role-select {
  min-width: 175px;

  padding: 8px 10px;

  border: 1px solid #ced4da;
  border-radius: 7px;

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

/* =========================================================
   CONFIRMATION DU RÔLE
========================================================= */

.confirm-role-btn {
  padding: 8px 12px;

  border: 1px solid #198754;
  border-radius: 7px;

  background-color: #198754;

  color: white;

  font-size: 12px;
  font-weight: 650;

  cursor: pointer;

  transition: 0.2s;

  white-space: nowrap;
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

/* =========================================================
   STATUT
========================================================= */

.status-badge {
  display: inline-block;

  padding: 6px 11px;

  border-radius: 999px;

  font-size: 12px;
  font-weight: 650;

  white-space: nowrap;
}

.active-status {
  background-color: #d1e7dd;

  color: #0f5132;
}

.archived-status {
  background-color: #e9ecef;

  color: #6c757d;
}

/* =========================================================
   ACTION ARCHIVER / RÉACTIVER
========================================================= */

.action-btn {
  padding: 8px 13px;

  border-radius: 7px;

  background-color: white;

  font-size: 13px;
  font-weight: 600;

  cursor: pointer;

  transition:
    background-color 0.2s,
    color 0.2s,
    border-color 0.2s;

  white-space: nowrap;
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

/* =========================================================
   AUCUN RÉSULTAT
========================================================= */

.empty-state {
  padding: 70px 20px;

  text-align: center;

  color: #868e96;

  font-size: 14px;
}

/* =========================================================
   RESPONSIVE TABLETTE
========================================================= */

@media (max-width: 900px) {
  .gestion-container {
    padding: 45px 20px 80px;
  }

  .page-header {
    gap: 25px;

    margin-bottom: 38px;
  }

  .page-heading h1 {
    font-size: 31px;
  }

  .employees-table {
    min-width: 1050px;
  }

  .role-editor {
    min-width: 285px;
  }
}

/* =========================================================
   RESPONSIVE MOBILE
========================================================= */

@media (max-width: 700px) {
  .gestion-container {
    padding: 35px 16px 65px;
  }

  .page-header {
    flex-direction: column;

    align-items: stretch;

    gap: 22px;

    margin-bottom: 32px;
  }

  .page-heading h1 {
    font-size: 28px;
  }

  .create-user-btn {
    width: 100%;
  }

  .status-filters {
    flex-direction: column;
  }

  .status-filter-btn {
    width: 100%;
  }

  .card-header {
    flex-direction: column;

    align-items: flex-start;

    gap: 16px;
  }

  .role-filters {
    align-items: flex-start;
  }

  .role-label {
    width: 100%;

    margin-bottom: 4px;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }

  .form-field.full-width {
    grid-column: auto;
  }

  .create-actions {
    flex-direction: column-reverse;
  }

  .cancel-create-btn,
  .submit-create-btn {
    width: 100%;
  }
}
.field-error {
  margin-top: 2px;

  color: #dc3545;

  font-size: 12px;
  font-weight: 500;
}

.form-field input.input-error,
.form-field select.input-error {
  border-color: #dc3545;

  background-color: #fffafa;
}

.form-field input.input-error:focus,
.form-field select.input-error:focus {
  border-color: #dc3545;

  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.12);
}

.general-error {
  margin-top: 20px;

  padding: 11px 14px;

  border: 1px solid #f1aeb5;
  border-radius: 7px;

  background-color: #f8d7da;

  color: #842029;

  font-size: 13px;
}
</style>
