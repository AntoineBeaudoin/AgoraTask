/** @file Fichier qui définit la logique pour la gestion des tâches */
import { defineStore } from 'pinia'
import { apiFetch, apiFetchFormData } from '@/utils/api'
import { isNumber } from '@/utils/checks'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loaded: false,
    myTasks: [],
    myTasksLoaded: false,
  }),

  actions: {
    async getTaskById(id) {
      return await this.tasks.find((task) => task.id == id);
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

    async loadMyTasks() {
      try {
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

    async saveProgress() {
      const tasks = []
      for (let i = 0; i < this.myTasks.length; i++) {
        const task = this.myTasks[i]
        const sousTaches = []
        const subs = task.sousTaches || []
        for (let j = 0; j < subs.length; j++) {
          sousTaches.push({ id: subs[j].id, isCompleted: subs[j].isCompleted })
        }
        tasks.push({
          tacheAFaireId: task.tacheAFaireId,
          isCompleted: task.isCompleted,
          commentaire: task.commentaire,
          sousTaches: sousTaches,
        })
      }

      try {
        const response = await apiFetch('/task/progress', {
          method: 'PATCH',
          body: JSON.stringify({ tasks: tasks }),
        })
        if (!response || response.status !== 200) {
          throw new Error(`HTTP ${response ? response.status : 'erreur'}`)
        }
        return true
      } catch (err) {
        console.log(`HTTP ${err}`)
        return false
      }
    },

    async addTask(task) {
      const formData = new FormData()
      formData.append('title', task.title)
      formData.append('room', task.room)
      formData.append('description', task.description ?? '')
      formData.append('recurring', task.recurring)
      formData.append('automaticAssignment', task.automaticAssignment)
      formData.append('occurrences', JSON.stringify(task.occurrences ?? []))
      formData.append('subTasks', JSON.stringify(task.subTasks ?? []))
      for (const image of task.images ?? []) {
        if (image.file) {
          formData.append('images', image.file)
        }
      }
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
      const formData = new FormData()
      formData.append('title', task.title)
      formData.append('room', task.room)
      formData.append('description', task.description ?? '')
      formData.append('recurring', task.recurring)
      formData.append('automaticAssignment', task.automaticAssignment)
      formData.append('occurrences', JSON.stringify(task.occurrences ?? []))
      formData.append('subTasks', JSON.stringify(task.subTasks ?? []))

      const existingImageIds = (task.images ?? [])
        .filter((img) => !img.file && img.id)
        .map((img) => img.id)
      formData.append('existingImageIds', JSON.stringify(existingImageIds))
      for (const image of task.images ?? []) {
        if (image.file) {
          formData.append('images', image.file)
        }
      }

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
