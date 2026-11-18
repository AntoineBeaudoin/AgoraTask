/**
 * Trie les priorités par poids croissant puis par identifiant.
 */
export function sortTaskPriorities(priorities = []) {
  return [...(priorities ?? [])].sort(
    (a, b) => (a.weigth ?? 0) - (b.weigth ?? 0) || a.id - b.id
  );
}

/**
 * Identifie dynamiquement la priorité la plus faible (poids numérique maximal).
 */
export function getLowestPriority(priorities = []) {
  if (!Array.isArray(priorities) || priorities.length === 0) {
    return null;
  }
  return priorities.reduce((lowest, current) => {
    const currentWeight = Number(current.weigth ?? 0);
    const lowestWeight = Number(lowest.weigth ?? 0);
    return currentWeight > lowestWeight ? current : lowest;
  }, priorities[0]);
}

/**
 * Vérifie si la priorité sélectionnée correspond à la priorité la plus faible.
 */
export function isLowestPriority(priorityId, priorities = []) {
  if (!priorityId || !Array.isArray(priorities) || priorities.length === 0) {
    return false;
  }
  const lowest = getLowestPriority(priorities);
  return Boolean(lowest && Number(lowest.id) === Number(priorityId));
}

/**
 * Vérifie si une URL externe est valide (http:// ou https://).
 */
export function isValidExternalUrl(value) {
  if (typeof value !== 'string' || !value.trim()) {
    return false;
  }
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
}

/**
 * Vérifie si un fichier téléversé est au format PDF.
 */
export function isPdfFileType(file) {
  if (!file) return false;
  const isPdfMime = file.type === 'application/pdf';
  const hasPdfExt = String(file.name ?? '').toLowerCase().endsWith('.pdf');
  return isPdfMime || hasPdfExt;
}
