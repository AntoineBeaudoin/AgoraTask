<template>
  <main class="gestion-container">
    <header class="page-header">
      <div class="page-heading">
        <h1>Gestion des utilisateurs</h1>

        <p>Gérez les comptes, les rôles et l'accès des employés.</p>
      </div>

      <button class="create-user-btn" @click="toggleCreateForm">
        {{ showCreateForm ? 'Fermer' : '+ Créer un compte' }}
      </button>
    </header>

    <EditPasswordModal />

    <div v-if="showCreateForm" class="create-user-card">
      <div class="create-form-header">
        <h2>Créer un compte</h2>

        <p>Ajoutez un nouvel utilisateur et attribuez-lui un rôle.</p>
      </div>

      <form class="create-user-form" @submit.prevent="createAccount">
        <div class="form-grid">
          <div class="form-field">
            <label for="prenom"> Prénom </label>

            <input id="prenom" v-model.trim="newUser.prenom" type="text" placeholder="Prénom"
              :class="{ 'input-error': createErrors.prenom }" />

            <span v-if="createErrors.prenom" class="field-error">
              {{ createErrors.prenom }}
            </span>
          </div>

          <div class="form-field">
            <label for="nom"> Nom </label>

            <input id="nom" v-model.trim="newUser.nom" type="text" placeholder="Nom"
              :class="{ 'input-error': createErrors.nom }" />

            <span v-if="createErrors.nom" class="field-error">
              {{ createErrors.nom }}
            </span>
          </div>

          <div class="form-field">
            <label for="courriel"> Courriel </label>

            <input id="courriel" v-model.trim="newUser.courriel" type="email" placeholder="utilisateur@exemple.com"
              :class="{ 'input-error': createErrors.courriel }" />

            <span v-if="createErrors.courriel" class="field-error">
              {{ createErrors.courriel }}
            </span>
          </div>

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

          <div class="form-field full-width">
            <label for="mdp"> Mot de passe </label>

            <input id="mdp" v-model="newUser.mdp" type="password" placeholder="Mot de passe initial"
              :class="{ 'input-error': createErrors.mdp }" />

            <span v-if="createErrors.mdp" class="field-error">
              {{ createErrors.mdp }}
            </span>

            <span v-else class="password-help">
              Minimum 8 caractères avec majuscule, minuscule, chiffre et caractère spécial.
            </span>
          </div>
        </div>

        <div v-if="createErrors.general" class="general-error">
          {{ createErrors.general }}
        </div>

        <div class="create-actions">
          <button type="button" class="cancel-create-btn" @click="toggleCreateForm">Annuler</button>

          <button type="submit" class="submit-create-btn">Créer le compte</button>
        </div>
      </form>
    </div>

    <div class="status-filters">
      <button class="status-filter-btn" :class="{ active: displayTitle === 'Employés actifs' }" @click="LoadUsers">
        Employés actifs
      </button>

      <button class="status-filter-btn" :class="{ active: displayTitle === 'Employés archivés' }"
        @click="ArchivedUsers">
        Employés archivés
      </button>

      <button class="status-filter-btn" :class="{ active: displayTitle === 'Tous les employés' }" @click="allUsers">
        Tous les employés
      </button>
    </div>

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

      <div class="role-filters">
        <span class="role-label"> Filtrer par rôle : </span>

        <button class="role-filter-btn" :class="{ active: displayedRole === 'all' }" @click="filterUsersByRole('all')">
          Tous
        </button>

        <button class="role-filter-btn" :class="{ active: displayedRole === 'administrateur' }"
          @click="filterUsersByRole('administrateur')">
          Administrateurs
        </button>

        <button class="role-filter-btn" :class="{ active: displayedRole === 'coordonnateur' }"
          @click="filterUsersByRole('coordonnateur')">
          Coordonnateurs
        </button>

        <button class="role-filter-btn" :class="{ active: displayedRole === 'personnel_de_terrain' }"
          @click="filterUsersByRole('personnel_de_terrain')">
          Personnel de terrain
        </button>
      </div>

      <div v-if="displayedUsers.length === 0" class="empty-state">
        Aucun employé ne correspond aux filtres sélectionnés.
      </div>

      <div v-else class="table-wrapper">
        <table class="employees-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Prénom</th>
              <th>Courriel</th>
              <th>Mot de passe</th>
              <th>Rôle</th>
              <th>Poste</th>
              <th>Statut</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            <tr v-for="user in displayedUsers" :key="user.id">
              <td class="user-name">
                {{ user.nom }}
              </td>

              <td>
                {{ user.prenom }}
              </td>

              <!-- COURRIEL -->
              <td class="user-email">
                {{ user.courriel }}
              </td>

              <td>
                <div class="role-editor">
                   <button class="btn btn-success rounded-5 confirm-role-btn" @click="editPasswordUser(user.id)">
                    Modifier le mot de passe
                  </button>
                </div>
              </td>

              <td>
                <div class="role-editor">
                  <select v-model="pendingRoles[user.id]" class="role-select"
                    :disabled="user.IsArchived || authStore.isConnectedUser(user.courriel) || savingUsers[user.id]">
                    <option value="administrateur">Administrateur</option>
                    <option value="coordonnateur">Coordonnateur</option>
                    <option value="personnel_de_terrain">Personnel de terrain</option>
                  </select>
                </div>
              </td>

              <td>
                <div class="role-editor">
                  <select
                    v-if="user.role === 'personnel_de_terrain' || pendingRoles[user.id] === 'personnel_de_terrain'"
                    v-model="pendingPostes[user.id]" class="role-select"
                    :disabled="user.IsArchived || savingUsers[user.id]">
                    <option value="">Aucun Poste</option>

                    <option v-for="poste in displayedPostes" :key="poste.id" :value="String(poste.id)">
                      {{ poste.nom }}
                    </option>
                  </select>

                  <p v-else>Non-disponible</p>

                  <button class="confirm-role-btn"
                    :disabled="user.IsArchived || savingUsers[user.id] || !hasPendingChanges(user)"
                    @click="editUser(user)">
                    {{ savingUsers[user.id] ? 'Enregistrement...' : 'Continuer' }}
                  </button>

                  <p v-if="saveErrors[user.id]" class="field-error">
                    {{ saveErrors[user.id] }}
                  </p>
                </div>
              </td>

              <td>
                <span v-if="!user.IsArchived" class="status-badge active-status"> Actif </span>

                <span v-else class="status-badge archived-status"> Archivé </span>
              </td>

              <td>
                <button v-if="!user.IsArchived" class="action-btn archive-btn" @click="archiveUser(user.id, true)">
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
import { useModalStore } from '@/stores/modalStore.js'
import EditPasswordModal from '@/components/users/EditPasswordModal.vue'
import { useAuthStore } from '@/stores/auth.js'
import { usePosteStore } from '@/stores/posteStore.js'

const modalStore = useModalStore()
const authStore = useAuthStore()
const posteStore = usePosteStore()

let displayTitle = ref('Employés actifs')
let displayedRole = ref('personnel_de_terrain')
let pendingRoles = ref({})
const pendingPostes = ref({})
const savingUsers = ref({})
const saveErrors = ref({})
const displayedUsers = ref([])
const loadedUsers = ref([])
const displayedPostes = ref([])

onMounted(() => {
  LoadUsers()
  LoadPostes()
})

async function LoadPostes() {
  try {
    await posteStore.loadPostes('/poste/list', true);

    const postes = posteStore.postes;
    displayedPostes.value = Array.isArray(postes) ? postes : [];
  } catch (error) {
    console.error(
      'Erreur lors du chargement des postes de travail :',
      error
    );
    displayedPostes.value = [];
  }
}

async function LoadEmployeePostes(users) {
  await Promise.all(
    users.map(async (user) => {
      if (user.role === 'personnel_de_terrain') {
        user.posteId = await posteStore.getEmployeePosteId(user.id)
      } else {
        user.posteId = null
      }

      pendingPostes.value[user.id] =
        user.posteId == null ? '' : String(user.posteId)
    })
  )
}

async function LoadUsers() {
  displayTitle.value = 'Employés actifs'

  try {
    const data = await apiFetch('/users?archived=false', {
      method: 'GET'
    })

    loadedUsers.value = data.data.users

    await LoadEmployeePostes(loadedUsers.value)

    ApplyRoleFilter()
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs :', error)
  }
}

async function ArchivedUsers() {
  displayTitle.value = 'Employés archivés'

  try {
    const data = await apiFetch('/users?archived=true', {
      method: 'GET'
    })

    loadedUsers.value = data.data.users

    await LoadEmployeePostes(loadedUsers.value)

    ApplyRoleFilter()
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs :', error)
  }
}

async function allUsers() {
  displayTitle.value = 'Tous les employés'

  try {
    const data = await apiFetch('/users', {
      method: 'GET'
    })

    loadedUsers.value = data.data.users

    await LoadEmployeePostes(loadedUsers.value)

    ApplyRoleFilter()
  } catch (error) {
    console.error('Erreur lors du chargement des utilisateurs :', error)
  }
}


function hasPendingChanges(user) {
  const roleChanged = pendingRoles.value[user.id] !== user.role

  const currentPosteId =
    user.posteId == null ? '' : String(user.posteId)

  const posteChanged =
    pendingPostes.value[user.id] !== currentPosteId

  return roleChanged || posteChanged
}

async function editUser(user) {
  const userId = user.id

  const newRole = pendingRoles.value[userId]
  const newPosteId =
    pendingPostes.value[userId] === ''
      ? null
      : Number(pendingPostes.value[userId])

  const roleChanged = newRole !== user.role

  const currentPosteId =
    user.posteId == null ? '' : String(user.posteId)

  const posteChanged =
    pendingPostes.value[userId] !== currentPosteId

  if (!roleChanged && !posteChanged) return

  savingUsers.value[userId] = true
  saveErrors.value[userId] = ''

  try {
    if (roleChanged) {
      const response = await apiFetch('/users/Edit_Role/', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId,
          newRole
        })
      })

      if (response.status !== 200) {
        throw new Error(response.message || `Erreur lors de la modification du rôle (${response.status}).`)
      }
      user.role = newRole
    }

    if (posteChanged) {
      const success = await posteStore.assignPosteToEmployee(userId, newPosteId)

      if (!success) {
        throw new Error(
          posteStore.lastErrorStatus
            ? `Impossible de modifier le poste (HTTP ${posteStore.lastErrorStatus}).`
            : "Impossible de modifier le poste de l'employé."
        )
      }

      user.posteId = newPosteId
    }

    pendingRoles.value[userId] = user.role
    pendingPostes.value[userId] = user.posteId == null ? '' : String(user.posteId)

  } catch (error) {
    console.error(
      "Erreur lors de la modification de l'employé :", error
    )

    saveErrors.value[userId] = error.message || "Une erreur est survenue lors de l'enregistrement."
  } finally {
    savingUsers.value[userId] = false
  }
}

async function editPasswordUser(userId) {
  await modalStore.openEditPassword(userId)
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
      LoadUsers()
    })
    .catch((error) => {
      console.error("Erreur lors de l'archivage de l'utilisateur :", error)
    })
}

function ApplyRoleFilter() {
  if (displayedRole.value === 'all') {
    displayedUsers.value = loadedUsers.value
  } else {
    displayedUsers.value = loadedUsers.value.filter(
      (user) => user.role === displayedRole.value
    )
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
  if (!validateCreateForm()) {
    return
  }

  apiFetch('/account/register', {
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

      resetCreateForm()

      LoadUsers()

      showCreateForm.value = false
    })

    .catch((error) => {
      console.error('Erreur lors de la création du compte :', error)

      createErrors.general = 'Une erreur est survenue lors de la création du compte.'
    })
}
</script>
<style scoped src="src/assets/employes.css"></style>
