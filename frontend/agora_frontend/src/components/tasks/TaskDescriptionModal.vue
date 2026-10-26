<template>
  <Teleport to="body">
    <div v-if="modalStore.taskDescriptionModalOpen" class="modal fade p-5 bd-example-modal-lg" @click.self="close"
      id="taskModal" tabindex="-1" role="dialog" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content mt-3 ps-3 pe-3">
          <div class="modal-header ps-0">
            <h2 class="modal-title">Description de la tâche</h2>
            <button type="button" class="bg-transparent border-0 ms-auto p-3 btn btn-close" @click="close"></button>
          </div>
          <div class="row g-4">
            <div class="col-lg-6">
              <h3 class="fs-5 mb-3 text-primary">Informations de la tâche</h3>
              <h4>{{ task.title }}</h4>
              <p>Local: {{ task.room }}</p>
              <h4>Description:</h4>
              <p>{{ task.description }}</p>
              <div v-if="task.images.length !== 0">
                <h3 class="fs-5 mb-2 text-primary">Images</h3>
                <div class="d-flex">
                  <div v-for="(file) in task.images" :key="file.id" class="position-relative">
                    <img class="imgIconDisplay rounded border me-1"
                      style="width: 100px; height: 100px; object-fit: cover;" :src="file.preview ?? file.path"
                      :alt="file.name" />
                  </div>
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div v-if="task.occurrences.length > 0" class="mb-2">
                <h3 class="fs-5 text-primary m-0">Horaires</h3>
                <p class="text-muted small mb-3">Fréquence et occurrences de la tâche.</p>
                <div v-for="(occ, index) in task.occurrences" :key="index"
                  class="card card-body bg-light mb-3 position-relative p-3">
                  <p><strong>Journée: </strong>{{ occ.journee ? occ.journee.charAt(0).toUpperCase() +
                    occ.journee.slice(1) : 'Non définie' }}</p>
                  <div class="d-flex justify-content-between">
                    <p><strong>Priorité:</strong> {{ occ.priorite ?? 'Non définie' }}</p>
                    <i class="ms-1" data-bs-toggle="tooltip" data-bs-placement="top"
                      title="Indique le niveau de priorité : 1 = très élevée, 2 = élevé, 3 = moyenne, 4 = basse, 5 = très basse."
                      style="cursor: help;">
                      <img src="../../assets/images/info-circle.svg" alt="">
                    </i>
                  </div>
                  <p><strong>Heure début:</strong> {{ occ.heureDebut || 'Non définie' }}</p>
                  <p><strong>Heure fin:</strong> {{ occ.heureFin || 'Non définie' }}</p>
                  <div class="col-12 mt-2">
                    <div class="form-check">
                      <input type="checkbox" :checked="occ.isRequired" class="form-check-input" :id="`req-${index}`"
                        disabled />
                      <label class="form-check-label small" :for="`req-${index}`">
                        Est obligatoire
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-secondary py-2 small text-center mb-3">Aucun horaire défini.</div>
              <div v-if="task.sous_taches.length > 0" class="mb-2 mt-4">
                <h3 class="fs-5 text-primary m-0">Sous-tâches</h3>
                <p class="text-muted small mb-3">Étapes ou sous-tâches associées.</p>
                <div v-for="(st, index) in task.sous_taches" :key="index"
                  class="card card-body bg-light mb-2 p-2 position-relative">
                  <div class="mb-2 pe-4">
                    <label class="form-label small fw-bold">Titre de la sous-tâche</label>
                    <p class="form-control-plaintext form-control-sm mb-2">{{ st.titre || 'Sans titre' }}</p>
                    <label class="form-label small fw-bold">Description</label>
                    <p class="form-control-plaintext form-control-sm mb-0">{{ st.description || 'Aucune description' }}
                    </p>
                  </div>
                </div>
              </div>
              <div v-else class="alert alert-secondary py-2 small text-center mb-3">Aucune sous-tâche définie.</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { watch, ref } from 'vue';
import { useModalStore } from '@/stores/modalStore';

const modalStore = useModalStore();
const task = ref('');

watch(
  () => modalStore.observableTask,
  (observableTask) => {
    console.log("the task to modify: ", observableTask);
    if (observableTask) {
      task.value = observableTask;
    }
  },
  { immediate: true }
)

function close() {
  modalStore.closeTaskModal();
}

</script>
