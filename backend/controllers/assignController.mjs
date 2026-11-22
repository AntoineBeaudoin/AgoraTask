import { creerAssignService } from "../services/assignService.mjs";
import { Op } from "sequelize";
import bd from "../models/bd.mjs";
import * as models from "../models/bd_index.mjs";
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
      return res.status(201).json({ message: "Horaire créé.", data });
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
      return res.status(200).json({ message: "Horaire modifié.", data });
    } catch (error) {
      return next(error);
    }
  }

  async function supprimerAssignation(req, res, next) {
    try {
      const data = await service.supprimerAssignation(req.params.workDayTaskId);
      return res.status(200).json({ message: "Assignation supprimée.", data });
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
    supprimerAssignation,
  };
}
const service = creerAssignService({ models, bd, Op });
export const controller = creerAssignController(service);
