import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import jwt from "jsonwebtoken";
import bd from '../models/bd.mjs';
import Poste from '../models/poste.mjs';
import Compte from '../models/compte.mjs';
import request from 'supertest';
import app from '../app.mjs';

describe('Tests en lien avec les postes de travail', () => {
  beforeAll(async () => {
    await bd.authenticate();
  });

  let adminToken;

  beforeEach(async () => {
    await Poste.destroy({ where: {} });
    await Compte.destroy({ where: {} });

    const admin = await Compte.create({
      prenom: "Admin",
      nom: "Test",
      courriel: "admin@test.com",
      motDePasse: "test-password",
      role: "administrateur",
      IsArchived: false,
    });

    adminToken = jwt.sign(
      {
        email: admin.courriel,
        id: admin.id,
        role: admin.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" }
    );
  });

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
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        name: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    beforeEach(async () => {
      await Poste.destroy({ where: {} });
      await Compte.destroy({ where: {} });

  it('crée un poste avec les propriétés par défaut', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

      token = jwt.sign(
        { id: admin.id, role: admin.role },
        process.env.JWT_SECRET,
        { expiresIn: '1h' }
      );
    });

    afterAll(async () => {
      await bd.close();
    });

    expect(savedPoste).not.toBeNull();
    expect(savedPoste.archived).toBe(false);
  });

  it('retourne une erreur lors de la modification d’un poste inexistant', async () => {
    const response = await request(app)
      .put('/api/poste/9999')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Lorem ipsum dolor',
        description: 'Sit amet consectetur'
      });

      const savedPoste = await Poste.findByPk(poste.id);

  it('modifie correctement un poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(201);

      await savedPoste.destroy();
    });

    const responseUpdate = await request(app)
      .put('/api/poste/' + savedPoste.id)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Vitest test poste updated',
        description: 'Poste updaté pendant le test'
      });

    expect(responseUpdate.status).toBe(200);

    const updatedPoste = await Poste.findByPk(savedPoste.id);

    expect(updatedPoste.nom).toBe('Vitest test poste updated');
    expect(updatedPoste.description).toBe('Poste updaté pendant le test');
  });

  it('archive correctement un poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
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

    const responseDelete = await request(app)
      .delete('/api/poste/' + savedPoste.id)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(responseDelete.status).toBe(204);

    const archivedPoste = await Poste.findByPk(savedPoste.id);

    expect(archivedPoste.archived).toBe(true);
  });

  it('retire correctement le statut archivé d’un poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

      const responseUpdate = await request(app)
        .put('/api/poste/' + savedPoste.id)
        .set('Authorization', 'Bearer ' + token)
        .send({
          nom: 'Vitest test poste updated',
          description: 'Poste updaté pendant le test'
        });

      expect(responseUpdate.status).toBe(200);
    });

    const responseDelete = await request(app)
      .delete('/api/poste/' + savedPoste.id)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

      expect(response.status).toBe(404);
    });

    const responseUnArchive = await request(app)
      .patch('/api/poste/' + savedPoste.id + '/reactivate')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(responseUnArchive.status).toBe(200);

    const restoredPoste = await Poste.findByPk(savedPoste.id);

    expect(restoredPoste.archived).toBe(false);
  });

  it('retourne tous les postes dans la liste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

      const responseDelete = await request(app)
        .delete('/api/poste/' + savedPoste.id)
        .set('Authorization', 'Bearer ' + token)
        .send({});

      expect(responseDelete.status).toBe(204);
    });

    it('retire correctement le statut archivé d’un poste', async () => {
      const response = await request(app)
        .post('/api/poste/add')
        .set('Authorization', 'Bearer ' + token)
        .send({
          nom: 'Vitest test poste',
          description: 'Poste créé pendant un test'
        });

      expect(response.status).toBe(201);

    const responseTwo = await request(app)
      .post('/api/poste/add')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        nom: 'Vitest test poste 2',
        description: 'Poste 2 créé pendant un test'
      });

      const responseDelete = await request(app)
        .delete('/api/poste/' + savedPoste.id)
        .set('Authorization', 'Bearer ' + token)
        .send({});

    const responseList = await request(app)
      .get('/api/poste/list')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({});

    expect(responseList.status).toBe(200);
    expect(responseList.body.data.length).toBe(2);
  });

  it('assigne correctement un poste à un employé', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const employe = await Compte.create({
      prenom: 'Jean',
      nom: 'Test',
      courriel: 'jean.test.vitest@example.com',
      motDePasse: 'password123'
    });

    const response = await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste.id
      });

    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      employeId: employe.id,
      posteId: poste.id
    });

    const employeUpdated = await Compte.findByPk(employe.id);

    expect(employeUpdated.posteId).toBe(poste.id);
  });

  it('modifie correctement le poste d’un employé', async () => {
    const poste1 = await Poste.create({
      nom: 'Poste initial',
      description: 'Premier poste'
    });

    const poste2 = await Poste.create({
      nom: 'Poste secondaire',
      description: 'Deuxième poste'
    });

    const employe = await Compte.create({
      prenom: 'Marie',
      nom: 'Test',
      courriel: 'marie.test.vitest@example.com',
      motDePasse: 'password123'
    });

    await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste1.id
      });

    const response = await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste2.id
      });

      const employe2 = await Compte.create({
        prenom: 'Marie',
        nom: 'Test',
        courriel: 'marie.test.vitest@example.com',
        motDePasse: 'password123'
      });

      const response = await request(app)
        .put(`/api/poste/${poste.id}/employes`)
        .set('Authorization', 'Bearer ' + token)
        .send({
          comptes: [employe1.id, employe2.id]
        });

    const employeUpdated = await Compte.findByPk(employe.id);

    expect(employeUpdated.posteId).toBe(poste2.id);
  });

  it('retire correctement le poste d’un employé', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const employe = await Compte.create({
      prenom: 'Jean',
      nom: 'Test',
      courriel: 'jean.remove.vitest@example.com',
      motDePasse: 'password123'
    });

    await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste.id
      });

    const response = await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: null
      });

    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      employeId: employe.id,
      posteId: null
    });

    const employeUpdated = await Compte.findByPk(employe.id);

    expect(employeUpdated.posteId).toBeNull();
  });

  it('retourne une erreur 404 lorsqu’un employé inexistant est assigné', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const response = await request(app)
      .patch('/api/poste/employe/9999')
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste.id
      });

    expect(response.status).toBe(404);
  });

  it('retourne une erreur 404 lorsqu’un poste inexistant est assigné', async () => {
    const employe = await Compte.create({
      prenom: 'Jean',
      nom: 'Test',
      courriel: 'jean.invalid.vitest@example.com',
      motDePasse: 'password123'
    });

    const response = await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: 9999
      });

    expect(response.status).toBe(404);

    const employeUpdated = await Compte.findByPk(employe.id);

    expect(employeUpdated.posteId).toBeNull();
  });

  it('refuse l’assignation d’un poste archivé', async () => {
    const poste = await Poste.create({
      nom: 'Poste archivé',
      description: 'Poste de test',
      archived: true
    });

    const employe = await Compte.create({
      prenom: 'Jean',
      nom: 'Test',
      courriel: 'jean.archived.vitest@example.com',
      motDePasse: 'password123'
    });

    const response = await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste.id
      });

    expect(response.status).toBe(400);

    const employeUpdated = await Compte.findByPk(employe.id);

    expect(employeUpdated.posteId).toBeNull();
  });

  it('retourne correctement le poste assigné à un employé', async () => {
    const poste = await Poste.create({
      nom: 'Vitest test poste',
      description: 'Poste de test'
    });

    const employe = await Compte.create({
      prenom: 'Marie',
      nom: 'Test',
      courriel: 'marie.get.vitest@example.com',
      motDePasse: 'password123'
    });

    await request(app)
      .patch(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)
      .send({
        posteId: poste.id
      });

    const response = await request(app)
      .get(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      employeId: employe.id,
      posteId: poste.id
    });
  });

  it('retourne null lorsqu’un employé ne possède aucun poste', async () => {
    const employe = await Compte.create({
      prenom: 'Jean',
      nom: 'Test',
      courriel: 'jean.noposte.vitest@example.com',
      motDePasse: 'password123'
    });

    const response = await request(app)
      .get(`/api/poste/employe/${employe.id}`)
      .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(200);

    expect(response.body.data).toMatchObject({
      employeId: employe.id,
      posteId: null
    });
  });

  it('retourne une erreur 404 lorsqu’on recherche le poste d’un employé inexistant', async () => {
    const response = await request(app)
      .get('/api/poste/employe/9999')
      .set("Authorization", `Bearer ${adminToken}`)

    expect(response.status).toBe(404);
  });
});
