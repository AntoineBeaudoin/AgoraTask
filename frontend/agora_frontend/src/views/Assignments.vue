<template>
  <main class="assign-page">
    <header class="page-header">
      <div>
        <span class="eyebrow">AGORATASK · ORGANISATION</span>
        <h1>Gestion des assignations</h1>
        <p>
          Planifiez les tâches d'une journée, consultez les affectations et ajustez les horaires.
        </p>
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
        <div class="panel-header">
          <div>
            <h2>Employés assignés</h2>
            <p>{{ journees.length }} employé(s) avec au moins une tâche</p>
          </div>
          <span class="subtle-pill">{{ journees.length }} / jour</span>
        </div>
        <div v-if="chargementJournee" class="empty-state" role="status">
          Chargement des assignations…
        </div>
        <div v-else-if="journees.length === 0" class="empty-state">
          <div class="empty-symbol">▤</div>
          <h3>Aucune assignation</h3>
          <p>
            Choisissez une assignation manuelle ou utilisez le bouton vert pour attribuer les tâches
            des postes.
          </p>
        </div>
        <div v-else class="employees-list">
          <button
            v-for="jour in journees"
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
                >{{ libelleRole(jour.account?.role) }} ·
                {{ jour.tasks?.length ?? 0 }} tâche(s)</small
              >
            </span>
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
          <p>Ses tâches, leur état d'avancement et leurs sous-tâches s'afficheront ici.</p>
        </div>
        <template v-else>
          <div class="selected-header">
            <span class="avatar avatar-large">{{ initiales(jourSelectionne.account) }}</span>
            <div class="selected-name">
              <h2>{{ nomEmploye(jourSelectionne.account) }}</h2>
              <p>{{ dateSelectionnee }} · {{ tachesSelectionnees.length }} tâche(s) assignée(s)</p>
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
                  <span class="task-number">ASSIGNATION N° {{ tacheCourante.id }}</span>
                  <h3>{{ tacheCourante.task?.title || 'Tâche sans titre' }}</h3>
                  <p v-if="tacheCourante.task?.room" class="task-room">
                    {{ tacheCourante.task.room }}
                  </p>
                </div>
                <span class="status-pill" :class="tacheCourante.isCompleted ? 'done' : 'pending'">
                  {{ tacheCourante.isCompleted ? 'Terminée' : 'Non terminée' }}
                </span>
              </div>
              <div class="task-metadata">
                <span
                  >◷ {{ heure(tacheCourante.occurrence?.heureDebut) }} –
                  {{ heure(tacheCourante.occurrence?.heureFin) }}</span
                >
                <span>{{ tacheCourante.isAutomatic ? 'Automatique' : 'Manuelle' }}</span>
                <span v-if="tacheCourante.occurrence?.journee">{{
                  capitale(tacheCourante.occurrence.journee)
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
                <span>Occurrence n° {{ tacheCourante.occurrenceId }}</span>
                <button
                  class="link-button"
                  type="button"
                  :disabled="enCours"
                  @click="ouvrirModificationOccurrence"
                >
                  Modifier l'occurrence
                </button>
              </div>
              <div v-if="modifierOccurrenceVisible" class="occurrence-editor">
                <label :for="'modifier-occurrence-' + tacheCourante.id">Nouvelle occurrence</label>
                <div class="inline-controls">
                  <select
                    :id="'modifier-occurrence-' + tacheCourante.id"
                    v-model="occurrenceModificationId"
                    :disabled="enCours || chargementChoix"
                  >
                    <option value="">Choisir une occurrence</option>
                    <option
                      v-for="occurrence in occurrencesPourTache(tacheCourante.taskId)"
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
          Les tâches liées aux postes et aux occurrences du
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
            <span class="eyebrow">ASSIGNATION PERSONNALISÉE</span>
            <h2 id="titreManuel">Assigner une tâche</h2>
            <p>Journée du {{ dateSelectionnee }}</p>
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
            <label for="employeManuel">1. Employé</label>
            <select id="employeManuel" v-model="formulaire.accountId" required :disabled="enCours">
              <option value="">Sélectionner un employé</option>
              <option
                v-for="employe in choixEmployes"
                :key="employe.id"
                :value="String(employe.id)"
              >
                {{ nomEmploye(employe) }} — {{ libelleRole(employe.role) }}
              </option>
            </select>
          </div>
          <div class="field-row">
            <label>2. Tâche à assigner</label>
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
              <label for="occurrenceManuelle">3. Occurrence</label
              ><button
                class="link-button"
                type="button"
                :disabled="enCours"
                @click="formulaireCreationOccurrence = !formulaireCreationOccurrence"
              >
                {{
                  formulaireCreationOccurrence ? 'Masquer le formulaire' : '+ Créer une occurrence'
                }}
              </button>
            </div>
            <select
              id="occurrenceManuelle"
              v-model="formulaire.occurrenceId"
              :disabled="enCours"
              required
            >
              <option value="">Sélectionner une occurrence</option>
              <option
                v-for="occurrence in occurrencesPourTache(tacheManuelleSelectionnee.id)"
                :key="occurrence.id"
                :value="String(occurrence.id)"
              >
                {{ libelleOccurrence(occurrence) }}
              </option>
            </select>
            <p v-if="!occurrencesPourTache(tacheManuelleSelectionnee.id).length" class="help-text">
              Aucune occurrence pour cette date. Créez-en une dans le formulaire ci-dessous.
            </p>
            <div v-if="formulaireCreationOccurrence" class="new-occurrence">
              <h3>Nouvelle occurrence</h3>
              <div class="two-fields">
                <label
                  >Début
                  <input v-model="nouvelleOccurrence.heureDebut" type="time" :disabled="enCours"
                /></label>
                <label
                  >Fin <input v-model="nouvelleOccurrence.heureFin" type="time" :disabled="enCours"
                /></label>
              </div>
              <label
                >Jour de semaine
                <select v-model="nouvelleOccurrence.journee" :disabled="enCours">
                  <option value="">Sans jour défini (assignation manuelle)</option>
                  <option :value="jourSemaineSelectionne">
                    {{ capitale(jourSemaineSelectionne) }}
                  </option>
                </select>
              </label>
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
                @click="creerNouvelleOccurrence"
              >
                {{ enCours ? 'Création…' : 'Créer cette occurrence' }}
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
  </main>
</template>

<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { apiFetch } from '../utils/api.js'

function dateLocale() {
  const maintenant = new Date()
  return `${maintenant.getFullYear()}-${String(maintenant.getMonth() + 1).padStart(2, '0')}-${String(maintenant.getDate()).padStart(2, '0')}`
}

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi']
const dateSelectionnee = ref(dateLocale())
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
const modifierOccurrenceVisible = ref(false)
const occurrenceModificationId = ref('')
const choixEmployes = ref([])
const choixTaches = ref([])
const choixPriorites = ref([])
const dateChoixCharges = ref('')
const formulaire = reactive({ accountId: '', taskId: '', occurrenceId: '', comment: '' })
const nouvelleOccurrence = reactive({
  journee: '',
  heureDebut: '',
  heureFin: '',
  taskPriorityId: '',
})
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
const jourSemaineSelectionne = computed(
  () => JOURS[new Date(`${dateSelectionnee.value}T12:00:00Z`).getUTCDay()],
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

function nomEmploye(employe) {
  return [employe?.prenom, employe?.nom].filter(Boolean).join(' ') || 'Employé inconnu'
}
function initiales(employe) {
  return `${employe?.prenom?.charAt(0) ?? ''}${employe?.nom?.charAt(0) ?? ''}`.toUpperCase() || '—'
}
function libelleRole(role) {
  return role?.replaceAll('_', ' ') || 'Employé'
}
function capitale(valeur) {
  return valeur ? valeur[0].toUpperCase() + valeur.slice(1) : ''
}
function heure(valeur) {
  return valeur ? valeur.slice(0, 5) : '—'
}
function toutesTerminees(taches) {
  return !!taches?.length && taches.every((tache) => tache.isCompleted)
}
function libelleOccurrence(occurrence) {
  return `${heure(occurrence.heureDebut)} – ${heure(occurrence.heureFin)} · ${occurrence.journee ? capitale(occurrence.journee) : 'Sans jour'} (n° ${occurrence.id})`
}
function occurrencesPourTache(taskId) {
  const tache = choixTaches.value.find((item) => Number(item.id) === Number(taskId))
  return (tache?.occurrences ?? []).filter(
    (item) => item.journee === null || item.journee === jourSemaineSelectionne.value,
  )
}
function selectionnerEmploye(accountId) {
  employeIdSelectionne.value = accountId
  indexTache.value = 0
  modifierOccurrenceVisible.value = false
  occurrenceModificationId.value = ''
}
function changerIndex(direction) {
  indexTache.value = Math.max(
    0,
    Math.min(indexTache.value + direction, tachesSelectionnees.value.length - 1),
  )
  modifierOccurrenceVisible.value = false
  occurrenceModificationId.value = ''
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
  nouvelleOccurrence.journee = ''
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
async function creerNouvelleOccurrence() {
  if (!formulaire.taskId) return
  erreurModal.value = ''
  if (!nouvelleOccurrence.taskPriorityId && !tacheManuelleSelectionnee.value?.taskPriorityId) {
    erreurModal.value = 'Veuillez choisir une priorité pour cette occurrence.'
    return
  }
  enCours.value = true
  try {
    const reponse = await apiFetch('/assign/occurrences', {
      method: 'POST',
      body: JSON.stringify({
        taskId: Number(formulaire.taskId),
        heureDebut: nouvelleOccurrence.heureDebut || null,
        heureFin: nouvelleOccurrence.heureFin || null,
        journee: nouvelleOccurrence.journee || null,
        ...(nouvelleOccurrence.taskPriorityId
          ? { taskPriorityId: Number(nouvelleOccurrence.taskPriorityId) }
          : {}),
      }),
    })
    const occurrence = reponse?.data
    if (!occurrence?.id) throw new Error('Le serveur n’a pas renvoyé l’occurrence créée.')
    const tache = tacheManuelleSelectionnee.value
    tache.occurrences ??= []
    tache.occurrences.push(occurrence)
    formulaire.occurrenceId = String(occurrence.id)
    formulaireCreationOccurrence.value = false
  } catch (error) {
    erreurModal.value = afficherErreur(error)
  } finally {
    enCours.value = false
  }
}
async function assignerManuellement() {
  if (!formulaire.accountId || !formulaire.taskId || !formulaire.occurrenceId) return
  erreurModal.value = ''
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
    erreurModal.value = afficherErreur(error)
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
  await chargerChoix()
}
async function enregistrerModificationOccurrence() {
  if (!tacheCourante.value || !occurrenceModificationId.value) return
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
    messageSucces.value = 'Occurrence modifiée avec succès.'
  } catch (error) {
    erreur.value = afficherErreur(error)
  } finally {
    enCours.value = false
  }
}
</script>

<style scoped>
.assign-page {
  min-height: 100vh;
  padding: 30px;
  background: #f5f6f8;
  color: #212529;
}
.page-header {
  display: flex;
  justify-content: space-between;
  gap: 24px;
  align-items: end;
  margin-bottom: 22px;
  flex-wrap: wrap;
}
.eyebrow {
  letter-spacing: 0.12em;
  font-size: 0.7rem;
  font-weight: 800;
  color: #27805e;
}
h1 {
  font-size: 2rem;
  font-weight: 750;
  margin: 4px 0 8px;
}
.page-header p,
.panel-header p,
.selected-name p {
  color: #74808d;
  margin: 0;
}
.header-actions {
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: 10px;
}
.date-box {
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 0.84rem;
}
.date-box input,
.manual-form input:not([type='radio']),
.manual-form select,
.manual-form textarea,
.occurrence-editor select {
  padding: 11px 12px;
  background: white;
  border: 1px solid #d8dde2;
  border-radius: 9px;
  width: 100%;
  color: #212529;
}
.date-box input {
  min-width: 165px;
}
.btn {
  border: 0;
  border-radius: 9px;
  padding: 12px 16px;
  cursor: pointer;
  font-weight: 650;
  white-space: normal;
}
.btn:disabled,
.navigation-buttons button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
.btn-dark-action {
  background: #212529;
  color: white;
}
.btn-dark-action:hover:not(:disabled) {
  background: #343a40;
}
.btn-green {
  background: #168451;
  color: white;
}
.btn-green:hover:not(:disabled) {
  background: #11673f;
}
.btn-light {
  background: #f0f2f3;
  color: #212529;
  border: 1px solid #d7dce1;
}
.btn-small {
  padding: 9px 12px;
  font-size: 0.84rem;
}
.btn-plus,
.btn-icon {
  margin-right: 5px;
  font-size: 1.1rem;
}
.notice {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  padding: 12px 16px;
  margin: 0 0 15px;
  border-radius: 9px;
}
.notice button {
  border: 0;
  background: transparent;
  font-size: 1.3rem;
  cursor: pointer;
}
.notice-success {
  color: #145c3c;
  background: #e5f5eb;
}
.notice-error {
  color: #8c2630;
  background: #ffebed;
}
.summary-strip {
  background: white;
  border: 1px solid #e0e3e6;
  border-radius: 12px;
  padding: 16px 20px;
  display: flex;
  flex-wrap: wrap;
  gap: 24px;
  margin-bottom: 22px;
}
.summary-item {
  display: flex;
  flex-direction: column;
  gap: 3px;
  min-width: 120px;
}
.summary-item span {
  color: #77808c;
  font-size: 0.78rem;
}
.summary-item strong {
  font-size: 1.45rem;
}
.summary-item small {
  color: #77808c;
  font-size: 0.9rem;
}
.summary-date {
  margin-left: auto;
}
.summary-date strong {
  font-size: 1.1rem;
}
.assign-layout {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 22px;
  align-items: stretch;
}
.panel {
  background: white;
  border: 1px solid #dfe2e5;
  padding: 20px;
  border-radius: 13px;
  min-height: 560px;
}
.panel-header,
.selected-header,
.task-heading,
.task-navigation,
.subtasks-header,
.occurrence-toolbar {
  display: flex;
  gap: 12px;
  align-items: center;
  justify-content: space-between;
}
.panel-header {
  margin-bottom: 18px;
}
.panel-header h2 {
  font-size: 1.4rem;
  font-weight: 700;
  margin: 0 0 4px;
}
.subtle-pill {
  padding: 6px 10px;
  border-radius: 18px;
  background: #f0f3f5;
  color: #6c757d;
  font-size: 0.75rem;
}
.employees-list {
  display: grid;
  gap: 10px;
}
.employee-row {
  display: flex;
  width: 100%;
  gap: 12px;
  align-items: center;
  text-align: left;
  background: white;
  border: 1px solid #dee2e6;
  border-radius: 9px;
  padding: 13px;
  cursor: pointer;
}
.employee-row:hover,
.employee-row.active {
  background: #f2f4f6;
  border-color: #373e45;
}
.avatar {
  flex: none;
  display: grid;
  place-items: center;
  width: 43px;
  height: 43px;
  border-radius: 50%;
  background: #22272b;
  color: #fff;
  font-weight: 750;
  font-size: 0.9rem;
}
.avatar-large {
  width: 54px;
  height: 54px;
}
.employee-meta {
  display: flex;
  flex: 1;
  gap: 3px;
  flex-direction: column;
  min-width: 0;
}
.employee-meta strong {
  font-size: 0.92rem;
}
.employee-meta small {
  color: #7b8794;
}
.status-pill {
  display: inline-block;
  white-space: nowrap;
  border-radius: 22px;
  padding: 6px 10px;
  font-size: 0.73rem;
  font-weight: 600;
}
.status-pill.pending {
  background: #fff1c7;
  color: #7f5900;
}
.status-pill.done {
  background: #dff4e7;
  color: #137746;
}
.chevron {
  color: #9ea5ad;
  font-size: 1.6rem;
}
.selected-header {
  justify-content: flex-start;
  padding-bottom: 18px;
  border-bottom: 1px solid #ebedef;
}
.selected-name {
  flex: 1;
}
.selected-name h2 {
  font-size: 1.3rem;
  font-weight: 750;
  margin: 0 0 6px;
}
.task-navigation {
  color: #77808a;
  font-size: 0.85rem;
  margin: 18px 0 12px;
}
.navigation-buttons {
  display: flex;
  gap: 6px;
}
.navigation-buttons button {
  width: 34px;
  height: 34px;
  background: white;
  border: 1px solid #cdd2d8;
  border-radius: 7px;
  cursor: pointer;
}
.task-card {
  border: 1px solid #e0e3e7;
  border-radius: 11px;
  padding: 18px;
}
.task-heading {
  align-items: flex-start;
}
.task-heading h3 {
  font-size: 1.3rem;
  line-height: 1.3;
  margin: 5px 0 3px;
}
.task-number {
  color: #85909a;
  font-size: 0.7rem;
  font-weight: 750;
  letter-spacing: 0.08em;
}
.task-room,
.task-description {
  color: #707c88;
  margin: 0;
}
.task-metadata {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  font-size: 0.8rem;
  margin: 15px 0 10px;
  color: #51606b;
}
.task-description {
  margin: 0 0 16px;
}
.comment-box {
  border-radius: 8px;
  background: #f5f7f9;
  padding: 12px;
  font-size: 0.88rem;
}
.comment-box p {
  margin: 5px 0 0;
}
.occurrence-toolbar {
  margin: 18px 0;
  border-top: 1px solid #e9ecef;
  padding-top: 14px;
  font-size: 0.82rem;
  color: #7b8490;
}
.link-button {
  color: #187a55;
  background: none;
  border: 0;
  padding: 2px;
  font-weight: 650;
  cursor: pointer;
}
.link-button:disabled {
  opacity: 0.45;
}
.occurrence-editor {
  background: #f5f8f6;
  border-radius: 9px;
  padding: 12px;
  margin-bottom: 16px;
}
.occurrence-editor label {
  font-size: 0.83rem;
  font-weight: 650;
}
.inline-controls {
  display: flex;
  gap: 7px;
  margin-top: 7px;
  flex-wrap: wrap;
}
.inline-controls select {
  min-width: 170px;
  flex: 1;
}
.subtasks-header {
  padding-bottom: 8px;
  border-bottom: 1px solid #e9ecef;
}
.subtasks-header h4 {
  font-size: 1.1rem;
  margin: 0;
}
.subtasks-header span {
  color: #77808a;
}
.subtask-row {
  padding: 14px 0;
  border-bottom: 1px solid #eceff0;
  display: flex;
  align-items: flex-start;
  gap: 11px;
}
.subtask-row:last-child {
  border: 0;
}
.subtask-row strong {
  font-size: 0.88rem;
}
.subtask-row p {
  font-size: 0.84rem;
  color: #75808c;
  margin: 4px 0 0;
}
.subtask-row .subtask-comment {
  color: #3c464b;
  background: #f4f6f7;
  padding: 8px;
  border-radius: 7px;
}
.subtask-check {
  flex: none;
  width: 21px;
  height: 21px;
  margin-top: 2px;
  display: grid;
  place-items: center;
  border-radius: 50%;
  border: 2px solid #cbd0d2;
  color: white;
  font-size: 0.8rem;
}
.subtask-check.checked {
  background: #168451;
  border-color: #168451;
}
.empty-state {
  text-align: center;
  color: #77808a;
  padding: 65px 22px;
}
.empty-state h2,
.empty-state h3 {
  color: #30383e;
  margin: 8px 0;
}
.empty-state p {
  max-width: 360px;
  margin: 8px auto;
}
.no-selection {
  padding-top: 130px;
}
.empty-symbol {
  width: 48px;
  height: 48px;
  display: grid;
  place-items: center;
  margin: auto;
  font-size: 1.6rem;
  border-radius: 13px;
  background: #f2f4f5;
  color: #7b8790;
}
.muted-empty {
  padding: 10px 0;
  color: #7b8790;
}
.modal-overlay {
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(19, 27, 34, 0.55);
  padding: 22px;
  display: grid;
  place-items: center;
}
.modal-card {
  width: min(100%, 710px);
  max-height: calc(100vh - 44px);
  overflow: auto;
  background: white;
  border-radius: 16px;
  padding: 26px;
  box-shadow: 0 20px 70px rgba(0, 0, 0, 0.18);
}
.confirm-card {
  max-width: 510px;
  text-align: center;
}
.confirm-card h2 {
  font-size: 1.4rem;
}
.confirm-card p {
  color: #65717c;
}
.warning-icon {
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  background: #fff1cc;
  color: #986000;
  border-radius: 50%;
  font-size: 1.4rem;
  font-weight: 800;
  margin: auto;
}
.confirm-card .warning-text {
  text-align: left;
  background: #fff6df;
  color: #765b1d;
  padding: 12px;
  border-radius: 9px;
  font-size: 0.88rem;
}
.modal-top {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding-bottom: 15px;
  border-bottom: 1px solid #e7eaec;
}
.modal-top h2 {
  margin: 5px 0 4px;
}
.modal-top p {
  color: #7b858e;
  margin: 0;
}
.close-button {
  border: 0;
  background: transparent;
  font-size: 1.8rem;
  align-self: flex-start;
  cursor: pointer;
}
.manual-form {
  display: grid;
  gap: 20px;
  padding-top: 16px;
}
.field-row {
  display: grid;
  gap: 8px;
}
.field-row > label,
.field-heading label {
  font-weight: 700;
  font-size: 0.91rem;
}
.field-heading {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.task-choices {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  max-height: 260px;
  overflow: auto;
  gap: 8px;
}
.choice-card {
  cursor: pointer;
  border: 1px solid #dbe0e3;
  border-radius: 9px;
  display: flex;
  align-items: flex-start;
  padding: 11px;
  gap: 9px;
}
.choice-card.chosen {
  border-color: #168451;
  background: #f1faf5;
}
.choice-card input {
  margin-top: 3px;
  accent-color: #168451;
}
.choice-text {
  min-width: 0;
  display: grid;
  gap: 4px;
  flex: 1;
}
.choice-text strong {
  font-size: 0.88rem;
}
.choice-text small {
  color: #72808c;
}
.choice-indicator {
  color: #168451;
}
.help-text {
  color: #9b6521;
  font-size: 0.82rem;
  margin: 0;
}
.new-occurrence {
  padding: 14px;
  display: grid;
  gap: 12px;
  border: 1px solid #d7e5d9;
  border-radius: 10px;
  background: #f6fbf7;
}
.new-occurrence h3 {
  font-size: 1rem;
  margin: 0;
}
.new-occurrence label {
  display: grid;
  gap: 5px;
  font-size: 0.85rem;
}
.two-fields {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
}
.modal-actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 20px;
}
@media (max-width: 1050px) {
  .page-header {
    align-items: flex-start;
  }
  .header-actions {
    width: 100%;
  }
  .assign-layout {
    grid-template-columns: 1fr;
  }
  .panel {
    min-height: 300px;
  }
  .no-selection {
    padding-top: 40px;
  }
}
@media (max-width: 580px) {
  .assign-page {
    padding: 14px;
  }
  .page-header h1 {
    font-size: 1.6rem;
  }
  .header-actions .btn {
    flex: 1 1 100%;
  }
  .date-box {
    width: 100%;
  }
  .summary-date {
    margin-left: 0;
  }
  .task-choices {
    grid-template-columns: 1fr;
  }
  .employee-row {
    flex-wrap: wrap;
  }
  .status-pill {
    font-size: 0.7rem;
  }
  .modal-overlay {
    padding: 9px;
  }
  .modal-card {
    padding: 18px;
  }
  .modal-actions {
    flex-wrap: wrap;
  }
}
</style>
