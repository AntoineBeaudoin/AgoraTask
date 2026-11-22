import { describe, test, expect, vi } from "vitest";
import { creerAssignService, jourDeSemaine, choisirOccurrence } from "../Middleware/assignUtils.mjs";

function contexte() {
  const modele = () => ({
    findAll: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    findOrCreate: vi.fn(),
    findByPk: vi.fn(),
    create: vi.fn(),
    destroy: vi.fn(),
    bulkCreate: vi.fn(),
  });
  const models = {
    Compte: modele(), Poste: modele(), Task: modele(), occurrence_de_tache: modele(),
    sous_tache: modele(), task_priority: modele(), work_day: modele(),
    work_day_task: modele(), work_day_sub_task: modele(),
  };
  const bd = { transaction: vi.fn((fn) => fn({ tx: true })) };
  const Op = { in: Symbol("in"), ne: Symbol("ne"), or: Symbol("or") };
  return { models, bd, Op, service: creerAssignService({ models, bd, Op }) };
}

function employeAvecTache() {
  return [{ id: 5, poste: { tasks: [{
    id: 10,
    occurrences: [{ id: 20, journee: "mercredi", heureDebut: "08:00:00" }],
    sous_taches: [{ id: 31 }, { id: 32 }],
  }] } }];
}

function preparerCreation(models) {
  models.work_day.findOrCreate.mockResolvedValue([{ id: 100 }, true]);
  models.work_day_task.findOne.mockResolvedValue(null);
  models.work_day_task.create.mockResolvedValue({ id: 200 });
}

describe("assignUtils — règles métiers isolées", () => {
  test("calcule correctement le jour de la semaine", () => {
    expect(jourDeSemaine("2026-11-18")).toBe("mercredi");
  });

  test("choisit l'occurrence la plus tôt", () => {
    expect(choisirOccurrence([
      { id: 2, heureDebut: "12:00:00" },
      { id: 1, heureDebut: "08:00:00" },
    ]).id).toBe(1);
  });

  test("n'assigne rien si la tâche n'a pas d'occurrence du jour", async () => {
    const { models, service } = contexte();
    models.Compte.findAll.mockResolvedValue([{ id: 5, poste: { tasks: [
      { id: 10, occurrences: [{ id: 1, journee: null }], sous_taches: [] },
    ] } }]);
    await service.assignerAutomatiquement("2026-11-18");
    expect(models.work_day.findOrCreate).not.toHaveBeenCalled();
  });

  test("supprime les anciennes sous-tâches automatiques avant les anciennes tâches automatiques", async () => {
    const { models, service, Op } = contexte();
    models.work_day.findAll.mockResolvedValue([{ id: 100 }]);
    models.work_day_task.findAll.mockResolvedValue([{ id: 200 }]);
    await service.assignerAutomatiquement("2026-11-18");
    expect(models.work_day_task.destroy).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: { [Op.in]: [200] }, isAutomatic: true },
    }));
    expect(models.work_day_sub_task.destroy.mock.invocationCallOrder[0])
      .toBeLessThan(models.work_day_task.destroy.mock.invocationCallOrder[0]);
  });

  test("préserve les assignations manuelles pendant la régénération", async () => {
    const { models, service } = contexte();
    models.work_day.findAll.mockResolvedValue([{ id: 100 }]);
    models.work_day_task.findAll.mockResolvedValue([]); // aucune affectation automatique
    await service.assignerAutomatiquement("2026-11-18");
    expect(models.work_day_task.findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ isAutomatic: true }),
    }));
    expect(models.work_day_task.destroy).not.toHaveBeenCalled();
  });

  test("l'assignation automatique crée une tâche marquée isAutomatic=true", async () => {
    const { models, service } = contexte();
    models.Compte.findAll.mockResolvedValue(employeAvecTache());
    preparerCreation(models);
    await service.assignerAutomatiquement("2026-11-18");
    expect(models.work_day_task.create).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 10, occurrenceId: 20, isAutomatic: true }),
      expect.any(Object),
    );
  });

  test("l'assignation automatique instancie les sous-tâches", async () => {
    const { models, service } = contexte();
    models.Compte.findAll.mockResolvedValue(employeAvecTache());
    preparerCreation(models);
    await service.assignerAutomatiquement("2026-11-18");
    expect(models.work_day_sub_task.bulkCreate).toHaveBeenCalledWith([
      { workDayTaskId: 200, subTaskId: 31, isCompleted: false },
      { workDayTaskId: 200, subTaskId: 32, isCompleted: false },
    ], expect.any(Object));
  });

  test("l'assignation manuelle refuse une occurrence d'un autre jour", async () => {
    const { models, service } = contexte();
    models.Compte.findOne.mockResolvedValue({ id: 5 });
    models.Task.findOne.mockResolvedValue({ id: 10 });
    models.occurrence_de_tache.findOne.mockResolvedValue({ id: 20, journee: "lundi" });
    await expect(service.assignerManuellement({ date: "2026-11-18", accountId: 5, taskId: 10, occurrenceId: 20 }))
      .rejects.toMatchObject({ statusCode: 400 });
  });

  test("l'assignation manuelle est créée avec isAutomatic=false", async () => {
    const { models, service } = contexte();
    models.Compte.findOne.mockResolvedValue({ id: 5 });
    models.Task.findOne.mockResolvedValue({ id: 10 });
    models.occurrence_de_tache.findOne.mockResolvedValue({ id: 20, journee: null });
    preparerCreation(models);
    await service.assignerManuellement({ date: "2026-11-18", accountId: 5, taskId: 10, occurrenceId: 20 });
    expect(models.work_day_task.create).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 10, isAutomatic: false }), expect.any(Object),
    );
  });
});
