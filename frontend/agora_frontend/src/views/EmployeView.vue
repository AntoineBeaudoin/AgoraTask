<template>
  <section class="container py-5">
    <h1 class="mb-4 text-center">Vos tâches</h1>
    <TaskDescriptionModal />
    <p v-if="taskStore.loaded && taskStore.tasks.length === 0" class="text-center text-muted">
      Aucune tâche ne vous est assignée.
    </p>
    
    <form v-else action="" class="mx-auto">
      <div v-for="task in taskStore.tasks" :key="task.id" class="card mb-3">
        <div class="card-body d-flex justify-content-between align-items-center">
          <div class="form-check d-flex align-items-center gap-2">
            <input class="form-check-input" type="checkbox" :id="'task-' + task.id" />
            <label class="form-check-label" :for="'task-' + task.id">
              {{ task.title }}
              <span class="badge bg-secondary ms-2">{{ task.room }}</span>
            </label>
          </div>
          <button type="button" @click="taskDetails(task.id)" class="btn btn-info">Détails</button>
        </div>
      </div>

      <div class="d-flex justify-content-center gap-2 mt-4">
        <button type="button" class="btn btn-primary">Sauvegarder</button>
        <button type="reset" class="btn btn-danger">Réinitialiser</button>
      </div>
    </form>
  </section>
</template>

<script setup>
import TaskDescriptionModal from '@/components/tasks/TaskDescriptionModal.vue';
import { onMounted } from 'vue';
import { useTaskStore } from '@/stores/taskStore.js';
import { useModalStore } from '@/stores/modalStore';

const taskStore = useTaskStore();
const modalStore = useModalStore();

async function taskDetails(id) {
  const observableTask = await taskStore.getTaskById(id);
  modalStore.openTaskDescription(observableTask);
}

onMounted(() => {
  taskStore.loadTasks();
});
</script>
