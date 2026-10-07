/** @file Fichier qui sert à gérer la logique des modals (les popups) */
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modal', {
  state: () => ({
    taskModalOpen: false,
    editingTask: null,

    passwordModalOpen: false,
    editingUser: null
  }),

  actions: {
    openAddTask() {
      this.editingTask = null
      this.taskModalOpen = true
    },

    openEditTask(task) {
      this.editingTask = task
      this.taskModalOpen = true
    },

    closeTaskModal() {
      this.taskModalOpen = false
      this.editingTask = null
    },

    openEditPassword(userId) {
       this.editingUser = userId
       this.passwordModalOpen = true
    },

    closePasswordModal() {
       this.passwordModalOpen = false
       this.editingUser = null
    }
  }
})
