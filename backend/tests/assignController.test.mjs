import { describe, test, expect, vi } from "vitest";
import { creerAssignController } from "../controllers/assignController.mjs";

function contexte() {
  const res = { status: vi.fn().mockReturnThis(), json: vi.fn().mockReturnThis() };
  const next = vi.fn();
  const service = {
    listerJournee: vi.fn(), listerChoix: vi.fn(), assignerAutomatiquement: vi.fn(),
    assignerManuellement: vi.fn(), creerOccurrence: vi.fn(), changerOccurrence: vi.fn(),
  };
  return { res, next, service, controller: creerAssignController(service) };
}

describe("assignController — orchestration HTTP uniquement", () => {
  test("transmet la date au service de lecture", async () => {
    const { controller, service, res, next } = contexte();
    service.listerJournee.mockResolvedValue([]);
    await controller.listerJournee({ query: { date: "2026-11-18" } }, res, next);
    expect(service.listerJournee).toHaveBeenCalledWith("2026-11-18");
  });

  test("retourne les compteurs de régénération au frontend", async () => {
    const { controller, service, res, next } = contexte();
    service.assignerAutomatiquement.mockResolvedValue({ supprimees: 2, creees: 4, ignorees: 1 });
    await controller.assignerAutomatiquement({ body: { date: "2026-11-18" } }, res, next);
    expect(res.json).toHaveBeenCalledWith(expect.objectContaining({
      data: { supprimees: 2, creees: 4, ignorees: 1 },
    }));
  });

  test("transmet les champs de l'assignation manuelle sans les modifier", async () => {
    const { controller, service, res, next } = contexte();
    service.assignerManuellement.mockResolvedValue({ id: 3 });
    const body = { date: "2026-11-18", accountId: 5, taskId: 10, occurrenceId: 20 };
    await controller.assignerManuellement({ body }, res, next);
    expect(service.assignerManuellement).toHaveBeenCalledWith(body);
  });

  test("transmet les deux identifiants pour modifier une occurrence", async () => {
    const { controller, service, res, next } = contexte();
    service.changerOccurrence.mockResolvedValue({ id: 3 });
    await controller.changerOccurrence({ params: { workDayTaskId: "3" }, body: { occurrenceId: 20 } }, res, next);
    expect(service.changerOccurrence).toHaveBeenCalledWith("3", 20);
  });

  test("délègue les erreurs du service au middleware Express", async () => {
    const { controller, service, res, next } = contexte();
    const erreur = new Error("Échec simulé");
    service.listerChoix.mockRejectedValue(erreur);
    await controller.listerChoix({ query: { date: "2026-11-18" } }, res, next);
    expect(next).toHaveBeenCalledWith(erreur);
  });
});
