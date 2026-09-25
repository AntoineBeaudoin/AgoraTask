/** @file Fichier qui définit la logique pour la gestion des tâches */
import { defineStore } from 'pinia'
import { apiFetch } from '@/utils/api';
import { isNumber } from '@/utils/checks';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: []
  }),



  actions: {
    async addTask(task) {
      const taskBody = {
        titre: task.title,
        local: task.local,
        description: task.description,
        startTime: task.startTime,
        endTime: task.endTime,
        recurring: task.recurring,
        frequency: task.frequency,
        automaticAssignment: task.automaticAssignment
      }
      try {
        const response = await apiFetch('/api/task/add', {
          method: "POST",
          body: JSON.stringify(taskBody)
        });

        console.log("createtask response: ", response);

        if (isNumber(response)) {
          if (response == 409) {
            return false;
          }
          else {
            throw new Error(`HTTP ${response}`);
          }
        }
        else {
          const returnedTask = response.data;
          this.tasks.push(returnedTask);
          console.log("create task success");
          return true;
        }
      } catch (err) {
        console.log((`HTTP ${err}`));
        return false;
      }

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
