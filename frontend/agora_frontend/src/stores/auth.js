import { defineStore } from "pinia";
import { isNumber } from "@/utils/checks";
import { ref, computed } from "vue";
import { useRoute, useRouter } from "vue-router";
import { jwtDecode } from "jwt-decode";
import { apiFetch } from "@/utils/api";

// Store qui serviera à mettre les méthodes pour la connexion à et la création d'un compte utilisateur.
export const useAuthStore = defineStore('auth', () =>{
  const errorMessage = ref('');
  const token = ref(localStorage.getItem("jwt"));
  const route = useRoute();
  const router = useRouter();
  const profile = ref({});

    /**
   * Vérifie si l'utilisateur est authentifié
   *
   * @type {*}
   */
  const isAuthenticated = computed(() => {
    if (token.value) {
      const decoded = jwtDecode(token.value);
      const now = Date.now() / 1000;
      return decoded.exp >= now;
    }
    return false;
  });

   const setToken = (theToken) => {
    localStorage.setItem("jwt", theToken);
    token.value = theToken;
  }

   const disconnect = () => {
    localStorage.removeItem("jwt");
  }

   function isTokenValid() {
    if (!token.value) return false;
    try {
      const { exp } = jwtDecode(token.value);
      return Date.now() < exp * 1000;
    } catch {
      return false;
    }
  }

    function isUserAdmin() {
    if (!token.value) return false;
    try {
      const { role } = jwtDecode(token.value);
      return role === 'administrateur';
    } catch {
      return false;
    }
  }

   function isUserCoordo() {
    if (!token.value) return false;
    try {
      const { role } = jwtDecode(token.value);
      return role === 'coordonnateur';
    } catch {
      return false;
    }
  }



  /**
   * Retrouve le jeton de l'utilisateur connecté dans le localStorage.
   *
   * @returns {*} Le jeton de l'utilisateur.
   */
  const getToken = () => {
    return localStorage.getItem("jwt");
  }

const loginUser = async (email, mdp) => {
    errorMessage.value = "";
    try {
      const response = await apiFetch("/api/account/login", {
        method: "POST",
        body: JSON.stringify({
          email: email.value,
          password: mdp.value
        })
      });

      const decodedToken = jwtDecode(response.data.token);

      console.log('response after login attempt', response);

      if (response == 401) {
        console.log('response is 401');
        errorMessage.value = "Identifiant ou mot de passe invalide.";
      }
      else if (isNumber(response)) {
        throw new Error(`HTTP ${response}`);
      }
      else {
        setToken(response.data.token);
        const userRole = decodedToken.role;
        let redirectTo = ""
        switch (userRole) {
          case "administrateur":
            redirectTo = route.query.redirect || "/admin";
            break;

          case "coordonnateur":
            redirectTo = route.query.redirect || "/coordo";
            break;

          case "personnel_de_terrain":
            redirectTo = route.query.redirect || "/employe";
            break;

          default:
            throw new Error(`Rôle ${userRole} invalide.`);
        }

        router.push(redirectTo);
      }
    } catch (err) {
      console.log('error', err);
    }
  };

  return{
    getToken,
    token,
    loginUser,
    errorMessage,
    isAuthenticated,
    disconnect,
    isTokenValid,
    isUserAdmin,
    isUserCoordo
  }
})
