import {
  describe,
  expect,
  it,
  beforeAll,
  afterAll,
  beforeEach,
  afterEach,
} from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bd from "../models/bd.mjs";
import {
  Task,
  Compte,
  occurrence_de_tache,
  sous_tache,
  task_priority,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import app from "../app.mjs";

const DATE = "2030-01-15";

describe("Tests des tâches de l'employé", function () {
  let employe, autreEmploye, token;
  let tache, autreTache, priorite, occurrence, autreOccurrence;
  let journee, autreJournee;
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

  function mesTaches(date) {
    return request(app)
      .get("/api/task/mine?date=" + (date || DATE))
      .set("Authorization", "Bearer " + token);
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
    autreTache = await Task.create({
      title: "Vitest autre tâche",
      room: "B-202",
    });

    priorite = await task_priority.create({
      task_priority: "Normale",
      weigth: 2,
    });

    occurrence = await occurrence_de_tache.create({
      tacheId: tache.id,
      journee: "lundi",
      heureDebut: "08:00",
      heureFin: "09:00",
      taskPriorityId: priorite.id,
    });
    autreOccurrence = await occurrence_de_tache.create({
      tacheId: autreTache.id,
      taskPriorityId: priorite.id,
    });

    sousTache = await sous_tache.create({
      tacheId: tache.id,
      titre: "Vitest sous-tâche",
    });
    sousTacheAutreTache = await sous_tache.create({
      tacheId: autreTache.id,
      titre: "Vitest sous-tâche autre",
    });

    journee = await work_day.create({ accountId: employe.id, date: DATE });
    autreJournee = await work_day.create({
      accountId: autreEmploye.id,
      date: DATE,
    });

    assignation = await work_day_task.create({
      workDayId: journee.id,
      taskId: tache.id,
      occurrenceId: occurrence.id,
    });
    autreAssignation = await work_day_task.create({
      workDayId: autreJournee.id,
      taskId: autreTache.id,
      occurrenceId: autreOccurrence.id,
    });

    await work_day_sub_task.create({
      workDayTaskId: assignation.id,
      subTaskId: sousTache.id,
    });
  });

  afterEach(async function () {
    if (!assignation || !autreAssignation) return;
    const assignationIds = [assignation.id, autreAssignation.id];
    await work_day_sub_task.destroy({
      where: { workDayTaskId: assignationIds },
    });
    await work_day_task.destroy({ where: { id: assignationIds } });
    await work_day.destroy({ where: { id: [journee.id, autreJournee.id] } });
    await sous_tache.destroy({
      where: { id: [sousTache.id, sousTacheAutreTache.id] },
    });
    await occurrence_de_tache.destroy({
      where: { id: [occurrence.id, autreOccurrence.id] },
    });
    if (priorite) {
      await task_priority.destroy({ where: { id: priorite.id } });
    }
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

    it("refuse une date invalide", async function () {
      const response = await mesTaches("pas-une-date");
      expect(response.status).toBe(400);
    });

    it("retourne seulement les tâches du compte connecté, avec leurs sous-tâches", async function () {
      const response = await mesTaches();

      expect(response.status).toBe(200);
      expect(response.body.data.tasks).toHaveLength(1);
      expect(response.body.data.workDayId).toBe(journee.id);
      expect(response.body.data.isDaySubmitted).toBe(false);
      expect(response.body.data.dailyComment).toBe("");

      const item = response.body.data.tasks[0];

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

    it("ne retourne aucune tâche pour une date sans journée de travail", async function () {
      const response = await mesTaches("2030-01-16");

      expect(response.status).toBe(200);
      expect(response.body.data.tasks).toHaveLength(0);
      expect(response.body.data.workDayId).toBeNull();
      expect(response.body.data.isDaySubmitted).toBe(false);
      expect(response.body.data.dailyComment).toBe("");
    });

    it("ignore les tâches archivées", async function () {
      await tache.update({ archived: true });

      const response = await mesTaches();

      expect(response.status).toBe(200);
      expect(response.body.data.tasks).toHaveLength(0);
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
      expect(assignation.comment).toBe("Terminé sans problème");
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
      expect(assignation.comment).toBe("Bonjour");

      await sauvegarder(corps(false, "a".repeat(1500)));
      await assignation.reload();
      expect(assignation.comment).toHaveLength(1000);
    });

    it("enregistre la progression d'une sous-tâche sans créer de doublon", async function () {
      await sauvegarder(
        corps(false, null, [{ id: sousTache.id, isCompleted: true }]),
      );

      let rows = await work_day_sub_task.findAll({
        where: { workDayTaskId: assignation.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].subTaskId).toBe(sousTache.id);
      expect(rows[0].isCompleted).toBe(true);

      await sauvegarder(
        corps(false, null, [{ id: sousTache.id, isCompleted: false }]),
      );

      rows = await work_day_sub_task.findAll({
        where: { workDayTaskId: assignation.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].isCompleted).toBe(false);
    });

    it("retourne la progression sauvegardée d'une sous-tâche dans la liste", async function () {
      await sauvegarder(
        corps(false, null, [{ id: sousTache.id, isCompleted: true }]),
      );

      const response = await mesTaches();

      expect(response.status).toBe(200);
      expect(response.body.data.tasks[0].sousTaches[0].isCompleted).toBe(true);
    });

    it("ne modifie pas la tâche assignée à un autre compte", async function () {
      const response = await sauvegarder({
        tasks: [
          {
            tacheAFaireId: autreAssignation.id,
            isCompleted: true,
            commentaire: "Piraté",
          },
        ],
      });
      expect(response.status).toBe(200);

      await autreAssignation.reload();
      expect(autreAssignation.isCompleted).toBe(false);
      expect(autreAssignation.comment).toBeNull();
    });

    it("ignore une sous-tâche qui n'appartient pas à la tâche", async function () {
      await sauvegarder(
        corps(false, null, [{ id: sousTacheAutreTache.id, isCompleted: true }]),
      );

      const rows = await work_day_sub_task.findAll({
        where: { workDayTaskId: assignation.id },
      });
      expect(rows).toHaveLength(1);
      expect(rows[0].subTaskId).toBe(sousTache.id);
      expect(rows[0].isCompleted).toBe(false);
    });

    describe("GET /api/task/occurrences/:id", function () {
      it("retourne les occurrences liées à une tâche", async function () {
        const response = await request(app)
          .get(`/api/task/occurrences/${tache.id}`)
          .set("Authorization", "Bearer " + token);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(1);

        expect(response.body.data[0]).toMatchObject({
          id: occurrence.id,
          tacheId: tache.id,
          journee: "lundi",
          heureDebut: "08:00:00",
          heureFin: "09:00:00",
          taskPriorityId: priorite.id,
        });

        expect(
          response.body.data.some((item) => item.id === autreOccurrence.id),
        ).toBe(false);
      });

      it("retourne une liste vide si la tâche ne possède aucune occurrence", async function () {
        await work_day_task.destroy({
          where: { occurrenceId: occurrence.id },
        });

        await occurrence_de_tache.destroy({
          where: { id: occurrence.id },
        });

        const response = await request(app)
          .get(`/api/task/occurrences/${tache.id}`)
          .set("Authorization", "Bearer " + token);

        expect(response.status).toBe(200);
        expect(response.body.data).toHaveLength(0);
      });

      it("retourne 404 si la tâche n'existe pas", async function () {
        const response = await request(app)
          .get("/api/task/occurrences/999999")
          .set("Authorization", "Bearer " + token);

        expect(response.status).toBe(404);
        expect(response.body.message).toBe("Tâche introuvable");
      });
    });
  });
});
