import { defineStore } from 'pinia'
import { apiFetch } from '@/utils/api';

export const usePosteStore = defineStore("postes", {
  state: () => ({
    postes: [],
    loaded: false,
    lastErrorStatus: 400
  }),

  actions: {
    async getPosteById(id) {
      return this.postes.find((poste) => poste.id == id);
    },

    async loadPostes(url = '/poste/list', forceRefresh = false) {
      if (this.loaded && !forceRefresh && url === '/poste/list') return;

      try {
        const response = await apiFetch(url);

        this.lastErrorStatus = response.status;

        if (this.lastErrorStatus !== 200) {
          throw new Error(`HTTP ${this.lastErrorStatus}`);
        }

        this.postes = response.data;
        this.loaded = true;
      } catch (err) {
        console.error('Error loading postes:', err);
      }
    },

    async addPoste(poste) {
      try {
        const response = await apiFetch('/poste/add', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            nom: poste.nom,
            description: poste.description ?? '',
            tasks: poste.tasks ?? []
          })
        });

        this.lastErrorStatus = response.status || 200;

        if (this.lastErrorStatus !== 200) {
          throw new Error(`HTTP ${this.lastErrorStatus}`);
        }

        await this.loadPostes('/poste/list', true);

        return response.poste?.id ?? true;
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


        this.lastErrorStatus = response.status;

        if (this.lastErrorStatus !== 200) {
          throw new Error(`HTTP ${this.lastErrorStatus}`);
        }

        const updatedPoste = response.data;
        const index = this.postes.findIndex(p => p.id === poste.id);

        if (index !== -1) {
          this.postes[index] = updatedPoste;
        }

        return true;
      } catch (err) {
        console.error('update poste error:', err);
        return false;
      }
    },

    async assignPosteToEmployees(posteId, comptes) {
      try {
        const response = await apiFetch(`/poste/${posteId}/employes`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            comptes
          })
        });

        this.lastErrorStatus = response.status;

        if (response.status !== 200) {
          throw new Error(`HTTP ${response.status}`);
        }

        await this.loadPostes('/poste/list', true);

        return true;
      } catch (err) {
        console.error('assign employees to poste error:', err);
        return false;
      }
    },

    async deletePoste(id) {
      this.postes = this.postes.filter(poste => poste.id !== id);
      try {
        const response = await apiFetch("/poste/" + id, {
          method: "DELETE"
        });

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
    },

    async reactivatePoste(id) {
      try {
        console.log("poste id:", id);
        const response = await apiFetch("/poste/reactivate/" + id, {
          method: "PATCH"
        });

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
