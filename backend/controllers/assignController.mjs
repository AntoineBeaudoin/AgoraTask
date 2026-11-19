export function creerAssignController(service) {
  async function listerJournee(req, res, next) {
    try {
      const data = await service.listerJournee(req.query.date);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  }

  async function listerChoix(req, res, next) {
    try {
      const data = await service.listerChoix(req.query.date);
      return res.status(200).json({ data });
    } catch (error) {
      return next(error);
    }
  }

  async function assignerAutomatiquement(req, res, next) {
    try {
      const data = await service.assignerAutomatiquement(req.body.date);
      return res
        .status(200)
        .json({ message: "Assignations automatiques régénérées.", data });
    } catch (error) {
      return next(error);
    }
  }

  async function assignerManuellement(req, res, next) {
    try {
      const data = await service.assignerManuellement(req.body);
      return res.status(201).json({ message: "Tâche assignée.", data });
    } catch (error) {
      return next(error);
    }
  }

  async function creerOccurrence(req, res, next) {
    try {
      const data = await service.creerOccurrence(req.body);
      return res.status(201).json({ message: "Occurrence créée.", data });
    } catch (error) {
      return next(error);
    }
  }

  async function changerOccurrence(req, res, next) {
    try {
      const data = await service.changerOccurrence(
        req.params.workDayTaskId,
        req.body.occurrenceId,
      );
      return res.status(200).json({ message: "Occurrence modifiée.", data });
    } catch (error) {
      return next(error);
    }
  }

  return {
    listerJournee,
    listerChoix,
    assignerAutomatiquement,
    assignerManuellement,
    creerOccurrence,
    changerOccurrence,
  };
}
