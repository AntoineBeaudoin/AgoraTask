<template>
  <main class="assign-page">
    <header class="page-header">
      <div>
        <h1>Gestion des assignations</h1>
      </div>
      <div class="header-actions">
        <label class="date-box" for="dateAssignation">
          <span>Date d'assignation</span>
          <input id="dateAssignation" v-model="dateSelectionnee" type="date" :disabled="enCours" />
        </label>
        <button
          class="btn btn-dark-action"
          type="button"
          :disabled="enCours"
          @click="ouvrirAssignationManuelle"
        >
          <span class="btn-plus">+</span> Assigner manuellement
        </button>
        <button
          class="btn btn-green"
          type="button"
          :disabled="enCours || chargementJournee"
          @click="confirmationAuto = true"
        >
          <span class="btn-icon">↻</span>
          {{ aDesAutomatiques ? 'Régénérer automatiquement' : 'Assigner automatiquement' }}
        </button>
      </div>
    </header>

    <div v-if="messageSucces" class="notice notice-success" role="status">
      <span>{{ messageSucces }}</span>
      <button type="button" aria-label="Fermer le message" @click="messageSucces = ''">×</button>
    </div>
    <div v-if="erreur" class="notice notice-error" role="alert">
      <span>{{ erreur }}</span>
      <button type="button" aria-label="Fermer l'erreur" @click="erreur = ''">×</button>
    </div>

    <AssignmentSummary
      :nombre-employes="journees.length"
      :nombre-taches="nombreTaches"
      :nombre-terminees="nombreTerminees"
      :date-longue="dateLongue"
    />

    <section class="assign-layout">
      <div class="panel employees-panel">
        <div class="panel-header"><h2>Employés assignés</h2></div>
        <label class="sr-only" for="rechercheEmploye">Rechercher un employé</label>
        <input
          id="rechercheEmploye"
          v-model="rechercheEmploye"
          class="employee-search"
          type="search"
          placeholder="Rechercher un employé"
          autocomplete="off"
        />
        <div v-if="chargementJournee" class="empty-state" role="status">
          Chargement des assignations…
        </div>
        <div v-else-if="journees.length === 0" class="empty-state">
          <div class="empty-symbol">▤</div>
          <h3>Aucune assignation</h3>
        </div>
        <div v-else-if="journeesFiltrees.length === 0" class="empty-state">
          Aucun employé trouvé.
        </div>
        <div v-else class="employees-list">
          <button
            v-for="jour in journeesFiltrees"
            :key="jour.id"
            type="button"
            class="employee-row"
            :class="{ active: jour.accountId === employeIdSelectionne }"
            :aria-pressed="jour.accountId === employeIdSelectionne"
            @click="selectionnerEmploye(jour.accountId)"
          >
            <span class="avatar">{{ initiales(jour.account) }}</span>
            <span class="employee-meta">
              <strong>{{ nomEmploye(jour.account) }}</strong>
              <small
                >{{
                  jour.account?.poste?.nom
                    ? 'Poste : ' + jour.account.poste.nom
                    : libelleRole(jour.account?.role)
                }}
                · {{ jour.tasks?.length ?? 0 }} tâche(s)</small
              >
            </span>
            <span
              v-if="jour.tasks?.some((tache) => tache.isAutomatic)"
              class="auto-marker"
              title="Contient des tâches automatiques"
              >Auto</span
            >
            <AssignmentStatusPill :complete="toutesTerminees(jour.tasks)" />
            <span class="chevron">›</span>
          </button>
        </div>
      </div>

      <div class="panel tasks-panel">
        <div v-if="!jourSelectionne" class="empty-state no-selection">
          <div class="empty-symbol">☷</div>
          <h2>Sélectionnez un employé</h2>
        </div>
        <template v-else>
          <div class="selected-header">
            <span class="avatar avatar-large">{{ initiales(jourSelectionne.account) }}</span>
            <div class="selected-name">
              <h2>{{ nomEmploye(jourSelectionne.account) }}</h2>
              <p>
                {{ dateSelectionnee }} · {{ tachesSelectionnees.length }} tâche(s) ·
                {{
                  jourSelectionne.account?.poste?.nom
                    ? 'Poste : ' + jourSelectionne.account.poste.nom
                    : libelleRole(jourSelectionne.account?.role)
                }}
              </p>
            </div>
            <AssignmentStatusPill
              :complete="toutesTerminees(tachesSelectionnees)"
              libelle-attente="En cours"
            />
          </div>

          <div v-if="tachesSelectionnees.length === 0" class="empty-state">
            Aucune tâche pour cette journée.
          </div>
          <template v-else>
            <nav class="task-navigation" aria-label="Navigation entre les tâches">
              <span
                >Tâche <strong>{{ indexTache + 1 }}</strong> /
                {{ tachesSelectionnees.length }}</span
              >
              <div class="navigation-buttons">
                <button
                  type="button"
                  :disabled="indexTache === 0"
                  aria-label="Tâche précédente"
                  @click="changerIndex(-1)"
                >
                  ←
                </button>
                <button
                  type="button"
                  :disabled="indexTache === tachesSelectionnees.length - 1"
                  aria-label="Tâche suivante"
                  @click="changerIndex(1)"
                >
                  →
                </button>
              </div>
            </nav>

            <article v-if="tacheCourante" :key="tacheCourante.id" class="task-card">
              <div class="task-heading">
                <div>
                  <h3>{{ tacheCourante.task?.title || 'Tâche sans titre' }}</h3>
                  <p v-if="tacheCourante.task?.room" class="task-room">
                    {{ tacheCourante.task.room }}
                  </p>
                </div>
              </div>
              <div class="task-metadata">
                <div class="schedule-main">
                  <strong>Horaire</strong>
                  <span
                    >{{ heure(tacheCourante.occurrence?.heureDebut) }} –
                    {{ heure(tacheCourante.occurrence?.heureFin) }}</span
                  >
                </div>
                <div class="schedule-priority">
                  <strong>Priorité</strong>
                  <span>{{ libellePriorite(tacheCourante.occurrence) }}</span>
                </div>
                <span class="task-origin">{{
                  tacheCourante.isAutomatic ? 'Automatique' : 'Manuelle'
                }}</span>
              </div>
              <p v-if="tacheCourante.task?.description" class="task-description">
                {{ tacheCourante.task.description }}
              </p>
              <div v-if="tacheCourante.comment" class="comment-box">
                <strong>Commentaire de la tâche</strong>
                <p>{{ tacheCourante.comment }}</p>
              </div>

              <div class="occurrence-toolbar">
                <button
                  class="link-button"
                  type="button"
                  :disabled="enCours"
                  @click="ouvrirModificationOccurrence"
                >
                  Modifier l'horaire
                </button>
              </div>
              <div v-if="modifierOccurrenceVisible" class="occurrence-editor">
                <label :for="'modifier-occurrence-' + tacheCourante.id">Horaire</label>
                <div class="inline-controls">
                  <select
                    :id="'modifier-occurrence-' + tacheCourante.id"
                    v-model="occurrenceModificationId"
                    :disabled="enCours || chargementChoix"
                  >
                    <option value="">Choisir un horaire</option>
                    <option
                      v-for="occurrence in occurrencesPourModification(tacheCourante)"
                      :key="occurrence.id"
                      :value="String(occurrence.id)"
                    >
                      {{ libelleOccurrence(occurrence) }}
                    </option>
                  </select>
                  <button
                    class="btn btn-green btn-small"
                    type="button"
                    :disabled="enCours || !occurrenceModificationId"
                    @click="enregistrerModificationOccurrence"
                  >
                    Enregistrer
                  </button>
                  <button
                    class="btn btn-light btn-small"
                    type="button"
                    :disabled="enCours"
                    @click="modifierOccurrenceVisible = false"
                  >
                    Annuler
                  </button>
                </div>
                <button
                  class="link-button create-schedule-trigger"
                  type="button"
                  :disabled="enCours"
                  @click="
                    formulaireCreationHoraireModification = !formulaireCreationHoraireModification
                  "
                >
                  {{ formulaireCreationHoraireModification ? 'Masquer' : '+ Créer un horaire' }}
                </button>
                <div
                  v-if="formulaireCreationHoraireModification"
                  class="new-occurrence schedule-modification-form"
                >
                  <div class="two-fields">
                    <label
                      >Heure de début
                      <input
                        v-model="nouvelHoraireModification.heureDebut"
                        type="time"
                        required
                        :disabled="enCours"
                    /></label>
                    <label
                      >Heure de fin
                      <input
                        v-model="nouvelHoraireModification.heureFin"
                        type="time"
                        required
                        :disabled="enCours"
                    /></label>
                  </div>
                  <label
                    >Priorité
                    <select v-model="nouvelHoraireModification.taskPriorityId" :disabled="enCours">
                      <option value="">Priorité de la tâche</option>
                      <option
                        v-for="priorite in choixPriorites"
                        :key="priorite.id"
                        :value="String(priorite.id)"
                      >
                        {{ priorite.task_priority }}
                      </option>
                    </select>
                  </label>
                  <button
                    class="btn btn-dark-action btn-small"
                    type="button"
                    :disabled="enCours"
                    @click="creerNouvelleOccurrence('modification')"
                  >
                    Créer cet horaire
                  </button>
                </div>
              </div>

              <div class="subtasks-header">
                <h4>Sous-tâches</h4>
                <span>{{ tacheCourante.subTasks?.length ?? 0 }}</span>
              </div>
              <p v-if="!tacheCourante.subTasks?.length" class="muted-empty">
                Aucune sous-tâche pour cette assignation.
              </p>
              <div
                v-for="sousTache in tacheCourante.subTasks ?? []"
                :key="sousTache.id"
                class="subtask-row"
              >
                <span class="subtask-check" :class="{ checked: sousTache.isCompleted }">{{
                  sousTache.isCompleted ? '✓' : ''
                }}</span>
                <div>
                  <strong>{{ sousTache.subTask?.titre || 'Sous-tâche' }}</strong>
                  <p v-if="sousTache.subTask?.description">{{ sousTache.subTask.description }}</p>
                  <p v-if="sousTache.comment" class="subtask-comment">{{ sousTache.comment }}</p>
                </div>
              </div>
              <footer class="task-delete-bar">
                <button
                  class="btn btn-delete btn-small"
                  type="button"
                  :disabled="enCours"
                  @click="
                    assignationASupprimer = {
                      id: tacheCourante.id,
                      titre: tacheCourante.task?.title || 'Tâche',
                    }
                  "
                >
                  Retirer cette assignation
                </button>
              </footer>
            </article>
          </template>
        </template>
      </div>
    </section>

    <div
      v-if="confirmationAuto"
      class="modal-overlay"
      role="presentation"
      @click.self="!enCours && (confirmationAuto = false)"
    >
      <section
        class="modal-card confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titreConfirmation"
      >
        <div class="warning-icon">!</div>
        <h2 id="titreConfirmation">
          {{
            aDesAutomatiques ? 'Régénérer les assignations ?' : 'Lancer l’assignation automatique ?'
          }}
        </h2>
        <p>
          Les tâches liées aux postes et aux horaires du
          <strong>{{ dateSelectionnee }}</strong> vont être générées automatiquement.
        </p>
        <p class="warning-text">
          Les assignations <strong>automatiques existantes</strong> pour cette date seront
          supprimées et recréées. Leurs commentaires et états de progression seront perdus. Les
          assignations manuelles seront conservées.
        </p>
        <p v-if="erreur" class="warning-text" role="alert">{{ erreur }}</p>
        <div class="modal-actions">
          <button
            class="btn btn-light"
            type="button"
            :disabled="enCours"
            @click="confirmationAuto = false"
          >
            Annuler
          </button>
          <button
            class="btn btn-green"
            type="button"
            :disabled="enCours"
            @click="assignerAutomatiquement"
          >
            {{ enCours ? 'Assignation en cours…' : 'Confirmer l’assignation' }}
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="modalManuelle"
      class="modal-overlay"
      role="presentation"
      @click.self="!enCours && fermerModalManuelle()"
    >
      <section
        class="modal-card manual-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titreManuel"
      >
        <header class="modal-top">
          <div>
            <h2 id="titreManuel">Assigner une tâche</h2>
            <p>{{ dateSelectionnee }}</p>
          </div>
          <button
            type="button"
            class="close-button"
            aria-label="Fermer"
            :disabled="enCours"
            @click="fermerModalManuelle"
          >
            ×
          </button>
        </header>
        <div v-if="chargementChoix" class="empty-state" role="status">
          Chargement des employés et des tâches…
        </div>
        <form v-else class="manual-form" @submit.prevent="assignerManuellement">
          <div class="field-row">
            <label for="employeManuel">Employé</label>
            <select id="employeManuel" v-model="formulaire.accountId" required :disabled="enCours">
              <option value="">Sélectionner un employé</option>
              <option
                v-for="employe in employesDeTerrain"
                :key="employe.id"
                :value="String(employe.id)"
              >
                {{ nomEmploye(employe) }}{{ employe.poste?.nom ? ' — ' + employe.poste.nom : '' }}
              </option>
            </select>
          </div>
          <div class="field-row">
            <label>Tâche à assigner</label>
            <div v-if="!choixTaches.length" class="muted-empty">Aucune tâche disponible.</div>
            <div v-else class="task-choices" role="radiogroup" aria-label="Tâche à assigner">
              <label
                v-for="tache in choixTaches"
                :key="tache.id"
                class="choice-card"
                :class="{ chosen: formulaire.taskId === String(tache.id) }"
              >
                <input
                  v-model="formulaire.taskId"
                  type="radio"
                  name="tacheManuelle"
                  :value="String(tache.id)"
                  :disabled="enCours"
                  @change="changerTacheManuelle"
                />
                <span class="choice-text"
                  ><strong>{{ tache.title }}</strong
                  ><small>{{ tache.room || 'Local non précisé' }}</small
                  ><small v-if="tache.description">{{ tache.description }}</small></span
                >
                <span class="choice-indicator">{{
                  formulaire.taskId === String(tache.id) ? '✓' : ''
                }}</span>
              </label>
            </div>
          </div>
          <div v-if="tacheManuelleSelectionnee" class="field-row">
            <div class="field-heading">
              <label for="occurrenceManuelle">Horaire</label
              ><button
                class="link-button"
                type="button"
                :disabled="enCours"
                @click="formulaireCreationOccurrence = !formulaireCreationOccurrence"
              >
                {{ formulaireCreationOccurrence ? 'Masquer le formulaire' : '+ Créer un horaire' }}
              </button>
            </div>
            <select
              id="occurrenceManuelle"
              v-model="formulaire.occurrenceId"
              :disabled="enCours"
              required
            >
              <option value="">Sélectionner un horaire</option>
              <option
                v-for="occurrence in occurrencesPourTache(tacheManuelleSelectionnee.id)"
                :key="occurrence.id"
                :value="String(occurrence.id)"
              >
                {{ libelleOccurrence(occurrence) }}
              </option>
            </select>
            <p v-if="!occurrencesPourTache(tacheManuelleSelectionnee.id).length" class="help-text">
              Aucun horaire disponible.
            </p>
            <div v-if="formulaireCreationOccurrence" class="new-occurrence">
              <h3>Nouvel horaire</h3>
              <div class="two-fields">
                <label
                  >Heure de début
                  <input
                    v-model="nouvelleOccurrence.heureDebut"
                    type="time"
                    required
                    :disabled="enCours"
                /></label>
                <label
                  >Heure de fin
                  <input
                    v-model="nouvelleOccurrence.heureFin"
                    type="time"
                    required
                    :disabled="enCours"
                /></label>
              </div>
              <label
                >Priorité
                <select
                  v-model="nouvelleOccurrence.taskPriorityId"
                  :disabled="enCours"
                  :required="!tacheManuelleSelectionnee.taskPriorityId"
                >
                  <option value="">Priorité de la tâche par défaut</option>
                  <option
                    v-for="priorite in choixPriorites"
                    :key="priorite.id"
                    :value="String(priorite.id)"
                  >
                    {{ priorite.task_priority }}
                  </option>
                </select>
              </label>
              <button
                class="btn btn-dark-action btn-small"
                type="button"
                :disabled="enCours"
                @click="creerNouvelleOccurrence('manuel')"
              >
                {{ enCours ? 'Création…' : 'Créer cet horaire' }}
              </button>
            </div>
          </div>
          <div class="field-row">
            <label for="commentaireManuel">Commentaire (facultatif)</label>
            <textarea
              id="commentaireManuel"
              v-model="formulaire.comment"
              rows="2"
              placeholder="Précisions pour l'employé…"
              :disabled="enCours"
            ></textarea>
          </div>
          <div v-if="erreurModal" class="notice notice-error" role="alert">{{ erreurModal }}</div>
          <footer class="modal-actions">
            <button
              class="btn btn-light"
              type="button"
              :disabled="enCours"
              @click="fermerModalManuelle"
            >
              Annuler
            </button>
            <button
              class="btn btn-green"
              type="submit"
              :disabled="
                enCours || !formulaire.accountId || !formulaire.taskId || !formulaire.occurrenceId
              "
            >
              {{ enCours ? 'Enregistrement…' : 'Assigner la tâche' }}
            </button>
          </footer>
        </form>
      </section>
    </div>

    <div
      v-if="alerteChevauchement"
      class="modal-overlay"
      role="presentation"
      @click.self="alerteChevauchement = ''"
    >
      <section
        class="modal-card confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titreChevauchement"
      >
        <div class="warning-icon">!</div>
        <h2 id="titreChevauchement">Horaire déjà utilisé</h2>
        <p role="alert">{{ alerteChevauchement }}</p>
        <div class="modal-actions">
          <button class="btn btn-dark-action" type="button" @click="alerteChevauchement = ''">
            Compris
          </button>
        </div>
      </section>
    </div>

    <div
      v-if="assignationASupprimer"
      class="modal-overlay"
      role="presentation"
      @click.self="!enCours && (assignationASupprimer = null)"
    >
      <section
        class="modal-card confirm-card"
        role="dialog"
        aria-modal="true"
        aria-labelledby="titreSuppression"
      >
        <h2 id="titreSuppression">Retirer cette assignation ?</h2>
        <p>{{ assignationASupprimer.titre }}</p>
        <p>Ses sous-tâches, commentaires et états seront supprimés.</p>
        <div class="modal-actions">
          <button
            class="btn btn-light"
            type="button"
            :disabled="enCours"
            @click="assignationASupprimer = null"
          >
            Annuler
          </button>
          <button
            class="btn btn-delete"
            type="button"
            :disabled="enCours"
            @click="supprimerAssignation"
          >
            Confirmer la suppression
          </button>
        </div>
      </section>
    </div>
  </main>
</template>

<script setup>
import { watch } from 'vue'
import AssignmentSummary from '../components/assignations/AssignmentSummary.vue'
import AssignmentStatusPill from '../components/assignations/AssignmentStatusPill.vue'
import { useAssignmentStore } from '../stores/assignmentStore.js'
import { useAssignmentUi } from '../composables/assignations/useAssignmentUi.js'
import { useAssignmentJournee } from '../composables/assignations/useAssignmentJournee.js'
import { useAssignmentManuelle } from '../composables/assignations/useAssignmentManuelle.js'
import { useAssignmentHoraires } from '../composables/assignations/useAssignmentHoraires.js'
import { useAssignmentActions } from '../composables/assignations/useAssignmentActions.js'
import {
  nomEmploye,
  initiales,
  libelleRole,
  heure,
  toutesTerminees,
} from '../utils/assignmentRules.js'

const store = useAssignmentStore()
const ui = useAssignmentUi()
const journee = useAssignmentJournee(store, ui)
const manuel = useAssignmentManuelle({ store, journee, ui })
const horaires = useAssignmentHoraires({ store, journee, manuel, ui })
const actions = useAssignmentActions({ store, journee, ui })

const { journees, choixTaches, choixPriorites, chargementJournee, chargementChoix } = store
const {
  enCours,
  erreur,
  erreurModal,
  messageSucces,
  confirmationAuto,
  modalManuelle,
  alerteChevauchement,
  assignationASupprimer,
  modifierOccurrenceVisible,
  occurrenceModificationId,
  formulaireCreationHoraireModification,
} = ui
const {
  dateSelectionnee,
  rechercheEmploye,
  employeIdSelectionne,
  indexTache,
  jourSelectionne,
  tachesSelectionnees,
  tacheCourante,
  nombreTaches,
  nombreTerminees,
  aDesAutomatiques,
  dateLongue,
  journeesFiltrees,
  selectionnerEmploye,
  changerIndex,
  chargerJournee,
} = journee
const {
  formulaire,
  nouvelleOccurrence,
  formulaireCreationOccurrence,
  tacheManuelleSelectionnee,
  employesDeTerrain,
  occurrencesPourTache,
  ouvrirAssignationManuelle,
  fermerModalManuelle,
  changerTacheManuelle,
  assignerManuellement,
} = manuel
const {
  nouvelHoraireModification,
  libellePriorite,
  libelleOccurrence,
  occurrencesPourModification,
  creerNouvelleOccurrence,
  ouvrirModificationOccurrence,
  enregistrerModificationOccurrence,
} = horaires
const { assignerAutomatiquement, supprimerAssignation } = actions

watch(
  dateSelectionnee,
  () => {
    confirmationAuto.value = false
    modalManuelle.value = false
    assignationASupprimer.value = null
    alerteChevauchement.value = ''
    store.invaliderChoix()
    void chargerJournee()
  },
  { immediate: true },
)
</script>

<style scoped src="../assets/assignment.css"></style>
