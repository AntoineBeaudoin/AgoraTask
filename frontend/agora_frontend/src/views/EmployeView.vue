<template>
  <section class="container py-5">
    <h1 class="mb-4 text-center">Vos tâches</h1>
    <TaskDescriptionModal />
    <button class="btn btn-primary mb-3" @click="printPage()" v-if="taskStore.myTasksLoaded && taskStore.myTasks.length > 0">
      <i class="bi bi-printer" aria-hidden="true"></i> Imprimer l'horaire</button>
    <link rel="stylesheet" href="">

    <p v-if="taskStore.myTasksLoaded && taskStore.myTasks.length === 0" class="text-center text-muted">
      Aucune tâche ne vous est assignée.
    </p>

    <form v-else class="mx-auto" @submit.prevent="submit" @reset.prevent="taskStore.loadEmployeeInterface()">
      <div v-for="task in taskStore.myTasks" :key="task.tacheAFaireId" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div class="form-check d-flex align-items-center gap-2">
              <input class="form-check-input" type="checkbox" :id="'task-' + task.tacheAFaireId"
                v-model="task.isCompleted" @change="save" />
              <label class="form-check-label" :for="'task-' + task.tacheAFaireId">
                {{ task.title }}
                <span class="badge bg-secondary ms-2">Début : {{ task.heureDebut }}</span>
                <span class="badge bg-secondary ms-2">Fin : {{ task.heureFin }}</span>
              </label>
            </div>
            <div class="d-flex gap-2">
              <button type="button" class="btn btn-info btn-sm task-details-btn" @click="openTaskDetails(task)">
                Détails
              </button>
              <button type="button" class="btn btn-outline-primary btn-sm toggle-details-btn"
                @click="toggleDetails(task.tacheAFaireId)">
                {{ detailledTasks.has(task.tacheAFaireId) ? 'Moins de détails' : 'Plus de détails' }}
              </button>
            </div>
          </div>
          <!-- Le visuel sera changé dans la branche de css -->
          <div v-for="sub in task.sousTaches" :key="sub.id" class="ms-4 mt-2">
            <div class="d-flex align-items-center gap-2">
              <div class="form-check mb-0">
                <input class="form-check-input" type="checkbox" :id="'sub-' + subKey(task, sub)"
                  v-model="sub.isCompleted" @change="save" />
                <label class="form-check-label" :for="'sub-' + subKey(task, sub)">
                  {{ sub.titre }}
                </label>
              </div>

              <button type="button" class="btn btn-link btn-sm p-0"
                :aria-expanded="isSubCommentOpen(task, sub)" @click="toggleSubComment(task, sub)">
                <i class="bi" aria-hidden="true"></i>
                {{ isSubCommentOpen(task, sub) ? 'Masquer' : 'Commenter' }}
              </button>
            </div>

            <div v-if="isSubCommentOpen(task, sub)" class="mt-1">
              <label class="visually-hidden" :for="'sub-comment-' + subKey(task, sub)">
                Commentaire pour {{ sub.titre }}
              </label>
              <textarea class="form-control form-control-sm" rows="2" maxlength="1000"
                placeholder="Commentaire sur cette sous-tâche" :id="'sub-comment-' + subKey(task, sub)"
                v-model="sub.commentaire"></textarea>
            </div>
          </div>
        </div>

        <div v-if="printing || detailledTasks.has(task.tacheAFaireId)" class="card-footer bg-light task-details">
          <p class="mb-1"><strong>Local :</strong> {{ task.room }}</p>
          <p class="mb-2"><strong>Description :</strong> {{ task.description }}</p>
          <TaskPdfPreview :documents="task.documents ?? []" />
          <TaskExternalLinks :links="task.externalLinks ?? []" />
          <label :for="'comment-' + task.tacheAFaireId" class="form-label">
            <strong>Commentaire :</strong>
          </label>
          <textarea class="form-control" rows="2" maxlength="1000" :id="'comment-' + task.tacheAFaireId"
            v-model="task.commentaire"></textarea>
        </div>
      </div>

      <div class="card-footer bg-light">
          <label for="dailyComment" class="form-label">Commentaire de la journée</label>
          <textarea class="form-control" rows="2" maxlength="1000" id="dailyComment" name="dailyComment" v-model="taskStore.dailyComment"></textarea>
      </div>

      <p v-if="message" id="msg-erreur" class="text-center">{{ message }}</p>

          <div v-if="!taskStore.isDaySubmitted" class="d-flex justify-content-center gap-2 mt-4">
        <button
          type="submit"
          class="btn btn-primary"
          id="btn-soumettre"
          :disabled="saving || !validation.valid"
        >
          Soumettre
        </button>
      </div>

      <p
        v-if="taskStore.isDaySubmitted"
        class="text-center text-success fw-bold mt-4"
        id="msg-soumission-reussie"
      >
        Journée soumise avec succès !
      </p>

      <p
        v-else-if="message"
        id="msg-erreur"
        class="text-center"
      >
        {{ message }}
      </p>

      <p
        v-if="!taskStore.isDaySubmitted && !validation.valid && validation.message"
        class="text-center text-muted small mt-2"
        id="msg-validation"
      >
        {{ validation.message }}
      </p>
    </form>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore.js'
import { useModalStore } from '@/stores/modalStore.js'
import TaskDescriptionModal from '@/components/tasks/TaskDescriptionModal.vue'
import TaskPdfPreview from '@/components/tasks/TaskPdfPreview.vue'
import TaskExternalLinks from '@/components/tasks/TaskExternalLinks.vue'
import 'bootstrap-icons/font/bootstrap-icons.css'

const taskStore = useTaskStore()
const modalStore = useModalStore()
const detailledTasks = reactive(new Set())
const openSubComments = reactive(new Set())
const saving = ref(false)
const message = ref('')
const printing = ref(false)

const validation = computed(() =>
  taskStore.myTasks.length > 0
    ? taskStore.validateSubmission()
    : { valid: false, message: '' },
)

async function printPage() {
  printing.value = true

  await nextTick()

  await new Promise(resolve => requestAnimationFrame(() => {
    requestAnimationFrame(resolve)
  }))

  window.print()
}

function toggleDetails(id) {
  if (detailledTasks.has(id)) {
    detailledTasks.delete(id)
  } else {
    detailledTasks.add(id)
  }
}

function subKey(task, sub) {
  return task.tacheAFaireId + '-' + sub.id
}

function isSubCommentOpen(task, sub) {
  if (printing.value) return Boolean(sub.commentaire)
  return openSubComments.has(subKey(task, sub))
}

function toggleSubComment(task, sub) {
  const key = subKey(task, sub)
  if (openSubComments.has(key)) {
    openSubComments.delete(key)
  } else {
    openSubComments.add(key)
  }
}

watch(
  () => taskStore.myTasks,
  (tasks) => {
    for (const task of tasks ?? []) {
      for (const sub of task.sousTaches ?? []) {
        if (sub.commentaire) openSubComments.add(subKey(task, sub))
      }
    }
  },
  { immediate: true },
)

async function openTaskDetails(task) {
  const fullTask = (await taskStore.getTaskById(task.id)) || {}
  modalStore.openTaskDescription({
    ...fullTask,
    ...task,
    images: task.images ?? fullTask.images ?? [],
    documents: task.documents ?? fullTask.documents ?? [],
    externalLinks: task.externalLinks ?? fullTask.externalLinks ?? [],
    occurrences: fullTask.occurrences ?? task.occurrences ?? [],
    sous_taches: fullTask.sous_taches ?? task.sousTaches ?? [],
  })
}

async function afterPrint() {
  printing.value = false
  await nextTick();
}

async function save() {
  if (taskStore.isDaySubmitted) return

  saving.value = true
  message.value = ''

  try {
    const ok = await taskStore.saveProgress()

    if (!taskStore.isDaySubmitted) {
      message.value = ok
        ? 'Progression enregistrée.'
        : "Échec de l'enregistrement."
    }
  } finally {
    saving.value = false
  }
}

async function submit() {
  if (taskStore.isDaySubmitted || !validation.value.valid) return

  saving.value = true
  message.value = ''

  try {
    const result = await taskStore.submitDay()
    message.value = result.success ? '' : result.message
  } finally {
    saving.value = false
  }
}



function handleKeydown(event) {
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
    event.preventDefault()
    printPage()
  }
}

onMounted(async () => {
  await taskStore.loadTasks()
  await taskStore.loadEmployeeInterface()

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('afterprint', afterPrint)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('afterprint', afterPrint)
})
</script>

<style scoped>
@media print {
  .btn {
    display: none !important;
  }

  #msg-error, #msg-validation{
    display: none !important;
  }

  .card-footer {
    display: block !important;
    break-inside: avoid;
  }

  textarea {
    border: none;
    resize: none;
  }

  .task-details {
    display: block !important;
    break-inside: avoid;
  }

  textarea {
    border: none !important;
    resize: none;
    background: transparent !important;
    color: black !important;
  }
}
</style>
