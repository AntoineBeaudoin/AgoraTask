import { defineStore } from 'pinia'
import { apiFetch } from '@/utils/api';
import { isNumber } from '@/utils/checks';

export const usePosteStore = defineStore("postes", {
  state: () => ({
    postes: [],
    loaded: false
  }),

  actions: {
    async getPosteById(id) {
      return this.postes.find((poste) => poste.id == id);
    },

    async loadPostes() {
      if (this.loaded) return;

      try {
        const response = await apiFetch('/poste/list');

        console.log('get postes response:', response);

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        this.postes = response.data;
        this.loaded = true;
      } catch (err) {
        console.error(`Error loading postes: ${err}`);
      }
    },

    async addPoste(poste) {
      try {
        const response = await apiFetch('/poste/add', {
          method: 'POST',
          body: JSON.stringify({
            nom: poste.nom,
            description: poste.description ?? '',
            tasks: poste.tasks ?? []
          })
        });

        console.log('create poste response:', response);

        if (isNumber(response)) {
          if (response === 409) {
            return false;
          }

          throw new Error(`HTTP ${response}`);
        }

        const returnedPoste = response.data;

        this.postes.push(returnedPoste);

        console.log('create poste success');
        return true;
      } catch (err) {
        console.error('create poste error:', err);
        return false;
      }
    },

    async updatePoste(poste) {
      try {
        const response = await apiFetch(`/poste/${poste.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nom: poste.nom,
            description: poste.description ?? '',
            tasks: poste.tasks ?? []
          })
        });

        console.log('update poste response:', response);

        if (isNumber(response)) {
          if (response === 409) {
            return false;
          }

          throw new Error(`HTTP ${response}`);
        }

        const updatedPoste = response.data;
        const index = this.postes.findIndex(p => p.id === poste.id);

        if (index !== -1) {
          this.postes[index] = updatedPoste;
        }

        console.log('update poste success');
        return true;
      } catch (err) {
        console.error('update poste error:', err);
        return false;
      }
    },

    async deletePoste(id) {
      this.postes = this.postes.filter(poste => poste.id !== id);
      try {
        console.log("poste id:", id);
        const response = await apiFetch("/poste/" + id, {
          method: "DELETE"
        });

        console.log("response after delete poste: ", response);

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
