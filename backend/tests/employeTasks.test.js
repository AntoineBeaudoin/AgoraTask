import { describe, expect, it, beforeAll, afterAll, beforeEach, afterEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bd from "../models/bd.mjs";
import {
  Task,
  Compte,
  occurrence_de_tache,
  tachesAFaire,
  sous_tache,
  sous_taches_AFaire,
} from "../models/bd_index.mjs";
import app from "../app.mjs";

describe("Tests des tâches de l'employé", function () {
  let employe, autreEmploye, token;
  let tache, autreTache, occurrence, autreOccurrence;
  let assignation, autreAssignation, sousTache, sousTacheAutreTache;

  function corps(isCompleted, commentaire, sousTaches) {
    return {
      tasks: [
        {
          tacheAFaireId: assignation.id,
          isCompleted: isCompleted,
          commentaire: commentaire,
          sousTaches: sousTaches || [],
        },
      ],
    };
  }

  function sauvegarder(body) {
    return request(app)
      .patch("/api/task/progress")
      .set("Authorization", "Bearer " + token)
      .send(body);
  }
  
  beforeAll(async function () {
    await bd.authenticate();
  });

  beforeEach(async function () {
    employe = await Compte.create({
      prenom: "Jean",
      nom: "Test",
      courriel: "employe.taches.vitest@example.com",
      motDePasse: "password123",
    });
    autreEmploye = await Compte.create({
      prenom: "Marie",
      nom: "Test",
      courriel: "autre.taches.vitest@example.com",
      motDePasse: "password123",
    });
    token = jwt.sign(
      { id: employe.id, role: employe.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    tache = await Task.create({
      title: "Vitest tâche",
      room: "A-101",
      description: "Tâche de test",
    });
    autreTache = await Task.create({ title: "Vitest autre tâche", room: "B-202" });

    occurrence = await occurrence_de_tache.create({
      tacheId: tache.id,
      journee: "lundi",
      heureDebut: "08:00",
      heureFin: "09:00",
      priorite: 3,
    });
    autreOccurrence = await occurrence_de_tache.create({
      tacheId: autreTache.id,
      priorite: 3,
    });

    assignation = await tachesAFaire.create({
      tacheId: tache.id,
      compteId: employe.id,
      occurrence_de_tacheId: occurrence.id,
    });
    autreAssignation = await tachesAFaire.create({
      tacheId: autreTache.id,
      compteId: autreEmploye.id,
      occurrence_de_tacheId: autreOccurrence.id,
    });

    sousTache = await sous_tache.create({ tacheId: tache.id, titre: "Vitest sous-tâche" });
    sousTacheAutreTache = await sous_tache.create({
      tacheId: autreTache.id,
      titre: "Vitest sous-tâche autre",
    });
  });

  afterEach(async function () {
    if (!assignation || !autreAssignation) return;
    const assignationIds = [assignation.id, autreAssignation.id];
    await sous_taches_AFaire.destroy({ where: { tachesAFaireId: assignationIds } });
    await tachesAFaire.destroy({ where: { id: assignationIds } });
    await sous_tache.destroy({ where: { id: [sousTache.id, sousTacheAutreTache.id] } });
    await occurrence_de_tache.destroy({ where: { id: [occurrence.id, autreOccurrence.id] } });
    await Task.destroy({ where: { id: [tache.id, autreTache.id] } });
    await Compte.destroy({ where: { id: [employe.id, autreEmploye.id] } });
  });

  afterAll(async function () {
    await bd.close();
  });

  describe("GET /api/task/mine", function () {
    it("refuse une requête sans token", async function () {
      const response = await request(app).get("/api/task/mine");
      expect(response.status).toBe(401);
    });

    it("retourne seulement les tâches du compte connecté, avec leurs sous-tâches", async function () {
      const response = await request(app)
        .get("/api/task/mine")
        .set("Authorization", "Bearer " + token);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);

      const item = response.body.data[0];
      expect(item.tacheAFaireId).toBe(assignation.id);
      expect(item.title).toBe("Vitest tâche");
      expect(item.isCompleted).toBe(false);
      expect(item.sousTaches).toHaveLength(1);
      expect(item.sousTaches[0]).toMatchObject({
        id: sousTache.id,
        titre: "Vitest sous-tâche",
        isCompleted: false,
      });
    });

    it("ignore les tâches archivées", async function () {
      await tache.update({ archived: true });

      const response = await request(app)
        .get("/api/task/mine")
        .set("Authorization", "Bearer " + token);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe("PATCH /api/task/progress", function () {
    it("refuse une requête sans token", async function () {
      const response = await request(app)
        .patch("/api/task/progress")
        .send(corps(true, null));
      expect(response.status).toBe(401);
    });

    it("refuse une requête sans tâches à enregistrer", async function () {
      const response = await sauvegarder({ tasks: [] });
      expect(response.status).toBe(400);
    });

    it("marque une tâche comme complétée et enregistre le commentaire", async function () {
      const response = await sauvegarder(corps(true, "Terminé sans problème"));
      expect(response.status).toBe(200);

      await assignation.reload();
      expect(assignation.isCompleted).toBe(true);
      expect(assignation.commentaire).toBe("Terminé sans problème");
    });

    it("permet de décocher une tâche déjà complétée", async function () {
      await sauvegarder(corps(true, null));
      await sauvegarder(corps(false, null));

      await assignation.reload();
      expect(assignation.isCompleted).toBe(false);
    });

    it("retire les espaces autour du commentaire et le limite à 1000 caractères", async function () {
      await sauvegarder(corps(false, "   Bonjour   "));
      await assignation.reload();
      expect(assignation.commentaire).toBe("Bonjour");

      await sauvegarder(corps(false, "a".repeat(1500)));
      await assignation.reload();
      expect(assignation.commentaire).toHaveLength(1000);
    });

    it("enregistre la progression d'une sous-tâche sans créer de doublon", async function () {
      await sauvegarder(corps(false, null, [{ id: sousTache.id, isCompleted: true }]));

      let rows = await sous_taches_AFaire.findAll({
        where: { tachesAFaireId: assignation.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].sousTacheId).toBe(sousTache.id);
      expect(rows[0].isCompleted).toBe(true);

      await sauvegarder(corps(false, null, [{ id: sousTache.id, isCompleted: false }]));

      rows = await sous_taches_AFaire.findAll({
        where: { tachesAFaireId: assignation.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].isCompleted).toBe(false);
    });

    it("retourne la progression sauvegardée d'une sous-tâche dans la liste", async function () {
      await sauvegarder(corps(false, null, [{ id: sousTache.id, isCompleted: true }]));

      const response = await request(app)
        .get("/api/task/mine")
        .set("Authorization", "Bearer " + token);

      expect(response.body.data[0].sousTaches[0].isCompleted).toBe(true);
    });

    it("ne modifie pas la tâche assignée à un autre compte", async function () {
      const response = await sauvegarder({
        tasks: [
          { tacheAFaireId: autreAssignation.id, isCompleted: true, commentaire: "Piraté" },
        ],
      });
      expect(response.status).toBe(200);

      await autreAssignation.reload();
      expect(autreAssignation.isCompleted).toBe(false);
      expect(autreAssignation.commentaire).toBeNull();
    });

    it("ignore une sous-tâche qui n'appartient pas à la tâche", async function () {
      await sauvegarder(
        corps(false, null, [{ id: sousTacheAutreTache.id, isCompleted: true }]),
      );

      const rows = await sous_taches_AFaire.findAll({
        where: { tachesAFaireId: assignation.id },
      });
      expect(rows).toHaveLength(0);
    });
  });
});