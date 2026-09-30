/** @file Fichier qui définit la logique pour la gestion des tâches */
import { defineStore } from 'pinia'
import { apiFetch, apiFetchFormData } from '@/utils/api';
import { isNumber } from '@/utils/checks';

export const useTaskStore = defineStore('tasks', {
  state: () => ({
    tasks: [],
    loaded: false
  }),

  actions: {

    async getTaskById(id) {
      return this.tasks.find((task) => task.id == id);
    },

    async loadTasks() {
      if (this.loaded) {
        return;
      }

      try {
        const response = await apiFetch('/task/list');

        console.log('get tasks response:', response);

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        this.tasks = response.data;
        this.loaded = true;

      } catch (err) {
        console.log(`HTTP ${err}`);
      }
    },

    async addTask(task) {
      const formData = new FormData();

      formData.append('title', task.title);
      formData.append('room', task.room);
      formData.append('description', task.description ?? '');
      formData.append('startTime', task.startTime);
      formData.append('endTime', task.endTime);
      formData.append('recurring', task.recurring);
      formData.append('frequency', task.frequency || "daily");
      formData.append('automaticAssignment', task.automaticAssignment);

      for (const image of task.images ?? []) {
        if (image.file) {
          formData.append('images', image.file);
        }
      }

      try {
        const response = await apiFetchFormData('/task/add', {
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

    async updateTask(task) {
      const formData = new FormData();
      formData.append('title', task.title);
      formData.append('room', task.room);
      formData.append('description', task.description ?? '');
      formData.append('startTime', task.startTime);
      formData.append('endTime', task.endTime);
      formData.append('recurring', task.recurring);
      formData.append('frequency', task.frequency || 'daily');
      formData.append('automaticAssignment', task.automaticAssignment);

      const existingImageIds = (task.images ?? [])
        .filter(img => !img.file && img.id)
        .map(img => img.id);
      formData.append('existingImageIds', JSON.stringify(existingImageIds));
      for (const image of task.images ?? []) {
        if (image.file) {
          formData.append('images', image.file);
        }
      }

      try {
        const response = await apiFetchFormData(`/task/${task.id}`, {
          method: 'PUT',
          body: formData
        });
        console.log('update task response:', response);
        if (isNumber(response)) {
          if (response === 409) {
            return false;
          }
          throw new Error(`HTTP ${response}`);
        }
        const updatedTask = response.data;
        const index = this.tasks.findIndex(t => t.id === task.id);
        if (index !== -1) {
          this.tasks[index] = updatedTask;
        }
        console.log('update task success');
        return true;
      } catch (err) {
        console.log(`HTTP ${err}`);
        return false;
      }
    },

    async deleteTask(id) {
      this.tasks = this.tasks.filter(task => task.id !== id);
      try {
        console.log("task id:", id);
        const response = await apiFetch("/task/" + id, {
          method: "DELETE"
        });

        console.log("response after delete task: ", response);

        if (response !== null) {
          throw new Error(`HTTP ${response.status}`);
        }
        else {
          return true;
        }
      } catch (err) {
        console.log(`HTTP ${err}`);
        return false;
      }

    }
  }
})
