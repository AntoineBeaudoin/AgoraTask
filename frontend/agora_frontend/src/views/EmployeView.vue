<template>
  <main>
    <h1>Vos tâches</h1>
    <form action="" class="">
      <div v-for="task in taskStore.tasks" :key="task.id">
        <div>
          <input type="checkbox" class="form-check-input" id="task-" + task.id />
          <label for="task1"> {{ task.titre }}</label>
          <label class="form-check-label" for="task1"> | {{ task.local }}</label>
                  <button type="button" @click="toggleDetails(task.id)">
          {{ detailledTasks.has(task.id) ? 'Moins de détails' : 'Plus de détails' }}
        </button>
        </div>

        <div v-if="detailledTasks.has(task.id)">
          <p>Description : {{ task.description }}</p>
          <p>Début : {{ task.startTime }}</p>
          <p>Fin : {{ task.endTime }}</p>
        </div>
      </div>
      <button type="submit" class="btn btn-primary">Sauvegarder</button>
      <button type="reset" class="btn btn-danger">Réinitialiser</button>
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
