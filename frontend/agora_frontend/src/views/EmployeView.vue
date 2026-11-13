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

    <form v-else class="mx-auto" @submit.prevent="save" @reset.prevent="taskStore.loadMyTasks()">
      <div v-for="task in taskStore.myTasks" :key="task.tacheAFaireId" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div class="form-check d-flex align-items-center gap-2">
              <input class="form-check-input" type="checkbox" :id="'task-' + task.tacheAFaireId"
                v-model="task.isCompleted" />
              <label class="form-check-label" :for="'task-' + task.tacheAFaireId">
                {{ task.title }}
                <span class="badge bg-secondary ms-2">Début : {{ task.heureDebut }}</span>
                <span class="badge bg-secondary ms-2">Fin : {{ task.heureFin }}</span>
              </label>
            </div>
            <button type="button" class="btn btn-outline-primary btn-sm" @click="toggleDetails(task.tacheAFaireId)">
              {{ detailledTasks.has(task.tacheAFaireId) ? 'Moins de détails' : 'Plus de détails' }}
            </button>
          </div>

          <div v-for="sub in task.sousTaches" :key="sub.id" class="form-check ms-4 mt-2">
            <input class="form-check-input" type="checkbox" :id="'sub-' + task.tacheAFaireId + '-' + sub.id"
              v-model="sub.isCompleted" />
            <label class="form-check-label" :for="'sub-' + task.tacheAFaireId + '-' + sub.id">
              {{ sub.titre }}
            </label>
          </div>
        </div>

        <div v-if="printing || detailledTasks.has(task.tacheAFaireId)" class="card-footer bg-light task-details">
          <p class="mb-1"><strong>Local :</strong> {{ task.room }}</p>
          <p class="mb-2"><strong>Description :</strong> {{ task.description }}</p>
          <label :for="'comment-' + task.tacheAFaireId" class="form-label">
            <strong>Commentaire :</strong>
          </label>
          <textarea class="form-control" rows="2" maxlength="1000" :id="'comment-' + task.tacheAFaireId"
            v-model="task.commentaire"></textarea>
        </div>
      </div>

      <p v-if="message" class="text-center">{{ message }}</p>

      <div class="d-flex justify-content-center gap-2 mt-4">
        <button type="submit" class="btn btn-primary" :disabled="saving">Sauvegarder</button>
        <button type="reset" class="btn btn-danger">Réinitialiser</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, onUnmounted, reactive, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore.js'
import { nextTick } from 'vue'
import 'bootstrap-icons/font/bootstrap-icons.css'

const taskStore = useTaskStore()
const detailledTasks = reactive(new Set())
const checkedIds = ref([])
const saving = ref(false)
const message = ref('')
const printing = ref(false)

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

async function afterPrint() {
  printing.value = false
  await nextTick();
}

async function save() {
  saving.value = true
  message.value = ''
  try {
    const ok = await taskStore.saveProgress(checkedIds.value)
    message.value = ok ? 'Progression enregistrée.' : "Échec de l'enregeistrement."
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

onMounted(() => {
  taskStore.loadTasks()
  taskStore.loadMyTasks()

  window.addEventListener('keydown', handleKeydown)
  window.addEventListener('afterprint', afterPrint)
})

onUnmounted(() => {
  window.addEventListener('keydown', handleKeydown)
  window.removeEventListener('afterprint', afterPrint)
})
</script>

<style scoped>
@media print {
  .btn {
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
