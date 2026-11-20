import bd from "../models/bd.mjs";
import {
  Task,
  occurrence_de_tache,
  sous_tache,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import { validerDate } from "../utils/dateHelpers.mjs";

function cleanComment(value) {
  if (typeof value !== "string") return null;
  const text = value.trim().slice(0, 1000);
  return text === "" ? null : text;
}

export async function getMyDay(req, res, next) {
  try {
    const date = req.query.date;
    if (!validerDate(date, next)) return;

    const day = await work_day.findOne({
      where: { accountId: req.user.id, date: date },
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
              include: { model: sous_tache, as: "subTask" },
            },
          ],
        },
      ],
      order: [
        [
          { model: work_day_task, as: "tasks" },
          { model: occurrence_de_tache, as: "occurrence" },
          "heureDebut",
          "ASC",
        ],
        [{ model: work_day_task, as: "tasks" }, "id", "ASC"],
        [
          { model: work_day_task, as: "tasks" },
          { model: work_day_sub_task, as: "subTasks" },
          "id",
          "ASC",
        ],
      ],
    });

    if (!day) {
      return res.status(404).json({
        status: 404,
        message: "Aucune journée pour cette date.",
      });
    }

    const data = day.toJSON();
    data.tasks = data.tasks.filter(function (t) {
      return t.task && !t.task.archived;
    });

    res.status(200).json({
      status: 200,
      message: "Journée récupérée avec succès.",
      data: data,
      path: "/api/work_day/mine",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function submitDay(req, res, next) {
  try {
    const day = await work_day.findOne({
      where: {
        id: req.params.id,
        accountId: req.user.id,
      },
    });

    if (!day) {
      return res.status(404).json({
        status: 404,
        message: "Journée introuvable.",
      });
    }

    if (day.isSubmitted) {
      return res.status(409).json({
        status: 409,
        message: "La journée est déjà soumise.",
      });
    }

    await bd.transaction(async function (t) {
      const dailyComment = cleanComment(req.body.comment || "");

      await day.update({
        comment: dailyComment,
      }, { transaction: t });

      const tasks = await work_day_task.findAll({
        where: { workDayId: day.id },
        include: [{
          model: work_day_sub_task,
        }],
        transaction: t,
      });

      const submittedTasks = Array.isArray(req.body.tasks)
        ? req.body.tasks
        : [];

      let hasIncompleteItems = false;

      for (let i = 0; i < tasks.length; i++) {
        const task = tasks[i];

        const submittedTask = submittedTasks.find(
          item => item.id === task.id
        );

        if (submittedTask) {
          await task.update({
            comment: cleanComment(submittedTask.comment || ""),
          }, { transaction: t });
        }

        if (!task.isCompleted) {
          hasIncompleteItems = true;

          if (!cleanComment(task.comment || "")) {
            const err = new Error(
              `La tâche "${task.title}" doit avoir un commentaire puisqu'elle n'est pas terminée.`
            );
            err.status = 422;
            throw err;
          }
        }

        const subs = task.work_day_sub_tasks || [];
        const submittedSubs = submittedTask?.subTasks || [];

        for (let j = 0; j < subs.length; j++) {
          const sub = subs[j];

          const submittedSub = submittedSubs.find(
            item => item.id === sub.id
          );

          if (submittedSub) {
            await sub.update({
              comment: cleanComment(submittedSub.comment || ""),
            }, { transaction: t });
          }

          if (!sub.isCompleted) {
            hasIncompleteItems = true;

            if (!cleanComment(sub.comment || "")) {
              const err = new Error(
                "Chaque sous-tâche non terminée doit avoir un commentaire."
              );
              err.status = 422;
              throw err;
            }
          }
        }
      }

      if (hasIncompleteItems && !dailyComment) {
        const err = new Error(
          "Un commentaire global est obligatoire lorsqu'il reste des tâches ou sous-tâches non terminées."
        );
        err.status = 422;
        throw err;
      }

      await day.update({
        isSubmitted: true,
      }, { transaction: t });

    });

    return res.status(200).json({
      status: 200,
      message: "Journée soumise avec succès.",
      path: "/api/work_day/submit/" + day.id,
      timestamp: new Date().toISOString(),
    });

  } catch (err) {
    next(err);
  }
}


export async function saveDay(req, res, next) {
  try {
    const day = await work_day.findOne({
      where: { id: req.params.id, accountId: req.user.id },
    });
    if (!day) {
      return res
        .status(404)
        .json({ status: 404, message: "Journée introuvable." });
    }
    if (day.isSubmitted) {
      return res
        .status(409)
        .json({ status: 409, message: "La journée est déjà soumise." });
    }

    await bd.transaction(async function (t) {
      const dayUpdates = { isSubmitted: req.body.submit === true };
      if (req.body.comment !== undefined) {
        dayUpdates.comment = cleanComment(req.body.comment);
      }
      await day.update(dayUpdates, { transaction: t });

      const items = Array.isArray(req.body.tasks) ? req.body.tasks : [];
      for (let i = 0; i < items.length; i++) {
        const task = await work_day_task.findOne({
          where: { id: items[i].id, workDayId: day.id },
          transaction: t,
        });
        if (!task) continue;

        const taskUpdates = {};
        if (items[i].isCompleted !== undefined) {
          taskUpdates.isCompleted = items[i].isCompleted === true;
        }
        if (items[i].comment !== undefined) {
          taskUpdates.comment = cleanComment(items[i].comment);
        }
        await task.update(taskUpdates, { transaction: t });

        const subs = Array.isArray(items[i].subTasks) ? items[i].subTasks : [];
        for (let j = 0; j < subs.length; j++) {
          const sub = await work_day_sub_task.findOne({
            where: { id: subs[j].id, workDayTaskId: task.id },
            transaction: t,
          });
          if (!sub) continue;

          const subUpdates = {};
          if (subs[j].isCompleted !== undefined) {
            subUpdates.isCompleted = subs[j].isCompleted === true;
          }
          if (subs[j].comment !== undefined) {
            subUpdates.comment = cleanComment(subs[j].comment);
          }
          await sub.update(subUpdates, { transaction: t });
        }
      }
    });

    res.status(200).json({
      status: 200,
      message: "Journée enregistrée.",
      path: "/api/work_day/" + day.id,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}
