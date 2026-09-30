import { Task, TaskImage } from '../models/bd_index.mjs';
import { put, del } from "@vercel/blob";
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