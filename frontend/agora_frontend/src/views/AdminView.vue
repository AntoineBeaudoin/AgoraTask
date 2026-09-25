<template>
<h1>Admin</h1>

<button @click="testPopup" data-target="#taskModal">Popup</button>
    <TaskModal/>
</template>

<script setup>
import { useModalStore } from "@/stores/modalStore";
import TaskModal from '@/components/tasks/TaskModal.vue';
async function testPopup() {
  console.log("Popup");
  const modalStore = useModalStore();
  modalStore.openAddTask();
}
</script>
