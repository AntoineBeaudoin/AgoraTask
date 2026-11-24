import { ref } from 'vue'
import { apiFetch } from '../utils/api.js'

export function useAssignmentStore() {
  const journees = ref([])
  const choixEmployes = ref([])
  const choixTaches = ref([])
  const choixPriorites = ref([])
  const chargementJournee = ref(false)
  const chargementChoix = ref(false)
  let requeteJournee = 0
  let requeteChoix = 0
  let dateChoixCharges = ''

  async function chargerJournee(date) {
    const id = ++requeteJournee
    chargementJournee.value = true
    try {
      const resultat = await apiFetch(`/assign?date=${encodeURIComponent(date)}`, { method: 'GET' })
      if (id !== requeteJournee) return { obsolete: true }
      journees.value = Array.isArray(resultat?.data) ? resultat.data : []
      return { obsolete: false }
    } catch (error) {
      if (id !== requeteJournee) return { obsolete: true }
      journees.value = []
      throw error
    } finally {
      if (id === requeteJournee) chargementJournee.value = false
    }
  }

  function invaliderChoix() {
    ++requeteChoix
    dateChoixCharges = ''
    choixEmployes.value = []
    choixTaches.value = []
    choixPriorites.value = []
    chargementChoix.value = false
  }

  async function chargerChoix(date) {
    if (dateChoixCharges === date) return true
    const id = ++requeteChoix
    chargementChoix.value = true
    try {
      const resultat = await apiFetch(`/assign/options?date=${encodeURIComponent(date)}`, { method: 'GET' })
      if (id !== requeteChoix) return false
      choixEmployes.value = resultat?.data?.employes ?? []
      choixTaches.value = resultat?.data?.taches ?? []
      choixPriorites.value = resultat?.data?.priorites ?? []
      dateChoixCharges = date
      return true
    } catch (error) {
      if (id !== requeteChoix) return false
      throw error
    } finally {
      if (id === requeteChoix) chargementChoix.value = false
    }
  }

  async function creerHoraire(corps) {
    const resultat = await apiFetch('/assign/occurrences', {
      method: 'POST', body: JSON.stringify(corps),
    })
    return resultat?.data
  }

  async function assignerManuellement(corps) {
    return apiFetch('/assign/manual', { method: 'POST', body: JSON.stringify(corps) })
  }

  async function assignerAutomatiquement(date) {
    return apiFetch('/assign/automatic', {
      method: 'POST', body: JSON.stringify({ date }),
    })
  }

  async function changerHoraire(workDayTaskId, occurrenceId) {
    return apiFetch(`/assign/tasks/${workDayTaskId}/occurrence`, {
      method: 'PATCH', body: JSON.stringify({ occurrenceId: Number(occurrenceId) }),
    })
  }

  async function supprimerAssignation(workDayTaskId) {
    return apiFetch(`/assign/tasks/${workDayTaskId}`, { method: 'DELETE' })
  }

  return {
    journees, choixEmployes, choixTaches, choixPriorites,
    chargementJournee, chargementChoix,
    chargerJournee, chargerChoix, invaliderChoix, creerHoraire,
    assignerManuellement, assignerAutomatiquement, changerHoraire, supprimerAssignation,
  }
}
