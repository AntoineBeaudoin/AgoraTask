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
              <h3 class="fs-5 mb-2 text-primary">Images</h3>
              <div class="d-flex">
                <div v-for="(file) in task.images" :key="file.id" class="position-relative">
                  <img class="imgIconDisplay rounded border me-1" style="width: 100px; height: 100px; object-fit: cover;"
                    :src="file.preview ?? file.path" :alt="file.name" />
                </div>
              </div>
            </div>
            <div class="col-lg-6">
              <div class="d-flex justify-content-between align-items-center mb-2">
                <h3 class="fs-5 text-primary m-0">Horaires & Fréquence (Occurrences)</h3>
              </div>
              <div class="alert alert-secondary py-2 small text-center mb-3">Aucun horaire défini.</div>
              <div class="d-flex justify-content-between align-items-center mb-2 mt-4">
                <h3 class="fs-5 text-primary m-0">Sous-tâches</h3>
              </div>
              <div class="alert alert-secondary py-2 small text-center mb-3">Aucune sous-tâche définie.</div>
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
