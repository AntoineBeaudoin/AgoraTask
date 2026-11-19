import {
  Task,
  TaskImage,
  TaskDocument,
  TaskLink,
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
import {
  createHttpError,
  parseJsonField,
  normalizeExternalLinks,
  validatePdfFiles,
  normalizeEmbeddedDocuments,
  resolveTaskPriorityId,
  validateOccurrencesForPriority,
} from "../utils/taskHelpers.mjs";
import { todayString, validerDate } from "../utils/dateHelpers.mjs";

dotenv.config();

const TASK_RELATIONS_INCLUDE = [
  { model: TaskImage, as: "images" },
  { model: TaskDocument, as: "documents" },
  { model: TaskLink, as: "externalLinks" },
  { model: task_priority, as: "priority" },
  {
    model: occurrence_de_tache,
    as: "occurrences",
    include: [{ model: task_priority, as: "priority" }],
  },
  { model: sous_tache, as: "sous_taches" },
];

function validateTaskRequiredFields(title, room) {
  if (!title || !String(title).trim() || !room || !String(room).trim()) {
    throw createHttpError("Le titre et le local de la tâche sont requis.", 400);
  }
}

/**
 * Valide qu'une tâche n'existe pas déjà. Si la tâche existe déjà lance une erreur 409
 * @param {*} title Titre de la tâche
 * @param {*} room Local de la tâche
 * @param {*} taskId Id de la tâche (-1 par défaut)
 * @returns
 */
async function validateTaskDoesNotAlreadyExist(title, room, taskId = -1) {
  const anotherTask = await Task.findOne({ where: { title, room } });
  if (anotherTask && Number(anotherTask.id) !== Number(taskId)) {
    throw createHttpError("Une tâche identique existe déjà.", 409);
  }
  return true;
}

function getImageFiles(req) {
  return (req.files ?? []).filter((file) => file.fieldname === "images");
}

function getDocumentFiles(req) {
  return (req.files ?? []).filter(
    (file) => file.fieldname === "documents" || file.fieldname === "pdf",
  );
}

async function uploadToStorage(pathKey, buffer, contentType) {
  try {
    const blob = await put(pathKey, buffer, { access: "public", contentType });
    return blob.url;
  } catch (err) {
    if (process.env.NODE_ENV === "test") {
      return `https://blob.vercel-storage.com/${pathKey}`;
    }
    throw err;
  }
}

async function safeDeleteFromStorage(url) {
  if (!url) return;
  try {
    await del(url);
  } catch (err) {
    if (process.env.NODE_ENV !== "test") {
      console.error(
        `Erreur lors de la suppression sur Vercel Blob (${url}):`,
        err,
      );
    }
  }
}

/**
 * Crée les occurrences d'une tâche
 * @param {*} taskId Id de la tâche
 * @param {*} occurrences JSON des occurrences de la tâche
 * @returns
 */
async function createOccurrences(taskId, occurrences) {
  if (!occurrences || occurrences.length < 1) return;
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
  if (!subTasks || subTasks.length < 1) return;
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

async function createExternalLinks(taskId, links) {
  if (!links || links.length < 1) return;
  await Promise.all(
    links.map((link) =>
      TaskLink.create({
        taskId,
        title: link.title || link.url,
        url: link.url,
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
  const imageFiles = getImageFiles(req);
  for (const file of imageFiles) {
    const blobUrl = await uploadToStorage(
      `task/${task.id}/${file.originalname}`,
      file.buffer,
      file.mimetype,
    );
    await TaskImage.create({
      taskId: task.id,
      filename: file.originalname,
      path: blobUrl,
      mimeType: file.mimetype,
    });
  }
}

async function addTaskDocuments(req, task) {
  const docFiles = getDocumentFiles(req);
  for (const file of docFiles) {
    const blobUrl = await uploadToStorage(
      `task/${task.id}/documents/${file.originalname}`,
      file.buffer,
      file.mimetype || "application/pdf",
    );
    await TaskDocument.create({
      taskId: task.id,
      filename: file.originalname,
      path: blobUrl,
      mimeType: file.mimetype || "application/pdf",
    });
  }
  const rawDocs = parseJsonField(req.body.documents, []).filter((d) => !d?.id);
  for (const doc of normalizeEmbeddedDocuments(rawDocs)) {
    await TaskDocument.create({ taskId: task.id, ...doc });
  }
}

async function copyExistingImages(originalTask, newTask) {
  for (const image of originalTask.images ?? []) {
    const imageResponse = await fetch(image.path);
    if (!imageResponse.ok) {
      throw new Error(`Impossible de récupérer l'image ${image.filename}`);
    }
    const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
    const blobUrl = await uploadToStorage(
      `task/${newTask.id}/${image.filename}`,
      imageBuffer,
      image.mimeType,
    );
    await TaskImage.create({
      taskId: newTask.id,
      filename: image.filename,
      path: blobUrl,
      mimeType: image.mimeType,
    });
  }
}

async function copyExistingDocumentsAndLinks(originalTask, newTask) {
  for (const doc of originalTask.documents ?? []) {
    await TaskDocument.create({
      taskId: newTask.id,
      filename: doc.filename,
      path: doc.path,
      mimeType: doc.mimeType || "application/pdf",
    });
  }
  const links = (originalTask.externalLinks ?? []).map((l) => ({
    title: l.title,
    url: l.url,
  }));
  await createExternalLinks(newTask.id, links);
}

/**
 * Synchronise les images existantes : supprime de Vercel Blob et de la BD
 * les images qui ne figurent plus dans la liste conservée (`existingImageIds`).
 */
async function syncExistingImages(req, taskId) {
  const existingIds = parseJsonField(req.body.existingImageIds, []).map(Number);
  const currentImages = await TaskImage.findAll({ where: { taskId } });
  for (const image of currentImages) {
    if (!existingIds.includes(image.id)) {
      await safeDeleteFromStorage(image.path);
      await image.destroy();
    }
  }
}

async function syncExistingDocuments(req, taskId) {
  if (
    req.body.existingDocumentIds === undefined &&
    req.body.documents === undefined
  ) {
    return;
  }
  const explicitIds = parseJsonField(req.body.existingDocumentIds, []).map(
    Number,
  );
  const docIds = parseJsonField(req.body.documents, [])
    .filter((d) => d?.id)
    .map((d) => Number(d.id));
  const retainedIds = [...new Set([...explicitIds, ...docIds])];
  const currentDocs = await TaskDocument.findAll({ where: { taskId } });
  for (const doc of currentDocs) {
    if (!retainedIds.includes(doc.id)) {
      await safeDeleteFromStorage(doc.path);
      await doc.destroy();
    }
  }
}

async function syncTaskOccurrences(taskId, occurrences) {
  const existingOccurrences = await occurrence_de_tache.findAll({
    where: { tacheId: taskId },
  });
  const existingById = new Map(
    existingOccurrences.map((occ) => [Number(occ.id), occ]),
  );
  const retainedIds = [];
  for (const occ of occurrences) {
    const existing = existingById.get(Number(occ.id));
    const payload = {
      journee: occ.journee,
      heureDebut: occ.heureDebut || null,
      heureFin: occ.heureFin || null,
      taskPriorityId: occ.taskPriorityId ?? occ.priority?.id,
      isRequired: occ.isRequired ?? true,
    };
    if (existing) {
      await existing.update(payload);
      retainedIds.push(existing.id);
    } else {
      const created = await occurrence_de_tache.create({
        tacheId: taskId,
        ...payload,
      });
      retainedIds.push(created.id);
    }
  }
  const removed = existingOccurrences.filter(
    (occ) => !retainedIds.includes(occ.id),
  );
  for (const occ of removed) {
    // Une occurrence déjà utilisée dans une journée de travail est conservée
    const refCount = await work_day_task.count({
      where: { occurrenceId: occ.id },
    });
    if (refCount === 0) await occ.destroy();
  }
}

/**
 * Synchronise les sous-tâches d'une tâche en les mettant à jour sur place
 * (comme pour les occurrences) afin de ne pas perdre l'historique des
 * journées de travail.
 */
async function syncTaskSubTasks(taskId, subTasks) {
  const existingSubTasks = await sous_tache.findAll({
    where: { tacheId: taskId },
  });
  const existingById = new Map(
    existingSubTasks.map((st) => [Number(st.id), st]),
  );
  const retainedIds = [];
  for (const st of subTasks) {
    const existing = existingById.get(Number(st.id));
    if (existing) {
      await existing.update({
        titre: st.titre,
        description: st.description || null,
      });
      retainedIds.push(existing.id);
    } else {
      const created = await sous_tache.create({
        tacheId: taskId,
        titre: st.titre,
        description: st.description || null,
      });
      retainedIds.push(created.id);
    }
  }
  const removed = existingSubTasks.filter((st) => !retainedIds.includes(st.id));
  for (const st of removed) {
    // Une sous-tâche déjà utilisée dans une journée de travail est conservée
    const refCount = await work_day_sub_task.count({
      where: { subTaskId: st.id },
    });
    if (refCount === 0) await st.destroy();
  }
}

async function prepareValidatedTaskInput(req) {
  validateTaskRequiredFields(req.body.title, req.body.room);
  validatePdfFiles(getDocumentFiles(req));
  const rawOccurrences = parseJsonField(req.body.occurrences, []);
  const subTasks = parseJsonField(req.body.subTasks, []);
  const externalLinks = normalizeExternalLinks(
    parseJsonField(req.body.externalLinks ?? req.body.links, []),
  );
  const priorities = await task_priority.findAll();
  const priorityId = resolveTaskPriorityId(
    req.body.taskPriorityId,
    rawOccurrences,
  );
  const occurrences =
    priorities.length > 0 ||
    req.body.taskPriorityId !== undefined ||
    rawOccurrences.length > 0
      ? validateOccurrencesForPriority(priorityId, rawOccurrences, priorities)
      : [];
  return { priorityId, occurrences, subTasks, externalLinks };
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
  try {
    const { priorityId, occurrences, subTasks, externalLinks } =
      await prepareValidatedTaskInput(req);
    const aTask = await Task.create({
      title,
      room,
      description: description ?? null,
      recurring,
      automaticAssignment,
      taskPriorityId: priorityId,
    });
    await createOccurrences(aTask.id, occurrences);
    await createSubTasks(aTask.id, subTasks);
    await createExternalLinks(aTask.id, externalLinks);
    await addTaskImages(req, aTask);
    await addTaskDocuments(req, aTask);
    const theCreatedTask = await Task.findOne({
      where: { id: aTask.id },
      include: TASK_RELATIONS_INCLUDE,
    });
    res.location(`/api/tasks/${aTask.id}`);
    return res.status(201).json({
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
    const task = await Task.findByPk(id);
    if (!task) {
      return res.status(404).json({
        status: 404,
        message: "Tâche introuvable",
        path: `/api/task/occurrences$/{id}`,
        timestamp: new Date().toISOString(),
      });
    }
    const occurrences = await occurrence_de_tache.findAll({
      where: { tacheId: id },
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
    const tasks = await Task.findAll({
      where: { archived: false },
      include: TASK_RELATIONS_INCLUDE,
    });
    return res.status(200).json({
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

function buildEmployeeTaskItem(assignment, task, subTasks, progressMap) {
  const mySubTasks = subTasks
    .filter((st) => st.tacheId === assignment.tacheId)
    .map((st) => ({
      id: st.id,
      titre: st.titre,
      description: st.description,
      isCompleted: progressMap[`${assignment.id}-${st.id}`] === true,
    }));
  const occ = assignment.occurrence_de_tache;
  return {
    ...task.toJSON(),
    tacheAFaireId: assignment.id,
    isCompleted: assignment.isCompleted,
    commentaire: assignment.commentaire,
    journee: occ ? occ.journee : null,
    heureDebut: occ ? occ.heureDebut : null,
    heureFin: occ ? occ.heureFin : null,
    sousTaches: mySubTasks,
  };
}

/**
 * Retourne les tâches de la journée de travail du compte connecté.
 * La date peut être précisée avec ?date=YYYY-MM-DD (aujourd'hui par défaut).
 */
export async function getMyTasks(req, res, next) {
  try {
    const date = req.query.date ?? todayString();
    if (!validerDate(date, next)) return;

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
          include: [
            { model: TaskImage, as: "images" },
            { model: TaskDocument, as: "documents" },
            { model: TaskLink, as: "externalLinks" },
            { model: task_priority, as: "priority" },
          ],
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
        // Le nom tacheAFaireId est conservé pour ne pas casser le frontend
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

    return res.status(200).json({
      status: 200,
      message: "Tâches récupérées avec succès.",
      data,
      path: "/api/task/mine",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
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
      return res
        .status(400)
        .json({ status: 400, message: "Aucune tâche à enregistrer." });
    }

    await bd.transaction(async function (t) {
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item || !item.tacheAFaireId) continue;

        // Le include sur workDay garantit que la tâche appartient au compte connecté
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

    return res.status(200).json({
      status: 200,
      message: "Progression enregistrée.",
      path: "/api/task/progress",
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

async function applyTaskUpdates(req, task) {
  const { title, room, description, recurring, automaticAssignment } = req.body;
  validateTaskRequiredFields(title, room);
  validatePdfFiles(getDocumentFiles(req));
  await validateTaskDoesNotAlreadyExist(title, room, task.id);
  const priorities = await task_priority.findAll();
  const hasOccOrPrio =
    req.body.occurrences !== undefined || req.body.taskPriorityId !== undefined;
  const rawOccurrences = parseJsonField(req.body.occurrences, []);
  const priorityId = resolveTaskPriorityId(
    req.body.taskPriorityId ?? task.taskPriorityId,
    rawOccurrences,
  );
  await task.update({
    title,
    room,
    description: description ?? null,
    recurring,
    automaticAssignment,
    taskPriorityId: priorityId,
  });
  if (hasOccOrPrio) {
    const occurrences = validateOccurrencesForPriority(
      priorityId,
      rawOccurrences,
      priorities,
    );
    await syncTaskOccurrences(task.id, occurrences);
  }
}

async function applyTaskCollectionsUpdate(req, task) {
  if (req.body.subTasks !== undefined) {
    const subTasks = parseJsonField(req.body.subTasks, []);
    await syncTaskSubTasks(task.id, subTasks);
  }
  if (req.body.externalLinks !== undefined || req.body.links !== undefined) {
    const links = normalizeExternalLinks(
      parseJsonField(req.body.externalLinks ?? req.body.links, []),
    );
    await TaskLink.destroy({ where: { taskId: task.id } });
    await createExternalLinks(task.id, links);
  }
  await syncExistingImages(req, task.id);
  await addTaskImages(req, task);
  await syncExistingDocuments(req, task.id);
  await addTaskDocuments(req, task);
}

export async function replaceTask(req, res, next) {
  const id = req.params.id;
  try {
    const task = await Task.findOne({ where: { id, archived: false } });
    if (!task) {
      return res
        .status(404)
        .json({ status: 404, message: "Tâche introuvable." });
    }
    await applyTaskUpdates(req, task);
    await applyTaskCollectionsUpdate(req, task);
    const updatedTask = await Task.findOne({
      where: { id: task.id },
      include: TASK_RELATIONS_INCLUDE,
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

async function computeNextCopyTitle(originalTitle) {
  // Retire le suffixe " - Copie #N" du titre afin de retrouver le titre original.
  // Exemple : "Nettoyage - Copie #3" devient "Nettoyage".
  const baseTitle = originalTitle.replace(/\s-\sCopie\s#\d+$/, "");
  const copies = await Task.findAll({
    where: { title: { [Op.like]: `${baseTitle} - Copie #%` } },
  });
  let highestCopyNumber = 0;
  for (const copy of copies) {
    // Extrait le numéro de copie à la fin du titre.
    // Exemple : "Nettoyage - Copie #12" retourne "12".
    const match = copy.title.match(/\s-\sCopie\s#(\d+)$/);
    if (match && Number(match[1]) > highestCopyNumber) {
      highestCopyNumber = Number(match[1]);
    }
  }
  return `${baseTitle} - Copie #${highestCopyNumber + 1}`;
}

async function createDuplicatedTaskObject(newTitle, originalTask) {
  const newTask = await Task.create({
    title: newTitle,
    room: originalTask.room,
    description: originalTask.description,
    recurring: originalTask.recurring,
    automaticAssignment: originalTask.automaticAssignment,
    taskPriorityId: originalTask.taskPriorityId ?? null,
    archived: false,
  });
  await createOccurrences(newTask.id, originalTask.occurrences);
  await createSubTasks(newTask.id, originalTask.sous_taches);
  return newTask;
}

export async function duplicateTask(req, res, next) {
  const id = req.params.id;
  try {
    const originalTask = await Task.findOne({
      where: { id, archived: false },
      include: TASK_RELATIONS_INCLUDE,
    });
    if (!originalTask) {
      return res
        .status(404)
        .json({ status: 404, message: "Tâche introuvable." });
    }
    const newTitle = await computeNextCopyTitle(originalTask.title);
    await validateTaskDoesNotAlreadyExist(newTitle, originalTask.room);
    const newTask = await createDuplicatedTaskObject(newTitle, originalTask);
    await copyExistingImages(originalTask, newTask);
    await copyExistingDocumentsAndLinks(originalTask, newTask);
    const createdTask = await Task.findOne({
      where: { id: newTask.id },
      include: TASK_RELATIONS_INCLUDE,
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

export async function deleteTask(req, res, next) {
  const id = req.params.id;
  try {
    const aTask = await Task.findOne({ where: { id } });
    if (aTask) {
      aTask.archived = true;
      await aTask.save();
    }
    return res.status(204).json({});
  } catch (err) {
    next(err);
  }
}
