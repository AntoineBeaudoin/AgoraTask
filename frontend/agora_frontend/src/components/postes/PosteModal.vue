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

            <div class="form-group mb-4" v-for="group in assignmentGroups" :key="group.type">
              <label class="form-label fw-semibold">{{ group.title }}</label>
              <div v-if="group.loading" class="text-muted">Chargement...</div>
              <div v-else-if="group.error" class="text-danger">
                {{ group.error }}
                <button type="button" class="btn btn-sm btn-outline-secondary ms-2"
                  @click="group.type === 'task' ? loadTasks() : loadComptes()">Réessayer</button>
              </div>
              <div v-else class="row g-3">
                <div class="col-6">
                  <label class="form-label small">Disponibles ({{ group.available.length }})</label>
                  <div class="drop-zone" @dragover.prevent @drop.prevent="dropItem(group.type, false, $event)">
                    <div v-for="item in group.available" :key="item.id" class="drag-item"
                      draggable="true" @dragstart="startDrag(group.type, item.id, $event)"
                      @dragend="draggedItem = null" @dblclick="moveItem(group.type, item.id, true)"
                      :title="'Double-cliquer pour assigner'">
                      <span class="item-text">{{ group.format(item) }}</span><span aria-hidden="true">⠿</span>
                    </div>
                    <div v-if="!group.available.length" class="text-muted small p-2">Aucun élément disponible</div>
                  </div>
                </div>
                <div class="col-6">
                  <label class="form-label small">Assignés ({{ group.selected.length }})</label>
                  <div class="drop-zone" @dragover.prevent @drop.prevent="dropItem(group.type, true, $event)">
                    <div v-for="item in group.selected" :key="item.id" class="drag-item"
                      draggable="true" @dragstart="startDrag(group.type, item.id, $event)"
                      @dragend="draggedItem = null" @dblclick="moveItem(group.type, item.id, false)"
                      :title="'Double-cliquer pour retirer'">
                      <span class="item-text">{{ group.format(item) }}</span><span aria-hidden="true">⠿</span>
                    </div>
                    <div v-if="!group.selected.length" class="text-muted small p-2">Glissez des éléments ici</div>
                  </div>
                </div>
              </div>
              <small class="text-muted">Glissez les éléments entre les colonnes ou double-cliquez dessus.</small>
            </div>
            <p class="text-danger">{{ posteError }}</p>

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
  taskStore.tasks.filter(task => !task.IsArchived && !task.archived)
);

const assignmentGroups = computed(() => [
  {
    type: 'task', title: 'Tâches associées', loading: loadingTasks.value,
    error: tasksError.value,
    available: tasksDisponibles.value.filter(t => !tasksSelectionnees.value.some(id => String(id) === String(t.id))),
    selected: tasksDisponibles.value.filter(t => tasksSelectionnees.value.some(id => String(id) === String(t.id))),
    format: t => `${t.title} (${t.room})`
  },
  {
    type: 'compte', title: 'Employés assignés', loading: loadingComptes.value,
    error: comptesError.value,
    available: comptesDisponibles.value.filter(c => !comptesSelectionnes.value.some(id => String(id) === String(c.id))),
    selected: comptesDisponibles.value.filter(c => comptesSelectionnes.value.some(id => String(id) === String(c.id))),
    format: c => `${c.prenom} ${c.nom} (${c.courriel})`
  }
]);

const draggedItem = ref(null);

function startDrag(type, id, event) {
  draggedItem.value = { type, id };
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', `${type}:${id}`);
}

function moveItem(type, id, assign) {
  const selection = type === 'task' ? tasksSelectionnees : comptesSelectionnes;
  const exists = selection.value.some(value => String(value) === String(id));
  if (assign && !exists) selection.value = [...selection.value, id];
  else if (!assign && exists) selection.value = selection.value.filter(value => String(value) !== String(id));
}

function dropItem(type, assign) {
  const item = draggedItem.value;
  if (item && item.type === type) moveItem(type, item.id, assign);
  draggedItem.value = null;
}

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

  } catch {
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
  } catch {
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

      const assigned = poste.employes ?? poste.comptes;
      comptesSelectionnes.value = Array.isArray(assigned)
        ? assigned.map(compte => typeof compte === 'object' ? compte.id : compte)
        : comptesDisponibles.value.filter(compte => String(compte.posteId) === String(poste.id))
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
  } catch {
    posteError.value =
      'Une erreur est survenue lors de l’enregistrement du poste.';
  } finally {
    saving.value = false;
  }
}
</script>
