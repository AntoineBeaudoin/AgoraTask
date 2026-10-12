import { Task, Poste } from '../models/bd_index.mjs';
import bd from "../models/bd.mjs";
import dotenv from "dotenv";

dotenv.config();

/**
 * Créé un poste avec un nom, une description et les tâches associées à celui-ci.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, utilisé en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function createPoste(req, res, next) {
    const { nom, description, tasks = [] } = req.body;

    if (!nom || !nom.trim()) {
        return res.status(400).json({
            message: "Le nom du poste est requis."
        });
    }

    if (!Array.isArray(tasks)) {
        return res.status(400).json({
            message: "Les tâches doivent être fournies sous forme de tableau d'dentifiants."
        });
    }

    const transaction = await bd.transaction();

    try {
        const poste = await Poste.create({
            nom: nom.trim(),
            description: description?.trim() ?? ""
        }, { transaction });

        if (tasks.length > 0) {
            await poste.setTasks(tasks, { transaction });
        }

        await transaction.commit();

        return res.status(201).json({
            message: "Le poste a été créé avec succès.",
            poste: {
                ...poste.toJSON(),
                tasks
            }
        });
    } catch (error) {
        await transaction.rollback();
        next(error);
    }
}

/**
 * Modifie un poste et les tâches qui lui sont associées.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function updatePoste(req, res, next) {
    const { id } = req.params;
    const { nom, description, tasks = [] } = req.body;

    if (!nom || !nom.trim()) {
        return res.status(400).json({
            message: "Le nom du poste est requis."
        });
    }

    if (!Array.isArray(tasks)) {
        return res.status(400).json({
            message: "Les tâches doivent être fournies sous forme de tableau d'identifiants."
        });
    }

    const transaction = await bd.transaction();

    try {
        const poste = await Poste.findByPk(id, { transaction });

        if (!poste) {
            await transaction.rollback();
            return res.status(404).json({
                message: "Le poste est introuvable."
            });
        }

        await poste.update({
            nom: nom.trim(),
            description: description?.trim() ?? ""
        }, { transaction });

        await poste.setTasks(tasks, { transaction });

        await transaction.commit();

        const posteMisAJour = await Poste.findByPk(id, {
            include: [{
                model: Task,
                as: "tasks",
                attributes: ["id", "title", "description"],
                through: { attributes: [] }
            }]
        });

        return res.status(200).json({
            status: 200,
            message: "Le poste a été modifié avec succès.",
            data: posteMisAJour,
            path: `/api/poste/${id}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        if (!transaction.finished) {
            await transaction.rollback();
        }
        next(error);
    }
}

/**
 * Retourne tous les postes qui ne sont pas archivés, ainsi que chacune des tâches associées.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function getAllPostes(req, res, next) {
    try {
        const postes = await Poste.findAll({
            where: {
                archived: false
            },
            include: [{
                model: Task,
                as: 'tasks',
                attributes: [
                    'id',
                    'title',
                    'description',
                ],
                through: {
                    attributes: []
                }
            }]
        });

        return res.status(200).json({
            status: 200,
            message: "Postes récupérés avec succès.",
            data: postes,
            path: "/api/poste/list",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        next(err);
    }
}


/**
 * Supprime un poste de travail par son identifiant.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function deletePoste(req, res, next) {
    const id = req.params.id;
    try {
        const aPoste = await Poste.findOne({
            where: {
                id: id
            }
        });

        if (aPoste) {
            aPoste.archived = true;

            await aPoste.save();
        }

        res.status(204).json({});
    }
    catch (err) {
        next(err);
    }
}

