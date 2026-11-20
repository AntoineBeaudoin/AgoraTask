/** @file Fichier qui définit la logique pour la gestion des tâches */
import { defineStore } from 'pinia'
import { apiFetch, apiFetchFormData } from '@/utils/api'
import { isNumber, stringVide } from '@/utils/checks'
import { appendFilesToFormData } from '@/utils/fileHelper'

function buildTaskFormData(task, isUpdate = false) {
  const formData = new FormData()
  formData.append('title', task.title)
  formData.append('room', task.room)
  formData.append('description', task.description ?? '')
  formData.append('recurring', task.recurring)
  formData.append('automaticAssignment', task.automaticAssignment)
  if (task.taskPriorityId !== undefined && task.taskPriorityId !== null) {
    formData.append('taskPriorityId', task.taskPriorityId)
  }
  formData.append('occurrences', JSON.stringify(task.occurrences ?? []))
  formData.append('subTasks', JSON.stringify(task.subTasks ?? []))
  formData.append('externalLinks', JSON.stringify(task.externalLinks ?? []))
  const embeddedDocs = (task.documents ?? []).filter((doc) => !doc.file)
  formData.append('documents', JSON.stringify(embeddedDocs))
  if (isUpdate) {
    const existingImageIds = (task.images ?? []).filter((i) => !i.file && i.id).map((i) => i.id)
    const existingDocIds = embeddedDocs.filter((d) => d.id).map((d) => d.id)
    formData.append('existingImageIds', JSON.stringify(existingImageIds))
    formData.append('existingDocumentIds', JSON.stringify(existingDocIds))
  }
  appendFilesToFormData(formData, task.images, 'images')
  appendFilesToFormData(formData, task.documents, 'documents')
  return formData
}

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loaded: false,
    myTasks: [],
    myTasksLoaded: false,
    dailyComment: ''
  }),

  actions: {
    async getTaskById(id) {
      return await this.tasks.find((task) => task.id == id)
    },
    async loadTasks() {
      if (this.loaded) {
        return
      }
      try {
        const response = await apiFetch('/task/list')
        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`)
        }
        this.tasks = response.data
        this.loaded = true
      } catch (err) {
        console.log(`HTTP ${err}`)
      }
    },

    async loadEmployeeInterface() {
      try {
        this.dailyComment = ''
        const response = await apiFetch('/task/mine')
        if (!response || response.status !== 200) {
          throw new Error(`HTTP ${response ? response.status : 'erreur'}`)
        }
        this.myTasks = response.data
        this.myTasksLoaded = true
      } catch (err) {
        console.log(`HTTP ${err}`)
      }
    },

    async getNumberOfTaskOccurrences(id) {
      try {
        const response = await apiFetch(`/task/occurrences/${id}`)
        if (!response || response.status !== 200) {
          throw new Error(`HTTP ${response ? response.status : 'erreur'}`)
        }
        return response.data.length
      } catch (err) {
        console.log(`HTTP ${err}`)
      }
    },

    async saveProgress() {
      const tasks = this.myTasks.map(task => ({
        id: task.id,
        isCompleted: task.isCompleted === true,
        subTasks: (task.sousTaches || []).map(sub => ({
          id: sub.id,
          isCompleted: sub.isCompleted === true,
        })),
      }))

      try {
        const response = await apiFetch('/task/progress', {
          method: 'PATCH',
          body: JSON.stringify({ tasks }),
        })

        if (!response || response.status !== 200) {
          throw new Error(`HTTP ${response ? response.status : 'erreur'}`)
        }

        return true
      } catch (err) {
        console.log(err)
        return false
      }
    },

    validateSubmission() {
      let hasIncompleteItems = false

      for (const task of this.myTasks) {

        if (!task.isCompleted) {
          hasIncompleteItems = true

          if (stringVide(task.commentaire)) {
            return {
              valid: false,
              message: `La tâche "${task.title}" doit avoir un commentaire puisqu'elle n'est pas terminée.`,
            }
          }
        }

        for (const sub of task.sousTaches || []) {
          if (!sub.isCompleted) {
            hasIncompleteItems = true

            if (stringVide(sub.commentaire)) {
              return {
                valid: false,
                message: `La sous-tâche "${sub.titre}" doit avoir un commentaire puisqu'elle n'est pas terminée.`,
              }
            }
          }
        }
      }

      if (hasIncompleteItems && stringVide(this.dailyComment)) {
        return {
          valid: false,
          message: "Un commentaire global est obligatoire lorsqu'il reste des tâches ou sous-tâches non terminées.",
        }
      }

      return {
        valid: true,
        message: '',
      }
    },

    async submitDay() {
      const validation = this.validateSubmission()

      if (!validation.valid) {
        return {
          success: false,
          message: validation.message,
        }
      }

      const tasks = this.myTasks.map(task => ({
        id: task.id,
        comment: task.commentaire ?? '',
        subTasks: (task.sousTaches || []).map(sub => ({
          id: sub.id,
          comment: sub.commentaire ?? '',
        })),
      }))

      try {
        const workDayId = this.myTasks[0]?.workDayId

        if (!workDayId) {
          throw new Error("Impossible de déterminer la journée à soumettre.")
        }

        const response = await apiFetch(`/work_day/submit/${workDayId}`, {
          method: 'POST',
          body: JSON.stringify({
            comment: this.dailyComment,
            tasks,
          }),
        })

        if (!response || response.status !== 200) {
          throw new Error(`HTTP ${response ? response.status : 'erreur'}`)
        }

        return {
          success: true,
          message: 'Journée soumise avec succès.',
        }

      } catch (err) {
        console.log(err)

        return {
          success: false,
          message: "Une erreur est survenue lors de la soumission de la journée.",
        }
      }
    },

    async addTask(task) {
      const formData = buildTaskFormData(task, false)
      try {
        const response = await apiFetchFormData('/task/add', {
          method: 'POST',
          body: formData,
        })
        if (isNumber(response)) {
          if (response === 409) return false
          throw new Error(`HTTP ${response}`)
        }
        const returnedTask = response.data
        this.tasks.push(returnedTask)
        return true
      } catch (err) {
        console.log(`HTTP ${err}`)
        return false
      }
    },

    async updateTask(task) {
      const formData = buildTaskFormData(task, true)
      try {
        const response = await apiFetchFormData(`/task/${task.id}`, {
          method: 'PUT',
          body: formData,
        })
        if (isNumber(response)) {
          if (response === 409) {
            return false
          }
          throw new Error(`HTTP ${response}`)
        }
        const updatedTask = response.data
        const index = this.tasks.findIndex((t) => t.id === task.id)
        if (index !== -1) {
          this.tasks[index] = updatedTask
        }
        return true
      } catch (err) {
        console.log(`HTTP ${err}`)
        return false
      }
    },

    async duplicateTask(id) {
      try {
        const response = await apiFetch(`/task/${id}/duplicate`, {
          method: 'POST',
        })
        if (isNumber(response)) {
          throw new Error(`HTTP ${response}`)
        }
        const duplicatedTask = response.data
        this.tasks.push(duplicatedTask)
        return true
      } catch (err) {
        return false
      }
    },

    async deleteTask(id) {
      this.tasks = this.tasks.filter((task) => task.id !== id)
      try {
        const response = await apiFetch('/task/' + id, {
          method: 'DELETE',
        })
        if (response !== null) {
          throw new Error(`HTTP ${response.status}`)
        } else {
          return true
        }
      } catch (err) {
        console.log(`HTTP ${err}`)
        return false
      }
    },
  },
})
