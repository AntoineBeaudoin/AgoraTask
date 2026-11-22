import { describe, test, expect, vi } from 'vitest';
import {
  creerAssignService, jourDeSemaine, choisirOccurrence,
  horairesSeChevauchent, horairesParPriorite, plageHoraire,
} from '../utils/assignUtils.mjs';

function contexte() {
  const modele = () => ({
    findAll: vi.fn().mockResolvedValue([]),
    findOne: vi.fn().mockResolvedValue(null),
    findOrCreate: vi.fn().mockResolvedValue([{ id: 100 }, true]),
    findByPk: vi.fn().mockResolvedValue(null),
    create: vi.fn(), destroy: vi.fn(), bulkCreate: vi.fn(),
  });
  const models = {
    Compte: modele(), Poste: modele(), Task: modele(), occurrence_de_tache: modele(),
    sous_tache: modele(), task_priority: modele(), work_day: modele(),
    work_day_task: modele(), work_day_sub_task: modele(),
  };
  models.work_day_task.create.mockResolvedValue({ id: 200 });
  const transaction = { id: 'tx', LOCK: { UPDATE: 'UPDATE' } };
  const bd = { transaction: vi.fn((callback) => callback(transaction)) };
  const Op = { in: Symbol('in'), ne: Symbol('ne') };
  return { models, bd, Op, transaction, service: creerAssignService({ models, bd, Op }) };
}

const lundi = { id: 20, tacheId: 10, journee: 'lundi', heureDebut: '08:00:00', heureFin: '09:00:00' };
const mercredi = { id: 21, tacheId: 10, journee: 'mercredi', heureDebut: '10:00:00', heureFin: '11:00:00' };
const libre = { id: 22, tacheId: 10, journee: null, heureDebut: '12:00:00', heureFin: '13:00:00' };
const demande = { date: '2026-11-18', accountId: 5, taskId: 10, occurrenceId: 21 };

function preparerManuel(models, { role = 'personnel_de_terrain', horaire = mercredi } = {}) {
  models.Compte.findOne.mockResolvedValue({ id: 5, role });
  models.Task.findOne.mockResolvedValue({ id: 10, taskPriorityId: 3 });
  models.occurrence_de_tache.findOne.mockResolvedValue(horaire);
}
function employesDuPoste(horaires = [lundi, mercredi, libre]) {
  return [{ id: 5, role: 'personnel_de_terrain', poste: { tasks: [
    { id: 10, occurrences: horaires, sous_taches: [{ id: 31 }, { id: 32 }] },
  ] } }];
}
function conflit(horaire, id = 70) {
  return { id, taskId: 10, workDayId: 100, occurrence: horaire };
}

describe('Horaires : fonctions pures', () => {
  test('identifie le jour ISO', () => expect(jourDeSemaine('2026-11-18')).toBe('mercredi'));
  test('rejette une date inexistante', () => expect(() => jourDeSemaine('2026-02-30')).toThrow());
  test('reconnaît les horaires qui se chevauchent', () => {
    expect(horairesSeChevauchent(lundi, { heureDebut: '08:30', heureFin: '09:30' })).toBe(true);
  });
  test('autorise deux horaires adjacents', () => {
    expect(horairesSeChevauchent(lundi, { heureDebut: '09:00', heureFin: '10:00' })).toBe(false);
  });
  test('rejette un horaire incomplet ou inversé', () => {
    expect(() => plageHoraire({ heureDebut: '10:00', heureFin: '09:00' })).toThrow();
  });
  test('préfère le jour choisi lors de l’automatique', () => {
    expect(horairesParPriorite([lundi, libre, mercredi], 'mercredi')[0].id).toBe(21);
  });
  test('retient le premier horaire disponible si aucun jour ne correspond', () => {
    expect(horairesParPriorite([libre, lundi], 'vendredi')[0].id).toBe(20);
  });
  test('le tri initial ne modifie pas le tableau source', () => {
    const horaires = [libre, lundi];
    expect(choisirOccurrence(horaires).id).toBe(20);
    expect(horaires[0].id).toBe(22);
  });
});

describe('Assignation : fonctions métier isolées de PostgreSQL', () => {
  test('charge tous les horaires dans les options, indépendamment du jour', async () => {
    const { service, models } = contexte();
    await service.listerChoix('2026-11-18');
    const association = models.Task.findAll.mock.calls[0][0].include[0];
    expect(association).toMatchObject({ as: 'occurrences', required: false });
    expect(association.where).toBeUndefined();
  });

  test('charge les priorités associées aux horaires de la journée', async () => {
    const { service, models } = contexte();
    await service.listerJournee('2026-11-18');
    const horaire = models.work_day.findAll.mock.calls[0][0].include[1].include[1];
    expect(horaire.include).toEqual([expect.objectContaining({ as: 'priority' })]);
  });

  test('ne recherche que les employés de terrain pour l’automatique', async () => {
    const { service, models } = contexte();
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.Compte.findAll.mock.calls[0][0].where.role).toBe('personnel_de_terrain');
  });

  test('l’automatique choisit l’horaire du jour quand il existe', async () => {
    const { service, models } = contexte();
    models.Compte.findAll.mockResolvedValue(employesDuPoste());
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.work_day_task.create).toHaveBeenCalledWith(
      expect.objectContaining({ occurrenceId: 21, isAutomatic: true }), expect.any(Object),
    );
  });

  test('l’automatique utilise un horaire même sans correspondance du jour', async () => {
    const { service, models } = contexte();
    models.Compte.findAll.mockResolvedValue(employesDuPoste([libre]));
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.work_day_task.create).toHaveBeenCalledWith(
      expect.objectContaining({ occurrenceId: 22 }), expect.any(Object),
    );
  });

  test('l’automatique essaie le prochain horaire si le premier chevauche une tâche manuelle', async () => {
    const { service, models } = contexte();
    models.Compte.findAll.mockResolvedValue(employesDuPoste());
    models.work_day_task.findAll.mockResolvedValue([conflit(mercredi)]);
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.work_day_task.create).toHaveBeenCalledWith(
      expect.objectContaining({ occurrenceId: 20, isAutomatic: true }), expect.any(Object),
    );
  });

  test('l’automatique recrée les sous-tâches avec la nouvelle ligne', async () => {
    const { service, models } = contexte();
    models.Compte.findAll.mockResolvedValue(employesDuPoste());
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.work_day_sub_task.bulkCreate).toHaveBeenCalledWith([
      { workDayTaskId: 200, subTaskId: 31, isCompleted: false },
      { workDayTaskId: 200, subTaskId: 32, isCompleted: false },
    ], expect.any(Object));
  });

  test('la régénération ne supprime que les assignations automatiques', async () => {
    const { service, models } = contexte();
    models.work_day.findAll.mockResolvedValue([{ id: 100 }]);
    models.work_day_task.findAll.mockResolvedValue([{ id: 200 }]);
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.work_day_task.findAll.mock.calls[0][0].where.isAutomatic).toBe(true);
  });

  test('la régénération supprime les sous-tâches avant les assignations', async () => {
    const { service, models } = contexte();
    models.work_day.findAll.mockResolvedValue([{ id: 100 }]);
    models.work_day_task.findAll.mockResolvedValue([{ id: 200 }]);
    await service.assignerAutomatiquement('2026-11-18');
    expect(models.work_day_sub_task.destroy.mock.invocationCallOrder[0])
      .toBeLessThan(models.work_day_task.destroy.mock.invocationCallOrder[0]);
  });

  test('le backend refuse une assignation manuelle à un administrateur', async () => {
    const { service, models } = contexte();
    preparerManuel(models, { role: 'administrateur' });
    await expect(service.assignerManuellement(demande)).rejects.toMatchObject({ statusCode: 403 });
  });

  test('le manuel autorise un horaire possédant un jour de semaine', async () => {
    const { service, models } = contexte();
    preparerManuel(models);
    await service.assignerManuellement(demande);
    expect(models.work_day_task.create).toHaveBeenCalledWith(
      expect.objectContaining({ taskId: 10, occurrenceId: 21, isAutomatic: false }), expect.any(Object),
    );
  });

  test('le manuel accepte une deuxième ligne de la même tâche à un horaire distinct', async () => {
    const { service, models } = contexte();
    preparerManuel(models);
    models.work_day_task.findAll.mockResolvedValue([conflit(lundi)]);
    await service.assignerManuellement(demande);
    expect(models.work_day_task.create).toHaveBeenCalledTimes(1);
  });

  test('le manuel refuse une deuxième ligne à un horaire qui chevauche', async () => {
    const { service, models } = contexte();
    preparerManuel(models);
    models.work_day_task.findAll.mockResolvedValue([conflit({ ...lundi, heureFin: '10:30' })]);
    await expect(service.assignerManuellement(demande)).rejects.toMatchObject({ statusCode: 409 });
    expect(models.work_day_task.create).not.toHaveBeenCalled();
  });

  test('le manuel refuse le même horaire même avec un identifiant différent', async () => {
    const { service, models } = contexte();
    preparerManuel(models, { horaire: { ...mercredi, id: 35 } });
    models.work_day_task.findAll.mockResolvedValue([conflit({ ...mercredi, id: 21 })]);
    await expect(service.assignerManuellement({ ...demande, occurrenceId: 35 }))
      .rejects.toMatchObject({ statusCode: 409 });
  });

  test('le manuel accepte deux plages adjacentes pour la même tâche', async () => {
    const { service, models } = contexte();
    preparerManuel(models);
    models.work_day_task.findAll.mockResolvedValue([
      conflit({ heureDebut: '09:00', heureFin: '10:00' }),
    ]);
    await service.assignerManuellement(demande);
    expect(models.work_day_task.create).toHaveBeenCalledTimes(1);
  });

  test('le manuel n’examine pas les affectations d’un autre employé ni d’un autre jour', async () => {
    const { service, models } = contexte();
    preparerManuel(models);
    await service.assignerManuellement(demande);
    expect(models.work_day_task.findAll.mock.calls.at(-1)[0].where).toEqual({ workDayId: 100, taskId: 10 });
  });

  test('la modification accepte un horaire de n’importe quel jour de semaine', async () => {
    const { service, models } = contexte();
    const affectation = { id: 30, taskId: 10, workDayId: 100, isAutomatic: true, update: vi.fn() };
    models.work_day_task.findByPk.mockResolvedValue(affectation);
    models.work_day.findByPk.mockResolvedValue({ id: 100, date: '2026-11-18' });
    models.occurrence_de_tache.findOne.mockResolvedValue(lundi);
    await service.changerOccurrence(30, 20);
    expect(affectation.update).toHaveBeenCalledWith(
      { occurrenceId: 20 }, expect.any(Object),
    );
  });

  test('la modification refuse un chevauchement avec une autre ligne de la même tâche', async () => {
    const { service, models } = contexte();
    models.work_day_task.findByPk.mockResolvedValue({
      id: 30, taskId: 10, workDayId: 100, update: vi.fn(),
    });
    models.work_day.findByPk.mockResolvedValue({ id: 100 });
    models.occurrence_de_tache.findOne.mockResolvedValue(lundi);
    models.work_day_task.findAll.mockResolvedValue([conflit(lundi, 70)]);
    await expect(service.changerOccurrence(30, 20)).rejects.toMatchObject({ statusCode: 409 });
  });

  test('la création d’un nouvel horaire n’attribue aucun jour de semaine', async () => {
    const { service, models } = contexte();
    models.Task.findOne.mockResolvedValue({ id: 10, taskPriorityId: 3 });
    await service.creerOccurrence({
      taskId: 10, heureDebut: '08:00', heureFin: '09:00', journee: 'vendredi',
    });
    expect(models.occurrence_de_tache.create).toHaveBeenCalledWith(
      expect.objectContaining({ journee: null, heureDebut: '08:00', heureFin: '09:00' }),
    );
  });

  test('la création refuse une plage invalide', async () => {
    const { service, models } = contexte();
    await expect(service.creerOccurrence({ taskId: 10, heureDebut: '11:00', heureFin: '10:00' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(models.occurrence_de_tache.create).not.toHaveBeenCalled();
  });

  test('la suppression efface les sous-tâches puis une seule ligne work_day_task', async () => {
    const { service, models } = contexte();
    models.work_day_task.findByPk.mockResolvedValue({ id: 55 });
    await service.supprimerAssignation(55);
    expect(models.work_day_sub_task.destroy).toHaveBeenCalledWith({
      where: { workDayTaskId: 55 }, transaction: expect.any(Object),
    });
    expect(models.work_day_task.destroy).toHaveBeenCalledWith({
      where: { id: 55 }, transaction: expect.any(Object),
    });
  });

  test('la suppression refuse une assignation inexistante', async () => {
    const { service } = contexte();
    await expect(service.supprimerAssignation(404)).rejects.toMatchObject({ statusCode: 404 });
  });
});
