<template>
  <Teleport to="body">
    <div v-if="modalStore.taskModalOpen" class="modal fade p-5 bd-example-modal-lg" @click.self="close" id="taskModal"
      tabindex="-1" role="dialog" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content mt-3 ps-3 pe-3">
          <div class="modal-header ps-0">
            <h2 class="modal-title">{{ isEditing ? 'Modifier une tâche' : 'Ajouter une tâche' }}</h2>
            <button type="button" class="bg-transparent border-0 ms-auto p-3 btn btn-close" @click="close"></button>
          </div>
          <form @submit.prevent="submit" novalidate class="mt-3">
            <div class="row g-4">
              <div class="col-lg-6">
                <h3 class="fs-5 mb-3 text-primary">1. Informations générales</h3>
                <div class="form-group mb-3">
                  <label for="title" class="form-label">Titre de la tâche *</label>
                  <input v-model="title" id="title" class="form-control" type="text" placeholder="Ex: Nettoyage complet"
                    required />
                  <div id="titleError" class="invalid-feedback">Le titre de la tâche est requis.</div>
                </div>
                <div class="form-group mb-3">
                  <label for="room" class="form-label">Local *</label>
                  <input v-model="room" id="room" class="form-control" type="text" placeholder="Ex: Local 102"
                    required />
                  <div id="roomError" class="invalid-feedback">Le local est requis.</div>
                </div>
                <div class="form-group mb-3">
                  <label for="desc" class="form-label">Description</label>
                  <textarea v-model="description" id="desc" class="form-control" rows="3"
                    placeholder="Description détaillée..."></textarea>
                </div>
                <div class="form-check mb-2">
                  <input v-model="recurring" type="checkbox" class="form-check-input" id="recurringCheck" />
                  <label class="form-check-label" for="recurringCheck">Tâche récurrente</label>
                </div>
                <div class="form-check mb-4">
                  <input v-model="automaticAssignment" type="checkbox" class="form-check-input" id="autoAssignCheck" />
                  <label class="form-check-label" for="autoAssignCheck">Assigner automatiquement</label>
                </div>
                <h3 class="fs-5 mb-2 text-primary">Images (max. 5)</h3>
                <div class="mb-3">
                  <div id="zone-drop"
                    class="revue-zone-drop border border-2 border-dashed p-3 text-center rounded bg-light cursor-pointer"
                    @click="openFilePicker" @dragover.prevent="handleDragOver" @dragleave="handleDragLeave"
                    @drop.prevent="handleDrop" :class="{ 'border-success bg-opacity-10 bg-success': isDragging }">
                    <div class="fs-2">🖼</div>
                    <div class="text-muted">Glisser-déposer ou cliquer pour</div>
                    <div class="text-success fw-bold">Parcourir les fichiers</div>
                    <div class="text-muted small mt-1">Max. 5 Mo par photo (.jpg, .png, .webp, etc.)</div>
                  </div>
                  <input ref="inputPhotos" type="file" id="imgs" name="photos" accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
                    multiple class="d-none" @change="handleFileChange" />
                </div>
                <div class="d-flex flex-wrap gap-2 mb-3">
                  <div v-for="(file, index) in images" :key="file.id || `${file.name}-${index}`"
                    class="position-relative">
                    <img class="imgIconDisplay rounded border" style="width: 70px; height: 70px; object-fit: cover;"
                      :src="file.preview ?? file.path" :alt="file.name" />
                    <button type="button"
                      class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle p-1 lh-1"
                      @click="removeImage(index)" style="font-size: 10px; width: 20px; height: 20px;">✕</button>
                  </div>
                  <button v-if="images.length > 0 && images.length < 5" type="button"
                    class="btn btn-outline-secondary d-flex align-items-center justify-content-center rounded"
                    style="width: 70px; height: 70px;" @click="openFilePicker">+</button>
                </div>
              </div>
              <div class="col-lg-6">
                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h3 class="fs-5 text-primary m-0">2. Horaires & Fréquence (Occurrences)</h3>
                  <button type="button" class="btn btn-sm btn-outline-success" @click="addOccurrence">+ Ajouter un
                    horaire</button>
                </div>
                <p class="text-muted small mb-3">Définissez les moments de la semaine où cette tâche doit être
                  effectuée.</p>
                <div v-if="occurrences.length === 0" class="alert alert-secondary py-2 small text-center mb-3">
                  Aucun horaire défini.
                </div>
                <div v-for="(occ, index) in occurrences" :key="index"
                  class="card card-body bg-light mb-3 position-relative p-3">
                  <button type="button" class="btn-close position-absolute top-0 end-0 m-2" aria-label="Supprimer"
                    @click="removeOccurrence(index)"></button>
                  <div class="row g-2">
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Journée *</label>
                      <select v-model="occ.journee" class="form-select form-select-sm" required>
                        <option value="" disabled>Choisir un jour</option>
                        <option value="lundi">Lundi</option>
                        <option value="mardi">Mardi</option>
                        <option value="mercredi">Mercredi</option>
                        <option value="jeudi">Jeudi</option>
                        <option value="vendredi">Vendredi</option>
                        <option value="samedi">Samedi</option>
                        <option value="dimanche">Dimanche</option>
                      </select>
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Priorité (1 à 5)</label>
                      <i class="ms-1" data-bs-toggle="tooltip" data-bs-placement="top"
                        title="Indique le niveau de priorité : 1 = très élevée, 2 = élevé, 3 = moyenne, 4 = basse, 5 = très basse."
                        style="cursor: help;"><img src="../../assets/images/info-circle.svg" alt=""></i>
                      <input type="number" v-model.number="occ.priorite" min="1" max="5"
                        class="form-control form-control-sm" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Heure début</label>
                      <input type="time" v-model="occ.heureDebut" class="form-control form-control-sm" />
                    </div>
                    <div class="col-md-6">
                      <label class="form-label small fw-bold">Heure fin</label>
                      <input type="time" v-model="occ.heureFin" class="form-control form-control-sm" />
                    </div>
                    <div class="col-12 mt-2">
                      <div class="form-check">
                        <input type="checkbox" v-model="occ.isRequired" class="form-check-input" :id="`req-${index}`" />
                        <label class="form-check-label small" :for="`req-${index}`">Est obligatoire</label>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="d-flex justify-content-between align-items-center mb-2 mt-4">
                  <h3 class="fs-5 text-primary m-0">3. Sous-tâches</h3>
                  <button type="button" class="btn btn-sm btn-outline-success" @click="addSubTask">+ Ajouter une
                    sous-tâche</button>
                </div>
                <p class="text-muted small mb-3">Étapes ou sous-tâches associées.</p>
                <div v-if="subTasks.length === 0" class="alert alert-secondary py-2 small text-center mb-3">
                  Aucune sous-tâche définie.
                </div>
                <div v-for="(st, index) in subTasks" :key="index"
                  class="card card-body bg-light mb-2 p-2 position-relative">
                  <button type="button" class="btn-close position-absolute top-0 end-0 m-2" aria-label="Supprimer"
                    @click="removeSubTask(index)"></button>
                  <div class="mb-2 pe-4">
                    <input type="text" v-model="st.titre" placeholder="Titre de la sous-tâche *"
                      class="form-control form-control-sm mb-1" required />
                    <div class="invalid-feedback">Le titre de la sous-tâche est requis.</div>
                    <textarea v-model="st.description" placeholder="Description (optionnel)"
                      class="form-control form-control-sm" rows="1"></textarea>
                  </div>
                </div>
              </div>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-danger" @click="close">Annuler</button>
              <button id="submitBtn" type="submit" class="btn btn-success">{{ isEditing ? 'Modifier' : 'Ajouter'
                }}</button>
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
import { switchIsButtonActiveById } from '@/utils/dom-manipulation';

const taskStore = useTaskStore();
const modalStore = useModalStore();

const SUBMIT_BUTTON_ID = 'submitBtn';

const title = ref('');
const room = ref('');
const description = ref('');
const recurring = ref(false);
const automaticAssignment = ref(false);
const occurrences = ref([]);
const subTasks = ref([]);
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
      room.value = task.room ?? '';
      description.value = task.description ?? '';
      recurring.value = task.recurring ?? false;
      automaticAssignment.value = task.automaticAssignment ?? false;

      occurrences.value = (task.occurrences ?? []).map(occ => ({ ...occ }));
      subTasks.value = (task.subTasks ?? task.sous_taches ?? []).map(st => ({
        titre: st.titre ?? st.title,
        description: st.description
      }));

      images.value = (task.images ?? []).map(image => ({
        ...image,
        preview: image.preview ?? image.path ?? image.url
      }));
    } else {
      resetForm();
    }
  },
  { immediate: true }
);

function resetForm() {
  images.value.forEach(image => {
    if (image.preview && image.preview.startsWith('blob:')) {
      URL.revokeObjectURL(image.preview);
    }
  });

  title.value = '';
  room.value = '';
  description.value = '';
  recurring.value = false;
  automaticAssignment.value = false;
  occurrences.value = [];
  subTasks.value = [];
  images.value = [];

  if (inputPhotos.value) {
    inputPhotos.value.value = '';
  }
}

function close() {
  resetForm();
  modalStore.closeTaskModal();
}

function addOccurrence() {
  occurrences.value.push({
    journee: 'lundi',
    heureDebut: '',
    heureFin: '',
    priorite: 3,
    isRequired: true
  });
}

function removeOccurrence(index) {
  occurrences.value.splice(index, 1);
}

function addSubTask() {
  subTasks.value.push({
    titre: '',
    description: ''
  });
}

function removeSubTask(index) {
  subTasks.value.splice(index, 1);
}

function formIsValid() {
  return title.value.trim() !== '' &&
    room.value.trim() !== '' &&
    subTasks.value.every(st => st.titre?.trim() !== '');
}

function markInvalidInputs() {
  document.querySelectorAll('#taskModal .is-invalid').forEach((input) => {
    input.classList.remove('is-invalid');
  });
  if (!title.value.trim()) {
    document.querySelector('#title').classList.add('is-invalid');
  }
  if (!room.value.trim()) {
    document.querySelector('#room').classList.add('is-invalid');
  }
  subTasks.value.forEach((st, index) => {
    if (!st.titre?.trim()) {
      document
        .querySelectorAll('#taskModal .card.card-body.bg-light.mb-2')[index]
        ?.querySelector('input')
        ?.classList.add('is-invalid');
    }
  });
}

async function submit() {
  if (!formIsValid()) {
    markInvalidInputs();
    return;
  }
  switchIsButtonActiveById(SUBMIT_BUTTON_ID);
  const taskPayload = {
    title: title.value,
    room: room.value,
    description: description.value,
    recurring: recurring.value,
    automaticAssignment: automaticAssignment.value,
    occurrences: occurrences.value,
    subTasks: subTasks.value,
    images: images.value
  };
  let success;
  if (isEditing.value) {
    modalStore.editingTask.images = [...images.value];
    success = await taskStore.updateTask({
      ...modalStore.editingTask,
      ...taskPayload
    });
  } else {
    success = await taskStore.addTask(taskPayload);
  }
  switchIsButtonActiveById(SUBMIT_BUTTON_ID);
  if (success) {
    resetForm();
    switchIsButtonActiveById(SUBMIT_BUTTON_ID);
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
  filesToAdd.forEach((file) => {
    if (!isValidImage(file)) {
      return;
    }
    const guid = generateGUID();
    const extension = file.name.split('.').pop();
    const randomFileName = `${guid}.${extension}`;

    const renamedFile = new File([file], randomFileName, { type: file.type });
    const preview = URL.createObjectURL(renamedFile);

    images.value.push({
      file: renamedFile,
      name: randomFileName,
      preview
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

/**
 * Fonction pour créer un guid aléatoire
 */
function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const random = (Math.random() * 16) | 0;
    const guid = c === 'x' ? random : (random & 0x3) | 0x8;
    return guid.toString(16);
  });
}

</script>
