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

<!-- <style scoped>
.gestion-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 70px 32px 100px;
}

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

.employees-card {
  margin-top: 8px;
  overflow: hidden;
  background-color: white;
  border: 1px solid #e1e5e8;
  border-radius: 14px;
  box-shadow: 0 4px 18px rgba(0, 0, 0, 0.055);
}

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

.empty-state {
  padding: 70px 20px;
  text-align: center;
  color: #868e96;
  font-size: 14px;
}

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

.general-error {
  margin-top: 20px;
  padding: 11px 14px;
  border: 1px solid #f1aeb5;
  border-radius: 7px;
  background-color: #f8d7da;
  color: #842029;
  font-size: 13px;
}

/* Dialogue de confirmation de suppression */
.dialog-overlay {
    position: fixed;
    inset: 0;
    z-index: 1000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    background: rgba(0, 0, 0, 0.45);
}

.confirmation-dialog {
    width: 100%;
    max-width: 440px;
    padding: 28px;
    border-radius: 12px;
    background: white;
    box-shadow: 0 10px 35px rgba(0, 0, 0, 0.2);
}

.confirmation-dialog h2 {
    margin: 0 0 14px;
    color: #212529;
    font-size: 21px;
}

.confirmation-dialog p {
    margin: 0;
    color: #495057;
    line-height: 1.6;
}

.dialog-actions {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    margin-top: 26px;
}

.cancel-btn,
.confirm-archive-btn {
    padding: 10px 16px;
    border-radius: 7px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
}

.cancel-btn {
    border: 1px solid #ced4da;
    background: white;
    color: #495057;
}

.confirm-archive-btn {
    border: 1px solid #dc3545;
    background: #dc3545;
    color: white;
}

.confirm-archive-btn:hover {
    background: #bb2d3b;
}
</style> -->
