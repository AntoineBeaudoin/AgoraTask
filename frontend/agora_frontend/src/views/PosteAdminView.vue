<template>
  <main class="gestion-container">
    <header class="page-header">
      <div class="page-heading">
        <h1>Gestion des postes de travail</h1>
        <p>Créer, modifier et gérer les postes de travail.</p>
      </div>
      <button class="create-user-btn" @click="modalStore.openAddPoste()">
        + Créer un poste
      </button>
    </header>

    <PosteModal @saved="reloadPostes"/>

    <div class="status-filters">
      <button class="status-filter-btn" :class="{ active: displayTitle === 'Postes actifs' }" @click="loadPostes">
        Postes actifs
      </button>
      <button class="status-filter-btn" :class="{ active: displayTitle === 'Postes archivés' }"
        @click="loadArchivedPostes">
        Postes archivés
      </button>
      <button class="status-filter-btn" :class="{ active: displayTitle === 'Tous les postes' }" @click="loadAllPostes">
        Tous les postes
      </button>
    </div>

    <section class="employees-card">
      <div class="card-header">
        <div>
          <h2>{{ displayTitle }}</h2>
          <p class="card-subtitle">Gérez les postes de travail correspondant au filtre sélectionné.</p>
        </div>
        <div class="employee-count">{{ displayedPostes.length }} résultat(s)</div>
      </div>

      <div v-if="displayedPostes.length === 0" class="empty-state">
        Aucun poste de travail ne correspond au filtre sélectionné.
      </div>

      <div v-else class="table-wrapper">
        <table class="employees-table">
          <thead>
            <tr>
              <th>Nom</th>
              <th>Description</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="poste in displayedPostes" :key="poste.id">
              <td class="user-name">{{ poste.nom }}</td>
              <td>{{ poste.description }}</td>
              <td>
                <span v-if="!poste.archived" class="status-badge active-status">Actif</span>
                <span v-else class="status-badge archived-status">Archivé</span>
              </td>
              <td>
                <div class="role-editor">
                  <button class="confirm-role-btn" @click="modalStore.openEditPoste(poste)">
                    Modifier
                  </button>
                  <button v-if="!poste.archived" class="action-btn archive-btn" @click="posteToArchive = poste">
                    Archiver
                  </button>
                  <button v-else class="action-btn restore-btn" @click="reactivatePoste(poste.id)">
                    Réactiver
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <div v-if="posteToArchive" class="dialog-overlay" @click.self="posteToArchive = null">
      <div class="confirmation-dialog">
        <h2>Confirmer l'archivage</h2>
        <p>
          Voulez-vous vraiment archiver le poste
          <strong>{{ posteToArchive.nom }}</strong> ?
        </p>
        <div class="dialog-actions">
          <button class="cancel-btn" @click="posteToArchive = null">
            Annuler
          </button>
          <button class="confirm-archive-btn" @click="confirmArchivePoste">
            Archiver
          </button>
        </div>
      </div>
    </div>

  </main>
</template>

<script setup>
import { onMounted, ref, watch } from 'vue';
import { useModalStore } from '@/stores/modalStore.js';
import PosteModal from '@/components/postes/PosteModal.vue';
import { usePosteStore } from '@/stores/posteStore.js';

const modalStore = useModalStore();
const posteStore = usePosteStore();

const displayTitle = ref('Postes actifs');
const displayedPostes = ref([]);

const posteToArchive = ref(null);

onMounted(() => {
  loadPostes();
});

async function loadPostes() {
  displayTitle.value = 'Postes actifs';
  await fetchPostes('/poste/list?archived=false');
}

async function loadArchivedPostes() {
  displayTitle.value = 'Postes archivés';
  await fetchPostes('/poste/list?archived=true');
}

async function loadAllPostes() {
  displayTitle.value = 'Tous les postes';
  await fetchPostes('/poste/list', true);
}

async function fetchPostes(url = '/poste/list', forceRefresh = false) {
  try {
    await posteStore.loadPostes(url, forceRefresh);

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

async function reloadPostes(){
   posteStore.loaded = false;

    if (displayTitle.value === 'Postes actifs') {
      await loadPostes();
    } else if (displayTitle.value === 'Postes archivés') {
      await loadArchivedPostes();
    } else {
      await loadAllPostes();
    }
}

watch(
  () => modalStore.posteModalOpen,
  async (isOpen, wasOpen) => {
    if (wasOpen && !isOpen) {
      await reloadPostes();
    }
  }
);

async function reactivatePoste(id){
  await posteStore.reactivatePoste(id);
  await reloadPostes();
}

async function confirmArchivePoste() {
  if (!posteToArchive.value) return;

  const posteId = posteToArchive.value.id;

  try {
    const success = await posteStore.deletePoste(posteId);

    if (success === false) return;

    posteToArchive.value = null;

    await reloadPostes();

  } catch (error) {
    console.error("Erreur lors de l'archivage du poste :", error);
  }
}
</script>
