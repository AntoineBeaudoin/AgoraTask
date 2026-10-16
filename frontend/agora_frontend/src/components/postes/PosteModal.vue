<template>
  <Teleport to="body">
    <div
      v-if="modalStore.posteModalOpen"
      id="posteModal"
      class="modal fade p-5"
      tabindex="-1"
      role="dialog"
      aria-labelledby="posteModalLabel"
      @click.self="close"
    >
      <div class="modal-dialog modal-lg">
        <div class="modal-content mt-3 px-3">
          <div class="modal-header ps-0">
            <h2 id="posteModalLabel" class="modal-title">
              {{ isEditing ? 'Modifier un poste' : 'Ajouter un poste' }}
            </h2>
            <button
              type="button"
              class="bg-transparent border-0 ms-auto p-3 btn btn-close"
              aria-label="Fermer"
              @click="close"
            ></button>
          </div>

          <form @submit.prevent="submit" novalidate class="mt-3">
            <div class="form-group mb-3">
              <label for="posteNom" class="d-none">Nom du poste</label>
              <input
                id="posteNom"
                v-model="nom"
                class="form-control"
                type="text"
                placeholder="Nom du poste *"
                required
              />
              <span id="posteNomError" class="invalid-feedback">
                Le nom du poste est requis.
              </span>
            </div>

            <div class="form-group mb-3">
              <label for="posteDescription" class="form-label">
                Description
              </label>
              <textarea
                id="posteDescription"
                v-model="description"
                class="form-control"
                rows="3"
                placeholder="Description du poste"
              ></textarea>
            </div>

            <div class="form-group mb-3">
              <label for="posteTasks" class="form-label">
                Tâches associées
              </label>

              <div v-if="loadingTasks" class="text-muted">
                Chargement des tâches...
              </div>

              <div v-else-if="tasksError" class="text-danger">
                {{ tasksError }}
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary ms-2"
                  @click="loadTasks"
                >
                  Réessayer
                </button>
              </div>

              <div
                v-else-if="tasksDisponibles.length === 0"
                class="text-muted"
              >
                Aucune tâche disponible.
              </div>

              <select
                v-else
                id="posteTasks"
                v-model="tasksSelectionnees"
                class="form-select"
                multiple
                size="6"
              >
                <option
                  v-for="task in tasksDisponibles"
                  :key="task.id"
                  :value="task.id"
                >
                  {{ task.title }}
                </option>
              </select>

              <small class="form-text text-muted">
                Maintenez Ctrl (Windows/Linux) ou Cmd (Mac) pour sélectionner
                plusieurs tâches.
              </small>

              <p class="text-danger">{{ posteError }}</p>
            </div>

            <div class="modal-footer">
              <button
                type="button"
                class="btn btn-danger"
                @click="close"
              >
                Annuler
              </button>
              <button
                id="posteSubmitBtn"
                type="submit"
                class="btn btn-success"
                :disabled="saving || loadingTasks"
              >
                {{ saving ? 'Enregistrement...' : isEditing ? 'Modifier' : 'Ajouter' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed, ref, watch } from 'vue';
import { usePosteStore } from '@/stores/posteStore';
import { useModalStore } from '@/stores/modalStore';
import { useTaskStore } from '@/stores/taskStore';

const posteStore = usePosteStore();
const modalStore = useModalStore();
const taskStore = useTaskStore();

const nom = ref('');
const description = ref('');
const tasksSelectionnees = ref([]);
const loadingTasks = ref(false);
const tasksError = ref('');
const posteError = ref('');
const saving = ref(false);

const isEditing = computed(() => !!modalStore.editingPoste);

const tasksDisponibles = computed(() =>
  taskStore.tasks.filter(task => !task.IsArchived)
);

watch(
  () => modalStore.posteModalOpen,
  async (isOpen) => {
    if (!isOpen) return;

    resetForm();
    await loadTasks();

    const poste = modalStore.editingPoste;

    if (poste) {
      nom.value = poste.nom ?? '';
      description.value = poste.description ?? '';

      tasksSelectionnees.value = (poste.tasks ?? []).map(
        task => typeof task === 'object' ? task.id : task
      );
    }
  }
);

async function loadTasks() {
  loadingTasks.value = true;
  tasksError.value = '';

  try {
    await taskStore.loadTasks();
  } catch (error) {
    console.error('Erreur lors du chargement des postes :', error);
    tasksError.value =
      'Une erreur est survenue lors du chargement des postes.';
  } finally {
    loadingTasks.value = false;
  }
}

function resetForm() {
  nom.value = '';
  description.value = '';
  tasksSelectionnees.value = [];
  tasksError.value = '';

  document.querySelectorAll('#posteModal .is-invalid').forEach(input => {
    input.classList.remove('is-invalid');
  });

  document.querySelectorAll('#posteModal .invalid-feedback').forEach(span => {
    span.classList.remove('d-block');
  });
}

function close() {
  resetForm();
  modalStore.closePosteModal();
}

function formIsValid() {
  return nom.value.trim() !== '';
}

function markInvalidInputs() {
  const input = document.querySelector('#posteNom');
  const error = document.querySelector('#posteNomError');

  input.classList.toggle('is-invalid', !nom.value.trim());
  error.classList.toggle('d-block', !nom.value.trim());
}

async function submit() {
  if (saving.value) return;
  posteError.value = "";

  if (!formIsValid()) {
    markInvalidInputs();
    return;
  }

  saving.value = true;

  const poste = {
    nom: nom.value.trim(),
    description: description.value.trim(),
    tasks: tasksSelectionnees.value
  };

  try {
    let result = true;

    if (isEditing.value) {
      result = await posteStore.updatePoste({
        ...modalStore.editingPoste,
        ...poste
      });
    } else {
      result = await posteStore.addPoste(poste);
    }

    console.log("RESULT OF OPERATION", result);

    if (result === false)
    {
      if (posteStore.$state.lastErrorStatus === 409)
      {
        posteError.value = "Un poste avec le même nom et la même description existe déjà.";
      }
      else
      {
        posteError.value = "Un poste doit minimalement contenir un nom et une description.";
      }
    }
    else
    {
      close();
    }
  } catch (error) {
    console.error('Erreur lors de l’enregistrement du poste :', error);
  } finally {
    saving.value = false;
  }
}
</script>
