<template>
  <section class="container">
    <h1>Gestion de tâches administrative</h1>
    <button @click="addTask" data-target="#taskModal" class="btn btn-secondary mx-auto m-3">
      Ajouter une tâche
    </button>
    <TaskModal />

    <div class="input-group mb-3">
      <input
        v-model="motCle"
        type="text"
        class="form-control"
        placeholder="Rechercher une tâche"
        @keyup.enter="filterTasks"
      />
      <button @click="filterTasks" class="btn btn-primary">Rechercher</button>
    </div>

    <div v-for="task in tasksDisplayed" :key="task.id" class="card mb-3 shadow-sm">
      <div class="card-body">
        <h2 class="card-title h4 mb-2">{{ task.title }}</h2>

        <p class="card-text text-secondary mb-3">{{ task.description }}</p>

        <div class="d-flex gap-2">
          <button @click="updateTask(task.id)" class="btn btn-primary">Modifier la tâche</button>
          <button @click="duplicateTask(task.id)" v-bind:id="task.id" class="btn btn-secondary">
            Dupliquer
          </button>
          <button @click="taskStore.deleteTask(task.id)" class="btn btn-danger">Supprimer</button>
        </div>
      </div>
    </div>
  </section>
</template>

<script setup>
import { useModalStore } from '@/stores/modalStore'
import { useTaskStore } from '@/stores/taskStore'
import TaskModal from '@/components/tasks/TaskModal.vue'
import { onMounted, ref } from 'vue'
import { switchIsButtonActiveById } from '@/utils/dom-manipulation'

const taskStore = useTaskStore()
const modalStore = useModalStore()
let motCle = ref('')
let tasksDisplayed = ref([])
function filterTasks() {
  if (motCle.value.trim() !== '') {
    tasksDisplayed.value = taskStore.tasks.filter((task) =>
      task.title.toLowerCase().includes(motCle.value.toLowerCase()),
    )
  } else {
    tasksDisplayed.value = taskStore.tasks
  }
}

onMounted(async () => {
  await taskStore.loadTasks()
  tasksDisplayed.value = taskStore.tasks
})

async function updateTask(id) {
  let theTask = await taskStore.getTaskById(id)
  modalStore.openEditTask(theTask)
}

async function duplicateTask(id) {
  switchIsButtonActiveById(id)
  await taskStore.duplicateTask(id)
  switchIsButtonActiveById(id)
}

async function addTask() {
  const modalStore = useModalStore()
  modalStore.openAddTask()
}
</script>
