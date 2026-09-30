<template>
  <section class="container">
    <h1>Admin</h1>
    <button @click="testPopup" data-target="#taskModal" class="btn btn-secondary mx-auto m-3">Ajouter une tâche</button>
    <TaskModal />

    <div v-for="task in taskStore.tasks" :key="task.id" class="card mb-3 shadow-sm">
      <div class="card-body">
        <h2 class="card-title h4 mb-2">{{ task.title }}</h2>

        <p class="card-text text-secondary mb-3">{{ task.description }}</p>

        <div class="d-flex gap-2">
          <button @click="updateTask(task.id)" class="btn btn-primary">Modifier la tâche</button>
          <button @click="taskStore.deleteTask(task.id)" class="btn btn-danger">Supprimer</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useModalStore } from "@/stores/modalStore";
import { useTaskStore } from "@/stores/taskStore";
import TaskModal from '@/components/tasks/TaskModal.vue';
import { onMounted } from "vue";

const taskStore = useTaskStore();
const modalStore = useModalStore();

onMounted(() => {
  taskStore.loadTasks();
});

async function updateTask(id) {
  let theTask = await taskStore.getTaskById(id);
  await modalStore.openEditTask(theTask);
}

async function testPopup() {
  const modalStore = useModalStore();
  modalStore.openAddTask();
}
</script>
