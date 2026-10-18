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

            <div class="form-group mb-3">
              <label for="posteComptes" class="form-label">
                Employés assignés
              </label>

              <div v-if="loadingComptes" class="text-muted">
                Chargement des employés...
              </div>

              <div v-else-if="comptesError" class="text-danger">
                {{ comptesError }}
                <button
                  type="button"
                  class="btn btn-sm btn-outline-secondary ms-2"
                  @click="loadComptes"
                >
                  Réessayer
                </button>
              </div>

              <div
                v-else-if="comptesDisponibles.length === 0"
                class="text-muted"
              >
                Aucun employé disponible.
              </div>

              <select
                v-else
                id="posteComptes"
                v-model="comptesSelectionnes"
                class="form-select"
                multiple
                size="6"
              >
                <option
                  v-for="compte in comptesDisponibles"
                  :key="compte.id"
                  :value="compte.id"
                >
                  {{ compte.prenom }} {{ compte.nom }} ({{ compte.courriel }})
                </option>
              </select>

              <small class="form-text text-muted">
                Maintenez Ctrl (Windows/Linux) ou Cmd (Mac) pour sélectionner
                plusieurs employés.
              </small>
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
                :disabled="saving || loadingTasks || loadingComptes"
              >
                {{
                  saving
                    ? 'Enregistrement...'
                    : isEditing
                      ? 'Modifier'
                      : 'Ajouter'
                }}
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
import { useAuthStore } from '@/stores/auth';

const posteStore = usePosteStore();
const authStore = useAuthStore();
const modalStore = useModalStore();
const taskStore = useTaskStore();

const emit = defineEmits(['saved']);

const nom = ref('');
const description = ref('');
const tasksSelectionnees = ref([]);
const loadingTasks = ref(false);
const tasksError = ref('');
const posteError = ref('');
const saving = ref(false);

const comptesDisponibles = ref([]);
const comptesSelectionnes = ref([]);
const loadingComptes = ref(false);
const comptesError = ref('');

const isEditing = computed(() => !!modalStore.editingPoste);

const tasksDisponibles = computed(() =>
  taskStore.tasks.filter(task => !task.IsArchived)
);

async function loadComptes() {
  loadingComptes.value = true;
  comptesError.value = '';

  try {
    const result = await authStore.getEmployes();

    if (Array.isArray(result)) {
      comptesDisponibles.value = result;
    } else {
      comptesDisponibles.value = authStore.employes ?? [];
    }

    console.log('Employés disponibles :', comptesDisponibles.value);
  } catch (error) {
    console.error('Erreur lors du chargement des employés :', error);
    comptesError.value =
      'Une erreur est survenue lors du chargement des employés.';
  } finally {
    loadingComptes.value = false;
  }
}

async function loadTasks() {
  loadingTasks.value = true;
  tasksError.value = '';

  try {
    await taskStore.loadTasks();
  } catch (error) {
    console.error('Erreur lors du chargement des tâches :', error);
    tasksError.value =
      'Une erreur est survenue lors du chargement des tâches.';
  } finally {
    loadingTasks.value = false;
  }
}

watch(
  () => modalStore.posteModalOpen,
  async (isOpen) => {
    if (!isOpen) return;

    resetForm();

    await Promise.all([
      loadTasks(),
      loadComptes()
    ]);

    const poste = modalStore.editingPoste;

    if (poste) {
      nom.value = poste.nom ?? '';
      description.value = poste.description ?? '';

      tasksSelectionnees.value = (poste.tasks ?? []).map(
        task => typeof task === 'object' ? task.id : task
      );

      comptesSelectionnes.value = comptesDisponibles.value.filter(compte => String(compte.posteId) === String(poste.id))
        .map(compte => compte.id);
    }
  }
);

function resetForm() {
  nom.value = '';
  description.value = '';
  tasksSelectionnees.value = [];
  comptesSelectionnes.value = [];
  tasksError.value = '';
  comptesError.value = '';
  posteError.value = '';

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

  posteError.value = '';

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
    let result;
    let posteId;

    if (isEditing.value) {
      posteId = modalStore.editingPoste.id;

      result = await posteStore.updatePoste({
        ...modalStore.editingPoste,
        ...poste
      });
    } else {
      result = await posteStore.addPoste(poste);

      if (result) {
        posteId = typeof result === 'number' ? result : null;
      }
    }

    if (result === false) {
      if (posteStore.lastErrorStatus === 409) {
        posteError.value =
          'Un poste avec le même nom et la même description existe déjà.';
      } else {
        posteError.value =
          'Une erreur est survenue lors de l’enregistrement du poste.';
      }
      return;
    }

    if (posteId == null) {
      posteError.value =
        'Le poste a été enregistré, mais son identifiant est introuvable. Les employés n’ont pas été assignés.';
      return;
    }

    const assignmentResult = await posteStore.assignPosteToEmployees(
      posteId,
      comptesSelectionnes.value
    );

    if (!assignmentResult) {
      posteError.value =
        'Le poste a été enregistré, mais une erreur est survenue lors de l’assignation des employés.';
      return;
    }

    emit('saved');
    close();
  } catch (error) {
    console.error('Erreur lors de l’enregistrement du poste :', error);
    posteError.value =
      'Une erreur est survenue lors de l’enregistrement du poste.';
  } finally {
    saving.value = false;
  }
}
</script>
