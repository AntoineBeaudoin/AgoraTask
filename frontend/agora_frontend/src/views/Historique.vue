<template>
  <main class="historique-page">
    <section class="historique-entete">
      <div>
        <h1>Historique des tâches</h1>

        <p>
          Consultez les employés en service et les tâches qui leur ont été assignées pour une
          journée donnée.
        </p>
      </div>

      <div class="date-actions">
        <div class="date-field">
          <label for="dateHistorique"> Date </label>

          <input id="dateHistorique" v-model="dateHistorique" type="date" />
        </div>
      </div>
    </section>

    <section class="historique-contenu">
      <div class="employes-section">
        <div class="section-entete">
          <div>
            <h2>Employés en service</h2>

            <span> {{ EmployeEnService.length }} employé(s) </span>
          </div>
        </div>

        <div v-if="EmployeEnService.length === 0" class="etat-vide">
          Aucun employé en service pour cette journée.
        </div>

        <div v-else class="liste-employes">
          <button
            v-for="employe in EmployeEnService"
            :key="employe.id"
            class="carte-employe"
            :class="{
              selectionne: employeSelectionne?.id === employe.id,
            }"
            @click="selectionnerEmploye(employe)"
          >
            <div class="avatar-employe">
              {{ employe.prenom?.charAt(0) }}
              {{ employe.nom?.charAt(0) }}
            </div>

            <div class="infos-employe">
              <strong>
                {{ employe.prenom }}
                {{ employe.nom }}
              </strong>

              <span>
                {{ employe.role?.replaceAll('_', ' ') }}
              </span>
            </div>

            <span class="fleche"> › </span>
          </button>
        </div>
      </div>

      <div class="taches-section">
        <div v-if="!employeSelectionne" class="aucune-selection">
          <div class="icone-selection">☷</div>

          <h2>Sélectionnez un employé</h2>

          <p>
            Cliquez sur un employé pour consulter immédiatement les tâches qui lui ont été assignées
            pour cette journée.
          </p>
        </div>

        <template v-else>
          <div class="employe-selectionne-entete">
            <div class="avatar-employe grand">
              {{ employeSelectionne.prenom?.charAt(0) }}
              {{ employeSelectionne.nom?.charAt(0) }}
            </div>

            <div>
              <h2>
                {{ employeSelectionne.prenom }}
                {{ employeSelectionne.nom }}
              </h2>

              <span>
                {{ dateHistorique }}
              </span>
            </div>
          </div>

          <div v-if="EmployeTaches.length === 0" class="etat-vide">
            Aucune tâche trouvée pour cet employé pour cette journée.
          </div>

          <div v-else class="liste-taches">
            <article v-for="tache in EmployeTaches" :key="tache.id" class="carte-tache">
              <div class="tache-entete">
                <div>
                  <h3>
                    {{ tache.occurrence_de_tache?.task?.title }}
                  </h3>

                  <span v-if="tache.occurrence_de_tache?.task?.room" class="local-tache">
                    {{ tache.occurrence_de_tache.task.room }}
                  </span>
                </div>

                <span
                  class="badge-statut"
                  :class="{
                    complete: tache.isCompleted,
                  }"
                >
                  {{ tache.isCompleted ? 'Terminée' : 'Non terminée' }}
                </span>
              </div>

              <div class="infos-tache">
                <span>
                  {{ tache.occurrence_de_tache?.heureDebut }}

                  -

                  {{ tache.occurrence_de_tache?.heureFin }}
                </span>

                <span>
                  Priorité :
                  {{ tache.occurrence_de_tache?.priorite }}
                </span>
              </div>

              <p v-if="tache.occurrence_de_tache?.task?.description" class="description-tache">
                {{ tache.occurrence_de_tache.task.description }}
              </p>

              <div v-if="tache.commentaire" class="commentaire-tache">
                <span> Commentaire </span>

                <p>
                  {{ tache.commentaire }}
                </p>
              </div>

              <div class="bloc-sous-taches">
                <h4>Sous-tâches</h4>

                <div
                  v-if="!tache.sous_taches || tache.sous_taches.length === 0"
                  class="aucune-sous-tache"
                >
                  Aucune sous-tâche.
                </div>

                <div v-for="sousTache in tache.sous_taches" :key="sousTache.id" class="sous-tache">
                  <div
                    class="etat-sous-tache"
                    :class="{
                      complete: sousTache.SousTachesAFaire?.isCompleted,
                    }"
                  >
                    {{ sousTache.SousTachesAFaire?.isCompleted ? '✓' : '' }}
                  </div>

                  <div class="contenu-sous-tache">
                    <strong>
                      {{ sousTache.titre }}
                    </strong>

                    <p v-if="sousTache.description">
                      {{ sousTache.description }}
                    </p>

                    <div
                      v-if="sousTache.SousTachesAFaire?.commentaire"
                      class="commentaire-sous-tache"
                    >
                      {{ sousTache.SousTachesAFaire.commentaire }}
                    </div>
                  </div>
                </div>
              </div>
            </article>
          </div>
        </template>
      </div>
    </section>
  </main>
</template>
<script setup>
import { ref, onMounted, watch } from 'vue'
import { apiFetch } from '../utils/api.js'

const dateHistorique = ref('')
const EmployeEnService = ref([])
const EmployeTaches = ref([])
const employeSelectionne = ref(null)

watch(dateHistorique, async (newDate) => {
  rafraichirHistorique()
})

async function getEmployeEnService() {
  try {
    const data = await apiFetch('/historique?date=' + dateHistorique.value, {
      method: 'GET',
    })

    EmployeEnService.value = data.data
  } catch (error) {
    console.error('Erreur lors de la récupération des employés en service :', error)
  }
}
onMounted(async () => {
  const today = new Date()

  dateHistorique.value =
    today.getFullYear() +
    '-' +
    String(today.getMonth() + 1).padStart(2, '0') +
    '-' +
    String(today.getDate()).padStart(2, '0')

  await getEmployeEnService()
})
async function getEmployeTaches(compteId) {
  try {
    const data = await apiFetch('/historique/' + compteId + '?date=' + dateHistorique.value, {
      method: 'GET',
    })

    EmployeTaches.value = data.data
  } catch (error) {
    console.error("Erreur lors de la récupération des tâches de l'employé :", error)
  }
}

async function selectionnerEmploye(employe) {
  employeSelectionne.value = employe

  await getEmployeTaches(employe.id)
}

async function rafraichirHistorique() {
  employeSelectionne.value = null
  EmployeTaches.value = []

  await getEmployeEnService()
}
</script>
<style scoped>
.historique-page {
  padding: 28px;
  background: #f5f6f8;
  min-height: 100vh;
}

.historique-entete,
.date-actions,
.carte-employe,
.employe-selectionne-entete,
.tache-entete,
.infos-tache,
.sous-tache {
  display: flex;
  align-items: center;
}

.historique-entete {
  justify-content: space-between;
  margin-bottom: 24px;
}

.historique-entete h1,
.section-entete h2,
.employe-selectionne-entete h2,
.tache-entete h3 {
  margin: 0;
}

.historique-entete p,
.employe-selectionne-entete span,
.infos-employe span,
.local-tache,
.description-tache,
.contenu-sous-tache p {
  color: #6c757d;
}

.date-actions {
  gap: 10px;
}

.date-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.date-field input,
.btn-refresh {
  padding: 9px 12px;
  border-radius: 8px;
}

.date-field input {
  border: 1px solid #ccc;
}

.btn-refresh {
  border: 0;
  background: #212529;
  color: white;
  cursor: pointer;
}

.historique-contenu {
  display: grid;
  grid-template-columns: 1.15fr 0.85fr;
  gap: 22px;
}

.employes-section,
.taches-section {
  background: white;
  padding: 20px;
  border: 1px solid #ddd;
  border-radius: 12px;
  min-height: 560px;
}

.liste-employes,
.liste-taches {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.carte-employe {
  gap: 12px;
  padding: 12px;
  width: 100%;
  border: 1px solid #ddd;
  border-radius: 9px;
  background: white;
  cursor: pointer;
  text-align: left;
}

.carte-employe:hover,
.carte-employe.selectionne {
  background: #f1f3f5;
  border-color: #444;
}

.avatar-employe {
  width: 42px;
  height: 42px;
  border-radius: 50%;
  background: #212529;
  color: white;
  display: grid;
  place-items: center;
  font-weight: bold;
}

.avatar-employe.grand {
  width: 52px;
  height: 52px;
}

.infos-employe {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.fleche {
  font-size: 1.6rem;
  color: #999;
}

.employe-selectionne-entete {
  gap: 12px;
  padding-bottom: 15px;
  margin-bottom: 18px;
  border-bottom: 1px solid #eee;
}

.carte-tache {
  padding: 16px;
  border: 1px solid #ddd;
  border-radius: 10px;
}

.tache-entete {
  justify-content: space-between;
  align-items: flex-start;
}

.badge-statut {
  padding: 5px 9px;
  border-radius: 20px;
  background: #fff3cd;
  font-size: 0.8rem;
}

.badge-statut.complete,
.etat-sous-tache.complete {
  background: #198754;
  color: white;
}

.infos-tache {
  gap: 16px;
  margin-top: 10px;
  font-size: 0.85rem;
}

.commentaire-tache,
.commentaire-sous-tache {
  margin-top: 10px;
  padding: 9px;
  background: #f8f9fa;
  border-radius: 7px;
}

.bloc-sous-taches {
  margin-top: 16px;
}

.sous-tache {
  gap: 10px;
  padding: 10px 0;
  border-top: 1px solid #eee;
}

.etat-sous-tache {
  width: 21px;
  height: 21px;
  border: 2px solid #ccc;
  border-radius: 50%;
  display: grid;
  place-items: center;
}

.contenu-sous-tache {
  flex: 1;
}

.etat-vide,
.aucune-selection {
  text-align: center;
  color: #777;
  padding: 50px 20px;
}

.aucune-selection {
  padding-top: 150px;
}

@media (max-width: 850px) {
  .historique-entete {
    align-items: stretch;
    flex-direction: column;
  }

  .historique-contenu {
    grid-template-columns: 1fr;
  }

  .employes-section,
  .taches-section {
    min-height: auto;
  }
}
</style>
