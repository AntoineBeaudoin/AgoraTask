<template>
  <Teleport to="body">
    <div v-if="modalStore.taskModalOpen" class="modal fade p-5 bd-example-modal-lg" @click.self="close" id="taskModal"
      tabindex="-1" role="dialog" aria-labelledby="taskModalLabel" aria-hidden="true">
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
                  <label for="title" class="d-none">Entrez le titre de la tâche</label>
                  <input v-model="title" id="title" class="form-control" type="text" placeholder="Titre de la tâche *"
                    required />
                  <span id="titleError" class="invalid-feedback">Le titre de la tâche est requis</span>
                </div>
                <div class="form-group mb-3">
                  <label for="local" class="d-none">Entrez le local de la tâche</label>
                  <input v-model="local" id="local" class="form-control" type="text" placeholder="Local de la tâche *"
                    required />
                  <span id="localError" class="invalid-feedback">Le local de la tâche est requis</span>
                </div>
                <div>
                  <label for="desc" class="d-none">Entrez la description de la tâche</label>
                  <textarea v-model="description" id="desc" class="form-control mb-3"
                    placeholder="Description de la tâche" />
                  <span class="invalid-feedback">Entrez la description de la tâche</span>
                </div>
              </div>
              <div class="col-md-6">
                <div class="mb-3">
                  <label class="form-label d-none" for="imgs">Image(s) à ajouter (optionnel, max. 5)</label>
                  <div id="zone-drop" class="revue-zone-drop" @click="openFilePicker" @dragover.prevent="handleDragOver"
                    @dragleave="handleDragLeave" @drop.prevent="handleDrop" :class="{ 'drag-over': isDragging }">
                    <div class="revue-zone-drop-icon">🖼</div>
                    <div class="text-muted">Glisser-déposer ou cliquer pour</div>
                    <div class="text-success fw-bold">Parcourir les fichiers</div>
                    <div class="text-muted small mt-1">Max. 5 Mo par photo</div>
                  </div>
                  <input ref="inputPhotos" type="file" id="imgs" name="photos" accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
                    multiple class="d-none" @change="handleFileChange" />
                </div>
                <div class="d-flex flex-wrap gap-2 mb-4">
                  <div v-for="(file, index) in images" :key="file.id || `${file.name}-${index}`"
                    class="position-relative">
                    <img class="imgIconDisplay" :src="file.preview" :alt="file.name" />
                    <button type="button"
                      class="btn btn-danger position-absolute top-0 end-0 rounded-circle p-0 btn-icon-close"
                      @click="removeImage(index)"> ✕ </button>
                  </div>
                  <button v-if="images.length > 0 && images.length < 5" type="button"
                    class="box-icon-add-images btn d-flex align-items-center justify-content-center"
                    @click="openFilePicker"> + </button>
                </div>

                <div class="form-group row">
                  <div class="col-xl-6 mb-3">
                    <div class="d-flex align-items-center gap-2">
                      <label for="sTime">Heure début * : </label>
                      <input v-model="startTime" id="sTime" type="time" class="form-control w-auto" />
                    </div>
                    <span id="sTimeError" class="invalid-feedback">L'heure de début doit être plus tôt que l'heure de
                      fin</span>
                  </div>
                  <div class="col-xl-6 mb-3">
                    <div class="d-flex align-items-center gap-2">
                      <label for="eTime">Heure fin * : </label>
                      <input v-model="endTime" id="eTime" type="time" class="form-control w-auto" />
                    </div>
                    <span id="eTimeError" class="invalid-feedback">L'heure de fin doit être plus tard que l'heure de
                      début</span>
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
                  <option value="bi_weekly">Deux fois par semaine</option>
                  <option value="tri_weekly">Trois fois par semaine</option>
                  <option value="two_week">Aux deux semaines</option>
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
const local = ref('');
const description = ref('');
const startTime = ref('');
const endTime = ref('');
const recurring = ref(false);
const frequency = ref('');
const automaticAssignment = ref(false);
const images = ref([]);
const inputPhotos = ref(null);
const isDragging = ref(false);

const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 Mo

const isEditing = computed(() => !!modalStore.editingTask);

watch(
  () => modalStore.editingTask,
  (task) => {
    if (task) {
      title.value = task.title ?? '';
      local.value = task.local ?? '';
      description.value = task.description ?? '';
      startTime.value = task.startTime ?? '';
      endTime.value = task.endTime ?? '';
      recurring.value = task.recurring ?? false;
      frequency.value = task.frequency ?? '';
      automaticAssignment.value = task.automaticAssignment ?? false;
      images.value = (task.images ?? []).map(image => ({
        ...image,
        preview: image.preview ?? image.url
      }));

    } else {
      resetForm();
    }
  },
  { immediate: true }
)

function resetForm() {
  images.value.forEach(image => {
    if (image.preview) {
      URL.revokeObjectURL(image.preview);
    }
  });

  title.value = '';
  local.value = '';
  description.value = '';
  startTime.value = '';
  endTime.value = '';
  recurring.value = false;
  frequency.value = '';
  automaticAssignment.value = false;
  images.value = [];

  if (inputPhotos.value) {
    inputPhotos.value.value = '';
  }
}


function close() {
  resetForm();
  modalStore.closeTaskModal();
}

function formIsValid() {
  return title.value !== ''
    && local.value !== ''
    && datesAreValid();
}

function datesAreValid() {
  if (!startTime.value || !endTime.value) {
    return false;
  }
  return startTime.value < endTime.value
    && dateIsLaterThanToday(startTime.value);
}

function dateIsLaterThanToday(date) {
  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return date > currentTime;
}

function markInvalidInputs() {
  document.querySelectorAll('#taskModal .is-invalid').forEach((input) => {
    input.classList.remove('is-invalid');
  });

  document.querySelectorAll('span').forEach((span) => {
    span.classList.remove('d-block');
  });

  if (!title.value.trim()) {
    document.querySelector('#title').classList.add('is-invalid');
    document.querySelector('#titleError').classList.add('d-block');
  }
  if (!local.value.trim()) {
    document.querySelector('#local').classList.add('is-invalid');
    document.querySelector('#localError').classList.add('d-block');
  }
  if (!startTime.value || !dateIsLaterThanToday(startTime.value)) {
    document.querySelector('#sTime').classList.add('is-invalid');
    document.querySelector('#sTimeError').classList.add('d-block');
  }
  if (!endTime.value || !(startTime.value < endTime.value)) {
    document.querySelector('#eTime').classList.add('is-invalid');
    document.querySelector('#eTimeError').classList.add('d-block');
  }
}

async function submit() {
  if (!formIsValid()) {
    markInvalidInputs();
  }
  else {
    const task = {
      title: title.value,
      local: local.value,
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
}

function openFilePicker() {
  inputPhotos.value?.click();
}

function handleDragOver() {
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(event) {
  isDragging.value = false;
  const files = Array.from(event.dataTransfer.files);
  addFiles(files);
}

function handleFileChange(event) {
  const files = Array.from(event.target.files);
  addFiles(files);
  event.target.value = '';
}

function addFiles(files) {
  const remainingSlots = MAX_IMAGES - images.value.length;
  if (remainingSlots <= 0) {
    return;
  }
  const filesToAdd = files.slice(0, remainingSlots);
  filesToAdd.forEach(file => {
    if (!isValidImage(file)) {
      return;
    }
    const preview = URL.createObjectURL(file);
    images.value.push({
      file,
      preview,
      name: file.name
    });
  });
}

function isValidImage(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    alert(`${file.name} n'est pas un format d'image accepté.`);
    return false;
  }
  if (file.size > MAX_FILE_SIZE) {
    alert(`${file.name} dépasse la limite de 5 Mo.`);
    return false;
  }
  return true;
}

function removeImage(index) {
  const image = images.value[index];
  if (image?.preview) {
    URL.revokeObjectURL(image.preview);
  }
  images.value.splice(index, 1);
}

</script>