<template>
  <Teleport to="body">
    <div v-if="modalStore.taskModalOpen" class="modal fade p-5 bd-example-modal-lg" @click.self="close" id="taskModal"
      tabindex="-1" role="dialog" aria-labelledby="taskModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-xl">
        <div class="modal-content mt-3 ps-3 pe-3">
          <div class="modal-header ps-0">
            <h2 class="modal-title">{{ task.title }}</h2>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useModalStore } from '@/stores/modalStore';

const taskStore = useTaskStore();
const modalStore = useModalStore();

const task = computed(() => !!taskStore.tasks);


function close() {
  modalStore.closeTaskModal();
}

</script>
