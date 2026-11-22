import { describe, test, expect, vi } from 'vitest';
import { creerAssignController } from '../controllers/assignController.mjs';

function base(service = {}) {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  return { controller: creerAssignController(service), res, next };
}

describe('assignController : adaptation HTTP uniquement', () => {
  test('transmet la date au service de consultation', async () => {
    const listerJournee = vi.fn().mockResolvedValue([]);
    const { controller, res, next } = base({ listerJournee });
    await controller.listerJournee({ query: { date: '2026-11-18' } }, res, next);
    expect(listerJournee).toHaveBeenCalledWith('2026-11-18');
  });
  test('transmet le corps au service manuel', async () => {
    const assignerManuellement = vi.fn().mockResolvedValue({ id: 4 });
    const { controller, res, next } = base({ assignerManuellement });
    const body = { taskId: 10, occurrenceId: 20 };
    await controller.assignerManuellement({ body }, res, next);
    expect(assignerManuellement).toHaveBeenCalledWith(body);
  });
  test('retourne 201 après une assignation manuelle', async () => {
    const { controller, res, next } = base({ assignerManuellement: vi.fn().mockResolvedValue({ id: 4 }) });
    await controller.assignerManuellement({ body: {} }, res, next);
    expect(res.status).toHaveBeenCalledWith(201);
  });
  test('transmet le nouvel horaire sans interpréter la journée', async () => {
    const changerOccurrence = vi.fn().mockResolvedValue({ id: 4 });
    const { controller, res, next } = base({ changerOccurrence });
    await controller.changerOccurrence({ params: { workDayTaskId: '4' }, body: { occurrenceId: 9 } }, res, next);
    expect(changerOccurrence).toHaveBeenCalledWith('4', 9);
  });
  test('transmet uniquement l’identifiant de suppression', async () => {
    const supprimerAssignation = vi.fn().mockResolvedValue({ id: 8 });
    const { controller, res, next } = base({ supprimerAssignation });
    await controller.supprimerAssignation({ params: { workDayTaskId: '8' } }, res, next);
    expect(supprimerAssignation).toHaveBeenCalledWith('8');
  });
  test('répond 200 après la suppression', async () => {
    const { controller, res, next } = base({ supprimerAssignation: vi.fn().mockResolvedValue({ id: 8 }) });
    await controller.supprimerAssignation({ params: { workDayTaskId: '8' } }, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
  });
  test('transmet les erreurs du service à next', async () => {
    const erreur = new Error('BD inaccessible');
    const { controller, res, next } = base({ supprimerAssignation: vi.fn().mockRejectedValue(erreur) });
    await controller.supprimerAssignation({ params: { workDayTaskId: '8' } }, res, next);
    expect(next).toHaveBeenCalledWith(erreur);
  });
});
