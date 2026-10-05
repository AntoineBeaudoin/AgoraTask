<template>
  <Teleport to="body">
    <div v-if="modalStore.passwordModalOpen" class="modal fade p-5" @click.self="close" id="passwordModal" tabindex="-1"
      role="dialog" aria-labelledby="passwordModalLabel" aria-hidden="true">
      <div class="modal-dialog">
        <div class="modal-content mt-3 ps-3 pe-3">

          <div class="modal-header ps-0">
            <h2 class="modal-title">
              Modifier le mot de passe
            </h2>

            <button type="button" class="bg-transparent border-0 ms-auto p-3 btn btn-close" @click="close">
            </button>
          </div>

          <form @submit.prevent="submit" novalidate class="mt-3">

            <div class="form-group mb-3">
              <label for="oldPassword" class="d-none">
                Ancien mot de passe
              </label>

              <input v-model="oldPassword" id="oldPassword" class="form-control" type="password"
                placeholder="Ancien mot de passe" required />

              <span id="oldPasswordError" class="invalid-feedback">
                L'ancien mot de passe est requis
              </span>
            </div>

            <div class="form-group mb-3">
              <label for="newPassword" class="d-none">
                Nouveau mot de passe
              </label>

              <input v-model="newPassword" id="newPassword" class="form-control" type="password"
                placeholder="Nouveau mot de passe" required />

              <span id="newPasswordError" class="invalid-feedback">
                Le nouveau mot de passe doit être différent que l'ancien mot de passe, et respecter les exigences de sécurité.
              </span>
            </div>

            <p class="text-danger mx-auto text-center">{{ errorMessage }}</p>

            <div class="modal-footer">
              <button type="button" class="btn btn-danger" @click="close">
                Annuler
              </button>

              <button type="submit" class="btn btn-success">
                Modifier
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch } from 'vue';
import { useModalStore } from '@/stores/modalStore';
import { useAuthStore } from '@/stores/auth';

const modalStore = useModalStore();
const authStore = useAuthStore();

const oldPassword = ref('');
const newPassword = ref('');
const errorMessage = ref('');

watch(() => modalStore.editingUser, (user) => {
  if (!user) {
    resetForm();
  }
},
  { immediate: true }
);

function resetValidationMessages() {
  document.querySelectorAll('#passwordModal .is-invalid').forEach((input) => input.classList.remove('is-invalid'));
  document.querySelectorAll('#passwordModal .invalid-feedback').forEach((span) => span.classList.remove('d-block'));
}

function resetForm() {
  errorMessage.value = '';
  oldPassword.value = '';
  newPassword.value = '';

  resetValidationMessages();
}

function close() {
  resetForm();
  modalStore.closePasswordModal();
}

function validatePassword(password)
{
  const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
  return passwordRegex.test(password);
}

function formIsValid() {
  const theOldPassword = oldPassword.value.trim();
  const theNewPassword = newPassword.value.trim();
  return theOldPassword !== '' && theNewPassword !== '' && theNewPassword !== theOldPassword && validatePassword(theNewPassword);
}

function markInvalidInputs() {
  resetValidationMessages();
  const theOldPassword = oldPassword.value.trim();
  const theNewPassword = newPassword.value.trim();
  if (!theOldPassword) {
    document.querySelector('#oldPassword').classList.add('is-invalid');

    document.querySelector('#oldPasswordError').classList.add('d-block');
  }

  if (!theNewPassword || theNewPassword === theOldPassword || !validatePassword(theNewPassword)) {
    document.querySelector('#newPassword').classList.add('is-invalid');

    document.querySelector('#newPasswordError').classList.add('d-block');
  }
}

async function submit() {
  errorMessage.value = "";
  if (!formIsValid()) {
    markInvalidInputs();
    return;
  }

  const userId = modalStore.editingUser;

  if (!userId) {
    return;
  }

  let hasPasswordChanged = await authStore.changePassword(userId, oldPassword, newPassword);
  if (!hasPasswordChanged)
  {
    errorMessage.value = "Une erreur est survenue lors du changement du mot de passe.";
  }
  else
  {
    close();
  }

}
</script>
