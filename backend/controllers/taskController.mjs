import {Task, TaskImage} from '../models/bd_index.mjs';
import { put } from "@vercel/blob";
import dotenv from "dotenv";

dotenv.config();

export async function createTask(req, res, next) {
    const {titre, local, description, startTime,
        endTime, recurring, frequency,
        automaticAssignment} = req.body;

    try {
        const anotherTask = await Task.findOne({
            where: {
                titre: titre,
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

        const theFrequency = frequency || "daily";
        const aTask = await Task.create({
            titre,
            local,
            description: description ?? null,
            startTime,
            endTime,
            recurring,
            theFrequency,
            automaticAssignment
        });

       if (req.files) {
            for (const file of req.files) {
                const blob = await put(
                    `task/${aTask.id}/${file.originalname}`,
                    file.buffer,
                    {
                        access: "public",
                        contentType: file.mimetype
                    }
                );

                await TaskImage.create({
                    taskId: aTask.id,
                    filename: file.originalname,
                    path: blob.url,
                    mimeType: file.mimetype
                });
            }
        }

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

export async function getAllTasks(req, res, next)
{
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

export async function replaceTask(req, res, next)
{

}


export async function deleteTask(req, res, next) {
    const id = req.params.id;
    try {
       const aTask = await Task.findOne({
            where: {
                id: id
            }
        });

        if (aTask)
        {
            aTask.archived = true;
    
            await aTask.save();
        }

        res.status(204).json({});
    }
    catch (err) {
        next(err);
    }
}