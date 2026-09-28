<template>
<h1>Admin</h1>

<button @click="testPopup" data-target="#taskModal">Ajouter une tâche</button>
    <TaskModal/>

 <div v-for="task in taskStore.tasks" :key="task.id">
    <h2>{{ task.title }}</h2>
    <p>{{ task.description }}</p>

    <button @click="updateTask(task.id)">
      Modifier la tâche
    </button>
    <button @click="taskStore.deleteTask(task.id)">
      Supprimer
    </button>
  </div>
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

async function updateTask(id){
  let theTask = await taskStore.getTaskById(id);
  await modalStore.openEditTask(theTask);
}

async function testPopup() {
  console.log("Popup");
  const modalStore = useModalStore();
  modalStore.openAddTask();
}
</script>
