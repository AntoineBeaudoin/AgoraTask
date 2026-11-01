import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import bd from '../models/bd.mjs';
import Poste from '../models/poste.mjs';
import Compte from '../models/compte.mjs';
import request from 'supertest';
import app from '../app.mjs';

describe('Tests en lien avec les postes de travail', () => {
  beforeAll(async () => {
    await bd.authenticate();
  });

  beforeEach(async() => {
    await Poste.destroy({where: {}});
    await Compte.destroy({where: {}});
  })

  afterAll(async () => {
    await bd.close();
  });

  it('définit archived à false par défaut', async () => {
    const poste = await Poste.create({
      nom: 'Test poste',
      description: 'Poste de test'
    });

    const savedPoste = await Poste.findByPk(poste.id);

    expect(savedPoste).not.toBeNull();
    expect(savedPoste.archived).toBe(false);

    await savedPoste.destroy();
  });

  it('refuse un poste invalide', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        name: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(400);
  });

  it('crée un poste avec les propriétés par défaut', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(201);

    expect(response.body.poste).toMatchObject({
      nom: 'Vitest test poste',
      description: 'Poste créé pendant un test',
      archived: false
    });

    const savedPoste = await Poste.findOne({
      where: { nom: 'Vitest test poste' }
    });

    expect(savedPoste).not.toBeNull();
    expect(savedPoste.archived).toBe(false);
  });

  it('retourne une erreur lors de la modification d’un poste inexistant', async () => {
    const response = await request(app)
      .put('/api/poste/9999')
      .send({
        nom: 'Lorem ipsum dolor',
        description: 'Sit amet consectetur'
      });

    expect(response.status).toBe(404);
  });

  it('modifie correctement un poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(201);

    const savedPoste = await Poste.findOne({
      where: { nom: 'Vitest test poste' }
    });

    const responseUpdate = await request(app)
      .put('/api/poste/' + savedPoste.id)
      .send({
        nom: 'Vitest test poste updated',
        description: 'Poste updaté pendant le test'
      });

    expect(responseUpdate.status).toBe(200);
  });

  it('retourne une erreur lors de la modification d’un poste inexistant', async () => {
    const response = await request(app)
      .put('/api/poste/9999')
      .send({
        nom: 'Lorem ipsum dolor',
        description: 'Sit amet consectetur'
      });

    expect(response.status).toBe(404);
  });

  it('archive correctement un poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(201);

    const savedPoste = await Poste.findOne({
      where: { nom: 'Vitest test poste' }
    });

    const responseDelete = await request(app)
      .delete('/api/poste/' + savedPoste.id)
      .send({});

    expect(responseDelete.status).toBe(204);
  });

  it('retire correctement le statut archivé d’un poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(201);

    const savedPoste = await Poste.findOne({
      where: { nom: 'Vitest test poste' }
    });

    const responseDelete = await request(app)
      .delete('/api/poste/' + savedPoste.id)
      .send({});

    expect(responseDelete.status).toBe(204);

    const responseUnArchive = await request(app)
      .patch('/api/poste/' + savedPoste.id + '/reactivate')
      .send({});

    expect(responseUnArchive.status).toBe(200);
  });

  it('retourne tous les postes dans la liste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(201);

    const responseTwo = await request(app)
      .post('/api/poste/add')
      .send({
        nom: 'Vitest test poste 2',
        description: 'Poste 2 créé pendant un test'
      });

    expect(responseTwo.status).toBe(201);

    const responseList = await request(app)
      .get('/api/poste/list')
      .send({});

    expect(responseList.body.data.length).toBe(2);
  });

  it('associe les employés au poste', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const employe1 = await Compte.create({
      prenom: 'Jean',
      nom: 'Test',
      courriel: 'jean.test.vitest@example.com',
      motDePasse: 'password123'
    });

    const employe2 = await Compte.create({
      prenom: 'Marie',
      nom: 'Test',
      courriel: 'marie.test.vitest@example.com',
      motDePasse: 'password123'
    });

    const response = await request(app)
      .put(`/api/poste/${poste.id}/employes`)
      .send({
        comptes: [employe1.id, employe2.id]
      });

    expect(response.status).toBe(200);

    expect(response.body.data.employes).toHaveLength(2);

    const employe1Updated = await Compte.findByPk(employe1.id);
    const employe2Updated = await Compte.findByPk(employe2.id);

    expect(employe1Updated.posteId).toBe(poste.id);
    expect(employe2Updated.posteId).toBe(poste.id);
  });

  it('refuse une requête dont la propriété comptes n’est pas un tableau', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const response = await request(app)
      .put(`/api/poste/${poste.id}/employes`)
      .send({
        comptes: '1,2'
      });

    expect(response.status).toBe(400);
  });

  it('refuse les identifiants d’employés invalides', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const response = await request(app)
      .put(`/api/poste/${poste.id}/employes`)
      .send({
        comptes: [0, -1, 'invalid']
      });

    expect(response.status).toBe(400);
  });

  it('retourne une erreur 404 lorsque le poste n’existe pas', async () => {
    const response = await request(app)
      .put('/api/poste/9999/employes')
      .send({
        comptes: []
      });

    expect(response.status).toBe(404);
  });

  it('retourne une erreur 404 lorsqu’un employé n’existe pas', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const response = await request(app)
      .put(`/api/poste/${poste.id}/employes`)
      .send({
        comptes: [9999]
      });

    expect(response.status).toBe(404);
  });

});