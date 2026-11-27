import bd from "../models/bd.mjs";
import {
  Compte,
  work_week,
  Task,
  occurrence_de_tache,
  sous_tache,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import { validerDate } from "../utils/dateHelpers.mjs";
import { createHttpError } from "../utils/taskHelpers.mjs";

function validateWeekDates(beginningDate, endDate, next) {
  if (!validerDate(beginningDate, next)) return false;
  if (!validerDate(endDate, next)) return false;

  if (beginningDate > endDate) {
    throw createHttpError(
      "La date de début doit précéder la date de fin.",
      400,
    );
  }

  return true;
}

function validateWorkDayIds(ids) {
  if (!Array.isArray(ids)) {
    throw createHttpError(
      "La liste des journées doit être un tableau.",
      400,
    );
  }

  const normalizedIds = ids.map(Number);

  if (
    normalizedIds.some(
      (id) => !Number.isInteger(id) || id <= 0,
    ) ||
    new Set(normalizedIds).size !== normalizedIds.length
  ) {
    throw createHttpError(
      "La liste des journées contient des identifiants invalides ou en double.",
      400,
    );
  }

  return normalizedIds;
}

/**
 * Vérifie que les journées existent, appartiennent au compte
 * et se situent dans l'intervalle de la semaine.
 */
async function validateWorkDays(
  workDayIds,
  accountId,
  beginningDate,
  endDate,
  transaction,
  currentWeekId = null,
) {
  if (workDayIds.length === 0) return [];

  const days = await work_day.findAll({
    where: {
      id: { [Op.in]: workDayIds },
      accountId,
    },
    transaction,
  });

  if (days.length !== workDayIds.length) {
    throw createHttpError(
      "Certaines journées sont introuvables ou n'appartiennent pas à cet employé.",
      400,
    );
  }

  for (const day of days) {
    if (
      day.date < beginningDate ||
      day.date > endDate
    ) {
      throw createHttpError(
        `La journée du ${day.date} ne se situe pas dans l'intervalle de la semaine.`,
        400,
      );
    }

    if (
      day.workWeekId !== null &&
      day.workWeekId !== currentWeekId
    ) {
      throw createHttpError(
        `La journée du ${day.date} appartient déjà à une autre semaine.`,
        409,
      );
    }
  }

  return days;
}

/**
 * Crée une semaine de travail et lui associe des journées existantes.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 */
export async function createWorkWeek(req, res, next) {
  try {
    const { accountId, beginningDate, endDate } = req.body;

    if (!validateWeekDates(beginningDate, endDate, next)) return;

    const workDayIds = validateWorkDayIds(req.body.workDayIds);

    if (!Number.isInteger(Number(accountId)) || Number(accountId) <= 0) {
      throw createHttpError("Identifiant d'employé invalide.", 400);
    }

    await bd.transaction(async function (t) {
      const account = await Compte.findByPk(accountId, {
        transaction: t,
      });

      if (!account) {
        throw createHttpError("Employé introuvable.", 404);
      }

      const days = await validateWorkDays(
        workDayIds,
        account.id,
        beginningDate,
        endDate,
        t,
      );

      const week = await work_week.create(
        {
          accountId: account.id,
          beginningDate,
          endDate,
        },
        { transaction: t },
      );

      for (const day of days) {
        await day.update(
          { workWeekId: week.id },
          { transaction: t },
        );
      }
    });

    const createdWeek = await work_week.findOne({
      where: {
        accountId,
        beginningDate,
      },
      include: [{ model: work_day, as: "workDays" }],
    });

    return res.status(201).json({
      status: 201,
      message: "Semaine de travail créée avec succès.",
      data: createdWeek,
      path: "/api/work_week",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Modifie une semaine de travail et synchronise ses journées associées.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 */
export async function updateWorkWeek(req, res, next) {
  try {
    const { beginningDate, endDate } = req.body;

    if (!validateWeekDates(beginningDate, endDate, next)) return;

    const workDayIds = validateWorkDayIds(req.body.workDayIds);

    let updatedWeekId;

    await bd.transaction(async function (t) {
      const week = await work_week.findByPk(req.params.id, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });

      if (!week) {
        throw createHttpError("Semaine de travail introuvable.", 404);
      }

      const days = await validateWorkDays(
        workDayIds,
        week.accountId,
        beginningDate,
        endDate,
        t,
        week.id,
      );

      await week.update(
        {
          beginningDate,
          endDate,
        },
        { transaction: t },
      );

      // Détacher les journées qui ne figurent plus dans la liste. Je ne sais pas si je vais garder cela.
      await work_day.update(
        { workWeekId: null },
        {
          where: {
            workWeekId: week.id,
            id: {
              [Op.notIn]: workDayIds.length > 0 ? workDayIds : [0],
            },
          },
          transaction: t,
        },
      );

      // Associer les journées reçues à la semaine.
      for (const day of days) {
        await day.update(
          { workWeekId: week.id },
          { transaction: t },
        );
      }

      updatedWeekId = week.id;
    });

    const updatedWeek = await work_week.findByPk(updatedWeekId, {
      include: [{ model: work_day, as: "workDays" }],
    });

    return res.status(200).json({
      status: 200,
      message: "Semaine de travail modifiée avec succès.",
      data: updatedWeek,
      path: `/api/work_week/${updatedWeekId}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}


/**
 * Retrouve la semaine de travail associée à un employé,
 * ainsi que toutes les journées et leurs tâches.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {unknown} La semaine de travail et ses journées, ou une erreur 404.
 */
export async function getMyWeek(req, res, next) {
  try {
    const date = req.query.date;
    if (!validerDate(date, next)) return;

    const week = await work_week.findOne({
      where: {
        accountId: req.user.id,
        beginningDate: {
          [Op.lte]: date,
        },
        endDate: {
          [Op.gte]: date,
        },
      },
      include: [
        {
          model: work_day,
          as: "workDays",
          include: [
            {
              model: work_day_task,
              as: "tasks",
              include: [
                { model: Task, as: "task" },
                { model: occurrence_de_tache, as: "occurrence" },
                {
                  model: work_day_sub_task,
                  as: "subTasks",
                  include: {
                    model: sous_tache,
                    as: "subTask",
                  },
                },
              ],
            },
          ],
        },
      ],
      order: [
        [{ model: work_day, as: "workDays" }, "date", "ASC"],
        [
          { model: work_day, as: "workDays" },
          { model: work_day_task, as: "tasks" },
          { model: occurrence_de_tache, as: "occurrence" },
          "heureDebut",
          "ASC",
        ],
        [
          { model: work_day, as: "workDays" },
          { model: work_day_task, as: "tasks" },
          "id",
          "ASC",
        ],
        [
          { model: work_day, as: "workDays" },
          { model: work_day_task, as: "tasks" },
          { model: work_day_sub_task, as: "subTasks" },
          "id",
          "ASC",
        ],
      ],
    });

    if (!week) {
      return res.status(404).json({
        status: 404,
        message: "Aucune semaine pour cette date.",
      });
    }

    const data = week.toJSON();

    // Exclure les tâches archivées de chaque journée.
    for (const day of data.workDays) {
      day.tasks = day.tasks.filter(function (t) {
        return t.task && !t.task.archived;
      });
    }

    return res.status(200).json({
      status: 200,
      message: "Semaine récupérée avec succès.",
      data: data,
      path: "/api/work_week/mine",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}