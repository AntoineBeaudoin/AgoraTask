import {Task, TaskImage} from '../models/bd_index.mjs';
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

        const aTask = await Task.create({
            titre,
            local,
            description: description ?? null,
            startTime,
            endTime,
            recurring,
            frequency,
            automaticAssignment
        });

        if (req.files) {
            for (const file of req.files) {
                await TaskImage.create({
                    taskId: aTask.id,
                    filename: file.filename,
                    path: `/uploads/tasks/${file.filename}`,
                    mimeType: file.mimetype
                });
            }
        }

        res.location(`/api/tasks/${aTask.id}`);
        res.status(201).json({
            status: 201,
            message: "Tâche ajoutée",
            data: aTask,
            path: `/api/tasks/${aTask.id}`,
            timestamp: new Date().toISOString()
        });
    }
    catch (err) {
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