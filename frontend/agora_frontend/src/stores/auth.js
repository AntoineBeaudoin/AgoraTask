import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { jwtDecode } from 'jwt-decode'
import { apiFetch } from '@/utils/api'

// Store qui serviera à mettre les méthodes pour la connexion à et la création d'un compte utilisateur.
export const useAuthStore = defineStore('auth', () => {
  const errorMessage = ref('')
  const token = ref(localStorage.getItem('jwt'))
  const route = useRoute()
  const router = useRouter()

  /**
   * Vérifie si l'utilisateur est authentifié
   *
   * @type {*}
   */
  const isAuthenticated = computed(() => {
    if (token.value) {
      const decoded = jwtDecode(token.value)
      const now = Date.now() / 1000
      return decoded.exp >= now
    }
    return false
  })

  const setToken = (theToken) => {
    localStorage.setItem('jwt', theToken);
    token.value = theToken;
  }

  const disconnect = () => {
    localStorage.removeItem('jwt');
    router.push('/');
  }

  const getUserById = async (id) => {
    try {
      const response = await apiFetch(`/account/${id}`);
      if (response.status !== 200) {
        errorMessage.value = response.status + ': ' + (response.message || 'Erreur lors de la récupération du compte')
        return null
      }
      return response.data
    }
    catch (err) {
      console.log('Erreur lors de la récupération du compte:', err)
      errorMessage.value = 'Erreur lors de la récupération du compte'
      return null
    }
  }

  function isTokenValid() {
    if (!token.value) return false
    try {
      const { exp } = jwtDecode(token.value)
      return Date.now() < exp * 1000
    } catch {
      return false
    }
  }

  function isUserAdmin() {
    if (!token.value) return false
    try {
      const { role } = jwtDecode(token.value)
      return role === 'administrateur'
    } catch {
      return false
    }
  }

  function isUserCoordo() {
    if (!token.value) return false
    try {
      const { role } = jwtDecode(token.value)
      return role === 'coordonnateur'
    } catch {
      return false
    }
  }

  function isUserEmploye() {
    if (!token.value) return false

    try {
      const { role } = jwtDecode(token.value)
      return role === 'personnel_de_terrain'
    } catch {
      return false
    }
  }

  function isUserEnAttente() {
    if (!token.value) return false

    try {
      const { role } = jwtDecode(token.value)
      return role === 'Role_En_Attente'
    } catch {
      return false
    }
  }

  function getRole() {
    if (!token.value) return null

    try {
      return jwtDecode(token.value).role
    } catch {
      return null
    }
  }

  /**
   * Retrouve le jeton de l'utilisateur connecté dans le localStorage.
   *
   * @returns {*} Le jeton de l'utilisateur.
   */
  const getToken = () => {
    return localStorage.getItem('jwt')
  }

  const loginUser = async (email, mdp) => {
    console.log('LOGIN USER FUNCTION BEGINNING')
    errorMessage.value = ''
    try {
      const response = await apiFetch('/account/login', {
        method: 'POST',
        body: JSON.stringify({
          email: email.value,
          password: mdp.value,
        }),
      })

      if (response.status !== 200 && response.status !== 201) {
        errorMessage.value = response.status + ': ' + response.message || 'Erreur lors de la connexion'
      } else {
        const decodedToken = jwtDecode(response.data.token)

        setToken(response.data.token)
        const userRole = decodedToken.role
        let redirectTo = ''
        switch (userRole) {
          case "administrateur":
            redirectTo = route.query.redirect || "/admin";
            break;

          case 'coordonnateur':
            redirectTo = route.query.redirect || '/coordo'
            break

          case 'personnel_de_terrain':
            redirectTo = route.query.redirect || '/employe'
            break

          default:
            throw new Error(`Rôle ${userRole} invalide.`)
        }

        router.push(redirectTo)
      }
    } catch (err) {
      console.log('error', err)
    }
  }

  const changePassword = async(userId, oldPassword, newPassword) => {
    try {
      const response = await apiFetch('/account/password', {
        method: 'POST',
        body: JSON.stringify({
          id: userId,
          currentPassword: oldPassword.value,
          newPassword: newPassword.value,
        }),
      });
      if (response.status !== 200)
      {
        throw new Error(`HTTP ${response.status}`);
      }
      return true;
    } catch (err) {
      console.log('error', err);
      return false;
    }
  }

  return {
    getToken,
    token,
    loginUser,
    errorMessage,
    isAuthenticated,
    disconnect,
    isTokenValid,
    isUserAdmin,
    isUserCoordo,
    isUserEmploye,
    isUserEnAttente,
    getRole,
    getUserById,
    changePassword
  }
})
