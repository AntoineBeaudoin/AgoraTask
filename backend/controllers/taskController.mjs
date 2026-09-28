import { Task, TaskImage } from '../models/bd_index.mjs';
import { put } from "@vercel/blob";
import dotenv from "dotenv";

dotenv.config();

/**
 * Valide qu'une tâche n'existe pas déjà. Si la tâche existe déjà lance une erreur 409
 * @param {*} title Titre de la tâche
 * @param {*} local Local de la tâche
 * @param {*} startTime Heure de début de la tâche
 * @param {*} endTime Heure de fin de la tâche
 * @param {*} taskId Id de la tâche (-1 par défaut)
 * @returns 
 */
async function validateTaskDoesNotAlreadyExist(title, local, startTime, endTime, taskId = -1) {
    const anotherTask = await Task.findOne({
        where: {
            title: title,
            local: local,
            startTime: startTime,
            endTime: endTime
        }
    });
    if (anotherTask) {
        const error = new Error("Une tâche identique existe déjà.");
        error.statusCode = 409;
        throw error;
    }
    if (taskId !== -1) {
        if (anotherTask.id !== task.id) {
            return res.status(409).json({
                status: 409,
                message: "Une tâche identique existe déjà."
            });
        }
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

export async function createTask(req, res, next) {
    const { title, local, description, startTime,
        endTime, recurring, frequency,
        automaticAssignment } = req.body;

    validateTaskDoesNotAlreadyExist(title, local, startTime, endTime);
    try {
        const theFrequency = frequency || "daily";
        const aTask = await Task.create({
            title,
            local,
            description: description ?? null,
            startTime,
            endTime,
            recurring,
            theFrequency,
            automaticAssignment
        });
        addTaskImages(req, atask);
        res.location(`/api/tasks/${aTask.id}`);
        res.status(201).json({
            status: 201,
            message: "Tâche ajoutée",
            data: aTask,
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
            }
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
        title, local, description, startTime, endTime, recurring, frequency, automaticAssignment
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
        validateTaskDoesNotAlreadyExist(title, local, startTime, endTime, id)
        await task.update({
            title,
            local,
            description: description ?? null,
            startTime,
            endTime,
            recurring,
            theFrequency: frequency || "daily",
            automaticAssignment
        });
        addTaskImages(req, task);
        const updatedTask = await Task.findByPk(task.id);
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