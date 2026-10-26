<template>
  <section class="container py-5">
    <h1 class="mb-4 text-center">Vos tâches</h1>

    <p v-if="taskStore.loaded && taskStore.tasks.length === 0" class="text-center text-muted">
      Aucune tâche ne vous est assignée.
    </p>

    <form v-else action="" class="mx-auto" @submit.prevent="save" @reset.prevent="checkedIds = []">
      <div v-for="task in taskStore.myTasks" :key="task.tacheAFaireId" class="card mb-3">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div class="form-check d-flex align-items-center gap-2">
            <input v-if="task.isCompleted" class="form-check-input" type="checkbox" checked disabled />
        <input v-else class="form-check-input" type="checkbox"
               :id="'task-' + task.tacheAFaireId"
               :value="task.tacheAFaireId" v-model="checkedIds" />
        <label class="form-check-label" :for="'task-' + task.tacheAFaireId">
          {{ task.title }}
          <span class="badge bg-secondary ms-2">{{ task.heureDebut }}</span>
          <span class="badge bg-secondary ms-2">{{ task.heureFin }}</span>
        </label>
      </div>

          <button
            type="button"
            class="btn btn-outline-primary btn-sm"
            @click="toggleDetails(task.id)"
          >
            {{ detailledTasks.has(task.id) ? 'Moins de détails' : 'Plus de détails' }}
          </button>
        </div>

        <div v-if="detailledTasks.has(task.id)" class="card-footer bg-light">
          <p class="mb-1"><strong>Local :</strong> {{ task.room }}</p>
          <p class="mb-1"><strong>Description :</strong> {{ task.description }}</p>
        </div>
      </div>

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

function toggleDetails(id) {
  if (detailledTasks.has(id)) {
    detailledTasks.delete(id)
  } else {
    detailledTasks.add(id)
  }
}

async function save() {
  if (checkedIds.value.length === 0) return
  saving.value = true
  try {
    const ok = await taskStore.saveCompleted(checkedIds.value)
    if (ok) checkedIds.value = []
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  taskStore.loadTasks()
  taskStore.loadMyTasks()
})
</script>
