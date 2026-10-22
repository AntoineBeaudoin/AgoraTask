import { describe, test, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import bd from '../models/bd.mjs';
import Poste from '../models/Poste.mjs';
import request from 'supertest';
import app from '../app.mjs';

describe('Tests en lien avec les postes de travail', () => {
  beforeAll(async () => {
    await bd.authenticate();
  });

  beforeEach(async() => {
    await Poste.destroy({where: {}})
  })

  afterAll(async () => {
    await bd.close();
  });

  it('should set archived to false by default', async () => {
    const poste = await Poste.create({
      nom: 'Test poste',
      description: 'Poste de test'
    });

    const savedPoste = await Poste.findByPk(poste.id);

    expect(savedPoste).not.toBeNull();
    expect(savedPoste.archived).toBe(false);

    await savedPoste.destroy();
  });

  it('refuses an invalid poste', async () => {
    const response = await request(app)
      .post('/api/poste/add')
      .send({
        name: 'Vitest test poste',
        description: 'Poste créé pendant un test'
      });

    expect(response.status).toBe(400);
  });

   it('creates a poste with default properties', async () => {
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

   it('updates an invalid poste', async () => {
    const response = await request(app)
      .put('/api/poste/9999')
      .send({
        nom: 'Lorem ipsum dolor',
        description: 'Sit amet consectetur'
      });

    expect(response.status).toBe(404);
  });

  it('updates a poste correctly', async () => {
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
    .put('/api/poste/' +  savedPoste.id)
    .send({
      nom: 'Vitest test poste updated',
      description: 'Poste updaté pendant le test'
    })

    expect(responseUpdate.status).toBe(200);
  });

  it('updates an invalid poste', async () => {
    const response = await request(app)
      .put('/api/poste/9999')
      .send({
        nom: 'Lorem ipsum dolor',
        description: 'Sit amet consectetur'
      });

    expect(response.status).toBe(404);
  });

  it('archives a poste correctly', async () => {
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
    .delete('/api/poste/' +  savedPoste.id)
    .send({})

    expect(responseDelete.status).toBe(204);
  });  

  it('removes the archived status from a poste correctly', async () => {
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
    .delete('/api/poste/' +  savedPoste.id)
    .send({})

    expect(responseDelete.status).toBe(204);

    const responseUnArchive = await request(app)
    .patch('/api/poste/' +  savedPoste.id + '/reactivate')
    .send({})

    expect (responseUnArchive.status).toBe(200);
  });  
});