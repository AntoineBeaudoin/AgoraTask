/** @file Fichier contenant des fonctions qui modifient le DOM (altération des éléments HTML et CSS d'une page). */

/**
 * Fonction pour activer ou désactiver la propriété « disabled » d'un bouton via son ID
 * @param buttonId ID du bouton dont la propriété « disabled » doit être activée ou désactivée
 */
export function switchIsButtonActiveById(buttonId) {
  const button = document.getElementById(buttonId);
  if (button) {
    if (button.disabled) {
      button.disabled = false;
    }
    else {
      button.disabled = true;
    }
  }
}