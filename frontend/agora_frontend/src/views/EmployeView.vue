<template>
  <section class="container py-5">
    <h1 class="mb-4 text-center">Vos tâches</h1>

    <p v-if="taskStore.loaded && taskStore.tasks.length === 0" class="text-center text-muted">
      Aucune tâche ne vous est assignée.
    </p>

    <form v-else class="mx-auto" @submit.prevent="save" @reset.prevent="taskStore.loadMyTasks()">
      <div v-for="task in taskStore.myTasks" :key="task.tacheAFaireId" class="card mb-3">
        <div class="card-body">
          <div class="d-flex justify-content-between align-items-center">
            <div class="form-check d-flex align-items-center gap-2">
              <input
                class="form-check-input"
                type="checkbox"
                :id="'task-' + task.tacheAFaireId"
                v-model="task.isCompleted"
              />
              <label class="form-check-label" :for="'task-' + task.tacheAFaireId">
                {{ task.title }}
                <span class="badge bg-secondary ms-2">{{ task.heureDebut }}</span>
                <span class="badge bg-secondary ms-2">{{ task.heureFin }}</span>
              </label>
            </div>
            <button
              type="button"
              class="btn btn-outline-primary btn-sm"
              @click="toggleDetails(task.tacheAFaireId)"
            >
              {{ detailledTasks.has(task.tacheAFaireId) ? 'Moins de détails' : 'Plus de détails' }}
            </button>
          </div>

          <div v-for="sub in task.sousTaches" :key="sub.id" class="form-check ms-4 mt-2">
            <input
              class="form-check-input"
              type="checkbox"
              :id="'sub-' + task.tacheAFaireId + '-' + sub.id"
              v-model="sub.isCompleted"
            />
            <label class="form-check-label" :for="'sub-' + task.tacheAFaireId + '-' + sub.id">
              {{ sub.titre }}
            </label>
          </div>
        </div>

        <div v-if="detailledTasks.has(task.tacheAFaireId)" class="card-footer bg-light">
          <p class="mb-1"><strong>Local :</strong> {{ task.room }}</p>
          <p class="mb-2"><strong>Description :</strong> {{ task.description }}</p>
          <label :for="'comment-' + task.tacheAFaireId" class="form-label">
            <strong>Commentaire :</strong>
          </label>
          <textarea
            class="form-control"
            rows="2"
            maxlength="1000"
            :id="'comment-' + task.tacheAFaireId"
            v-model="task.commentaire"
          ></textarea>
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
import { onMounted, reactive, ref } from 'vue'
import { useTaskStore } from '@/stores/taskStore.js'

const taskStore = useTaskStore()
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
  taskStore.loadMyTasks()
})
</script>
