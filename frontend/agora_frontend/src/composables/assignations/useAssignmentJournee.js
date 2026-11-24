import { computed, ref } from 'vue'
import { afficherErreur, normaliser } from '../../utils/assignmentRules.js'

function dateLocale() {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`
}

export function useAssignmentJournee(store, ui) {
  const dateSelectionnee = ref(dateLocale())
  const rechercheEmploye = ref('')
  const employeIdSelectionne = ref(null)
  const indexTache = ref(0)
  const jourSelectionne = computed(() => store.journees.value.find((jour) => jour.accountId === employeIdSelectionne.value) ?? null)
  const tachesSelectionnees = computed(() => jourSelectionne.value?.tasks ?? [])
  const tacheCourante = computed(() => tachesSelectionnees.value[indexTache.value] ?? null)
  const nombreTaches = computed(() => store.journees.value.reduce((total, jour) => total + (jour.tasks?.length ?? 0), 0))
  const nombreTerminees = computed(() => store.journees.value.reduce((total, jour) => total + (jour.tasks?.filter((tache) => tache.isCompleted).length ?? 0), 0))
  const aDesAutomatiques = computed(() => store.journees.value.some((jour) => jour.tasks?.some((tache) => tache.isAutomatic)))
  const dateLongue = computed(() => {
    const date = new Date(`${dateSelectionnee.value}T12:00:00Z`)
    return Number.isNaN(date.getTime()) ? dateSelectionnee.value : new Intl.DateTimeFormat('fr-CA', {
      day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
    }).format(date)
  })
  const journeesFiltrees = computed(() => {
    const terme = normaliser(rechercheEmploye.value.trim())
    if (!terme) return store.journees.value
    return store.journees.value.filter((jour) => normaliser([
      jour.account?.prenom, jour.account?.nom, jour.account?.poste?.nom,
    ].filter(Boolean).join(' ')).includes(terme))
  })

  function selectionnerEmploye(accountId) {
    employeIdSelectionne.value = accountId
    indexTache.value = 0
    ui.modifierOccurrenceVisible.value = false
    ui.occurrenceModificationId.value = ''
    ui.formulaireCreationHoraireModification.value = false
  }

  function changerIndex(direction) {
    indexTache.value = Math.max(0, Math.min(indexTache.value + direction, tachesSelectionnees.value.length - 1))
    ui.modifierOccurrenceVisible.value = false
    ui.occurrenceModificationId.value = ''
    ui.formulaireCreationHoraireModification.value = false
  }

  async function chargerJournee(preserverSelection = false) {
    const selection = preserverSelection ? employeIdSelectionne.value : null
    ui.erreur.value = ''
    if (!preserverSelection) selectionnerEmploye(null)
    try {
      const resultat = await store.chargerJournee(dateSelectionnee.value)
      if (resultat.obsolete) return false
      const trouve = store.journees.value.find((jour) => jour.accountId === selection)
      selectionnerEmploye(trouve ? selection : null)
      return true
    } catch (error) {
      selectionnerEmploye(null)
      ui.erreur.value = afficherErreur(error)
      return false
    }
  }

  async function chargerChoix() {
    try {
      return await store.chargerChoix(dateSelectionnee.value)
    } catch (error) {
      ui.erreurModal.value = afficherErreur(error)
      ui.erreur.value = afficherErreur(error)
      return false
    }
  }

  return {
    dateSelectionnee, rechercheEmploye, employeIdSelectionne, indexTache,
    jourSelectionne, tachesSelectionnees, tacheCourante,
    nombreTaches, nombreTerminees, aDesAutomatiques, dateLongue, journeesFiltrees,
    selectionnerEmploye, changerIndex, chargerJournee, chargerChoix,
  }
}
