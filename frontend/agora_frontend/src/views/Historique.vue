<template></template>
<script>
import { ref } from 'vue'
import { onMounted, reactive } from 'vue'
import { apiFetch } from '../utils/api.js'
let dateHistorique = ref('')
let EmployeEnService = reactive([])
let EmployeTaches = reactive([])
onMounted(async () => {
  try {
    dateHistorique.value = new Date()
    getEmployeEnService()
  } catch (error) {
    console.error('Erreur lors de la récupération des employés en service :', error)
  }
})

function getEmployeEnService() {
  apiFetch('/api/historique?date=' + dateHistorique.value, {
    method: 'GET',
  })
    .then((data) => {
      EmployeEnService = data.data
    })
    .catch((error) => {
      console.error('Erreur lors de la récupération des employés en service :', error)
    })
}
function getEmployeTaches(compteId) {
  apiFetch('/api/historique/' + compteId + '?date=' + dateHistorique.value, {
    method: 'GET',
  })
    .then((data) => {
      EmployeTaches = data.data
    })
    .catch((error) => {
      console.error('Erreur lors de la récupération des employés en service :', error)
    })
}
</script>
