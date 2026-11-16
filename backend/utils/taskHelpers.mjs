/**
 * Crée une erreur HTTP typée avec un code de statut.
 */
export function createHttpError(message, statusCode = 400) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

/**
 * Parse un champ JSON ou retourne la valeur par défaut.
 */
export function parseJsonField(value, fallback = []) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  if (typeof value !== "string") {
    return Array.isArray(value) ? value : fallback;
  }
  try {
    return JSON.parse(value);
  } catch {
    throw createHttpError("Format JSON invalide.", 400);
  }
}

/**
 * Retourne dynamiquement la priorité la plus faible (poids numérique maximal).
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
 * Vérifie si l'identifiant correspond à la priorité ayant le poids le plus faible.
 */
export function isLowestPriorityId(priorityId, priorities = []) {
  if (!priorityId || !Array.isArray(priorities) || priorities.length === 0) {
    return false;
  }
  const lowest = getLowestPriority(priorities);
  return Boolean(lowest && Number(lowest.id) === Number(priorityId));
}

/**
 * Vérifie qu'une chaîne correspond à une URL HTTP/HTTPS valide.
 */
export function isValidHttpUrl(value) {
  if (typeof value !== "string" || !value.trim()) {
    return false;
  }
  try {
    const parsed = new URL(value.trim());
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Normalise et valide la liste des liens externes d'une tâche.
 */
export function normalizeExternalLinks(rawLinks = []) {
  if (!Array.isArray(rawLinks)) {
    throw createHttpError("Format des liens externes invalide.", 400);
  }
  return rawLinks.map((item) => {
    const url = (typeof item === "string" ? item : item?.url ?? "").trim();
    const title = (typeof item === "object" ? item?.title ?? "" : "").trim();
    if (!isValidHttpUrl(url)) {
      throw createHttpError("L'URL du lien externe est invalide.", 400);
    }
    return { title: title || url, url };
  });
}

/**
 * Vérifie si un fichier téléversé est un PDF valide.
 */
export function isPdfFile(file) {
  if (!file) return false;
  const isPdfMime = file.mimetype === "application/pdf";
  const hasPdfExt = String(file.originalname ?? "").toLowerCase().endsWith(".pdf");
  return isPdfMime || hasPdfExt;
}

/**
 * Valide que tous les fichiers de documents sont au format PDF.
 */
export function validatePdfFiles(files = []) {
  for (const file of files) {
    if (!isPdfFile(file)) {
      throw createHttpError("Seuls les fichiers PDF sont acceptés.", 400);
    }
  }
}

/**
 * Normalise les documents PDF embarqués transmis dans le corps de la requête.
 */
export function normalizeEmbeddedDocuments(rawDocs = []) {
  if (!Array.isArray(rawDocs)) return [];
  return rawDocs
    .filter((doc) => doc && (doc.path || doc.url))
    .map((doc) => ({
      filename: (doc.filename || doc.name || "document.pdf").trim(),
      path: (doc.path || doc.url).trim(),
      mimeType: doc.mimeType || "application/pdf",
    }));
}

/**
 * Détermine l'identifiant de priorité de la tâche à partir de la requête ou des occurrences.
 */
export function resolveTaskPriorityId(bodyPriorityId, occurrences = []) {
  if (bodyPriorityId !== undefined && bodyPriorityId !== null && bodyPriorityId !== "") {
    return Number(bodyPriorityId);
  }
  const firstOccurrence = Array.isArray(occurrences) ? occurrences[0] : null;
  const occPriorityId = firstOccurrence?.taskPriorityId ?? firstOccurrence?.priority?.id;
  return occPriorityId ? Number(occPriorityId) : null;
}

/**
 * Normalise une occurrence et vérifie ses champs requis.
 */
function normalizeSingleOccurrence(occ, fallbackPriorityId) {
  const resolvedPriorityId = occ?.taskPriorityId ?? occ?.priority?.id ?? fallbackPriorityId;
  if (!occ?.journee || !resolvedPriorityId) {
    throw createHttpError("Chaque occurrence doit avoir une journée et une priorité.", 400);
  }
  return {
    ...occ,
    taskPriorityId: Number(resolvedPriorityId),
  };
}

/**
 * Valide et filtre les occurrences selon la priorité sélectionnée.
 */
export function validateOccurrencesForPriority(priorityId, occurrences = [], priorities = []) {
  if (isLowestPriorityId(priorityId, priorities)) {
    return [];
  }
  if (!Array.isArray(occurrences) || occurrences.length === 0) {
    throw createHttpError("Au moins une occurrence est requise pour cette priorité.", 400);
  }
  return occurrences.map((occ) => normalizeSingleOccurrence(occ, priorityId));
}
