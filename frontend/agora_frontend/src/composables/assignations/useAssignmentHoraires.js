import { reactive } from 'vue'
import { afficherErreur, heure, secondes, verifierChevauchement } from '../../utils/assignmentRules.js'

const MESSAGE_CHEVAUCHEMENT = 'Cette tâche existe déjà à cet horaire pour cet employé.'

export function useAssignmentHoraires({ store, journee, manuel, ui }) {
  const nouvelHoraireModification = reactive({ heureDebut: '', heureFin: '', taskPriorityId: '' })

  function libellePriorite(horaire) {
    return horaire?.priority?.task_priority || store.choixPriorites.value.find(
      (priorite) => Number(priorite.id) === Number(horaire?.taskPriorityId),
    )?.task_priority || 'Non précisée'
  }

  function libelleOccurrence(horaire) {
    return `${heure(horaire.heureDebut)} – ${heure(horaire.heureFin)} · Priorité : ${libellePriorite(horaire)}`
  }

  function occurrencesPourModification(affectation) {
    return manuel.occurrencesPourTache(affectation.taskId)
  }

  async function creerNouvelleOccurrence(destination = 'manuel') {
    const modification = destination === 'modification'
    const taskId = modification ? journee.tacheCourante.value?.taskId : manuel.formulaire.taskId
    const valeurs = modification ? nouvelHoraireModification : manuel.nouvelleOccurrence
    const tache = store.choixTaches.value.find((item) => Number(item.id) === Number(taskId))
    if (!taskId || !tache) return
    const debut = secondes(valeurs.heureDebut)
    const fin = secondes(valeurs.heureFin)
    if (debut === null || fin === null || fin <= debut) {
      const message = 'Indiquez un horaire valide : fin après début.'
      if (modification) ui.erreur.value = message
      else ui.erreurModal.value = message
      return
    }
    if (!valeurs.taskPriorityId && !tache.taskPriorityId) {
      const message = 'Choisissez une priorité.'
      if (modification) ui.erreur.value = message
      else ui.erreurModal.value = message
      return
    }
    ui.enCours.value = true
    try {
      const horaire = await store.creerHoraire({
        taskId: Number(taskId),
        heureDebut: valeurs.heureDebut,
        heureFin: valeurs.heureFin,
        ...(valeurs.taskPriorityId ? { taskPriorityId: Number(valeurs.taskPriorityId) } : {}),
      })
      if (!horaire?.id) throw new Error('Le serveur n’a pas renvoyé le nouvel horaire.')
      tache.occurrences ??= []
      tache.occurrences.push(horaire)
      if (modification) {
        ui.occurrenceModificationId.value = String(horaire.id)
        ui.formulaireCreationHoraireModification.value = false
      } else {
        manuel.formulaire.occurrenceId = String(horaire.id)
        manuel.formulaireCreationOccurrence.value = false
      }
    } catch (error) {
      if (modification) ui.erreur.value = afficherErreur(error)
      else ui.erreurModal.value = afficherErreur(error)
    } finally {
      ui.enCours.value = false
    }
  }

  async function ouvrirModificationOccurrence() {
    ui.modifierOccurrenceVisible.value = !ui.modifierOccurrenceVisible.value
    if (!ui.modifierOccurrenceVisible.value) return
    ui.occurrenceModificationId.value = String(journee.tacheCourante.value?.occurrenceId ?? '')
    ui.formulaireCreationHoraireModification.value = false
    await journee.chargerChoix()
  }

  async function enregistrerModificationOccurrence() {
    if (!journee.tacheCourante.value || !ui.occurrenceModificationId.value) return
    const horaire = occurrencesPourModification(journee.tacheCourante.value).find(
      (item) => String(item.id) === ui.occurrenceModificationId.value,
    )
    if (horaire && verifierChevauchement(
      store.journees.value, journee.employeIdSelectionne.value,
      journee.tacheCourante.value.taskId, horaire, journee.tacheCourante.value.id,
    )) {
      ui.alerteChevauchement.value = MESSAGE_CHEVAUCHEMENT
      return
    }
    ui.enCours.value = true
    ui.erreur.value = ''
    try {
      await store.changerHoraire(journee.tacheCourante.value.id, ui.occurrenceModificationId.value)
      const id = journee.employeIdSelectionne.value
      const index = journee.indexTache.value
      await journee.chargerJournee(true)
      if (journee.employeIdSelectionne.value === id) {
        journee.indexTache.value = Math.min(index, journee.tachesSelectionnees.value.length - 1)
      }
      ui.modifierOccurrenceVisible.value = false
      ui.messageSucces.value = 'Horaire modifié avec succès.'
    } catch (error) {
      if (error?.status === 409 || error?.statusCode === 409 || /existe déjà à cet horaire/i.test(afficherErreur(error))) {
        ui.alerteChevauchement.value = MESSAGE_CHEVAUCHEMENT
      } else ui.erreur.value = afficherErreur(error)
    } finally {
      ui.enCours.value = false
    }
  }

  return {
    nouvelHoraireModification, libellePriorite, libelleOccurrence,
    occurrencesPourModification, creerNouvelleOccurrence,
    ouvrirModificationOccurrence, enregistrerModificationOccurrence,
  }
}
