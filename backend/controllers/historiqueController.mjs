import bcrypt from "bcrypt";
import {
  Compte,
  Task,
  TaskImage,
  Poste,
  occurrence_de_tache,
  sous_tache,
  TaskPoste,
  tachesAFaire,
  sous_taches_AFaire,
} from "../models/bd_index.mjs";
import { Op } from "sequelize";

export async function getEmployeEnService(req, res, next) {
  try {
    const { date } = req.query;
    if (!date) {
      const error = new Error("La date est requise.");
      error.statusCode = 400;
      return next(error);
    }
    const EmployeEnService = await Compte.findAll({
      include: [
        {
          model: Task,
          as: "taches",
          required: true,
          through: {
            where: {
              createdAt: {
                [Op.gte]: new Date(date + "T00:00:00"),
                [Op.lte]: new Date(date + "T23:59:59.999"),
              },
            },
          },
        },
      ],
    });
    res.status(200).json({
      status: 200,
      message: "Liste des employés en service récupérée avec succès",
      data: EmployeEnService,
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function getEmployeTaches(req, res, next) {
  try {
    const { compteId } = req.params;
    const { date } = req.query;
    if (!date) {
      const error = new Error("La date est requise.");
      error.statusCode = 400;
      return next(error);
    }
    const EmployeTaches = await tachesAFaire.findAll({
      where: {
        compteId: compteId,
        createdAt: {
          [Op.gte]: new Date(date + "T00:00:00"),
          [Op.lte]: new Date(date + "T23:59:59.999"),
        },
      },

      include: [
        {
          model: occurrence_de_tache,
          as: "occurrence_de_tache",
          include: [
            {
              model: Task,
              as: "task",
            },
          ],
        },
        {
          model: sous_tache,
          as: "sous_taches",
        },
      ],
    });
    if (EmployeTaches.length > 0) {
      res.status(200).json({
        status: 200,
        message: "Liste des tâches de l'employé récupérée avec succès",
        data: EmployeTaches,
        error: null,
      });
    } else {
      let error = new Error("Employé introuvable.");
      error.statusCode = 404;
      next(error);
    }
  } catch (error) {
    next(error);
  }
}
