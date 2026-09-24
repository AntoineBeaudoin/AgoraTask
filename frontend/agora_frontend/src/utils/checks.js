
/**
 * Vérifie si la valeur passée en paramètre correspond bien à un nombre valide.
 *
 * @export
 * @param {*} value Le valeur à valider.
 * @returns {boolean} Vrai si la valeur est un nombre, faux autrement.
 */
export function isNumber(value) {
  return typeof value === "number" && !Number.isNaN(value);
}


/**
 * Vérifie si une chaîne de caractères est vide.
 *
 * @param {*} str La chaîne de caractères à valider.
 * @returns {boolean} Vrai si la chaîne de caractères est vide, faux autrement.
 */
export const stringVide = (str) => {
  return (!str || str.trim() === "");
}


/**
 * Vérifie si le paramètre correspond bien à une date valide.
 *
 * @param {*} str La valeur à valider.
 * @returns {boolean} Vrai si la valeur est une date, faux autrement.
 */
export const dateValide = (str) => {
  const d = new Date(str);
  return !isNaN(d.getTime());
}
