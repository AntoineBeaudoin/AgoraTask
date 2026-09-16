<script setup>
</script>

<template>
  <main>
    <h1>AgoraTask</h1>
    <button @click="testPopup">Popup</button>
    <TaskModal/>
  </main>
</template>

<script setup>
import { useModalStore } from "@/stores/modalStore";
import TaskModal from '@/components/tasks/TaskModal.vue'
async function testPopup() {
  console.log("Popup");
  const modalStore = useModalStore(); 
  modalStore.openAddTask();
}
</script>
