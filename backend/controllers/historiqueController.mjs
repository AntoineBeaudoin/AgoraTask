import {
  Compte,
  Task,
  occurrence_de_tache,
  sous_tache,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import { validerDate } from "../utils/dateHelpers.mjs";

export async function getEmployeEnService(req, res, next) {
  try {
    const { date } = req.query;
    if (!validerDate(date, next)) return;

    const comptes = await Compte.findAll({
      attributes: { exclude: ["motDePasse"] },
      include: [
        {
          model: work_day,
          as: "workDays",
          required: true,
          where: { date },
          include: [
            {
              model: work_day_task,
              as: "tasks",
              attributes: ["id", "isCompleted"],
            },
          ],
        },
      ],
    });

    const data = comptes.map((compte) => {
      const { workDays, ...employe } = compte.toJSON();
      return {
        ...employe,
        aDesTachesNonTerminees: workDays.some((jour) =>
          jour.tasks.some((tache) => tache.isCompleted === false),
        ),
      };
    });

    res.status(200).json({
      status: 200,
      message: "Liste des employés en service récupérée avec succès",
      data,
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
    if (!validerDate(date, next)) return;

    const workTasks = await work_day_task.findAll({
      include: [
        {
          model: work_day,
          as: "workDay",
          where: { accountId: compteId, date },
          attributes: [],
        },
        { model: Task, as: "task" },
        { model: occurrence_de_tache, as: "occurrence" },
        {
          model: work_day_sub_task,
          as: "subTasks",
          include: [{ model: sous_tache, as: "subTask" }],
        },
      ],
      order: [["id", "ASC"]],
    });

    if (workTasks.length > 0) {
      const data = workTasks.map((wt) => ({
        id: wt.id,
        isCompleted: wt.isCompleted,
        commentaire: wt.comment,
        occurrence_de_tache: {
          ...(wt.occurrence ? wt.occurrence.toJSON() : {}),
          task: wt.task,
        },
        sous_taches: [...wt.subTasks]
          .sort((a, b) => a.id - b.id)
          .map((s) => ({
            id: s.subTaskId,
            titre: s.subTask ? s.subTask.titre : null,
            description: s.subTask ? s.subTask.description : null,
            SousTachesAFaire: {
              isCompleted: s.isCompleted,
              commentaire: s.comment,
            },
          })),
      }));

      res.status(200).json({
        status: 200,
        message: "Liste des tâches de l'employé récupérée avec succès",
        data: data,
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
