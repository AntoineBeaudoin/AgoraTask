import { col, fn, where } from "sequelize";
import bd from "../models/bd.mjs";
import { Task, task_priority, occurrence_de_tache } from "../models/bd_index.mjs";
import { emptyString } from "../utils/checks.mjs";
import { createHttpError } from "../utils/taskHelpers.mjs";

/**
 * Valide les champs d'une priorité de tâche. Lance une erreur 400 si invalide.
 * @param {*} priorityName Nom de la priorité
 * @param {*} weigth Poids de la priorité
 */
function validateTaskPriorityInput(priorityName, weigth) {
    if (emptyString(priorityName)) {
        const error = new Error("Le nom de la priorité est requis.");
        error.statusCode = 400;
        throw error;
    }

    if (weigth !== undefined && weigth !== null && !Number.isInteger(Number(weigth))) {
        const error = new Error("Le poids de la priorité doit être un nombre entier.");
        error.statusCode = 400;
        throw error;
    }

    if (weigth < 0){
        const error = new Error("Le poids de la priorité doit être un nombre supérieur ou égale à 0.");
        error.statusCode = 400;
        throw error;
    }
}

/**
 * Valide qu'une priorité de tâche n'existe pas déjà. Si elle existe déjà, lance une erreur 409.
 * @param {*} priorityName Nom de la priorité
 * @param {*} priorityId Id de la priorité (-1 par défaut)
 * @returns {Promise<boolean>}
 */
async function validateTaskPriorityDoesNotAlreadyExist(priorityName, priorityId = -1) {
    const normalizedName = priorityName.trim().toLowerCase();
    const anotherPriority = await task_priority.findOne({
        where: where(fn("LOWER", col("task_priority")), normalizedName),
    });

    if (anotherPriority && Number(anotherPriority.id) !== Number(priorityId)) {
        throw createHttpError("Une priorité identique existe déjà.", 409);
    }

    return true;
}

/**
 * Retourne toutes les priorités de tâches.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 */
export async function getAllTaskPriorities(req, res, next) {
    try {
        const priorities = await task_priority.findAll({
            order: [
                ["weigth", "ASC"],
                ["id", "ASC"],
            ],
        });

        res.status(200).json({
            status: 200,
            message: "Priorités récupérées avec succès.",
            data: priorities,
            path: "/api/task_priority/list",
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Crée une nouvelle priorité de tâche.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 */
export async function createTaskPriority(req, res, next) {
    const { task_priority: priorityName, weigth } = req.body;

    try {
        validateTaskPriorityInput(priorityName, weigth);
        await validateTaskPriorityDoesNotAlreadyExist(priorityName);

        const createdPriority = await task_priority.create({
            task_priority: priorityName.trim(),
            weigth: weigth !== undefined && weigth !== null && weigth !== "" ? Number(weigth) : 0,
        });

        res.location(`/api/task_priority/${createdPriority.id}`);
        res.status(201).json({
            status: 201,
            message: "Priorité ajoutée avec succès.",
            data: createdPriority,
            path: `/api/task_priority/${createdPriority.id}`,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
}

/**
 * Modifie une priorité de tâche existante.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 */
export async function replaceTaskPriority(req, res, next) {
    const { task_priority: priorityName, weigth } = req.body;

    try {
        const id = parsePriorityId(req.params.id);
        const priority = await task_priority.findByPk(id);
        if (!priority) {
            return res.status(404).json({
                status: 404,
                message: "Priorité introuvable.",
            });
        }

        validateTaskPriorityInput(priorityName, weigth);
        await validateTaskPriorityDoesNotAlreadyExist(priorityName, id);

        await priority.update({
            task_priority: priorityName.trim(),
            weigth: weigth !== undefined && weigth !== null && weigth !== "" ? Number(weigth) : priority.weigth,
        });

        return res.status(200).json({
            status: 200,
            message: "Priorité modifiée avec succès.",
            data: priority,
            path: `/api/task_priority/${priority.id}`,
            timestamp: new Date().toISOString(),
        });
    } catch (err) {
        next(err);
    }
}

function parsePriorityId(rawId) {
    const numericId = Number(rawId);
    if (!Number.isInteger(numericId) || numericId <= 0) {
        throw createHttpError("L'identifiant de la priorité est invalide.", 400);
    }
    return numericId;
}

async function isPriorityUsedByActiveTasks(priorityId, transaction) {
    const activeTaskCount = await Task.count({
        where: { taskPriorityId: priorityId, archived: false },
        transaction,
    });
    if (activeTaskCount > 0) return true;

    const activeOccurrenceCount = await occurrence_de_tache.count({
        where: { taskPriorityId: priorityId },
        include: [
            {
                model: Task,
                as: "task",
                where: { archived: false },
                required: true,
                attributes: [],
            },
        ],
        transaction,
    });
    return activeOccurrenceCount > 0;
}

async function clearPriorityFromArchivedTasks(priorityId, transaction) {
    const archivedTasks = await Task.findAll({
        where: { archived: true },
        attributes: ["id"],
        transaction,
    });
    const archivedTaskIds = archivedTasks.map((task) => task.id);
    if (archivedTaskIds.length === 0) return;

    await Task.update(
        { taskPriorityId: null },
        { where: { id: archivedTaskIds, taskPriorityId: priorityId }, transaction },
    );
    await occurrence_de_tache.update(
        { taskPriorityId: null },
        { where: { tacheId: archivedTaskIds, taskPriorityId: priorityId }, transaction },
    );
}

/**
 * Supprime une priorité de tâche si aucune tâche active ni aucune occurrence
 * d'une tâche active n'y est liée. Met à null les références des tâches archivées.
 */
export async function deleteTaskPriority(req, res, next) {
    try {
        const id = parsePriorityId(req.params.id);
        await bd.transaction(async (transaction) => {
            const priority = await task_priority.findByPk(id, { transaction });
            if (!priority) {
                throw createHttpError("Priorité introuvable.", 404);
            }
            if (await isPriorityUsedByActiveTasks(id, transaction)) {
                throw createHttpError(
                    "Impossible de supprimer cette priorité car elle est utilisée par au moins une tâche active ou l'une de ses occurrences.",
                    409,
                );
            }
            await clearPriorityFromArchivedTasks(id, transaction);
            await priority.destroy({ transaction });
        });
        return res.status(204).json({});
    } catch (err) {
        next(err);
    }
}
