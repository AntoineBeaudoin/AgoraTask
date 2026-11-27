<template>
  <section class="container py-5">

    <div class="employee-calendar mb-4">
      <div class="calendar-controls d-flex align-items-center justify-content-center gap-3">

        <button type="button" class="btn btn-outline-success calendar-nav" aria-label="Jour précédent"
          @click="changeDate(-1)">
          <i class="bi bi-chevron-left"></i>
        </button>

        <div class="text-center">
          <label for="selectedDate" class="form-label small fw-bold mb-1">
            Calendrier
          </label>

          <input id="selectedDate" type="date" class="form-control text-center" :min="today" :value="selectedDate"
            :max="maxSelectableDate" @change="selectDate($event.target.value)" />
        </div>

        <button type="button" class="btn btn-outline-success calendar-nav" aria-label="Jour suivant"
          :disabled="selectedDate >= maxSelectableDate" @click="changeDate(1)">
          <i class="bi bi-chevron-right"></i>
        </button>

      </div>

      <h1 class="mt-4 mb-0 text-center">
        Tâches pour {{ authStore.getEmail() }} le {{ formattedSelectedDate }}
      </h1>
    </div>

    <TaskDescriptionModal />
    <button class="btn btn-success mb-3" @click="printPage()"
      v-if="taskStore.myTasksLoaded && taskStore.myTasks.length > 0">
      <i class="bi bi-printer" aria-hidden="true"></i> Imprimer l'horaire</button>
    <link rel="stylesheet" href="">

    <p v-if="taskStore.myTasksLoaded && taskStore.myTasks.length === 0" class="text-center text-muted">
      Aucune tâche ne vous est assignée.
    </p>

    <form v-else class="mx-auto" @submit.prevent="submit" @reset.prevent="taskStore.loadEmployeeInterface(selectedDate)">
      <div v-for="task in taskStore.myTasks" :key="task.tacheAFaireId" class="card mb-3">

        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div class="form-check d-flex align-items-center gap-2">
              <input class="form-check-input" type="checkbox" :id="'task-' + task.tacheAFaireId"
                v-model="task.isCompleted" @change="toggleTaskCompletion(task)" />

              <label class="form-check-label" :for="'task-' + task.tacheAFaireId">
                {{ task.title }}

                <span class="badge bg-secondary ms-2">
                  Début : {{ task.heureDebut }}
                </span>
                <span class="badge bg-secondary ms-2">
                  Fin : {{ task.heureFin }}
                </span>
                <span v-if="task.room" class="badge bg-secondary ms-2">
                  Local : {{ task.room }}
                </span>
                <button type="button" class="d-inline-block btn btn-outline-success btn-sm ms-2"
                  :aria-expanded="isTaskCommentOpen(task)" @click="toggleTaskComment(task)">
                  {{ isTaskCommentOpen(task) ? 'Masquer' : 'Commenter' }}
                </button>
              </label>
            </div>

            <div class="d-flex gap-2">
              <button type="button" class="btn btn-outline-success btn-sm task-details-btn"
                @click="openTaskDetails(task)">
                Détails
              </button>
            </div>
          </div>

          <div class="mt-2">
            <div v-if="isTaskCommentOpen(task)" class="mt-1">
              <label class="form-label small fw-bold mb-1">
                Commentaire – {{ task.title }}
              </label>

              <textarea class="form-control form-control-sm" rows="2" maxlength="1000"
                placeholder="Commentaire sur cette tâche" :id="'comment-' + task.tacheAFaireId"
                v-model="task.commentaire"></textarea>
            </div>
          </div>

          <div v-for="sub in task.sousTaches" :key="sub.id" class="ms-4 mt-2">
            <div class="d-flex align-items-center gap-2">
              <div class="form-check mb-0">
                <input class="form-check-input" type="checkbox" :id="'sub-' + subKey(task, sub)"
                  v-model="sub.isCompleted" @change="save" />
                <label class="form-check-label" :for="'sub-' + subKey(task, sub)">
                  {{ sub.titre }}
                </label>
              </div>

              <button type="button" class="btn btn-outline-success btn-sm" :aria-expanded="isSubCommentOpen(task, sub)"
                @click="toggleSubComment(task, sub)">
                {{ isSubCommentOpen(task, sub) ? 'Masquer' : 'Commenter' }}
              </button>
            </div>

            <div v-if="isSubCommentOpen(task, sub)" class="mt-1">
              <label class="form-label small fw-bold mb-1">
                Commentaire – {{ sub.titre }}
              </label>

              <textarea class="form-control form-control-sm" rows="2" maxlength="1000"
                placeholder="Commentaire sur cette sous-tâche" :id="'sub-comment-' + subKey(task, sub)"
                v-model="sub.commentaire"></textarea>
            </div>
          </div>
        </div>

        <div v-if="printing || detailledTasks.has(task.tacheAFaireId)" class="card-footer bg-light task-details">
          <TaskPdfPreview :documents="task.documents ?? []" />
          <TaskExternalLinks :links="task.externalLinks ?? []" />
        </div>

      </div>

      <div class="card-footer">
        <label for="dailyComment" class="form-label">Commentaire de la journée</label>
        <textarea class="form-control" rows="2" maxlength="1000" id="dailyComment" name="dailyComment"
          v-model="taskStore.dailyComment"></textarea>
      </div>

      <div v-if="!taskStore.isDaySubmitted" class="d-flex justify-content-center gap-2 mt-4">
        <button type="submit" class="btn btn-success" id="btn-soumettre" :disabled="saving || !validation.valid">
          Soumettre
        </button>
      </div>

      <p v-if="taskStore.isDaySubmitted" class="text-center text-success fw-bold mt-4" id="msg-soumission-reussie">
        Journée soumise avec succès !
      </p>

      <p v-else-if="message" id="msg-erreur" class="text-center">
        {{ message }}
      </p>

      <p v-if="!taskStore.isDaySubmitted && !validation.valid && validation.message"
        class="text-center text-muted small mt-2" id="msg-validation">
        {{ validation.message }}
      </p>
    </form>
  </section>
</template>

<script setup>
import { computed, nextTick, onMounted, onUnmounted, reactive, ref, watch } from 'vue'
import { useTaskStore } from '@/stores/taskStore.js'
import { useAuthStore } from '@/stores/auth'
import { useModalStore } from '@/stores/modalStore.js'
import { todayString } from '@/utils/dateHelpers'
import TaskDescriptionModal from '@/components/tasks/TaskDescriptionModal.vue'
import TaskPdfPreview from '@/components/tasks/TaskPdfPreview.vue'
import TaskExternalLinks from '@/components/tasks/TaskExternalLinks.vue'
import 'bootstrap-icons/font/bootstrap-icons.css'

const taskStore = useTaskStore()
const authStore = useAuthStore()
const modalStore = useModalStore()
const detailledTasks = reactive(new Set())
const openSubComments = reactive(new Set())
const openTaskComments = reactive(new Set())
const saving = ref(false)
const message = ref('')
const printing = ref(false)

const today = todayString()
const selectedDate = ref(today)

const maxSelectableDate = addDays(today, 7)

const formattedSelectedDate = computed(() => {
  const [year, month, day] = selectedDate.value.split('-')
  const date = new Date(Number(year), Number(month) - 1, Number(day))

  const formatted = new Intl.DateTimeFormat('fr-CA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(date)

  return formatted.charAt(0).toUpperCase() + formatted.slice(1)
})

function addDays(dateString, amount) {
  const [year, month, day] = dateString.split('-').map(Number)
  const date = new Date(year, month - 1, day)

  date.setDate(date.getDate() + amount)

  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')

  return `${y}-${m}-${d}`
}

function changeDate(amount) {
  const newDate = addDays(selectedDate.value, amount)
  if ( newDate < today || newDate > maxSelectableDate) return

  selectedDate.value = newDate
}

function selectDate(date) {
  if (!date || date < today || date > maxSelectableDate) return

  selectedDate.value = date
}

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

  await new Promise(resolve => setTimeout(resolve, 250))

  if (document.fonts?.ready) {
    await document.fonts.ready
  }

  window.print()
}

function isTaskCommentOpen(task) {
  return printing.value || openTaskComments.has(task.tacheAFaireId)
}

async function toggleTaskCompletion(task) {
  if (taskStore.isDaySubmitted) return

  if (task.isCompleted) {
    for (const sub of task.sousTaches ?? []) {
      sub.isCompleted = true
    }
  }

  await save()
}

function toggleTaskComment(task) {
  const id = task.tacheAFaireId

  if (openTaskComments.has(id)) {
    openTaskComments.delete(id)
  } else {
    openTaskComments.add(id)
  }
}

function subKey(task, sub) {
  return task.tacheAFaireId + '-' + sub.id
}

function isSubCommentOpen(task, sub) {
  return printing.value || openSubComments.has(subKey(task, sub))
}

function toggleSubComment(task, sub) {
  const key = subKey(task, sub)
  if (openSubComments.has(key)) {
    openSubComments.delete(key)
  } else {
    openSubComments.add(key)
  }
}

watch(selectedDate, async (newDate, oldDate) => {
  if (newDate === oldDate) return

  message.value = ''

  detailledTasks.clear()
  openSubComments.clear()
  openTaskComments.clear()

  await taskStore.loadEmployeeInterface(newDate)
})

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
  await taskStore.loadEmployeeInterface(selectedDate.value)

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('afterprint', afterPrint)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
  window.removeEventListener('afterprint', afterPrint)
})
</script>

<style scoped>
h1 {
  font-size: 1.7rem;
}

.employee-calendar {
  max-width: 850px;
  margin: 0 auto 2rem;
}

.calendar-nav {
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

#selectedDate {
  width: 190px;
  cursor: pointer;
}

@media (max-width: 576px) {
  .employee-calendar h1 {
    font-size: 1.35rem;
  }

  #selectedDate {
    width: 165px;
  }
}

.form-check-input {
  width: 1.25em;
  height: 1.25em;
  margin-top: 0;
  border: 2px solid #198754;
  cursor: pointer;
  transition: background-color 0.15s, border-color 0.15s;
}

.form-check-input:checked {
  background-color: #198754;
  border-color: #198754;
}

.form-check-input:focus {
  border-color: #198754;
  box-shadow: 0 0 0 0.2rem rgba(25, 135, 84, 0.2);
}

.form-check-label {
  cursor: pointer;
}

.btn-success {
  background-color: #198754;
  border-color: #198754;
}

.btn-success:hover {
  background-color: #157347;
  border-color: #146c43;
}

.btn-outline-success:hover {
  background-color: #198754;
  border-color: #198754;
}

.btn {
  transition: background-color 0.2s, border-color 0.2s, box-shadow 0.2s;
}

@media print {
  .btn {
    display: none !important;
  }

   .calendar-controls {
    display: none !important;
  }

  #msg-erreur,
  #msg-validation,
  #msg-soumission-reussie {
    display: none !important;
  }

  .card-footer {
    display: block !important;
    break-inside: avoid;
  }

  .task-details {
    display: block !important;
    break-inside: avoid;
  }

  textarea::placeholder {
    color: transparent !important;
    opacity: 0 !important;
  }

  .form-label {
    display: block !important;
    font-weight: bold !important;
    color: black !important;
  }

  textarea {
    border: none !important;
    resize: none;
    background: transparent !important;
    color: black !important;
  }
}
</style>
