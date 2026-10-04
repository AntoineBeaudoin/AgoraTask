/**
 * Valide qu'un mot de passe respecte les exigences de sécurité.
 *
 * @param {*} password Le mot de passe à valider.
 * @returns {boolean} Vrai si le mot de passe est considéré comme sécuritaire, faux autrement.
 */
export const validatePassword = (password) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;
    if (!passwordRegex.test(password)){
        return false;
    }
    return true;
}
