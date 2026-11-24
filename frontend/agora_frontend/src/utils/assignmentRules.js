export function normaliser(texte) {
  return String(texte ?? '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
}

export function nomEmploye(employe) {
  return [employe?.prenom, employe?.nom].filter(Boolean).join(' ') || 'Employé inconnu'
}

export function initiales(employe) {
  return `${employe?.prenom?.charAt(0) ?? ''}${employe?.nom?.charAt(0) ?? ''}`.toUpperCase() || '—'
}

export function libelleRole(role) {
  return role?.replaceAll('_', ' ') || 'Employé'
}

export function heure(valeur) {
  return valeur ? valeur.slice(0, 5) : '—'
}

export function toutesTerminees(taches) {
  return !!taches?.length && taches.every((tache) => tache.isCompleted)
}

export function secondes(heureSaisie) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d(?::[0-5]\d(?:\.\d+)?)?$/.test(heureSaisie ?? '')) return null
  const [h, m, s = '0'] = heureSaisie.split(':')
  return Number(h) * 3600 + Number(m) * 60 + Number(s)
}

export function horairesChevauchants(a, b) {
  const debutA = secondes(a?.heureDebut)
  const finA = secondes(a?.heureFin)
  const debutB = secondes(b?.heureDebut)
  const finB = secondes(b?.heureFin)
  if ([debutA, finA, debutB, finB].some((valeur) => valeur === null)) return false
  return debutA < finB && debutB < finA
}

export function verifierChevauchement(journees, accountId, taskId, horaire, idExclu = null) {
  const jour = journees.find((item) => Number(item.accountId) === Number(accountId))
  return (jour?.tasks ?? []).some((affectation) =>
    Number(affectation.taskId) === Number(taskId) &&
    Number(affectation.id) !== Number(idExclu) &&
    horairesChevauchants(horaire, affectation.occurrence),
  )
}

export function afficherErreur(error) {
  return error?.message || 'Une erreur inattendue est survenue.'
}
