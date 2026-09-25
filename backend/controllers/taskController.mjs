import Task from '../models/task.mjs';
import dotenv from "dotenv";

dotenv.config();

export async function createTask(req, res, next){
    const {titre,local,description,
        startTime,endTime,recurring,
        frequency, automaticAssignment} = req.body;
    try{
        let start = new Date(startTime);
        let end = new Date(endTime);
        const anotherTask = await Task.findOne({
            where: {
                titre: titre,
                local: local,
                startTime: start,
                endTime: end
            }
        });
        if (anotherTask) {
            const error = new Error("Une tâche identique existe déjà.");
            error.statusCode = 409;
            throw error;
        }

        const aTask = Task.build({
            titre: titre,
            local: local,
            description: description ?? null,
            startTime: start,
            endTime: end,
            recurring: recurring,
            frequency: frequency,
            automaticAssignment: automaticAssignment
        });

        await aTask.save();

        res.location(`/api/campsites/${aTask.id}`);
        res.status(201).json({
            status: 201,
            message: "Tâche ajoutée",
            data: aTask,
            path: `/api/campsites/${aTask.id}`,
            timestamp: new Date().toISOString()
        });
    }
    catch(err){
        next(err);
    }   
}

export async function replaceTask(req, res, next)
{

}


export async function deleteTask(req, res, next) {
    const id = req.params.id;
    try {
       const aTask = Task.findOne({
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