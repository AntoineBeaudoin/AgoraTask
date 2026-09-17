<template>
  <div class="container m-3 m-auto">
    <h2 class="text-center">Se connecter</h2>

    <img src="../assets/images/user.png" alt="Image statique pour un compte utilisateur" class="w-50">

    <form action="POST" novalidate @submit.prevent="loginUser" class="mx-auto d-block text-center">
        <div class="mb-3 text-start">
          <label for="courriel" class="form-label">Courriel :</label>
          <input type="email" class="form-control" name="courriel" id="courriel" v-model.trim="courriel" />
          <div class="text-danger" v-if="courrielInvalide">Le courriel n'est pas valide.</div>
        </div>

        <div class="mb-3 text-start">
          <label for="mdp" class="form-label">Mot De Passe : </label>
          <input type="password" class="form-control" name="mdp" id="mdp" v-model.trim="mdp" />
          <div class="text-danger" v-if="mdpInvalide">Le mot de passe n'est pas valide.</div>
        </div>

        <p class="text-danger" v-if="errorMessage">{{ errorMessage }}</p>

        <div class="mb-3 text-start">
          Pas de compte? <RouterLink to="/register" class="nav-link" id="lien-creation-compte">Créez-en un</RouterLink>
        </div>

        <div class="d-flex justify-content-start mb-3">
          <button type="submit" class="btn btn-success">Se Connecter</button>
        </div>
      </form>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

const store = useAuthStore();
const courriel = ref('');
const mdp = ref('');
const errorMessage = storeToRefs(store);

const courrielInvalide = ref(false);
const mdpInvalide = ref(false);


const validateUser = () => {
  courrielInvalide.value = false;
  mdpInvalide.value = false;

  let formIsValid = true;

  const courrielRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+.[a-zA-Z]{2,6}$/;

  if (courriel.value.length == 0 || !courrielRegex.test(courriel.value)) {
    courrielInvalide.value = true;
    errorMessage.value = "Le courriel n'est pas valide.";
    formIsValid = false;
  }

  return formIsValid;
};

const loginUser = async () => {
  if (validateUser()) {
    await store.loginUser(courriel, mdp);
  }
}


</script>

<style scoped>
#lien-creation-compte {
  color: blue;
  text-decoration: underline;
  display: inline;
}

#lien-creation-compte:hover {
  color: rgb(0, 1, 140);
  text-decoration: none;
}

img{
  max-width: 90%;
  max-height: 80%;
}
</style>
