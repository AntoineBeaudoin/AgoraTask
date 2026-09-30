/**
 * Effectue une requête vers une url avec d'une méthoode et des options définies par l'utilisateur,
 * tout cela en utilisant la clé d'api pour le projet.
 *
 * @export
 * @async
 * @param {*} path L'url où envoyer une requête.
 * @param {{}} [options={}] Les options à envoyer, tels que le type de méthode utilisée, et des paramètres supplémentaires si nécessaire.
 * @returns {unknown} La réponse retournée par le serveur en cas de succès, le code d'erreur de celle-ci autrement. Si le code d'erreur
 * est 204, cette fonction retourne null.
 */
export async function apiFetch(path, options = {}) {
  const token = localStorage.getItem('jwt')
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  const res = await fetch(`${import.meta.env.VITE_API_BASE}${path}`, { ...options, headers })
  // if (!res.ok) {
  //   return res.status
  // }
  if (res.status === 204) return null
  const jsonResponse = await res.json()
  return jsonResponse
}

export async function apiFetchFormData(path, options = {}) {
   const token = localStorage.getItem("jwt");
   const headers = { ...options.headers };
   if (token) {
     headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch( `${import.meta.env.VITE_API_BASE}${path}`, { ...options, headers } );
    if (!res.ok) {
      return res.status;
    }

    if (res.status === 204) return null;
    const jsonResponse = await res.json();
    return jsonResponse;
}
