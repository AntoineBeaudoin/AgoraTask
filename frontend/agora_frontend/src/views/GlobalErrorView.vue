<template>
  <main class="error-page" :class="`error-${errorType}`">
    <section class="error-container">
      <!-- PARTIE VISUELLE -->
      <div class="error-visual">
        <div class="error-glow"></div>

        <div class="error-code">
          {{ displayCode }}
        </div>

        <div class="error-category">
          {{ errorConfig.category }}
        </div>
      </div>

      <!-- CONTENU -->
      <div class="error-content">
        <span class="error-badge">
          {{ errorConfig.badge }}
        </span>

        <h1>
          {{ errorConfig.title }}
        </h1>

        <p class="error-description">
          {{ errorConfig.description }}
        </p>

        <!-- MESSAGE RÉEL ENREGISTRÉ DANS LE STORE -->
        <div class="error-details">
          <div class="details-header">Détails de l'erreur</div>

          <p>
            {{ displayMessage }}
          </p>
        </div>

        <!-- ACTIONS -->
        <div class="error-actions">
          <button v-if="errorConfig.canRetry" class="primary-btn" @click="retry">Réessayer</button>

          <button class="secondary-btn" @click="goBack">Retour</button>

          <button class="home-btn" @click="goHome">Accueil</button>
        </div>
      </div>
    </section>
  </main>
</template>

<script setup>
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import useErrorStore from '../stores/Error.js'

const router = useRouter()
const errorStore = useErrorStore()

const displayCode = computed(() => {
  return errorStore.code || 'ERR'
})

const displayMessage = computed(() => {
  return errorStore.Message || "Une erreur inattendue s'est produite."
})

const errorType = computed(() => {
  const code = String(errorStore.code).toUpperCase()

  if (code === '401') {
    return 'auth'
  }

  if (code === '403') {
    return 'forbidden'
  }

  if (code === '404') {
    return 'notfound'
  }

  if (code === '409') {
    return 'conflict'
  }

  if (code === '422') {
    return 'validation'
  }

  if (code === 'NETWORK' || code === 'OFFLINE') {
    return 'network'
  }

  const numericCode = Number(code)

  if (!Number.isNaN(numericCode) && numericCode >= 500) {
    return 'server'
  }

  return 'generic'
})

const errorConfig = computed(() => {
  switch (errorType.value) {
    case 'auth':
      return {
        category: 'Authentification',
        badge: 'Session requise',
        title: 'Votre session ne permet pas cette action',
        description: 'Votre session est absente, invalide ou arrivée à expiration.',
        canRetry: false,
      }

    case 'forbidden':
      return {
        category: 'Autorisation',
        badge: 'Accès restreint',
        title: 'Vous n’avez pas accès à cette ressource',
        description:
          'Votre compte est connecté, mais votre rôle ne permet pas d’effectuer cette opération.',
        canRetry: false,
      }

    case 'notfound':
      return {
        category: 'Navigation',
        badge: 'Introuvable',
        title: 'La ressource demandée est introuvable',
        description:
          'La page ou la ressource demandée a peut-être été déplacée, supprimée ou n’existe pas.',
        canRetry: false,
      }

    case 'conflict':
      return {
        category: 'Conflit',
        badge: 'Action impossible',
        title: 'Cette opération entre en conflit avec les données existantes',
        description:
          'Certaines informations empêchent actuellement cette action de se terminer correctement.',
        canRetry: false,
      }

    case 'validation':
      return {
        category: 'Validation',
        badge: 'Données invalides',
        title: 'Certaines informations ne peuvent pas être traitées',
        description: 'Les données envoyées ne respectent pas les règles attendues.',
        canRetry: false,
      }

    case 'network':
      return {
        category: 'Connexion',
        badge: 'Serveur inaccessible',
        title: 'Impossible de joindre AgoraTask',
        description:
          'La connexion au serveur a échoué. Vérifiez votre connexion ou réessayez dans quelques instants.',
        canRetry: true,
      }

    case 'server':
      return {
        category: 'Serveur',
        badge: 'Service perturbé',
        title: 'AgoraTask rencontre un problème',
        description: 'Le serveur n’a pas pu terminer la demande. Le problème peut être temporaire.',
        canRetry: true,
      }

    default:
      return {
        category: 'Application',
        badge: 'Erreur inattendue',
        title: 'Quelque chose ne s’est pas déroulé comme prévu',
        description: 'AgoraTask n’a pas pu terminer l’opération demandée.',
        canRetry: true,
      }
  }
})

function goBack() {
  router.back()
}

function goHome() {
  router.push({
    name: 'home',
  })
}

function retry() {
  router.back()
}
</script>

<style scoped>
/* =========================================================
   THÈME DE BASE
========================================================= */

.error-page {
  --accent: #212529;
  --accent-dark: #111827;
  --accent-soft: #f1f3f5;
  --accent-border: #dee2e6;

  min-height: calc(100vh - 70px);

  display: flex;
  align-items: center;
  justify-content: center;

  padding: 70px 30px;

  background: radial-gradient(circle at 15% 20%, var(--accent-soft), transparent 32%), #f8f9fa;
}

/* =========================================================
   COULEURS SELON L'ERREUR
========================================================= */

.error-auth {
  --accent: #d97706;
  --accent-dark: #92400e;
  --accent-soft: #fff7ed;
  --accent-border: #fed7aa;
}

.error-forbidden {
  --accent: #dc3545;
  --accent-dark: #842029;
  --accent-soft: #fff1f2;
  --accent-border: #fecdd3;
}

.error-notfound {
  --accent: #6366f1;
  --accent-dark: #3730a3;
  --accent-soft: #eef2ff;
  --accent-border: #c7d2fe;
}

.error-conflict {
  --accent: #b45309;
  --accent-dark: #78350f;
  --accent-soft: #fffbeb;
  --accent-border: #fde68a;
}

.error-validation {
  --accent: #7c3aed;
  --accent-dark: #5b21b6;
  --accent-soft: #f5f3ff;
  --accent-border: #ddd6fe;
}

.error-network {
  --accent: #0369a1;
  --accent-dark: #0c4a6e;
  --accent-soft: #f0f9ff;
  --accent-border: #bae6fd;
}

.error-server {
  --accent: #dc3545;
  --accent-dark: #842029;
  --accent-soft: #fff1f2;
  --accent-border: #fecdd3;
}

/* =========================================================
   CARTE
========================================================= */

.error-container {
  width: 100%;
  max-width: 1050px;

  display: grid;
  grid-template-columns: 0.85fr 1.15fr;

  overflow: hidden;

  background: white;

  border: 1px solid #e5e7eb;
  border-radius: 24px;

  box-shadow:
    0 20px 60px rgba(0, 0, 0, 0.08),
    0 4px 15px rgba(0, 0, 0, 0.04);
}

/* =========================================================
   PARTIE VISUELLE GAUCHE
========================================================= */

.error-visual {
  position: relative;

  min-height: 500px;

  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;

  overflow: hidden;

  padding: 50px;

  background: var(--accent-soft);
}

.error-glow {
  position: absolute;

  width: 300px;
  height: 300px;

  border-radius: 50%;

  background: var(--accent);

  opacity: 0.08;

  filter: blur(15px);
}

.error-code {
  position: relative;

  color: var(--accent);

  font-size: clamp(72px, 9vw, 130px);
  font-weight: 900;

  line-height: 1;

  letter-spacing: -5px;
}

.error-category {
  position: relative;

  margin-top: 20px;

  padding: 7px 14px;

  border: 1px solid var(--accent-border);
  border-radius: 999px;

  background: rgba(255, 255, 255, 0.7);

  color: var(--accent-dark);

  font-size: 13px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.08em;
}

/* =========================================================
   CONTENU DROITE
========================================================= */

.error-content {
  display: flex;
  flex-direction: column;
  justify-content: center;

  padding: 55px;
}

.error-badge {
  align-self: flex-start;

  margin-bottom: 20px;

  padding: 7px 12px;

  border-radius: 7px;

  background: var(--accent-soft);

  color: var(--accent-dark);

  font-size: 12px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.06em;
}

.error-content h1 {
  margin: 0 0 17px;

  color: #212529;

  font-size: 34px;
  font-weight: 800;

  line-height: 1.15;

  letter-spacing: -0.6px;
}

.error-description {
  margin: 0;

  color: #6c757d;

  font-size: 16px;
  line-height: 1.65;
}

/* =========================================================
   DÉTAIL RÉEL DE L'ERREUR
========================================================= */

.error-details {
  margin-top: 30px;

  padding: 17px 19px;

  border: 1px solid var(--accent-border);
  border-left: 4px solid var(--accent);

  border-radius: 8px;

  background: var(--accent-soft);
}

.details-header {
  margin-bottom: 7px;

  color: var(--accent-dark);

  font-size: 12px;
  font-weight: 700;

  text-transform: uppercase;

  letter-spacing: 0.05em;
}

.error-details p {
  margin: 0;

  color: #495057;

  font-size: 14px;

  line-height: 1.5;
}

/* =========================================================
   ACTIONS
========================================================= */

.error-actions {
  display: flex;
  flex-wrap: wrap;

  gap: 10px;

  margin-top: 34px;
}

.error-actions button {
  padding: 10px 17px;

  border-radius: 8px;

  font-size: 14px;
  font-weight: 650;

  cursor: pointer;

  transition: 0.2s;
}

.primary-btn {
  border: 1px solid var(--accent);

  background: var(--accent);

  color: white;
}

.primary-btn:hover {
  filter: brightness(0.9);

  transform: translateY(-1px);
}

.secondary-btn {
  border: 1px solid #ced4da;

  background: white;

  color: #495057;
}

.secondary-btn:hover {
  background: #f1f3f5;
}

.home-btn {
  border: 1px solid #212529;

  background: #212529;

  color: white;
}

.home-btn:hover {
  background: #343a40;

  border-color: #343a40;
}

/* =========================================================
   RESPONSIVE
========================================================= */

@media (max-width: 800px) {
  .error-page {
    padding: 35px 18px;
  }

  .error-container {
    grid-template-columns: 1fr;
  }

  .error-visual {
    min-height: 230px;

    padding: 35px;
  }

  .error-code {
    font-size: 80px;

    letter-spacing: -3px;
  }

  .error-content {
    padding: 35px 28px;
  }

  .error-content h1 {
    font-size: 28px;
  }
}

@media (max-width: 500px) {
  .error-actions {
    flex-direction: column;
  }

  .error-actions button {
    width: 100%;
  }
}
</style>
