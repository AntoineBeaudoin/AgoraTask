import { ref } from 'vue'

export function useAssignmentUi() {
  return {
    enCours: ref(false),
    erreur: ref(''),
    erreurModal: ref(''),
    messageSucces: ref(''),
    confirmationAuto: ref(false),
    modalManuelle: ref(false),
    formulaireCreationHoraireModification: ref(false),
    alerteChevauchement: ref(''),
    assignationASupprimer: ref(null),
    modifierOccurrenceVisible: ref(false),
    occurrenceModificationId: ref(''),
  }
}
