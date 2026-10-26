/** @file Fichier qui sert à gérer la logique des modals (les popups) */
import { defineStore } from 'pinia'

export const useModalStore = defineStore('modal', {
  state: () => ({
    taskModalOpen: false,
    editingTask: null,
    taskDescriptionModalOpen: false,
    observableTask: null,

    passwordModalOpen: false,
    editingUser: null,

    posteModalOpen: false,
    editingPoste: null
  }),

  actions: {
    openTaskDescription(observableTask) {
      this.observableTask = observableTask;
      this.taskDescriptionModalOpen = true;
    },

    openAddTask() {
      this.editingTask = null
      this.taskModalOpen = true
    },

    openEditTask(task) {
      this.editingTask = task
      this.taskModalOpen = true
    },

    closeTaskModal() {
      this.taskDescriptionModalOpen = false;
      this.taskModalOpen = false
      this.editingTask = null
      this.observableTask = null;
    },

    openEditPassword(userId) {
       this.editingUser = userId
       this.passwordModalOpen = true
    },

    closePasswordModal() {
       this.passwordModalOpen = false
       this.editingUser = null
    },

    openAddPoste(){
      this.editingPoste = null;
      this.posteModalOpen = true;
    },

    openEditPoste(poste){
      this.editingPoste = poste;
      this.posteModalOpen = true;
    },

    closePosteModal(){
      this.editingPoste = null;
      this.posteModalOpen = false;
    }
  }
})
