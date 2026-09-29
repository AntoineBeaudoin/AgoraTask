<template>
      <main>
    <h1>Vos tâches</h1>
    <form action="" class="">
      <div v-for="task in taskStore.tasks" :key="task.id">
        <input type="checkbox" class="form-check-input" id="task1" />
        <label for="task1"> {{ task.titre }}</label>
        <label class="form-check-label" for="task1"> | {{ task.local }}</label>
      </div>
      <button type="submit" class="btn btn-primary">Sauvegarder</button>
      <button type="reset" class="btn btn-danger">Réinitialiser</button>
    </form>
  </main>
</template>

<script setup>
import { onMounted } from 'vue';
import { useTaskStore } from '@/stores/taskStore.js';

const taskStore = useTaskStore();

onMounted(() => {
  taskStore.loadTasks();
});
</script>
