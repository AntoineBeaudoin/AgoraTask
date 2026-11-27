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
  task_priority,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import app from "../app.mjs";

describe("Tests en lien avec les journées de travail", function () {
  const DATE = "2026-11-12";
  const EMAIL_EMPLOYE = "employe.work_day.vitest@example.com";
  const EMAIL_AUTRE = "autre.work_day.vitest@example.com";
  const TITRE_TACHE = "Vitest tâche journée";

  let employe, autreEmploye, token, tache, priorite, occurrence, sousTache;
  let day, autreDay, dayTask, daySubTask;

  function mine(date) {
    return request(app)
      .get("/api/work_day/mine" + (date ? "?date=" + date : ""))
      .set("Authorization", "Bearer " + token);
  }

  async function submit(id, body = {}) {
    return request(app)
      .post(`/api/work_day/submit/${id}`)
      .set("Authorization", `Bearer ${token}`)
      .send(body);
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
    await Compte.destroy({ where: { courriel: [EMAIL_EMPLOYE, EMAIL_AUTRE] } });
    await Task.destroy({ where: { title: TITRE_TACHE } });

    employe = await Compte.create({
      prenom: "Jean",
      nom: "Test",
      courriel: EMAIL_EMPLOYE,
      motDePasse: "password123",
    });
    autreEmploye = await Compte.create({
      prenom: "Marie",
      nom: "Test",
      courriel: EMAIL_AUTRE,
      motDePasse: "password123",
    });
    token = jwt.sign(
      { id: employe.id, role: employe.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" },
    );

    tache = await Task.create({ title: TITRE_TACHE, room: "A-101" });
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
    sousTache = await sous_tache.create({
      tacheId: tache.id,
      titre: "Vitest sous-tâche",
    });

    day = await work_day.create({ accountId: employe.id, date: DATE });
    autreDay = await work_day.create({
      accountId: autreEmploye.id,
      date: DATE,
    });
    dayTask = await work_day_task.create({
      workDayId: day.id,
      taskId: tache.id,
      occurrenceId: occurrence.id,
    });
    daySubTask = await work_day_sub_task.create({
      workDayTaskId: dayTask.id,
      subTaskId: sousTache.id,
    });
  });

  afterEach(async function () {
    const dayIds = [day, autreDay].filter(Boolean).map((d) => d.id);
    if (dayIds.length > 0) {
      const tasks = await work_day_task.findAll({
        where: { workDayId: dayIds },
      });
      const taskIds = tasks.map((t) => t.id);
      if (taskIds.length > 0) {
        await work_day_sub_task.destroy({ where: { workDayTaskId: taskIds } });
      }
      await work_day_task.destroy({ where: { workDayId: dayIds } });
      await work_day.destroy({ where: { id: dayIds } });
    }
    if (sousTache) await sous_tache.destroy({ where: { id: sousTache.id } });
    if (occurrence) {
      await occurrence_de_tache.destroy({ where: { id: occurrence.id } });
    }
    if (priorite) await task_priority.destroy({ where: { id: priorite.id } });
    if (tache) await Task.destroy({ where: { id: tache.id } });
    const compteIds = [employe, autreEmploye].filter(Boolean).map((c) => c.id);
    if (compteIds.length > 0) {
      await Compte.destroy({ where: { id: compteIds } });
    }

    employe = autreEmploye = tache = priorite = occurrence = sousTache = undefined;
    day = autreDay = dayTask = daySubTask = undefined;
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
    await dayTask.update({ comment: "Note de tâche" });
    await daySubTask.update({ comment: "Note de sous-tâche" });

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
          id: dayTask.id,
          isCompleted: true,
          comment: "Fait",
          subTasks: [
            {
              id: daySubTask.id,
              isCompleted: true,
              comment: "Filtre changé",
            },
          ],
        },
      ],
    });
    expect(response.status).toBe(200);

    await day.reload();
    await dayTask.reload();
    await daySubTask.reload();
    expect(day.comment).toBe("Journée calme");
    expect(dayTask.isCompleted).toBe(true);
    expect(dayTask.comment).toBe("Fait");
    expect(daySubTask.isCompleted).toBe(true);
    expect(daySubTask.comment).toBe("Filtre changé");
  });

  it("ne supprime pas un commentaire absent de la requête", async function () {
    await dayTask.update({ comment: "À garder" });
    await save(day.id, {
      tasks: [{ id: dayTask.id, isCompleted: true }],
    });

    await dayTask.reload();
    expect(dayTask.isCompleted).toBe(true);
    expect(dayTask.comment).toBe("À garder");
  });

  it("refuse les modifications après la soumission", async function () {
    const submitted = await submit(day.id, {
      tasks: [
        {
          id: dayTask.id,
          isCompleted: true,
          subTasks: [
            {
              id: daySubTask.id,
              isCompleted: true,
            },
          ],
        },
      ],
    });

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