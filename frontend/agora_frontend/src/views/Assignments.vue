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

    <section class="summary-strip" aria-label="Résumé des assignations">
      <div class="summary-item">
        <span>Employés assignés</span><strong>{{ journees.length }}</strong>
      </div>
      <div class="summary-item">
        <span>Tâches de la journée</span><strong>{{ nombreTaches }}</strong>
      </div>
      <div class="summary-item">
        <span>Tâches terminées</span
        ><strong
          >{{ nombreTerminees }} <small>/ {{ nombreTaches }}</small></strong
        >
      </div>
      <div class="summary-item summary-date">
        <span>Journée consultée</span><strong>{{ dateLongue }}</strong>
      </div>
    </section>

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
            <span class="status-pill" :class="toutesTerminees(jour.tasks) ? 'done' : 'pending'">
              {{ toutesTerminees(jour.tasks) ? 'Terminé' : 'À compléter' }}
            </span>
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
            <span
              class="status-pill"
              :class="toutesTerminees(tachesSelectionnees) ? 'done' : 'pending'"
            >
              {{ toutesTerminees(tachesSelectionnees) ? 'Terminé' : 'En cours' }}
            </span>
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
import { computed, reactive, ref, watch } from 'vue'
import { apiFetch } from '../utils/api.js'

function dateLocale() {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`
}

const dateSelectionnee = ref(dateLocale())
const rechercheEmploye = ref('')
const journees = ref([])
const employeIdSelectionne = ref(null)
const indexTache = ref(0)
const chargementJournee = ref(false)
const chargementChoix = ref(false)
const enCours = ref(false)
const erreur = ref('')
const erreurModal = ref('')
const messageSucces = ref('')
const confirmationAuto = ref(false)
const modalManuelle = ref(false)
const formulaireCreationOccurrence = ref(false)
const formulaireCreationHoraireModification = ref(false)
const alerteChevauchement = ref('')
const assignationASupprimer = ref(null)
const modifierOccurrenceVisible = ref(false)
const occurrenceModificationId = ref('')
const choixEmployes = ref([])
const choixTaches = ref([])
const choixPriorites = ref([])
const dateChoixCharges = ref('')
const formulaire = reactive({ accountId: '', taskId: '', occurrenceId: '', comment: '' })
const nouvelleOccurrence = reactive({ heureDebut: '', heureFin: '', taskPriorityId: '' })
const nouvelHoraireModification = reactive({ heureDebut: '', heureFin: '', taskPriorityId: '' })
let requeteJournee = 0
let requeteChoix = 0

const jourSelectionne = computed(
  () => journees.value.find((jour) => jour.accountId === employeIdSelectionne.value) ?? null,
)
const tachesSelectionnees = computed(() => jourSelectionne.value?.tasks ?? [])
const tacheCourante = computed(() => tachesSelectionnees.value[indexTache.value] ?? null)
const nombreTaches = computed(() =>
  journees.value.reduce((total, jour) => total + (jour.tasks?.length ?? 0), 0),
)
const nombreTerminees = computed(() =>
  journees.value.reduce(
    (total, jour) => total + (jour.tasks?.filter((tache) => tache.isCompleted).length ?? 0),
    0,
  ),
)
const aDesAutomatiques = computed(() =>
  journees.value.some((jour) => jour.tasks?.some((tache) => tache.isAutomatic)),
)
const dateLongue = computed(() => {
  const date = new Date(`${dateSelectionnee.value}T12:00:00Z`)
  return Number.isNaN(date.getTime())
    ? dateSelectionnee.value
    : new Intl.DateTimeFormat('fr-CA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: 'UTC',
      }).format(date)
})
const tacheManuelleSelectionnee = computed(
  () => choixTaches.value.find((tache) => String(tache.id) === formulaire.taskId) ?? null,
)
const employesDeTerrain = computed(() =>
  choixEmployes.value.filter((employe) => employe.role === 'personnel_de_terrain'),
)
const journeesFiltrees = computed(() => {
  const terme = normaliser(rechercheEmploye.value.trim())
  if (!terme) return journees.value
  return journees.value.filter((jour) =>
    normaliser(
      [jour.account?.prenom, jour.account?.nom, jour.account?.poste?.nom].filter(Boolean).join(' '),
    ).includes(terme),
  )
})

function normaliser(texte) {
  return String(texte ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function nomEmploye(employe) {
  return [employe?.prenom, employe?.nom].filter(Boolean).join(' ') || 'Employé inconnu'
}
function initiales(employe) {
  return `${employe?.prenom?.charAt(0) ?? ''}${employe?.nom?.charAt(0) ?? ''}`.toUpperCase() || '—'
}
function libelleRole(role) {
  return role?.replaceAll('_', ' ') || 'Employé'
}
function heure(valeur) {
  return valeur ? valeur.slice(0, 5) : '—'
}
function toutesTerminees(taches) {
  return !!taches?.length && taches.every((tache) => tache.isCompleted)
}
function libellePriorite(horaire) {
  return (
    horaire?.priority?.task_priority ||
    choixPriorites.value.find((priorite) => Number(priorite.id) === Number(horaire?.taskPriorityId))
      ?.task_priority ||
    'Non précisée'
  )
}
function libelleOccurrence(horaire) {
  return `${heure(horaire.heureDebut)} – ${heure(horaire.heureFin)} · Priorité : ${libellePriorite(horaire)}`
}
function occurrencesPourTache(taskId) {
  return choixTaches.value.find((item) => Number(item.id) === Number(taskId))?.occurrences ?? []
}
function occurrencesPourModification(affectation) {
  return occurrencesPourTache(affectation.taskId)
}
function secondes(heureSaisie) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(heureSaisie ?? '')) return null
  const [h, m, s = '0'] = heureSaisie.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}
function horairesChevauchants(a, b) {
  const debutA = secondes(a?.heureDebut)
  const finA = secondes(a?.heureFin)
  const debutB = secondes(b?.heureDebut)
  const finB = secondes(b?.heureFin)
  if ([debutA, finA, debutB, finB].some((valeur) => valeur === null)) return false
  return debutA < finB && debutB < finA
}
function verifierChevauchement(accountId, taskId, horaire, idExclu = null) {
  const jour = journees.value.find((item) => Number(item.accountId) === Number(accountId))
  return (jour?.tasks ?? []).some(
    (affectation) =>
      Number(affectation.taskId) === Number(taskId) &&
      Number(affectation.id) !== Number(idExclu) &&
      horairesChevauchants(horaire, affectation.occurrence),
  )
}
function selectionnerEmploye(accountId) {
  employeIdSelectionne.value = accountId
  indexTache.value = 0
  modifierOccurrenceVisible.value = false
  occurrenceModificationId.value = ''
  formulaireCreationHoraireModification.value = false
}
function changerIndex(direction) {
  indexTache.value = Math.max(
    0,
    Math.min(indexTache.value + direction, tachesSelectionnees.value.length - 1),
  )
  modifierOccurrenceVisible.value = false
  occurrenceModificationId.value = ''
  formulaireCreationHoraireModification.value = false
}
function afficherErreur(error) {
  return error?.message || 'Une erreur inattendue est survenue.'
}

async function chargerJournee(preserverSelection = false) {
  const id = ++requeteJournee
  const date = dateSelectionnee.value
  const selection = preserverSelection ? employeIdSelectionne.value : null
  chargementJournee.value = true
  erreur.value = ''
  if (!preserverSelection) selectionnerEmploye(null)
  try {
    const resultat = await apiFetch(`/assign?date=${encodeURIComponent(date)}`, { method: 'GET' })
    if (id !== requeteJournee) return
    journees.value = Array.isArray(resultat?.data) ? resultat.data : []
    const trouve = journees.value.find((jour) => jour.accountId === selection)
    selectionnerEmploye(trouve ? selection : null)
  } catch (error) {
    if (id !== requeteJournee) return
    journees.value = []
    selectionnerEmploye(null)
    erreur.value = afficherErreur(error)
  } finally {
    if (id === requeteJournee) chargementJournee.value = false
  }
}

watch(
  dateSelectionnee,
  () => {
    confirmationAuto.value = false
    modalManuelle.value = false
    assignationASupprimer.value = null
    alerteChevauchement.value = ''
    dateChoixCharges.value = ''
    ++requeteChoix
    void chargerJournee()
  },
  { immediate: true },
)

async function chargerChoix() {
  if (dateChoixCharges.value === dateSelectionnee.value) return true
  const id = ++requeteChoix
  const date = dateSelectionnee.value
  chargementChoix.value = true
  try {
    const resultat = await apiFetch(`/assign/options?date=${encodeURIComponent(date)}`, {
      method: 'GET',
    })
    if (id !== requeteChoix || date !== dateSelectionnee.value) return false
    choixEmployes.value = resultat?.data?.employes ?? []
    choixTaches.value = resultat?.data?.taches ?? []
    choixPriorites.value = resultat?.data?.priorites ?? []
    dateChoixCharges.value = date
    return true
  } catch (error) {
    if (id === requeteChoix) {
      erreurModal.value = afficherErreur(error)
      erreur.value = afficherErreur(error)
    }
    return false
  } finally {
    if (id === requeteChoix) chargementChoix.value = false
  }
}
function reinitialiserFormulaire() {
  formulaire.accountId = ''
  formulaire.taskId = ''
  formulaire.occurrenceId = ''
  formulaire.comment = ''
  nouvelleOccurrence.heureDebut = ''
  nouvelleOccurrence.heureFin = ''
  nouvelleOccurrence.taskPriorityId = ''
  formulaireCreationOccurrence.value = false
  erreurModal.value = ''
}
async function ouvrirAssignationManuelle() {
  reinitialiserFormulaire()
  modalManuelle.value = true
  await chargerChoix()
}
function fermerModalManuelle() {
  modalManuelle.value = false
  reinitialiserFormulaire()
}
function changerTacheManuelle() {
  formulaire.occurrenceId = ''
  nouvelleOccurrence.taskPriorityId = tacheManuelleSelectionnee.value?.taskPriorityId
    ? String(tacheManuelleSelectionnee.value.taskPriorityId)
    : ''
  formulaireCreationOccurrence.value = false
}
async function creerNouvelleOccurrence(destination = 'manuel') {
  const modification = destination === 'modification'
  const taskId = modification ? tacheCourante.value?.taskId : formulaire.taskId
  const valeurs = modification ? nouvelHoraireModification : nouvelleOccurrence
  const tache = choixTaches.value.find((item) => Number(item.id) === Number(taskId))
  if (!taskId || !tache) return
  const debut = secondes(valeurs.heureDebut)
  const fin = secondes(valeurs.heureFin)
  if (debut === null || fin === null || fin <= debut) {
    const message = 'Indiquez un horaire valide : fin après début.'
    if (modification) erreur.value = message
    else erreurModal.value = message
    return
  }
  if (!valeurs.taskPriorityId && !tache.taskPriorityId) {
    const message = 'Choisissez une priorité.'
    if (modification) erreur.value = message
    else erreurModal.value = message
    return
  }
  enCours.value = true
  try {
    const reponse = await apiFetch('/assign/occurrences', {
      method: 'POST',
      body: JSON.stringify({
        taskId: Number(taskId),
        heureDebut: valeurs.heureDebut,
        heureFin: valeurs.heureFin,
        ...(valeurs.taskPriorityId ? { taskPriorityId: Number(valeurs.taskPriorityId) } : {}),
      }),
    })
    const horaire = reponse?.data
    if (!horaire?.id) throw new Error('Le serveur n’a pas renvoyé le nouvel horaire.')
    tache.occurrences ??= []
    tache.occurrences.push(horaire)
    if (modification) {
      occurrenceModificationId.value = String(horaire.id)
      formulaireCreationHoraireModification.value = false
    } else {
      formulaire.occurrenceId = String(horaire.id)
      formulaireCreationOccurrence.value = false
    }
  } catch (error) {
    if (modification) erreur.value = afficherErreur(error)
    else erreurModal.value = afficherErreur(error)
  } finally {
    enCours.value = false
  }
}
async function assignerManuellement() {
  if (!formulaire.accountId || !formulaire.taskId || !formulaire.occurrenceId) return
  erreurModal.value = ''
  const horaire = occurrencesPourTache(formulaire.taskId).find(
    (item) => String(item.id) === formulaire.occurrenceId,
  )
  if (horaire && verifierChevauchement(formulaire.accountId, formulaire.taskId, horaire)) {
    alerteChevauchement.value = 'Cette tâche existe déjà à cet horaire pour cet employé.'
    return
  }
  enCours.value = true
  const compteId = Number(formulaire.accountId)
  try {
    await apiFetch('/assign/manual', {
      method: 'POST',
      body: JSON.stringify({
        date: dateSelectionnee.value,
        accountId: compteId,
        taskId: Number(formulaire.taskId),
        occurrenceId: Number(formulaire.occurrenceId),
        comment: formulaire.comment.trim() || null,
      }),
    })
    fermerModalManuelle()
    await chargerJournee()
    const jour = journees.value.find((item) => item.accountId === compteId)
    if (jour) selectionnerEmploye(compteId)
    messageSucces.value = 'La tâche a été assignée manuellement.'
  } catch (error) {
    if (
      error?.status === 409 ||
      error?.statusCode === 409 ||
      /existe déjà à cet horaire/i.test(afficherErreur(error))
    ) {
      alerteChevauchement.value = 'Cette tâche existe déjà à cet horaire pour cet employé.'
    } else {
      erreurModal.value = afficherErreur(error)
    }
  } finally {
    enCours.value = false
  }
}
async function assignerAutomatiquement() {
  enCours.value = true
  erreur.value = ''
  try {
    const resultat = await apiFetch('/assign/automatic', {
      method: 'POST',
      body: JSON.stringify({ date: dateSelectionnee.value }),
    })
    confirmationAuto.value = false
    await chargerJournee(true)
    const bilan = resultat?.data ?? {}
    messageSucces.value = `${bilan.creees ?? 0} tâche(s) créée(s), ${bilan.supprimees ?? 0} remplacée(s), ${bilan.ignorees ?? 0} ignorée(s).`
  } catch (error) {
    erreur.value = afficherErreur(error)
  } finally {
    enCours.value = false
  }
}
async function ouvrirModificationOccurrence() {
  modifierOccurrenceVisible.value = !modifierOccurrenceVisible.value
  if (!modifierOccurrenceVisible.value) return
  occurrenceModificationId.value = String(tacheCourante.value?.occurrenceId ?? '')
  formulaireCreationHoraireModification.value = false
  await chargerChoix()
}
async function enregistrerModificationOccurrence() {
  if (!tacheCourante.value || !occurrenceModificationId.value) return
  const horaire = occurrencesPourModification(tacheCourante.value).find(
    (item) => String(item.id) === occurrenceModificationId.value,
  )
  if (
    horaire &&
    verifierChevauchement(
      employeIdSelectionne.value,
      tacheCourante.value.taskId,
      horaire,
      tacheCourante.value.id,
    )
  ) {
    alerteChevauchement.value = 'Cette tâche existe déjà à cet horaire pour cet employé.'
    return
  }
  enCours.value = true
  erreur.value = ''
  try {
    await apiFetch(`/assign/tasks/${tacheCourante.value.id}/occurrence`, {
      method: 'PATCH',
      body: JSON.stringify({ occurrenceId: Number(occurrenceModificationId.value) }),
    })
    const id = employeIdSelectionne.value
    const index = indexTache.value
    await chargerJournee(true)
    if (employeIdSelectionne.value === id)
      indexTache.value = Math.min(index, tachesSelectionnees.value.length - 1)
    modifierOccurrenceVisible.value = false
    messageSucces.value = 'Horaire modifié avec succès.'
  } catch (error) {
    if (
      error?.status === 409 ||
      error?.statusCode === 409 ||
      /existe déjà à cet horaire/i.test(afficherErreur(error))
    ) {
      alerteChevauchement.value = 'Cette tâche existe déjà à cet horaire pour cet employé.'
    } else erreur.value = afficherErreur(error)
  } finally {
    enCours.value = false
  }
}
async function supprimerAssignation() {
  if (!assignationASupprimer.value) return
  const identifiant = assignationASupprimer.value.id
  const index = indexTache.value
  enCours.value = true
  erreur.value = ''
  try {
    await apiFetch(`/assign/tasks/${identifiant}`, { method: 'DELETE' })
    assignationASupprimer.value = null
    await chargerJournee(true)
    indexTache.value = Math.max(0, Math.min(index, tachesSelectionnees.value.length - 1))
    messageSucces.value = 'Assignation retirée.'
  } catch (error) {
    erreur.value = afficherErreur(error)
  } finally {
    enCours.value = false
  }
}
</script>

<style scoped src="../assets/assignments.css"></style>
