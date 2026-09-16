<template>
  <Teleport to="body">
    <div v-if="modalStore.taskModalOpen" class="modal-overlay" @click.self="close">
      <div class="task-modal">
        <div class="modal-header">
          <h2>
            {{ isEditing ? 'Modifier une tâche' : 'Ajouter/Modifier une tâche' }}
          </h2>
          <button type="button" class="close-button" @click="close">×</button>
        </div>
        <form @submit.prevent="submit">
          <div class="form-layout">
            <div class="left-column">
              <input v-model="title" class="input" type="text" placeholder="Titre de la tâche" required />
              <textarea v-model="description" class="description" placeholder="Description de la tâche" />
            </div>
            <div class="right-column">
              <label class="field-label">Image(s) à ajouter</label>
              <input type="file" multiple accept="image/*" @change="images = [...$event.target.files]" />
              <div class="time-row">
                <div>
                  <label>Heure début</label>
                  <input v-model="startTime" type="time" />
                </div>
                <div>
                  <label>Heure fin</label>
                  <input v-model="endTime" type="time" />
                </div>
              </div>
              <label class="checkbox-row">
                <input v-model="recurring" type="checkbox" />
                <span>Tâche récurrente?</span>
              </label>
              <select v-if="recurring" v-model="frequency" class="input">
                <option value="">Fréquence de la tâche</option>
                <option value="daily">Tous les jours</option>
                <option value="weekly">Toutes les semaines</option>
                <option value="monthly">Tous les mois</option>
              </select>
              <label class="checkbox-row">
                <input v-model="automaticAssignment" type="checkbox" />
                <span>Assigner automatiquement?</span>
              </label>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="cancel-button" @click="close">Annuler</button>
            <button type="submit" class="submit-button">{{ isEditing ? 'Modifier' : 'Ajouter' }}</button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useTaskStore } from '@/stores/taskStore';
import { useModalStore } from '@/stores/modalStore';

const taskStore = useTaskStore();
const modalStore = useModalStore();

const title = ref('');
const description = ref('');
const startTime = ref('');
const endTime = ref('');
const recurring = ref(false);
const frequency = ref('');
const automaticAssignment = ref(false);
const images = ref([]);

const isEditing = computed(() => !!modalStore.editingTask);

watch(
  () => modalStore.editingTask,
  (task) => {
    if (task) {
      title.value = task.title ?? '';
      description.value = task.description ?? '';
      startTime.value = task.startTime ?? '';
      endTime.value = task.endTime ?? '';
      recurring.value = task.recurring ?? false;
      frequency.value = task.frequency ?? '';
      automaticAssignment.value = task.automaticAssignment ?? false;
      images.value = task.images ?? [];
    } else {
      resetForm();
    }
  },
  { immediate: true }
)

function resetForm() {
  title.value = '';
  description.value = '';
  startTime.value = '';
  endTime.value = '';
  recurring.value = false;
  frequency.value = '';
  automaticAssignment.value = false;
  images.value = [];
}

function close() {
  modalStore.closeTaskModal();
}

async function submit() {
  const task = {
    title: title.value,
    description: description.value,
    startTime: startTime.value,
    endTime: endTime.value,
    recurring: recurring.value,
    frequency: frequency.value,
    automaticAssignment: automaticAssignment.value,
    images: images.value
  }

  if (isEditing.value) {
    await taskStore.updateTask({
      ...modalStore.editingTask,
      ...task
    });
  } else {
    await taskStore.addTask(task);
  }
  
  resetForm();
  close();
}
</script>