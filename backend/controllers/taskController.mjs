import {
  Task,
  TaskImage,
  occurrence_de_tache,
  sous_tache,
  task_priority,
  work_day,
  work_day_task,
  work_day_sub_task,
} from "../models/bd_index.mjs";
import { put, del } from "@vercel/blob";
import { Op } from "sequelize";
import dotenv from "dotenv";
import bd from "../models/bd.mjs";

dotenv.config();

const FORMAT_DATE = /^\d{4}-\d{2}-\d{2}$/;

function todayString() {
  const date = new Date();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const dayOfMonth = String(date.getDate()).padStart(2, "0");
  return date.getFullYear() + "-" + month + "-" + dayOfMonth;
}

/**
 * Valide qu'une tâche n'existe pas déjà. Si la tâche existe déjà lance une erreur 409
 * @param {*} title Titre de la tâche
 * @param {*} room Local de la tâche
 * @param {*} taskId Id de la tâche (-1 par défaut)
 * @returns
 */
async function validateTaskDoesNotAlreadyExist(title, room, taskId = -1) {
  const anotherTask = await Task.findOne({
    where: {
      title: title,
      room: room,
    },
  });
  if (anotherTask && Number(anotherTask.id) !== Number(taskId)) {
    const error = new Error("Une tâche identique existe déjà.");
    error.statusCode = 409;
    throw error;
  }
  return true;
}

/**
 * Crée les occurrences d'une tâche
 * @param {*} taskId Id de la tâche
 * @param {*} occurrences JSON des occurrences de la tâche
 * @returns
 */
async function createOccurrences(taskId, occurrences) {
  if (occurrences.length < 1) return;
  await Promise.all(
    occurrences.map((occ) =>
      occurrence_de_tache.create({
        tacheId: taskId,
        journee: occ.journee,
        heureDebut: occ.heureDebut || null,
        heureFin: occ.heureFin || null,
        taskPriorityId: occ.taskPriorityId ?? occ.priority?.id,
        isRequired: occ.isRequired ?? true,
      }),
    ),
  );
}

/**
 * Crée les sous tâches
 * @param {*} taskId Id de la tâche
 * @param {*} subTasks JSON des sous tâches de la tâche
 * @returns
 */
async function createSubTasks(taskId, subTasks) {
  if (subTasks.length < 1) return;
  await Promise.all(
    subTasks.map((st) =>
      sous_tache.create({
        tacheId: taskId,
        titre: st.titre,
        description: st.description || null,
      }),
    ),
  );
}

/**
 * Ajoute les images d'une tâche à la bd (Blob)
 * @param {*} req La requête
 * @param {*} task La tâche dont les images appartiennent
 */
async function addTaskImages(req, task) {
  if (req.files.length > 0) {
    for (const file of req.files) {
      const blob = await put(
        `task/${task.id}/${file.originalname}`,
        file.buffer,
        {
          access: "public",
          contentType: file.mimetype,
        },
      );
      await TaskImage.create({
        taskId: task.id,
        filename: file.originalname,
        path: blob.url,
        mimeType: file.mimetype,
      });
    }
  }
}

async function copyExistingImages(originalTask, newTask) {
  for (const image of originalTask.images ?? []) {
    const imageResponse = await fetch(image.path);

    if (!imageResponse.ok) {
      throw new Error(`Impossible de récupérer l'image ${image.filename}`);
    }

    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const blob = await put(
      `task/${newTask.id}/${image.filename}`,
      imageBuffer,
      {
        access: "public",
        contentType: image.mimeType,
      },
    );
    await TaskImage.create({
      taskId: newTask.id,
      filename: image.filename,
      path: blob.url,
      mimeType: image.mimeType,
    });
  }
}

/**
 * Synchronise les images existantes : supprime de Vercel Blob et de la BD
 * les images qui ne figurent plus dans la liste conservée (`existingImageIds`).
 */
async function syncExistingImages(req, taskId) {
  let existingIds = [];
  if (req.body.existingImageIds) {
    try {
      existingIds = JSON.parse(req.body.existingImageIds).map((id) =>
        Number(id),
      );
    } catch {
      existingIds = [];
    }
  }
  const currentImages = await TaskImage.findAll({ where: { taskId } });
  for (const image of currentImages) {
    if (!existingIds.includes(image.id)) {
      if (image.path) {
        try {
          await del(image.path);
        } catch (err) {
          console.error(
            `Erreur lors de la suppression sur Vercel Blob (${image.path}):`,
            err,
          );
        }
      }
      await image.destroy();
    }
  }
}

/**
 * Créé une tâche avec ses propriétés associés.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {unknown} Retourne le prochain résultat au middleware, en cas d'erreur.
 */
export async function createTask(req, res, next) {
  const { title, room, description, recurring, automaticAssignment } = req.body;
  const occurrences = req.body.occurrences
    ? JSON.parse(req.body.occurrences)
    : [];
  const subTasks = req.body.subTasks ? JSON.parse(req.body.subTasks) : [];
  try {
    const aTask = await Task.create({
      title,
      room,
      description: description ?? null,
      recurring,
      automaticAssignment,
    });
    await createOccurrences(aTask.id, occurrences);
    await createSubTasks(aTask.id, subTasks);
    await addTaskImages(req, aTask);
    const theCreatedTask = await Task.findOne({
      where: { id: aTask.id },
      include: [
        { model: TaskImage, as: "images" },
        {
          model: occurrence_de_tache,
          as: "occurrences",
          include: [{ model: task_priority, as: "priority" }],
        },
        { model: sous_tache, as: "sous_taches" },
      ],
    });
    res.location(`/api/tasks/${aTask.id}`);
    res.status(201).json({
      status: 201,
      message: "Tâche ajoutée avec succès",
      data: theCreatedTask,
      path: `/api/task/${aTask.id}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne les occurrences liés à une tâche.
 *
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {unknown} Retourne le statut de la requête au client.
 */
export async function getTaskOccurrences(req, res, next) {
  const id = req.params.id;
  try {
    let task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        status: 404,
        message: "Tâche introuvable",
        path: `/api/task/occurrences$/{id}`,
        timestamp: new Date().toISOString(),
      });
    }
    let occurrences = await occurrence_de_tache.findAll({
      where: {
        tacheId: id,
      },
    });
    return res.status(200).json({
      status: 200,
      message: "Occurrences de la tâche récupérés avec succès.",
      data: occurrences,
      path: `/api/task/occurrences$/{id}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne toutes les tâches qui ne sont pas archivés, ainsi que chacune des urls des images qui lui sont associés.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middlware à appeler, en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function getAllTasks(req, res, next) {
  try {
    let tasks = await Task.findAll({
      where: {
        archived: false,
      },
      include: [
        { model: TaskImage, as: "images" },
        {
          model: occurrence_de_tache,
          as: "occurrences",
          include: [
            {
              model: task_priority,
              as: "priority",
            },
          ],
        },
        { model: sous_tache, as: "sous_taches" },
      ],
    });

    res.status(200).json({
      status: 200,
      message: "Tâches récupérés avec succès.",
      data: tasks,
      path: `/api/task/list`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne les tâches de la journée de travail du compte connecté.
 * La date peut être précisée avec ?date=YYYY-MM-DD (aujourd'hui par défaut).
 */
export async function getMyTasks(req, res, next) {
  try {
    const date = req.query.date ?? todayString();
    if (!FORMAT_DATE.test(date)) {
      return res.status(400).json({
        status: 400,
        message: "La date est invalide (format attendu : YYYY-MM-DD).",
      });
    }

    const workTasks = await work_day_task.findAll({
      include: [
        {
          model: work_day,
          as: "workDay",
          where: { accountId: req.user.id, date },
          attributes: [],
        },
        {
          model: Task,
          as: "task",
          where: { archived: false },
          include: [{ model: TaskImage, as: "images" }],
        },
        { model: occurrence_de_tache, as: "occurrence" },
        {
          model: work_day_sub_task,
          as: "subTasks",
          include: [{ model: sous_tache, as: "subTask" }],
        },
      ],
    });

    const data = workTasks.map((wt) => {
      const subTasks = [...wt.subTasks].sort((a, b) => a.id - b.id);
      return {
        ...wt.task.toJSON(),
        tacheAFaireId: wt.id,
        isCompleted: wt.isCompleted,
        commentaire: wt.comment,
        journee: wt.occurrence ? wt.occurrence.journee : null,
        heureDebut: wt.occurrence ? wt.occurrence.heureDebut : null,
        heureFin: wt.occurrence ? wt.occurrence.heureFin : null,
        sousTaches: subTasks.map((s) => ({
          id: s.subTaskId,
          titre: s.subTask ? s.subTask.titre : null,
          description: s.subTask ? s.subTask.description : null,
          isCompleted: s.isCompleted,
        })),
      };
    });

    data.sort((a, b) => (a.heureDebut ?? "").localeCompare(b.heureDebut ?? ""));

    res.status(200).json({
      status: 200,
      message: "Tâches récupérées avec succès.",
      data: data,
      path: "/api/task/mine",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    console.error(err);
    next(err);
  }
}

/**
 * Enregistre la progression (statut, commentaire, sous-tâches) des tâches
 * de la journée de travail du compte connecté.
 * `tacheAFaireId` correspond maintenant à l'id d'un work_day_task.
 */
export async function saveProgress(req, res, next) {
  try {
    const items = req.body.tasks;
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        status: 400,
        message: "Aucune tâche à enregistrer.",
      });
    }

    await bd.transaction(async function (t) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || !item.tacheAFaireId) continue;

        const workTask = await work_day_task.findOne({
          where: { id: item.tacheAFaireId },
          include: [
            {
              model: work_day,
              as: "workDay",
              where: { accountId: req.user.id },
              attributes: [],
            },
          ],
          transaction: t,
        });
        if (!workTask) continue;

        const comment = item.commentaire
          ? String(item.commentaire).trim().slice(0, 1000)
          : null;

        await workTask.update(
          {
            isCompleted: item.isCompleted === true,
            comment: comment || null,
          },
          { transaction: t },
        );

        const subs = Array.isArray(item.sousTaches) ? item.sousTaches : [];
        for (let j = 0; j < subs.length; j++) {
          const sub = await work_day_sub_task.findOne({
            where: { workDayTaskId: workTask.id, subTaskId: subs[j].id },
            transaction: t,
          });
          if (!sub) continue;

          await sub.update(
            { isCompleted: subs[j].isCompleted === true },
            { transaction: t },
          );
        }
      }
    });

    res.status(200).json({
      status: 200,
      message: "Progression enregistrée.",
      path: "/api/task/progress",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function replaceTask(req, res, next) {
  const id = req.params.id;
  const { title, room, description, recurring, automaticAssignment } = req.body;
  try {
    const task = await Task.findOne({ where: { id, archived: false } });
    if (!task) {
      return res.status(404).json({
        status: 404,
        message: "Tâche introuvable.",
      });
    }
    await validateTaskDoesNotAlreadyExist(title, room, id);
    await task.update({
      title,
      room,
      description: description ?? null,
      recurring,
      automaticAssignment,
    });
    if (req.body.occurrences !== undefined) {
      const occurrences =
        typeof req.body.occurrences === "string"
          ? JSON.parse(req.body.occurrences)
          : req.body.occurrences;
      const existingOccurrences = await occurrence_de_tache.findAll({
        where: { tacheId: task.id },
      });
      const existingById = new Map(
        existingOccurrences.map((occ) => [Number(occ.id), occ]),
      );
      const retainedIds = [];
      for (const occ of occurrences) {
        const occurrenceId = Number(occ.id);
        const existing = existingById.get(occurrenceId);
        if (existing) {
          await existing.update({
            journee: occ.journee,
            heureDebut: occ.heureDebut || null,
            heureFin: occ.heureFin || null,
            taskPriorityId: occ.taskPriorityId ?? occ.priority?.id,
            isRequired: occ.isRequired ?? true,
          });
          retainedIds.push(existing.id);
        } else {
          const created = await occurrence_de_tache.create({
            tacheId: task.id,
            journee: occ.journee,
            heureDebut: occ.heureDebut || null,
            heureFin: occ.heureFin || null,
            taskPriorityId: occ.taskPriorityId ?? occ.priority?.id,
            isRequired: occ.isRequired ?? true,
          });
          retainedIds.push(created.id);
        }
      }
      const removedOccurrences = existingOccurrences.filter(
        (occ) => !retainedIds.includes(occ.id),
      );
      for (const occ of removedOccurrences) {
        const referenceCount = await work_day_task.count({
          where: { occurrenceId: occ.id },
        });
        if (referenceCount === 0) {
          await occ.destroy();
        }
      }
    }
    if (req.body.subTasks !== undefined) {
      const subTasks =
        typeof req.body.subTasks === "string"
          ? JSON.parse(req.body.subTasks)
          : req.body.subTasks;

      const existingSubTasks = await sous_tache.findAll({
        where: { tacheId: task.id },
      });
      const existingSubTasksById = new Map(
        existingSubTasks.map((st) => [Number(st.id), st]),
      );
      const retainedSubTaskIds = [];
      for (const st of subTasks) {
        const existing = existingSubTasksById.get(Number(st.id));
        if (existing) {
          await existing.update({
            titre: st.titre,
            description: st.description || null,
          });
          retainedSubTaskIds.push(existing.id);
        } else {
          const created = await sous_tache.create({
            tacheId: task.id,
            titre: st.titre,
            description: st.description || null,
          });
          retainedSubTaskIds.push(created.id);
        }
      }
      const removedSubTasks = existingSubTasks.filter(
        (st) => !retainedSubTaskIds.includes(st.id),
      );
      for (const st of removedSubTasks) {
        const referenceCount = await work_day_sub_task.count({
          where: { subTaskId: st.id },
        });
        if (referenceCount === 0) {
          await st.destroy();
        }
      }
    }
    await syncExistingImages(req, task.id);
    await addTaskImages(req, task);
    const updatedTask = await Task.findOne({
      where: { id: task.id },
      include: [
        { model: TaskImage, as: "images" },
        {
          model: occurrence_de_tache,
          as: "occurrences",
          include: [{ model: task_priority, as: "priority" }],
        },
        { model: sous_tache, as: "sous_taches" },
      ],
    });
    return res.status(200).json({
      status: 200,
      message: "Tâche modifiée avec succès.",
      data: updatedTask,
      path: `/api/task/${task.id}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

export async function duplicateTask(req, res, next) {
  const id = req.params.id;
  try {
    const originalTask = await Task.findOne({
      where: { id, archived: false },
      include: [
        { model: TaskImage, as: "images" },
        {
          model: occurrence_de_tache,
          as: "occurrences",
          include: [{ model: task_priority, as: "priority" }],
        },
        { model: sous_tache, as: "sous_taches" },
      ],
    });
    if (!originalTask) {
      return res.status(404).json({
        status: 404,
        message: "Tâche introuvable.",
      });
    }
    // Retire le suffixe " - Copie #N" du titre afin de retrouver le titre original.
    // Exemple : "Nettoyage - Copie #3" devient "Nettoyage".
    const baseTitle = originalTask.title.replace(/\s-\sCopie\s#\d+$/, "");
    const copies = await Task.findAll({
      where: { title: { [Op.like]: `${baseTitle} - Copie #%` } },
    });
    let highestCopyNumber = 0;
    for (const copy of copies) {
      // Extrait le numéro de copie à la fin du titre.
      // Exemple : "Nettoyage - Copie #12" retourne "12".
      const match = copy.title.match(/\s-\sCopie\s#(\d+)$/);
      if (match) {
        const copyNumber = Number(match[1]);
        if (copyNumber > highestCopyNumber) {
          highestCopyNumber = copyNumber;
        }
      }
    }
    const nextCopyNumber = highestCopyNumber + 1;
    const newTitle = `${baseTitle} - Copie #${nextCopyNumber}`;
    await validateTaskDoesNotAlreadyExist(newTitle, originalTask.room);
    const newTask = await createDuplicatedTaskObject(newTitle, originalTask);
    await copyExistingImages(originalTask, newTask);
    const createdTask = await Task.findOne({
      where: { id: newTask.id },
      include: [
        { model: TaskImage, as: "images" },
        {
          model: occurrence_de_tache,
          as: "occurrences",
          include: [{ model: task_priority, as: "priority" }],
        },
        { model: sous_tache, as: "sous_taches" },
      ],
    });
    return res.status(201).json({
      status: 201,
      message: "Tâche dupliquée avec succès.",
      data: createdTask,
      path: `/api/task/${newTask.id}`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function createDuplicatedTaskObject(newTitle, originalTask) {
  const newTask = await Task.create({
    title: newTitle,
    room: originalTask.room,
    description: originalTask.description,
    recurring: originalTask.recurring,
    automaticAssignment: originalTask.automaticAssignment,
    archived: false,
  });
  await createOccurrences(newTask.id, originalTask.occurrences);
  await createSubTasks(newTask.id, originalTask.sous_taches);
  return newTask;
}

export async function deleteTask(req, res, next) {
  const id = req.params.id;
  try {
    const aTask = await Task.findOne({ where: { id: id } });
    if (aTask) {
      aTask.archived = true;
      await aTask.save();
    }
    res.status(204).json({});
  } catch (err) {
    next(err);
  }
}
