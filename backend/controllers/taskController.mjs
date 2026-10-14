import { Task, TaskImage } from '../models/bd_index.mjs';
import { put, del } from "@vercel/blob";
import { Op } from 'sequelize';
import dotenv from "dotenv";

dotenv.config();

/**
 * Valide qu'une tâche n'existe pas déjà. Si la tâche existe déjà lance une erreur 409
 * @param {*} title Titre de la tâche
 * @param {*} room Local de la tâche
 * @param {*} startTime Heure de début de la tâche
 * @param {*} endTime Heure de fin de la tâche
 * @param {*} taskId Id de la tâche (-1 par défaut)
 * @returns 
 */
async function validateTaskDoesNotAlreadyExist(title, room, startTime, endTime, taskId = -1) {
    const anotherTask = await Task.findOne({
        where: {
            title: title,
            room: room,
            startTime: startTime,
            endTime: endTime
        }
    });
    if (taskId !== -1) {
        if (anotherTask?.id !== taskId) {
            return false;
        }
        return true;
    }
    if (anotherTask) {
        const error = new Error("Une tâche identique existe déjà.");
        error.statusCode = 409;
        throw error;
    }
}

/**
 * Ajoute les images d'une tâche à la bd (Blob)
 * @param {*} req La requête
 * @param {*} task La tâche dont les images appartiennent
 */
async function addTaskImages(req, task) {
    if (req.files) {
        for (const file of req.files) {
            const blob = await put(
                `task/${task.id}/${file.originalname}`,
                file.buffer,
                {
                    access: "public",
                    contentType: file.mimetype
                }
            );
            await TaskImage.create({
                taskId: task.id,
                filename: file.originalname,
                path: blob.url,
                mimeType: file.mimetype
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
                contentType: image.mimeType
            }
        );
        await TaskImage.create({
            taskId: newTask.id,
            filename: image.filename,
            path: blob.url,
            mimeType: image.mimeType
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
            existingIds = JSON.parse(req.body.existingImageIds).map(id => Number(id));
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
                    console.error(`Erreur lors de la suppression sur Vercel Blob (${image.path}):`, err);
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
    const { title, room, description, startTime,
        endTime, recurring, frequency,
        automaticAssignment } = req.body;
    try {
        let taskExists = await validateTaskDoesNotAlreadyExist(title, room, startTime, endTime);
        if (taskExists) {
            return res.status(409).json({
                status: 409,
                message: "Une tâche identique existe déjà."
            });
        }
        const theFrequency = frequency || "daily";
        const aTask = await Task.create({
            title,
            room,
            description: description ?? null,
            startTime,
            endTime,
            recurring,
            theFrequency,
            automaticAssignment
        });
        await addTaskImages(req, aTask);

        const theCreatedTask = await Task.findOne({
            where: {
                id: aTask.id
            },
            include: { model: TaskImage, as: 'images' }
        });
        res.location(`/api/tasks/${aTask.id}`);
        res.status(201).json({
            status: 201,
            message: "Tâche ajoutée",
            data: theCreatedTask,
            path: `/api/task/${aTask.id}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
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
                archived: false
            },
            include: { model: TaskImage, as: 'images' }
        });

        res.status(200).json(
            {
                status: 200,
                message: "Tâches récupérés avec succès.",
                data: tasks,
                path: `/api/task/list`,
                timestamp: new Date().toISOString()
            }
        )
    } catch (err) {
        next(err);
    }
}

export async function replaceTask(req, res, next) {
    const id = req.params.id;
    const {
        title, room, description, startTime, endTime, recurring, frequency, automaticAssignment
    } = req.body;
    try {
        const task = await Task.findOne({
            where: {
                id: id,
                archived: false
            }
        });
        if (!task) {
            return res.status(404).json({
                status: 404,
                message: "Tâche introuvable."
            });
        }
        let taskExists = await validateTaskDoesNotAlreadyExist(title, room, startTime, endTime, id);
        if (taskExists) {
            return res.status(409).json({
                status: 409,
                message: "Une tâche identique existe déjà."
            });
        }
        await task.update({
            title,
            room,
            description: description ?? null,
            startTime,
            endTime,
            recurring,
            theFrequency: frequency || "daily",
            automaticAssignment
        });
        await syncExistingImages(req, task.id);
        await addTaskImages(req, task);
        const updatedTask = await Task.findOne({
            where: {
                id: task.id
            },
            include: { model: TaskImage, as: 'images' }
        })
        return res.status(200).json({
            status: 200,
            message: "Tâche modifiée avec succès.",
            data: updatedTask,
            path: `/api/task/${task.id}`,
            timestamp: new Date().toISOString()
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
            include: { model: TaskImage, as: 'images' }
        });
        if (!originalTask) {
            return res.status(404).json({
                status: 404,
                message: "Tâche introuvable."
            });
        }
        // Retire le suffixe " - Copie #N" du titre afin de retrouver le titre original.
        // Exemple : "Nettoyage - Copie #3" devient "Nettoyage".
        const baseTitle = originalTask.title.replace(/\s-\sCopie\s#\d+$/, '');
        const copies = await Task.findAll({
            where: { title: { [Op.like]: `${baseTitle} - Copie #%` } }
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
        await validateTaskDoesNotAlreadyExist(newTitle, originalTask.room, originalTask.startTime, originalTask.endTime);
        const newTask = await createDuplicatedTaskObject(newTitle, originalTask);
        await copyExistingImages(originalTask, newTask);
        const createdTask = await Task.findOne({
            where: { id: newTask.id },
            include: { model: TaskImage, as: 'images' }
        });
        return res.status(201).json({
            status: 201,
            message: "Tâche dupliquée avec succès.",
            data: createdTask,
            path: `/api/task/${newTask.id}`,
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        next(err);
    }
}

async function createDuplicatedTaskObject(newTitle, originalTask) {
    return await Task.create({
        title: newTitle,
        room: originalTask.room,
        description: originalTask.description,
        startTime: originalTask.startTime,
        endTime: originalTask.endTime,
        recurring: originalTask.recurring,
        theFrequency: originalTask.theFrequency,
        automaticAssignment: originalTask.automaticAssignment,
        archived: false
    });
}

export async function deleteTask(req, res, next) {
    const id = req.params.id;
    try {
        const aTask = await Task.findOne({
            where: {
                id: id
            }
        });

        if (aTask) {
            aTask.archived = true;

            await aTask.save();
        }

        res.status(204).json({});
    }
    catch (err) {
        next(err);
    }
}