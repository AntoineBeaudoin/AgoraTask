/** @file Fichier qui définit la logique pour la gestion des priorités de tâches */
import { defineStore } from 'pinia'
import { apiFetch } from '@/utils/api'

export const useTaskPriorityStore = defineStore('taskPriorities', {
  state: () => ({
    taskPriorities: [],
    loaded: false,
    lastErrorMessage: '',
  }),

  actions: {
    async getTaskPriorityById(id) {
      return this.taskPriorities.find((priority) => priority.id == id)
    },

    async loadTaskPriorities(forceRefresh = false) {
      if (this.loaded && !forceRefresh) {
        return
      }
      try {
        const response = await apiFetch('/task_priority/list')
        if (!response || response.status !== 200) {
          throw new Error(`HTTP ${response ? response.status : 'erreur'}`)
        }
        this.taskPriorities = response.data
        this.loaded = true
      } catch (err) {
        console.log(`HTTP ${err}`)
      }
    },

    async addTaskPriority(priority) {
      this.lastErrorMessage = ''
      try {
        const response = await apiFetch('/task_priority/add', {
          method: 'POST',
          body: JSON.stringify({
            task_priority: priority.task_priority,
            weigth: priority.weigth,
          }),
        })
        if (!response || response.status !== 201) {
          this.lastErrorMessage =
            response?.message || "Une erreur est survenue lors de l'ajout de la priorité."
          return false
        }
        const returnedPriority = response.data
        this.taskPriorities.push(returnedPriority)
        return true
      } catch (err) {
        console.log(`HTTP ${err}`)
        this.lastErrorMessage = "Une erreur est survenue lors de l'ajout de la priorité."
        return false
      }
    },

    async updateTaskPriority(priority) {
      this.lastErrorMessage = ''
      try {
        const response = await apiFetch(`/task_priority/${priority.id}`, {
          method: 'PUT',
          body: JSON.stringify({
            task_priority: priority.task_priority,
            weigth: priority.weigth,
          }),
        })
        if (!response || response.status !== 200) {
          this.lastErrorMessage =
            response?.message || 'Une erreur est survenue lors de la modification de la priorité.'
          return false
        }
        const updatedPriority = response.data
        const index = this.taskPriorities.findIndex((pri) => pri.id === priority.id)
        if (index !== -1) {
          this.taskPriorities[index] = updatedPriority
        }
        return true
      } catch (err) {
        console.log(`HTTP ${err}`)
        this.lastErrorMessage = 'Une erreur est survenue lors de la modification de la priorité.'
        return false
      }
    },

    async deleteTaskPriority(id) {
      this.lastErrorMessage = ''
      try {
        const response = await apiFetch('/task_priority/' + id, {
          method: 'DELETE',
        })
        if (response !== null) {
          this.lastErrorMessage =
            response?.message ||
            'Impossible de supprimer cette priorité car elle est utilisée par une occurrence de tâche.'
          return false
        }
        this.taskPriorities = this.taskPriorities.filter((priority) => priority.id !== id)
        return true
      } catch (err) {
        console.log(`HTTP ${err}`)
        this.lastErrorMessage =
          'Une erreur est survenue lors de la suppression de la priorité.'
        return false
      }
    },
  },
})
