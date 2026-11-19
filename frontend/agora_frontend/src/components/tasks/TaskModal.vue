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
                    list="roomSuggestions" autocomplete="off" required />
                  <datalist id="roomSuggestions">
                    <option v-for="suggestedRoom in roomSuggestions" :key="suggestedRoom" :value="suggestedRoom" />
                  </datalist>
                  <div id="roomError" class="invalid-feedback">Le local est requis.</div>
                </div>
                <div class="form-group mb-3">
                  <label for="taskPriority" class="form-label">Priorité globale *</label>
                  <select v-model="selectedPriorityId" id="taskPriority" class="form-select" required
                    @change="handleTaskPriorityChange">
                    <option value="" disabled>Choisir une priorité globale</option>
                    <option v-for="priority in taskPriorities" :key="priority.id" :value="priority.id">
                      {{ priority.task_priority }}
                    </option>
                  </select>
                  <div id="taskPriorityError" class="invalid-feedback">La priorité globale est requise.</div>
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
                <div class="d-flex flex-wrap gap-2 mb-4">
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

                <div class="d-flex justify-content-between align-items-center mb-2">
                  <h3 class="fs-5 text-primary m-0">Documents PDF</h3>
                  <button id="addPdfFileBtn" type="button" class="btn btn-sm btn-outline-success"
                    @click="openPdfPicker">
                    + Ajouter un PDF
                  </button>
                </div>
                <input ref="inputPdfs" type="file" id="pdfInput" name="documents" accept=".pdf,application/pdf" multiple
                  class="d-none" @change="handlePdfChange" />
                <div class="input-group input-group-sm mb-3">
                  <input v-model="embeddedPdfUrl" id="embeddedPdfUrlInput" type="url" class="form-control"
                    placeholder="Ou intégrer l'URL d'un PDF (https://.../doc.pdf)" />
                  <button id="addEmbeddedPdfBtn" type="button" class="btn btn-outline-primary" @click="addEmbeddedPdf">
                    Intégrer PDF
                  </button>
                </div>
                <div v-if="documents.length > 0" class="mb-3">
                  <div v-for="(doc, index) in documents" :key="doc.id || `${doc.filename || doc.name}-${index}`"
                    class="d-flex justify-content-between align-items-center border rounded p-2 mb-2 bg-light pdf-item">
                    <span class="small fw-semibold text-truncate">{{ doc.filename || doc.name }}</span>
                    <button type="button" class="btn btn-sm btn-outline-danger remove-pdf-btn"
                      @click="removeDocument(index)">
                      Supprimer
                    </button>
                  </div>
                  <TaskPdfPreview :documents="documents" />
                </div>
              </div>

              <div class="col-lg-6">
                <div v-if="!isLowestPrioritySelected" id="occurrencesSection">
                  <div class="d-flex justify-content-between align-items-center mb-2">
                    <h3 class="fs-5 text-primary m-0">2. Horaires & Fréquence (Occurrences)</h3>
                    <button id="addOccurrenceBtn" type="button" class="btn btn-sm btn-outline-success"
                      @click="addOccurrence">
                      + Ajouter un horaire
                    </button>
                  </div>
                  <p class="text-muted small mb-3">Définissez les moments de la semaine où cette tâche doit être
                    effectuée.</p>
                  <div v-if="showMissingOccurrencesError" id="occurrencesError"
                    class="alert alert-danger py-2 small mb-3">
                    Veuillez ajouter au moins un horaire pour cette priorité.
                  </div>
                  <div v-if="occurrences.length === 0" class="alert alert-secondary py-2 small text-center mb-3">
                    Aucun horaire défini.
                  </div>
                  <div v-for="(occ, index) in occurrences" :key="index"
                    class="card card-body bg-light mb-3 position-relative p-3 occurrence-card">
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
                        <label class="form-label small fw-bold">Priorité *</label>
                        <select v-model="occ.taskPriorityId"
                          class="form-select form-select-sm occurrence-priority-select" required>
                          <option value="" disabled>Choisir une priorité</option>
                          <option v-for="priority in taskPriorities" :key="priority.id" :value="priority.id">
                            {{ priority.task_priority }}
                          </option>
                        </select>
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
                          <input type="checkbox" v-model="occ.isRequired" class="form-check-input"
                            :id="`req-${index}`" />
                          <label class="form-check-label small" :for="`req-${index}`">Est obligatoire</label>
                        </div>
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
                  class="card card-body bg-light mb-2 p-2 position-relative subtask-card">
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

                <div class="d-flex justify-content-between align-items-center mb-2 mt-4">
                  <h3 class="fs-5 text-primary m-0">4. Liens externes</h3>
                  <button id="addExternalLinkBtn" type="button" class="btn btn-sm btn-outline-success"
                    @click="addExternalLink">
                    + Ajouter un lien
                  </button>
                </div>
                <p class="text-muted small mb-3">Liens vers des documents externes (s'ouvrent dans un nouvel onglet).
                </p>
                <div v-if="externalLinks.length === 0" class="alert alert-secondary py-2 small text-center mb-3">
                  Aucun lien externe défini.
                </div>
                <div v-for="(link, index) in externalLinks" :key="index"
                  class="card card-body bg-light mb-2 p-2 position-relative external-link-card">
                  <button type="button" class="btn-close position-absolute top-0 end-0 m-2 remove-external-link-btn"
                    aria-label="Supprimer" @click="removeExternalLink(index)"></button>
                  <div class="pe-4">
                    <input type="text" v-model="link.title" placeholder="Titre du document (optionnel)"
                      class="form-control form-control-sm mb-1 external-link-title" />
                    <input type="url" v-model="link.url" placeholder="https://exemple.com/document *"
                      class="form-control form-control-sm external-link-url" required />
                    <div class="invalid-feedback">Veuillez entrer une URL valide (http:// ou https://).</div>
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
import { computed, ref, watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore'
import { useTaskPriorityStore } from '@/stores/taskPriorityStore'
import { useModalStore } from '@/stores/modalStore'
import { switchIsButtonActiveById } from '@/utils/dom-manipulation'
import {
  sortTaskPriorities,
  isLowestPriority,
  isValidExternalUrl,
  isPdfFileType,
} from '@/utils/taskPriorityHelpers'
import TaskPdfPreview from '@/components/tasks/TaskPdfPreview.vue'

const taskStore = useTaskStore()
const taskPriorityStore = useTaskPriorityStore()
const modalStore = useModalStore()

const SUBMIT_BUTTON_ID = 'submitBtn'
const MAX_IMAGES = 5
const MAX_FILE_SIZE = 5 * 1024 * 1024
const MAX_PDF_SIZE = 10 * 1024 * 1024

const title = ref('')
const room = ref('')
const description = ref('')
const recurring = ref(false)
const automaticAssignment = ref(false)
const selectedPriorityId = ref('')
const previousPriorityId = ref('')
const occurrences = ref([])
const subTasks = ref([])
const images = ref([])
const documents = ref([])
const externalLinks = ref([])
const embeddedPdfUrl = ref('')
const showMissingOccurrencesError = ref(false)
const inputPhotos = ref(null)
const inputPdfs = ref(null)
const isDragging = ref(false)

const isEditing = computed(() => !!modalStore.editingTask)
const taskPriorities = computed(() => sortTaskPriorities(taskPriorityStore.taskPriorities))
const defaultPriorityId = computed(() => taskPriorities.value[0]?.id ?? '')
const isLowestPrioritySelected = computed(() =>
  isLowestPriority(selectedPriorityId.value, taskPriorities.value)
)

const roomSuggestions = computed(() => {
  const tasks = taskStore.tasks ?? []
  return [...new Set(tasks.map((t) => t.room?.trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'fr')
  )
})

function syncPrioritySelectionWithTask() {
  if (!selectedPriorityId.value && defaultPriorityId.value) {
    selectedPriorityId.value = defaultPriorityId.value
    previousPriorityId.value = defaultPriorityId.value
  }
  occurrences.value.forEach((occ) => {
    if (!occ.taskPriorityId && selectedPriorityId.value) {
      occ.taskPriorityId = selectedPriorityId.value
    }
  })
}

watch(
  () => modalStore.taskModalOpen,
  async (isOpen) => {
    if (isOpen) {
      await taskPriorityStore.loadTaskPriorities()
      if (modalStore.editingTask) {
        populateFormFromTask(modalStore.editingTask)
      } else {
        syncPrioritySelectionWithTask()
      }
    }
  },
  { immediate: true }
)

function resolveInitialTaskPriority(task) {
  const firstOccPrio = task.occurrences?.[0]?.taskPriorityId ?? task.occurrences?.[0]?.priority?.id
  return task.taskPriorityId ?? task.priority?.id ?? firstOccPrio ?? defaultPriorityId.value
}

function populateFormFromTask(task) {
  title.value = task.title ?? ''
  room.value = task.room ?? ''
  description.value = task.description ?? ''
  recurring.value = task.recurring ?? false
  automaticAssignment.value = task.automaticAssignment ?? false
  const resolvedPriority = resolveInitialTaskPriority(task)
  selectedPriorityId.value = resolvedPriority
  previousPriorityId.value = resolvedPriority
  occurrences.value = (task.occurrences ?? []).map((occ) => ({
    ...occ,
    taskPriorityId: occ.taskPriorityId ?? occ.priority?.id ?? resolvedPriority,
  }))
  subTasks.value = (task.sous_taches ?? []).map((st) => ({
    id: st.id,
    tacheId: st.tacheId,
    titre: st.titre ?? '',
    description: st.description ?? '',
  }))
  images.value = (task.images ?? []).map((img) => ({
    ...img,
    preview: img.preview ?? img.path ?? img.url,
  }))
  documents.value = (task.documents ?? []).map((doc) => ({
    ...doc,
    preview: doc.preview ?? doc.path ?? doc.url,
  }))
  externalLinks.value = (task.externalLinks ?? []).map((link) => ({
    id: link.id,
    title: link.title ?? '',
    url: link.url ?? '',
  }))
}

watch(
  () => modalStore.editingTask,
  (task) => {
    if (task) {
      populateFormFromTask(task)
    } else {
      resetForm()
    }
  },
  { immediate: true }
)

function handleTaskPriorityChange() {
  showMissingOccurrencesError.value = false
  if (isLowestPrioritySelected.value) {
    occurrences.value = []
    previousPriorityId.value = selectedPriorityId.value
    return
  }
  occurrences.value.forEach((occ) => {
    const matchesPrevious = Number(occ.taskPriorityId) === Number(previousPriorityId.value)
    if (!occ.taskPriorityId || matchesPrevious) {
      occ.taskPriorityId = selectedPriorityId.value
    }
  })
  previousPriorityId.value = selectedPriorityId.value
}

function revokeBlobUrls(list) {
  list.forEach((item) => {
    if (item?.preview && item.preview.startsWith('blob:')) {
      URL.revokeObjectURL(item.preview)
    }
  })
}

function resetForm() {
  revokeBlobUrls(images.value)
  revokeBlobUrls(documents.value)
  title.value = ''
  room.value = ''
  description.value = ''
  recurring.value = false
  automaticAssignment.value = false
  selectedPriorityId.value = defaultPriorityId.value
  previousPriorityId.value = defaultPriorityId.value
  occurrences.value = []
  subTasks.value = []
  images.value = []
  documents.value = []
  externalLinks.value = []
  embeddedPdfUrl.value = ''
  showMissingOccurrencesError.value = false
  if (inputPhotos.value) inputPhotos.value.value = ''
  if (inputPdfs.value) inputPdfs.value.value = ''
}

function close() {
  resetForm()
  modalStore.closeTaskModal()
}

function addOccurrence() {
  showMissingOccurrencesError.value = false
  occurrences.value.push({
    journee: 'lundi',
    heureDebut: '',
    heureFin: '',
    taskPriorityId: selectedPriorityId.value || defaultPriorityId.value,
    isRequired: true,
  })
}

function removeOccurrence(index) {
  occurrences.value.splice(index, 1)
}

function addSubTask() {
  subTasks.value.push({ titre: '', description: '' })
}

function removeSubTask(index) {
  subTasks.value.splice(index, 1)
}

function addExternalLink() {
  externalLinks.value.push({ title: '', url: '' })
}

function removeExternalLink(index) {
  externalLinks.value.splice(index, 1)
}

function areOccurrencesValid() {
  if (isLowestPrioritySelected.value) {
    return true
  }
  return (
    occurrences.value.length > 0 &&
    occurrences.value.every((occ) => Boolean(occ.taskPriorityId) && Boolean(occ.journee))
  )
}

function formIsValid() {
  return (
    title.value.trim() !== '' &&
    room.value.trim() !== '' &&
    areOccurrencesValid() &&
    subTasks.value.every((st) => st.titre?.trim() !== '') &&
    externalLinks.value.every((link) => isValidExternalUrl(link.url))
  )
}

function markInvalidSubTasksAndLinks() {
  subTasks.value.forEach((st, index) => {
    if (!st.titre?.trim()) {
      document.querySelectorAll('#taskModal .subtask-card')[index]
        ?.querySelector('input')
        ?.classList.add('is-invalid')
    }
  })
  externalLinks.value.forEach((link, index) => {
    if (!isValidExternalUrl(link.url)) {
      document.querySelectorAll('#taskModal .external-link-card')[index]
        ?.querySelector('.external-link-url')
        ?.classList.add('is-invalid')
    }
  })
}

function markInvalidInputs() {
  document.querySelectorAll('#taskModal .is-invalid').forEach((el) => el.classList.remove('is-invalid'))
  if (!title.value.trim()) document.querySelector('#title')?.classList.add('is-invalid')
  if (!room.value.trim()) document.querySelector('#room')?.classList.add('is-invalid')
  showMissingOccurrencesError.value = !isLowestPrioritySelected.value && occurrences.value.length === 0
  markInvalidSubTasksAndLinks()
}

function buildTaskPayload() {
  return {
    title: title.value,
    room: room.value,
    description: description.value,
    recurring: recurring.value,
    automaticAssignment: automaticAssignment.value,
    taskPriorityId: selectedPriorityId.value || null,
    occurrences: isLowestPrioritySelected.value ? [] : occurrences.value,
    subTasks: subTasks.value,
    images: images.value,
    documents: documents.value,
    externalLinks: externalLinks.value.map((l) => ({
      title: l.title?.trim() || l.url.trim(),
      url: l.url.trim(),
    })),
  }
}

async function submit() {
  if (!formIsValid()) {
    markInvalidInputs()
    return
  }
  switchIsButtonActiveById(SUBMIT_BUTTON_ID)
  const taskPayload = buildTaskPayload()
  const success = isEditing.value
    ? await taskStore.updateTask({ ...modalStore.editingTask, ...taskPayload })
    : await taskStore.addTask(taskPayload)
  switchIsButtonActiveById(SUBMIT_BUTTON_ID)
  if (success) {
    resetForm()
    switchIsButtonActiveById(SUBMIT_BUTTON_ID)
    close()
  }
}

function openFilePicker() {
  inputPhotos.value?.click();
}

function openPdfPicker() {
  inputPdfs.value?.click();
}

function handleDragOver() {
  isDragging.value = true;
}

function handleDragLeave() {
  isDragging.value = false;
}

function handleDrop(event) {
  isDragging.value = false;
  addFiles(Array.from(event.dataTransfer.files));
}

function handleFileChange(event) {
  addFiles(Array.from(event.target.files))
  event.target.value = ''
}

function handlePdfChange(event) {
  addPdfFiles(Array.from(event.target.files))
  event.target.value = ''
}

function generateRandomFileName(file) {
  const ext = file.name.split('.').pop()
  return `${generateGUID()}.${ext}`
}

function addFiles(files) {
  const remainingSlots = MAX_IMAGES - images.value.length
  if (remainingSlots <= 0) return
  files.slice(0, remainingSlots).forEach((file) => {
    if (!isValidImage(file)) return
    const randomFileName = generateRandomFileName(file)
    const renamedFile = new File([file], randomFileName, { type: file.type })
    images.value.push({
      file: renamedFile,
      name: randomFileName,
      preview: URL.createObjectURL(renamedFile),
    })
  })
}

function addPdfFiles(files) {
  files.forEach((file) => {
    if (!isValidPdf(file)) return
    const randomFileName = generateRandomFileName(file)
    const renamedFile = new File([file], randomFileName, { type: file.type })
    const preview = URL.createObjectURL(renamedFile)
    documents.value.push({
      file: renamedFile,
      filename: randomFileName,
      name: randomFileName,
      mimeType: 'application/pdf',
      preview,
    })
  })
}

function addEmbeddedPdf() {
  const url = embeddedPdfUrl.value.trim()
  if (!isValidExternalUrl(url)) return
  const filename = url.split('/').pop()?.split('?')[0] || 'document.pdf'
  documents.value.push({
    filename,
    name: filename,
    path: url,
    preview: url,
    mimeType: 'application/pdf',
  })
  embeddedPdfUrl.value = ''
}

function isValidImage(file) {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/bmp', 'image/webp']
  if (!allowedTypes.includes(file.type)) {
    alert(`${file.name} n'est pas un format d'image accepté.`)
    return false
  }
  if (file.size > MAX_FILE_SIZE) {
    alert(`${file.name} dépasse la limite de 5 Mo.`)
    return false
  }
  return true
}

function isValidPdf(file) {
  if (!isPdfFileType(file)) {
    alert(`${file.name} n'est pas un fichier PDF valide.`)
    return false
  }
  if (file.size > MAX_PDF_SIZE) {
    alert(`${file.name} dépasse la limite de 10 Mo.`)
    return false
  }
  return true
}

function removeImage(index) {
  const image = images.value[index]
  if (image?.preview && image.preview.startsWith('blob:')) {
    URL.revokeObjectURL(image.preview)
  }
  images.value.splice(index, 1)
}

function removeDocument(index) {
  const doc = documents.value[index]
  if (doc?.preview && doc.preview.startsWith('blob:')) {
    URL.revokeObjectURL(doc.preview)
  }
  documents.value.splice(index, 1)
}

/**
 * Fonction pour créer un guid aléatoire
 */
function generateGUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const random = (Math.random() * 16) | 0
    const guid = c === 'x' ? random : (random & 0x3) | 0x8
    return guid.toString(16)
  })
}
</script>
