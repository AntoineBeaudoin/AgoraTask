/** @file Fichier qui définit la logique pour la gestion des tâches */
import { defineStore } from 'pinia'

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: []
  }),

  actions: {
    async addTask(task) {
      this.tasks.push({
        id: Math.floor(Math.random() * 10000),
        ...task
      });
    },

    async updateTask(task) {
      const index = this.tasks.findIndex(t => t.id === task.id);

      if (index !== -1) {
        this.tasks[index] = task
      }
    },

    async deleteTask(id) {
      this.tasks = this.tasks.filter(task => task.id !== id);
    }
  }
})
