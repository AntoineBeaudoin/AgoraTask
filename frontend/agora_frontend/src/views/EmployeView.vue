<template>
  <main class="container py-5">
    <h1 class="mb-4 text-center">Vos tâches</h1>
    <form action="" class="mx-auto">
      <div v-for="task in taskStore.tasks" :key="task.id" class="card mb-3">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div class="form-check d-flex align-items-center gap-2">
            <input class="form-check-input" type="checkbox" :id="'task-' + task.id" />
            <label class="form-check-label" :for="'task-' + task.id">
              {{ task.titre }}
              <span class="badge bg-secondary ms-2">{{ task.local }}</span>
            </label>
          </div>

          <button type="button" class="btn btn-outline-primary btn-sm" @click="toggleDetails(task.id)">
            {{ detailledTasks.has(task.id) ? 'Moins de détails' : 'Plus de détails' }}
          </button>
        </div>

        <div v-if="detailledTasks.has(task.id)" class="card-footer bg-light">
          <p class="mb-1"><strong>Description :</strong> {{ task.description }}</p>
          <p class="mb-1"><strong>Début :</strong> {{ task.startTime }}</p>
          <p class="mb-0"><strong>Fin :</strong> {{ task.endTime }}</p>
        </div>
      </div>

      <div class="d-flex justify-content-center gap-2 mt-4">
        <button type="submit" class="btn btn-primary">Sauvegarder</button>
        <button type="reset" class="btn btn-danger">Réinitialiser</button>
      </div>
    </form>
  </main>
</template>

<script setup>
import { onMounted, reactive } from 'vue';
import { useTaskStore } from '@/stores/taskStore.js';

const taskStore = useTaskStore();
const detailledTasks = reactive(new Set());

function toggleDetails(id) {
  if (detailledTasks.has(id)) {
    detailledTasks.delete(id);
  } else {
    detailledTasks.add(id);
  }
}

onMounted(() => {
  taskStore.loadTasks();
});
</script>
