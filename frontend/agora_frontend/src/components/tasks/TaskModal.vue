<template>
  <Teleport to="body">
    <div v-if="modalStore.taskModalOpen" class="modal fade p-5 bd-example-modal-lg" @click.self="close" id="taskModal" tabindex="-1" role="dialog" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content mt-3 ps-3 pe-3">
            <div class="modal-header ps-0">
              <h2 class="modal-title">{{ isEditing ? 'Modifier une tâche' : 'Ajouter/Modifier une tâche' }}</h2>
              <button type="button" class="bg-transparent border-0 ms-auto p-3 btn btn-close" @click="close"></button>
            </div>
            <form @submit.prevent="submit" novalidate class="mt-3">
              <div class="form-layout row">
                <div class="col-md-6">
                  <div class="form-group mb-3">
                    <input v-model="title" class="form-control" type="text" placeholder="Titre de la tâche" required />
                    <span class="invalid-feedback">Entrez le titre de la tâche</span>
                  </div>
                  <div class="form-group mb-3">
                    <input v-model="local" class="form-control" type="text" placeholder="Local de la tâche" required />
                    <span class="invalid-feedback">Entrez le local de la tâche</span>
                  </div>
                  <div>
                    <textarea v-model="description" class="form-control mb-3" placeholder="Description de la tâche" />
                    <span class="invalid-feedback">Entrez la description de la tâche</span>
                  </div>
                </div>
                <div class="col-md-6">
                  <div class="form-group mb-3 d-flex align-items-center gap-2">
                    <label class="form-label">Image(s) à ajouter</label>
                    <input class="form-control w-75" type="file" multiple accept="image/*" @change="images = [...$event.target.files]" />
                  </div>
                  <div class="form-group mb-3 row">
                    <div class="col-6 d-flex align-items-center gap-2">
                      <label>Heure début: </label>
                      <input v-model="startTime" type="time" class="form-control w-auto" />
                    </div>
                    <div class="col-6 d-flex align-items-center gap-2 border-start border-2 border-black">
                      <label>Heure fin: </label>
                      <input v-model="endTime" type="time" class="form-control w-auto" />
                    </div>
                  </div>
                  <div class="form-group mb-3">
                    <label>
                      <input v-model="recurring" type="checkbox" class="form-check-input me-2" />
                      <span>Tâche récurrente?</span>
                    </label>
                  </div>
                  <select v-if="recurring" v-model="frequency" class="form-control mb-3">
                    <option value="">Fréquence de la tâche</option>
                    <option value="daily">Tous les jours</option>
                    <option value="weekly">Toutes les semaines</option>
                    <option value="monthly">Tous les mois</option>
                  </select>
                  <div class="form-group mb-3">
                    <label>
                      <input v-model="automaticAssignment" type="checkbox" class="form-check-input me-2" />
                      <span>Assigner automatiquement?</span>
                    </label>
                  </div>
                </div>
              </div>
              <div class="modal-footer">
                <button type="button" class="btn btn-danger" @click="close">Annuler</button>
                <button type="submit" class="btn btn-success">{{ isEditing ? 'Modifier' : 'Ajouter' }}</button>
              </div>
            </form>
          </div>
        </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useModalStore } from '@/stores/modalStore';

const taskStore = useTaskStore();
const modalStore = useModalStore();

const title = ref('');
const description = ref('');
const startTime = ref('');
const endTime = ref('');
const recurring = ref(false);
const frequency = ref('');
const automaticAssignment = ref(false);
const images = ref([]);

const isEditing = computed(() => !!modalStore.editingTask);

watch(
  () => modalStore.editingTask,
  (task) => {
    if (task) {
      title.value = task.title ?? '';
      description.value = task.description ?? '';
      startTime.value = task.startTime ?? '';
      endTime.value = task.endTime ?? '';
      recurring.value = task.recurring ?? false;
      frequency.value = task.frequency ?? '';
      automaticAssignment.value = task.automaticAssignment ?? false;
      images.value = task.images ?? [];
    } else {
      resetForm();
    }
  },
  { immediate: true }
)

function resetForm() {
  title.value = '';
  description.value = '';
  startTime.value = '';
  endTime.value = '';
  recurring.value = false;
  frequency.value = '';
  automaticAssignment.value = false;
  images.value = [];
}

function close() {
  resetForm();
  modalStore.closeTaskModal();
}

async function submit() {
  const task = {
    title: title.value,
    description: description.value,
    startTime: startTime.value,
    endTime: endTime.value,
    recurring: recurring.value,
    frequency: frequency.value,
    automaticAssignment: automaticAssignment.value,
    images: images.value
  }

  if (isEditing.value) {
    await taskStore.updateTask({
      ...modalStore.editingTask,
      ...task
    });
  } else {
    await taskStore.addTask(task);
  }

  resetForm();
  close();
}
</script>