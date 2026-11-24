import { afficherErreur } from '../../utils/assignmentRules.js'

export function useAssignmentActions({ store, journee, ui }) {
  async function assignerAutomatiquement() {
    ui.enCours.value = true
    ui.erreur.value = ''
    try {
      const resultat = await store.assignerAutomatiquement(journee.dateSelectionnee.value)
      ui.confirmationAuto.value = false
      await journee.chargerJournee(true)
      const bilan = resultat?.data ?? {}
      ui.messageSucces.value = `${bilan.creees ?? 0} tâche(s) créée(s), ${bilan.supprimees ?? 0} remplacée(s), ${bilan.ignorees ?? 0} ignorée(s).`
    } catch (error) {
      ui.erreur.value = afficherErreur(error)
    } finally {
      ui.enCours.value = false
    }
  }

  async function supprimerAssignation() {
    if (!ui.assignationASupprimer.value) return
    const identifiant = ui.assignationASupprimer.value.id
    const index = journee.indexTache.value
    ui.enCours.value = true
    ui.erreur.value = ''
    try {
      await store.supprimerAssignation(identifiant)
      ui.assignationASupprimer.value = null
      await journee.chargerJournee(true)
      journee.indexTache.value = Math.max(0, Math.min(index, journee.tachesSelectionnees.value.length - 1))
      ui.messageSucces.value = 'Assignation retirée.'
    } catch (error) {
      ui.erreur.value = afficherErreur(error)
    } finally {
      ui.enCours.value = false
    }
  }

  return { assignerAutomatiquement, supprimerAssignation }
}
