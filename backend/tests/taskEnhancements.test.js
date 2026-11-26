import { describe, expect, it, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import jwt from "jsonwebtoken";
import bd from "../models/bd.mjs";
import {
  Task,
  TaskImage,
  TaskDocument,
  TaskLink,
  Compte,
  occurrence_de_tache,
  sous_tache,
  task_priority,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import { todayString } from "../utils/dateHelpers.mjs";
import app from "../app.mjs";

describe("Tests des améliorations des tâches (PDF, liens externes et priorités dynamiques)", () => {
  let prioriteImportante, prioriteNormale, prioriteLibre;
  let employe, token;

  async function cleanDatabase() {
    await work_day_sub_task.destroy({ where: {} });
    await work_day_task.destroy({ where: {} });
    await work_day.destroy({ where: {} });
    await occurrence_de_tache.destroy({ where: {} });
    await sous_tache.destroy({ where: {} });
    await TaskImage.destroy({ where: {} });
    await TaskDocument.destroy({ where: {} });
    await TaskLink.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await task_priority.destroy({ where: {} });
    await Compte.destroy({ where: {} });
  }

  beforeAll(async () => {
    await bd.authenticate();
  });

  beforeEach(async () => {
    await cleanDatabase();

    prioriteImportante = await task_priority.create({
      task_priority: "Important",
      weigth: 1,
    });
    prioriteNormale = await task_priority.create({
      task_priority: "Normale",
      weigth: 2,
    });
    prioriteLibre = await task_priority.create({
      task_priority: "Libre",
      weigth: 3,
    });

    employe = await Compte.create({
      prenom: "Alex",
      nom: "employe",
      courriel: "alex.pdf.test@example.com",
      motDePasse: "password123",
    });

    token = jwt.sign(
      { id: employe.id, role: employe.role },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );
  });

  afterAll(async () => {
    await cleanDatabase();
    await bd.close();
  });

  describe("1. Documents PDF et Liens externes", () => {
    it("permet de téléverser un document PDF et de le récupérer avec la tâche", async () => {
      const pdfBuffer = Buffer.from("%PDF-1.4 contenu de test");
      const occurrences = JSON.stringify([
        {
          journee: "lundi",
          heureDebut: "08:00",
          heureFin: "09:00",
          taskPriorityId: prioriteImportante.id,
          isRequired: true,
        },
      ]);

      const response = await request(app)
        .post("/api/task/add")
        .field("title", "Tâche avec PDF")
        .field("room", "Local 201")
        .field("description", "Lire le protocole PDF")
        .field("taskPriorityId", String(prioriteImportante.id))
        .field("occurrences", occurrences)
        .attach("documents", pdfBuffer, {
          filename: "protocole.pdf",
          contentType: "application/pdf",
        });

      expect(response.status).toBe(201);
      expect(response.body.data.documents).toHaveLength(1);
      expect(response.body.data.documents[0]).toMatchObject({
        filename: "protocole.pdf",
        mimeType: "application/pdf",
      });
      expect(response.body.data.documents[0].path).toContain("protocole.pdf");

      const listResponse = await request(app).get("/api/task/list");
      expect(listResponse.status).toBe(200);
      expect(listResponse.body.data).toHaveLength(1);
      expect(listResponse.body.data[0].documents).toHaveLength(1);
      expect(listResponse.body.data[0].documents[0].filename).toBe("protocole.pdf");
    });

    it("permet d'ajouter un ou plusieurs liens externes et valide leur association à la tâche", async () => {
      const externalLinks = [
        { title: "Guide sécurité", url: "https://example.com/securite.pdf" },
        { title: "Procédure équipement", url: "https://example.com/equipement" },
      ];

      const response = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche avec liens externes",
          room: "Gymnase",
          taskPriorityId: prioriteLibre.id,
          externalLinks: JSON.stringify(externalLinks),
          documents: JSON.stringify([
            {
              filename: "manuel-integre.pdf",
              path: "https://example.com/manuel-integre.pdf",
            },
          ]),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.externalLinks).toHaveLength(2);
      expect(response.body.data.externalLinks).toEqual(
        expect.arrayContaining([
          expect.objectContaining({
            title: "Guide sécurité",
            url: "https://example.com/securite.pdf",
          }),
          expect.objectContaining({
            title: "Procédure équipement",
            url: "https://example.com/equipement",
          }),
        ])
      );
      expect(response.body.data.documents).toHaveLength(1);
      expect(response.body.data.documents[0].filename).toBe("manuel-integre.pdf");
    });

    it("isole correctement les documents et liens externes entre différentes tâches et les retourne à l'employé", async () => {
      const resTask1 = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche 1",
          room: "Salle A",
          taskPriorityId: prioriteNormale.id,
          occurrences: JSON.stringify([
            { journee: "mardi", taskPriorityId: prioriteNormale.id },
          ]),
          documents: JSON.stringify([
            { filename: "doc1.pdf", path: "https://example.com/doc1.pdf" },
          ]),
          externalLinks: JSON.stringify([
            { title: "Lien 1", url: "https://example.com/lien1" },
          ]),
        });

      const resTask2 = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche 2",
          room: "Salle B",
          taskPriorityId: prioriteLibre.id,
          documents: JSON.stringify([
            { filename: "doc2.pdf", path: "https://example.com/doc2.pdf" },
          ]),
          externalLinks: JSON.stringify([
            { title: "Lien 2", url: "https://example.com/lien2" },
          ]),
        });

      expect(resTask1.status).toBe(201);
      expect(resTask2.status).toBe(201);

      const task1 = resTask1.body.data;
      const task2 = resTask2.body.data;

      expect(task1.documents).toHaveLength(1);
      expect(task1.documents[0].filename).toBe("doc1.pdf");
      expect(task2.documents).toHaveLength(1);
      expect(task2.documents[0].filename).toBe("doc2.pdf");

      const journee = await work_day.create({
        accountId: employe.id,
        date: todayString(),
      });
      await work_day_task.create({
        workDayId: journee.id,
        taskId: task1.id,
        occurrenceId: task1.occurrences[0].id,
      });

      const mineResponse = await request(app)
        .get("/api/task/mine")
        .set("Authorization", `Bearer ${token}`);

      expect(mineResponse.status).toBe(200);
      expect(mineResponse.body.data).toHaveLength(1);
      expect(mineResponse.body.data[0].documents).toHaveLength(1);
      expect(mineResponse.body.data[0].documents[0].filename).toBe("doc1.pdf");
      expect(mineResponse.body.data[0].externalLinks).toHaveLength(1);
      expect(mineResponse.body.data[0].externalLinks[0].url).toBe("https://example.com/lien1");
    });

    it("permet de modifier les documents PDF et les liens externes d'une tâche existante", async () => {
      const createRes = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche à modifier",
          room: "Local 303",
          taskPriorityId: prioriteLibre.id,
          documents: JSON.stringify([
            { filename: "ancien.pdf", path: "https://example.com/ancien.pdf" },
          ]),
          externalLinks: JSON.stringify([
            { title: "Ancien lien", url: "https://example.com/ancien" },
          ]),
        });

      const taskId = createRes.body.data.id;

      const updateRes = await request(app)
        .put(`/api/task/${taskId}`)
        .field("title", "Tâche modifiée")
        .field("room", "Local 303")
        .field("taskPriorityId", String(prioriteLibre.id))
        .field("existingDocumentIds", JSON.stringify([]))
        .field(
          "externalLinks",
          JSON.stringify([{ title: "Nouveau lien", url: "https://example.com/nouveau" }])
        )
        .attach("documents", Buffer.from("%PDF-1.4 nouveau"), {
          filename: "nouveau.pdf",
          contentType: "application/pdf",
        });

      expect(updateRes.status).toBe(200);
      expect(updateRes.body.data.documents).toHaveLength(1);
      expect(updateRes.body.data.documents[0].filename).toBe("nouveau.pdf");
      expect(updateRes.body.data.externalLinks).toHaveLength(1);
      expect(updateRes.body.data.externalLinks[0].url).toBe("https://example.com/nouveau");
    });

    it("rejette un fichier document non-PDF et une URL externe invalide avec le code 400", async () => {
      const invalidFileRes = await request(app)
        .post("/api/task/add")
        .field("title", "Tâche fichier invalide")
        .field("room", "Local 100")
        .field("taskPriorityId", String(prioriteLibre.id))
        .attach("documents", Buffer.from("pas un pdf"), {
          filename: "script.exe",
          contentType: "application/octet-stream",
        });

      expect(invalidFileRes.status).toBe(400);

      const invalidLinkRes = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche lien invalide",
          room: "Local 100",
          taskPriorityId: prioriteLibre.id,
          externalLinks: JSON.stringify([{ title: "Lien cassé", url: "ftp://invalide" }]),
        });

      expect(invalidLinkRes.status).toBe(400);
    });
  });

  describe("2. Gestion dynamique des occurrences selon la priorité", () => {
    it("permet de créer une tâche avec la priorité au poids le plus faible sans occurrences", async () => {
      const response = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche libre sans horaire",
          room: "Entrepôt",
          taskPriorityId: prioriteLibre.id,
          occurrences: JSON.stringify([]),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.taskPriorityId).toBe(prioriteLibre.id);
      expect(response.body.data.occurrences).toHaveLength(0);
    });

    it("conserve les occurrences fournies si la priorité la plus faible est sélectionnée et hérite de la priorité globale par défaut", async () => {
      const response = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche libre avec occurrences",
          room: "Entrepôt B",
          taskPriorityId: prioriteLibre.id,
          occurrences: JSON.stringify([
            {
              journee: "jeudi",
              heureDebut: "10:00",
              heureFin: "11:00",
            },
          ]),
        });

      expect(response.status).toBe(201);
      expect(response.body.data.occurrences).toHaveLength(1);
      expect(response.body.data.occurrences[0].taskPriorityId).toBe(prioriteLibre.id);

      const dbCount = await occurrence_de_tache.count({
        where: { tacheId: response.body.data.id },
      });
      expect(dbCount).toBe(1);
    });

    it("exige au moins une occurrence lorsque la priorité n'est pas la plus faible", async () => {
      const failResponse = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche importante sans occurrence",
          room: "Bureau 101",
          taskPriorityId: prioriteImportante.id,
          occurrences: JSON.stringify([]),
        });

      expect(failResponse.status).toBe(400);

      const successResponse = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche importante avec occurrence",
          room: "Bureau 101",
          taskPriorityId: prioriteImportante.id,
          occurrences: JSON.stringify([
            {
              journee: "vendredi",
              heureDebut: "14:00",
              heureFin: "15:00",
              taskPriorityId: prioriteImportante.id,
            },
          ]),
        });

      expect(successResponse.status).toBe(201);
      expect(successResponse.body.data.occurrences).toHaveLength(1);
    });

    it("s'adapte dynamiquement lorsque les poids des priorités changent", async () => {
      // On change le poids de 'Normale' à 10 (elle devient la priorité la plus faible)
      await request(app)
        .put(`/api/task_priority/${prioriteNormale.id}`)
        .send({ task_priority: "Normale", weigth: 10 });

      // Désormais 'Libre' (poids 3) n'est plus la plus faible -> exige une occurrence
      const libreWithoutOcc = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche Libre devenue moyenne",
          room: "Salle 1",
          taskPriorityId: prioriteLibre.id,
          occurrences: JSON.stringify([]),
        });
      expect(libreWithoutOcc.status).toBe(400);

      // 'Normale' (poids 10) est maintenant la plus faible -> aucune occurrence requise
      const normaleWithoutOcc = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche Normale devenue plus faible",
          room: "Salle 2",
          taskPriorityId: prioriteNormale.id,
          occurrences: JSON.stringify([]),
        });
      expect(normaleWithoutOcc.status).toBe(201);
      expect(normaleWithoutOcc.body.data.occurrences).toHaveLength(0);
    });

    it("conserve les occurrences existantes et leurs priorités lorsqu'une tâche passe à la priorité la plus faible", async () => {
      const createRes = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche évolutive",
          room: "Salle C",
          taskPriorityId: prioriteImportante.id,
          occurrences: JSON.stringify([
            {
              journee: "lundi",
              heureDebut: "09:00",
              heureFin: "10:00",
              taskPriorityId: prioriteImportante.id,
            },
          ]),
        });

      expect(createRes.status).toBe(201);
      const taskId = createRes.body.data.id;
      const occId = createRes.body.data.occurrences[0].id;
      expect(createRes.body.data.occurrences).toHaveLength(1);

      const updateToLowestRes = await request(app)
        .put(`/api/task/${taskId}`)
        .send({
          title: "Tâche évolutive",
          room: "Salle C",
          taskPriorityId: prioriteLibre.id,
          occurrences: JSON.stringify([
            {
              id: occId,
              journee: "lundi",
              heureDebut: "09:00",
              heureFin: "10:00",
              taskPriorityId: prioriteImportante.id,
            },
          ]),
        });

      expect(updateToLowestRes.status).toBe(200);
      expect(updateToLowestRes.body.data.taskPriorityId).toBe(prioriteLibre.id);
      expect(updateToLowestRes.body.data.occurrences).toHaveLength(1);
      expect(updateToLowestRes.body.data.occurrences[0].taskPriorityId).toBe(
        prioriteImportante.id,
      );

      const remainingCount = await occurrence_de_tache.count({ where: { tacheId: taskId } });
      expect(remainingCount).toBe(1);
    });
  });

  describe("3. Suppression des sous-tâches et occurrences liées à des journées de travail", () => {
    it("supprime une ou plusieurs sous-tâches et occurrences sans erreur 500 ni duplication et sans affecter les autres tâches", async () => {
      const resT1 = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche avec suppressions",
          room: "Salle D",
          taskPriorityId: prioriteImportante.id,
          occurrences: JSON.stringify([
            { journee: "lundi", heureDebut: "08:00", heureFin: "09:00", taskPriorityId: prioriteImportante.id },
            { journee: "mardi", heureDebut: "10:00", heureFin: "11:00", taskPriorityId: prioriteImportante.id },
            { journee: "mercredi", heureDebut: "12:00", heureFin: "13:00", taskPriorityId: prioriteImportante.id },
          ]),
          subTasks: JSON.stringify([
            { titre: "Sous-tâche 1" },
            { titre: "Sous-tâche 2" },
            { titre: "Sous-tâche 3" },
          ]),
        });
      expect(resT1.status).toBe(201);
      const t1 = resT1.body.data;

      const resOther = await request(app)
        .post("/api/task/add")
        .send({
          title: "Tâche non liée",
          room: "Salle E",
          taskPriorityId: prioriteNormale.id,
          occurrences: JSON.stringify([
            { journee: "jeudi", taskPriorityId: prioriteNormale.id },
          ]),
          subTasks: JSON.stringify([{ titre: "Sous-tâche intacte" }]),
        });
      expect(resOther.status).toBe(201);
      const otherTask = resOther.body.data;

      const wd = await work_day.create({ accountId: employe.id, date: todayString() });
      const wdt1 = await work_day_task.create({
        workDayId: wd.id,
        taskId: t1.id,
        occurrenceId: t1.occurrences[0].id,
      });
      const wdt2 = await work_day_task.create({
        workDayId: wd.id,
        taskId: t1.id,
        occurrenceId: t1.occurrences[1].id,
      });
      await work_day_sub_task.create({ workDayTaskId: wdt1.id, subTaskId: t1.sous_taches[0].id });
      await work_day_sub_task.create({ workDayTaskId: wdt2.id, subTaskId: t1.sous_taches[1].id });

      // Suppression d'une sous-tâche et d'une occurrence référencées
      const singleDeleteRes = await request(app)
        .put(`/api/task/${t1.id}`)
        .send({
          title: t1.title,
          room: t1.room,
          taskPriorityId: prioriteImportante.id,
          occurrences: JSON.stringify(t1.occurrences.slice(1)),
          subTasks: JSON.stringify(t1.sous_taches.slice(1)),
        });

      expect(singleDeleteRes.status).toBe(200);
      expect(singleDeleteRes.body.data.occurrences).toHaveLength(2);
      expect(singleDeleteRes.body.data.sous_taches).toHaveLength(2);
      expect(await work_day_task.findByPk(wdt1.id)).toBeNull();

      // Suppression multiple des occurrences et sous-tâches restantes (passage à Libre)
      const multiDeleteRes = await request(app)
        .put(`/api/task/${t1.id}`)
        .send({
          title: t1.title,
          room: t1.room,
          taskPriorityId: prioriteLibre.id,
          occurrences: JSON.stringify([]),
          subTasks: JSON.stringify([]),
        });

      expect(multiDeleteRes.status).toBe(200);
      expect(multiDeleteRes.body.data.occurrences).toHaveLength(0);
      expect(multiDeleteRes.body.data.sous_taches).toHaveLength(0);
      expect(await work_day_task.count({ where: { taskId: t1.id } })).toBe(0);
      expect(await work_day_sub_task.count({ where: { workDayTaskId: [wdt1.id, wdt2.id] } })).toBe(0);

      // La tâche non liée reste intacte
      expect(await occurrence_de_tache.count({ where: { tacheId: otherTask.id } })).toBe(1);
      expect(await sous_tache.count({ where: { tacheId: otherTask.id } })).toBe(1);
    });

    it("retourne 400 ou 404 pour un identifiant de tâche invalide ou inexistant lors de la mise à jour", async () => {
      const invalidRes = await request(app)
        .put("/api/task/abc")
        .send({ title: "X", room: "Y" });
      expect(invalidRes.status).toBe(400);

      const notFoundRes = await request(app)
        .put("/api/task/999999")
        .send({ title: "X", room: "Y" });
      expect(notFoundRes.status).toBe(404);
    });
  });
});