import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import bd from "../models/bd.mjs";
import { Task, occurrence_de_tache, task_priority } from "../models/bd_index.mjs";
import app from "../app.mjs";

describe("Tests en lien avec les priorités de tâches (task_priority)", () => {
  beforeAll(async () => {
    await bd.authenticate();
  });

  beforeEach(async () => {
    await occurrence_de_tache.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await task_priority.destroy({ where: {} });
  });

  afterAll(async () => {
    await bd.close();
  });

  it("crée et récupère une priorité de tâche", async () => {
    const createResponse = await request(app)
      .post("/api/task_priority/add")
      .send({
        task_priority: "Important",
        weigth: 1,
      });

    expect(createResponse.status).toBe(201);
    expect(createResponse.body.data).toMatchObject({
      task_priority: "Important",
      weigth: 1,
    });

    const listResponse = await request(app).get("/api/task_priority/list");
    expect(listResponse.status).toBe(200);
    expect(listResponse.body.data).toHaveLength(1);
    expect(listResponse.body.data[0].task_priority).toBe("Important");
  });

  it("modifie une priorité existante et empêche la suppression si elle est liée à une occurrence", async () => {
    const priority = await task_priority.create({
      task_priority: "Normale",
      weigth: 2,
    });

    const updateResponse = await request(app)
      .put(`/api/task_priority/${priority.id}`)
      .send({
        task_priority: "Priorité modifiée",
        weigth: 3,
      });

    expect(updateResponse.status).toBe(200);
    expect(updateResponse.body.data.task_priority).toBe("Priorité modifiée");
    expect(updateResponse.body.data.weigth).toBe(3);

    const task = await Task.create({
      title: "Tâche liée",
      room: "Local 101",
    });

    const occurrence = await occurrence_de_tache.create({
      tacheId: task.id,
      journee: "lundi",
      taskPriorityId: priority.id,
    });

    const blockedDeleteResponse = await request(app).delete(
      `/api/task_priority/${priority.id}`
    );
    expect(blockedDeleteResponse.status).toBe(409);

    await occurrence.destroy();

    const allowedDeleteResponse = await request(app).delete(
      `/api/task_priority/${priority.id}`
    );
    expect(allowedDeleteResponse.status).toBe(204);
  });
});
