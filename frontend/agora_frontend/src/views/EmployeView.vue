<template>
  <section class="container py-5">
    <h1 class="mb-4 text-center">Vos tâches</h1>
    <TaskDescriptionModal />
    <p v-if="taskStore.myTasksLoaded && taskStore.myTasks.length === 0" class="text-center text-muted">
      Aucune tâche ne vous est assignée.
    </p>

    <form v-else class="mx-auto" @submit.prevent="save" @reset.prevent="taskStore.loadEmployeeInterface()">
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

          <div v-for="sub in task.sousTaches" :key="sub.id" class="form-check ms-4 mt-2">
            <input class="form-check-input" type="checkbox" :id="'sub-' + task.tacheAFaireId + '-' + sub.id"
              v-model="sub.isCompleted" />
            <label class="form-check-label" :for="'sub-' + task.tacheAFaireId + '-' + sub.id">
              {{ sub.titre }}
            </label>
          </div>
        </div>

        <div v-if="detailledTasks.has(task.tacheAFaireId)" class="card-footer bg-light">
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

      <div class="d-flex justify-content-center gap-2 mt-4">
        <button type="reset" class="btn btn-danger">Réinitialiser</button>
      </div>
      <div class="d-flex justify-content-center gap-2 mt-4">
        <button type="submit" class="btn btn-primary" id="btn-soumettre" :disabled="saving">Soumettre</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import { onMounted, reactive, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore.js'
import { useModalStore } from '@/stores/modalStore.js'
import TaskDescriptionModal from '@/components/tasks/TaskDescriptionModal.vue'
import TaskPdfPreview from '@/components/tasks/TaskPdfPreview.vue'
import TaskExternalLinks from '@/components/tasks/TaskExternalLinks.vue'

const taskStore = useTaskStore()
const modalStore = useModalStore()
const detailledTasks = reactive(new Set())
const checkedIds = ref([])
const saving = ref(false)
const message = ref('')

function toggleDetails(id) {
  if (detailledTasks.has(id)) {
    detailledTasks.delete(id)
  } else {
    detailledTasks.add(id)
  }
}

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

onMounted(() => {
  taskStore.loadTasks()
  taskStore.loadEmployeeInterface()
})
</script>
