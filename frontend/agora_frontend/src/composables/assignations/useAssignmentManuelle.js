import { computed, reactive, ref } from 'vue'
import { afficherErreur, verifierChevauchement } from '../../utils/assignmentRules.js'

const MESSAGE_CHEVAUCHEMENT = 'Cette tâche existe déjà à cet horaire pour cet employé.'

export function useAssignmentManuelle({ store, journee, ui }) {
  const formulaire = reactive({ accountId: '', taskId: '', occurrenceId: '', comment: '' })
  const nouvelleOccurrence = reactive({ heureDebut: '', heureFin: '', taskPriorityId: '' })
  const formulaireCreationOccurrence = ref(false)
  const tacheManuelleSelectionnee = computed(() => store.choixTaches.value.find((tache) => String(tache.id) === formulaire.taskId) ?? null)
  const employesDeTerrain = computed(() => store.choixEmployes.value.filter((employe) => employe.role === 'personnel_de_terrain'))

  function reinitialiserFormulaire() {
    formulaire.accountId = ''
    formulaire.taskId = ''
    formulaire.occurrenceId = ''
    formulaire.comment = ''
    nouvelleOccurrence.heureDebut = ''
    nouvelleOccurrence.heureFin = ''
    nouvelleOccurrence.taskPriorityId = ''
    formulaireCreationOccurrence.value = false
    ui.erreurModal.value = ''
  }

  async function ouvrirAssignationManuelle() {
    reinitialiserFormulaire()
    ui.modalManuelle.value = true
    await journee.chargerChoix()
  }

  function fermerModalManuelle() {
    ui.modalManuelle.value = false
    reinitialiserFormulaire()
  }

  function changerTacheManuelle() {
    formulaire.occurrenceId = ''
    nouvelleOccurrence.taskPriorityId = tacheManuelleSelectionnee.value?.taskPriorityId
      ? String(tacheManuelleSelectionnee.value.taskPriorityId) : ''
    formulaireCreationOccurrence.value = false
  }

  function occurrencesPourTache(taskId) {
    return store.choixTaches.value.find((item) => Number(item.id) === Number(taskId))?.occurrences ?? []
  }

  async function assignerManuellement() {
    if (!formulaire.accountId || !formulaire.taskId || !formulaire.occurrenceId) return
    ui.erreurModal.value = ''
    const horaire = occurrencesPourTache(formulaire.taskId).find((item) => String(item.id) === formulaire.occurrenceId)
    if (horaire && verifierChevauchement(store.journees.value, formulaire.accountId, formulaire.taskId, horaire)) {
      ui.alerteChevauchement.value = MESSAGE_CHEVAUCHEMENT
      return
    }
    ui.enCours.value = true
    const compteId = Number(formulaire.accountId)
    try {
      await store.assignerManuellement({
        date: journee.dateSelectionnee.value,
        accountId: compteId,
        taskId: Number(formulaire.taskId),
        occurrenceId: Number(formulaire.occurrenceId),
        comment: formulaire.comment.trim() || null,
      })
      fermerModalManuelle()
      await journee.chargerJournee()
      const jour = store.journees.value.find((item) => item.accountId === compteId)
      if (jour) journee.selectionnerEmploye(compteId)
      ui.messageSucces.value = 'La tâche a été assignée manuellement.'
    } catch (error) {
      if (error?.status === 409 || error?.statusCode === 409 || /existe déjà à cet horaire/i.test(afficherErreur(error))) {
        ui.alerteChevauchement.value = MESSAGE_CHEVAUCHEMENT
      } else {
        ui.erreurModal.value = afficherErreur(error)
      }
    } finally {
      ui.enCours.value = false
    }
  }

  return {
    formulaire, nouvelleOccurrence, formulaireCreationOccurrence,
    tacheManuelleSelectionnee, employesDeTerrain, occurrencesPourTache,
    reinitialiserFormulaire, ouvrirAssignationManuelle,
    fermerModalManuelle, changerTacheManuelle, assignerManuellement,
  }
}
