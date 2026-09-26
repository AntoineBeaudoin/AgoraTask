/** @file Fichier qui définit la logique pour la gestion des tâches */
import { defineStore } from 'pinia'
import { apiFetch, apiFetchFormData } from '@/utils/api';
import { isNumber } from '@/utils/checks';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: []
  }),



  actions: {
      async addTask(task) {
        const formData = new FormData();

        formData.append('titre', task.title);
        formData.append('local', task.local);
        formData.append('description', task.description ?? '');
        formData.append('startTime', task.startTime);
        formData.append('endTime', task.endTime);
        formData.append('recurring', task.recurring);
        formData.append('frequency', task.frequency ?? '');
        formData.append('automaticAssignment', task.automaticAssignment);

        for (const image of task.images ?? []) {
          if (image.file) {
            formData.append('images', image.file);
          }
        }

        try {
          const response = await apiFetchFormData('/api/task/add', {
            method: 'POST',
            body: formData
          });

          console.log('createtask response:', response);

          if (isNumber(response)) {
            if (response === 409) {
              return false;
            }

            throw new Error(`HTTP ${response}`);
          }

          const returnedTask = response.data;

          this.tasks.push(returnedTask);

          console.log('create task success');

          return true;
        } catch (err) {
          console.log(`HTTP ${err}`);
          return false;
        }
      },

    async getTasks(task){
      const response = await apiFetch('/api/task/list');
      if (isNumber(response)){
        let i = 0;
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
