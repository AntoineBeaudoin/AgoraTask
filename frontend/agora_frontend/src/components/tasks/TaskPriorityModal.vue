<template>
  <Teleport to="body">
    <div v-if="modalStore.taskPriorityModalOpen" class="modal fade p-5 bd-example-modal-lg" @click.self="close"
      id="taskPriorityModal" tabindex="-1" role="dialog" aria-labelledby="taskPriorityModalLabel" aria-hidden="true">
      <div class="modal-dialog modal-lg">
        <div class="modal-content mt-3 ps-3 pe-3">
          <div class="modal-header ps-0">
            <h2 id="taskPriorityModalLabel" class="modal-title">
              {{ isEditing ? 'Modifier une priorité' : 'Gérer les priorités de tâches' }}
            </h2>
            <button type="button" class="bg-transparent border-0 ms-auto p-3 btn btn-close" aria-label="Fermer"
              @click="close"></button>
          </div>

          <div v-if="warningMessage" id="priorityWarningAlert"
            class="alert alert-warning d-flex justify-content-between align-items-center mt-3 mb-0" role="alert">
            <span>{{ warningMessage }}</span>
            <button type="button" class="btn-close" aria-label="Fermer l'alerte" @click="warningMessage = ''"></button>
          </div>

          <form @submit.prevent="submit" novalidate class="mt-3">
            <div class="row g-4 pb-3">
              <div class="col-lg-5">
                <h3 class="fs-5 mb-3 text-primary">
                  {{ isEditing ? '1. Modifier la priorité' : '1. Ajouter une priorité' }}
                </h3>
                <div class="form-group my-3">
                  <label for="priorityName" class="form-label">Nom de la priorité *</label>
                  <input v-model="priorityName" id="priorityName" class="form-control" type="text"
                    placeholder="Ex: Important" required />
                  <div id="priorityNameError" class="invalid-feedback">
                    Le nom de la priorité est requis.
                  </div>
                </div>
                <div class="form-group mb-3">
                  <label for="priorityWeigth" class="form-label d-block">Poids *</label>
                  <span><em class="blockquote-footer">Plus le poids est élevé plus il est important</em></span>
                  <input v-model.number="weigth" id="priorityWeigth" class="form-control" type="number" min="0"
                    placeholder="Ex: 1" required />
                  <div id="priorityWeigthError" class="invalid-feedback">
                    Le poids de la priorité doit être un nombre entier valide.
                  </div>
                </div>
                <div class="d-flex gap-2">
                  <button id="submitPriorityBtn" type="submit" class="btn btn-success">
                    {{ isEditing ? 'Modifier' : 'Ajouter' }}
                  </button>
                  <button v-if="isEditing" type="button" class="btn btn-outline-secondary" @click="cancelEdit">
                    Annuler la modification
                  </button>
                </div>
              </div>

              <div class="col-lg-7">
                <h3 class="fs-5 mb-3 text-primary">2. Priorités existantes</h3>
                <div v-if="sortedPriorities.length === 0" class="alert alert-secondary py-2 small text-center mb-3">
                  Aucune priorité définie.
                </div>
                <div v-for="priority in sortedPriorities" :key="priority.id" class="card card-body bg-light mb-2 p-3">
                  <div class="d-flex justify-content-between align-items-center">
                    <div>
                      <strong class="d-block">{{ priority.task_priority }}</strong>
                      <span class="text-muted small">Poids : {{ priority.weigth ?? 0 }}</span>
                    </div>
                    <div class="d-flex gap-2">
                      <button type="button" class="btn btn-sm btn-primary" @click="selectForEdit(priority)">
                        Modifier
                      </button>
                      <button type="button" class="btn btn-sm btn-danger" @click="removePriority(priority.id)">
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { useTaskPriorityStore } from '@/stores/taskPriorityStore';
import { useModalStore } from '@/stores/modalStore';
import { switchIsButtonActiveById } from '@/utils/dom-manipulation';

const taskPriorityStore = useTaskPriorityStore();
const modalStore = useModalStore();

const SUBMIT_BUTTON_ID = 'submitPriorityBtn';

const priorityName = ref('');
const weigth = ref(0);
const warningMessage = ref('');

const isEditing = computed(() => !!modalStore.editingTaskPriority);

const sortedPriorities = computed(() => {
  return [...(taskPriorityStore.taskPriorities ?? [])].sort(
    (a, b) => (a.weigth ?? 0) - (b.weigth ?? 0) || a.id - b.id
  );
});

watch(
  () => modalStore.taskPriorityModalOpen,
  async (isOpen) => {
    if (isOpen) {
      await taskPriorityStore.loadTaskPriorities(true);
    }
  },
  { immediate: true }
);

watch(
  () => modalStore.editingTaskPriority,
  (priority) => {
    clearInvalidInputs();
    if (priority) {
      priorityName.value = priority.task_priority ?? '';
      weigth.value = priority.weigth ?? 0;
    } else {
      resetFormFields();
    }
  },
  { immediate: true }
);

function resetFormFields() {
  priorityName.value = '';
  weigth.value = 0;
  clearInvalidInputs();
}

function resetForm() {
  resetFormFields();
  warningMessage.value = '';
}

function cancelEdit() {
  modalStore.openAddTaskPriority();
  resetFormFields();
}

function selectForEdit(priority) {
  warningMessage.value = '';
  modalStore.openEditTaskPriority(priority);
}

function close() {
  resetForm();
  modalStore.closeTaskPriorityModal();
}

function formIsValid() {
  return (
    priorityName.value.trim() !== '' &&
    weigth.value !== '' &&
    weigth.value !== null &&
    Number.isInteger(Number(weigth.value))
  );
}

function clearInvalidInputs() {
  document.querySelectorAll('#taskPriorityModal .is-invalid').forEach((input) => {
    input.classList.remove('is-invalid');
  });
}

function markInvalidInputs() {
  clearInvalidInputs();
  if (!priorityName.value.trim()) {
    document.querySelector('#priorityName')?.classList.add('is-invalid');
  }
  if (
    weigth.value === '' ||
    weigth.value === null ||
    !Number.isInteger(Number(weigth.value))
  ) {
    document.querySelector('#priorityWeigth')?.classList.add('is-invalid');
  }
}

async function submit() {
  warningMessage.value = '';
  if (!formIsValid()) {
    markInvalidInputs();
    return;
  }

  switchIsButtonActiveById(SUBMIT_BUTTON_ID);

  const payload = {
    task_priority: priorityName.value.trim(),
    weigth: Number(weigth.value),
  };

  let success;
  if (isEditing.value) {
    success = await taskPriorityStore.updateTaskPriority({
      ...modalStore.editingTaskPriority,
      ...payload,
    });
  } else {
    success = await taskPriorityStore.addTaskPriority(payload);
  }

  switchIsButtonActiveById(SUBMIT_BUTTON_ID);

  if (success) {
    cancelEdit();
  } else {
    warningMessage.value = taskPriorityStore.lastErrorMessage;
  }
}

async function removePriority(id) {
  warningMessage.value = '';
  const success = await taskPriorityStore.deleteTaskPriority(id);
  if (!success) {
    warningMessage.value =
      taskPriorityStore.lastErrorMessage ||
      'Impossible de supprimer cette priorité car elle est utilisée par une occurrence de tâche.';
  } else if (modalStore.editingTaskPriority?.id === id) {
    cancelEdit();
  }
}
</script>
