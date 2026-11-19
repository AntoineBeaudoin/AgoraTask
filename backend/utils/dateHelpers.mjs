export const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Valide un paramètre de date (YYYY-MM-DD). En cas d'erreur, appelle
 * next() avec une erreur 400 et retourne false.
 * @param {string} date La date à valider
 * @param {Function} next Le prochain middleware (gestion d'erreur)
 * @returns {boolean} true si la date est valide
 */
export function validerDate(date, next) {
  if (!date) {
    const error = new Error("La date est requise.");
    error.statusCode = 400;
    next(error);
    return false;
  }
  if (!FORMAT_DATE.test(date)) {
    const error = new Error(
      "La date est invalide (format attendu : YYYY-MM-DD).",
    );
    error.statusCode = 400;
    next(error);
    return false;
  }
  return true;
}

/**
 * Retourne la date d'aujourd'hui au format YYYY-MM-DD (heure du serveur).
 * @returns {string}
 */
export function todayString() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + dayOfMonth;
}