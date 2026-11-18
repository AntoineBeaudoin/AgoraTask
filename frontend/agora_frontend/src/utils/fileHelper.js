/**
 * Ajoute des items (ex: images, PDF...) au formData
 * @param {*} formData Le formData
 * @param {*} items Un ou plusieurs items à ajouter au formData (ex: images, PDF, etc.)
 * @param {*} fieldName Le nom du champ à associer aux items à ajouter
 */
export function appendFilesToFormData(formData, items = [], fieldName) {
  for (const item of items) {
    if (item?.file) {
      formData.append(fieldName, item.file)
    }
  }
}