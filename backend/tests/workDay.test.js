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
  Compte,
  Task,
  occurrence_de_tache,
  sous_tache,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import app from "../app.mjs";

describe("Tests en lien avec les journées de travail", function () {
  const DATE = "2026-11-12";
  let employe, autreEmploye, token, tache, occurrence, sousTache;
  let day, autreDay, work_day_task, work_day_sub_task;

  function mine(date) {
    return request(app)
      .get("/api/work_day/mine" + (date ? "?date=" + date : ""))
      .set("Authorization", "Bearer " + token);
  }

  function save(id, body) {
    return request(app)
      .patch("/api/work_day/" + id)
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
      courriel: "employe.work_day.vitest@example.com",
      motDePasse: "password123",
    });
    autreEmploye = await Compte.create({
      prenom: "Marie",
      nom: "Test",
      courriel: "autre.work_day.vitest@example.com",
      motDePasse: "password123",
    });
    token = jwt.sign(
      { id: employe.id, role: employe.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    tache = await Task.create({ title: "Vitest tâche journée", room: "A-101" });
    occurrence = await occurrence_de_tache.create({
      tacheId: tache.id,
      journee: "lundi",
      heureDebut: "08:00",
      heureFin: "09:00",
      priorite: 3,
    });
    sousTache = await sous_tache.create({
      tacheId: tache.id,
      titre: "Vitest sous-tâche",
    });

    day = await work_day.create({ accountId: employe.id, date: DATE });
    autreDay = await work_day.create({
      accountId: autreEmploye.id,
      date: DATE,
    });
    work_day_task = await work_day_task.create({
      work_dayId: day.id,
      taskId: tache.id,
      occurrenceId: occurrence.id,
    });
    work_day_sub_task = await work_day_sub_task.create({
      work_day_taskId: work_day_task.id,
      subTaskId: sousTache.id,
    });
  });

  afterEach(async function () {
    if (!day || !autreDay) return;
    const dayIds = [day.id, autreDay.id];
    const tasks = await work_day_task.findAll({
      where: { work_dayId: dayIds },
    });
    const taskIds = tasks.map(function (t) {
      return t.id;
    });
    await work_day_sub_task.destroy({ where: { work_day_taskId: taskIds } });
    await work_day_task.destroy({ where: { work_dayId: dayIds } });
    await work_day.destroy({ where: { id: dayIds } });
    await sous_tache.destroy({ where: { id: sousTache.id } });
    await occurrence_de_tache.destroy({ where: { id: occurrence.id } });
    await Task.destroy({ where: { id: tache.id } });
    await Compte.destroy({ where: { id: [employe.id, autreEmploye.id] } });
  });

  afterAll(async function () {
    await bd.close();
  });

  it("refuse une requête sans token", async function () {
    const response = await request(app).get("/api/work_day/mine?date=" + DATE);
    expect(response.status).toBe(401);
  });

  it("refuse une requête sans date valide", async function () {
    const response = await mine();
    expect(response.status).toBe(400);
  });

  it("retourne 404 quand il n'y a pas de journée pour cette date", async function () {
    const response = await mine("2026-01-01");
    expect(response.status).toBe(404);
  });

  it("retourne la journée avec les trois niveaux de commentaires", async function () {
    await day.update({ comment: "Note du jour" });
    await work_day_task.update({ comment: "Note de tâche" });
    await work_day_sub_task.update({ comment: "Note de sous-tâche" });

    const response = await mine(DATE);
    expect(response.status).toBe(200);
    expect(response.body.data.comment).toBe("Note du jour");
    expect(response.body.data.tasks).toHaveLength(1);
    expect(response.body.data.tasks[0].comment).toBe("Note de tâche");
    expect(response.body.data.tasks[0].subTasks[0].comment).toBe(
      "Note de sous-tâche",
    );
  });

  it("enregistre la progression et les commentaires des trois niveaux", async function () {
    const response = await save(day.id, {
      comment: "  Journée calme  ",
      tasks: [
        {
          id: work_day_task.id,
          isCompleted: true,
          comment: "Fait",
          subTasks: [
            {
              id: work_day_sub_task.id,
              isCompleted: true,
              comment: "Filtre changé",
            },
          ],
        },
      ],
    });
    expect(response.status).toBe(200);

    await day.reload();
    await work_day_task.reload();
    await work_day_sub_task.reload();
    expect(day.comment).toBe("Journée calme");
    expect(work_day_task.isCompleted).toBe(true);
    expect(work_day_task.comment).toBe("Fait");
    expect(work_day_sub_task.isCompleted).toBe(true);
    expect(work_day_sub_task.comment).toBe("Filtre changé");
  });

  it("limite les commentaires à 1000 caractères", async function () {
    await save(day.id, { comment: "a".repeat(1500) });
    await day.reload();
    expect(day.comment).toHaveLength(1000);
  });

  it("ne supprime pas un commentaire absent de la requête", async function () {
    await work_day_task.update({ comment: "À garder" });
    await save(day.id, {
      tasks: [{ id: work_day_task.id, isCompleted: true }],
    });

    await work_day_task.reload();
    expect(work_day_task.isCompleted).toBe(true);
    expect(work_day_task.comment).toBe("À garder");
  });

  it("refuse les modifications après la soumission", async function () {
    const submitted = await save(day.id, { submit: true });
    expect(submitted.status).toBe(200);
    await day.reload();
    expect(day.isSubmitted).toBe(true);

    const late = await save(day.id, { comment: "Trop tard" });
    expect(late.status).toBe(409);
    await day.reload();
    expect(day.comment).toBeNull();
  });

  it("refuse de modifier la journée d'un autre compte", async function () {
    const response = await save(autreDay.id, { comment: "Piraté" });
    expect(response.status).toBe(404);

    await autreDay.reload();
    expect(autreDay.comment).toBeNull();
  });
});
