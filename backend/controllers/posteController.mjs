import { Task, Poste, Compte } from '../models/bd_index.mjs';
import bd from "../models/bd.mjs";
import dotenv from "dotenv";
import { emptyString } from '../utils/checks.mjs';
import { createHttpError } from '../utils/httpError.mjs';
import { Op } from 'sequelize';

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

    if (emptyString(nom) || emptyString(description)){
        throw createHttpError(400, "Le poste spécifié doit contenir un nom et une description.");
    }

    const aSimilarPoste = await Poste.findOne({
        where: {
            nom: nom,
            description: description
        }
    });

    if (aSimilarPoste) {
        throw createHttpError(409, "Un poste avec un nom et une description identique existe déjà.");
    }

    if (!nom || !nom.trim()) {
        throw createHttpError(400, "Le nom du poste est requis.");
    }

    if (!Array.isArray(tasks)) {
        throw createHttpError(400, "Les tâches doivent être fournies sous forme de tableau d'identifiants.");
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

    if ( !id || emptyString(nom) || emptyString(description)){
        throw createHttpError(400, "Le poste spécifié doit contenir un nom et une description.");
    }

    const aSimilarPoste = await Poste.findOne({
        where: {
            id: { [Op.ne]: id },
            nom: nom,
            description: description
        }
    });

    if (aSimilarPoste) {
        throw createHttpError(409, "Un poste avec un nom et une description identique existe déjà.");
    }

    if (!nom || !nom.trim()) {
        throw createHttpError(400, "Le nom du poste est requis.");
    }

    if (!Array.isArray(tasks)) {
        throw createHttpError(400, "Les tâches doivent être fournies sous forme de tableau d'identifiants.");
    }

    const transaction = await bd.transaction();

    try {
        const poste = await Poste.findByPk(id, { transaction });

        if (!poste) {
            await transaction.rollback();
            throw createHttpError(404, "Le poste est introuvable");
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
 * Retourne les postes selon leur statut d'archivage, ainsi que les tâches associées.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {*} Le statut de la requête.
 */
export async function getPostes(req, res, next) {
    try {
        const { archived } = req.query;
        const where = {};

        if (archived === 'true') {
            where.archived = true;
        } else if (archived === 'false') {
            where.archived = false;
        }

        const postes = await Poste.findAll({
            where,
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
    }
    catch (err) {
        next(err);
    }
}


/**
 * Retroune l'identifiant du poste d'un employé, s'il en a un.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {unknown} Le statut de la requête.
 */
export async function getEmployeePosteId(req, res, next) {
    try {
        const { id } = req.params;

        const employe = await Compte.findOne({
            where: { id },
            attributes: ['id', 'posteId']
        });

        if (!employe) {
            throw createHttpError(404, "L'employé demandé n'existe pas.");
        }

        return res.status(200).json({
            status: 200,
            message: "Poste de l'employé récupéré avec succès.",
            data: {
                employeId: employe.id,
                posteId: employe.posteId
            },
            path: `/api/poste/employe/${id}`,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        next(error);
    }
}

/**
 * Assigne ou retire un poste de travail à un employé.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {unknown} Retourne le statut de la requête en JSON.
 */
export async function assignPosteToEmployee(req, res, next) {
    const { id } = req.params;
    const { posteId } = req.body;

    const transaction = await bd.transaction();

    try {
        const employe = await Compte.findOne({
            where: { id },
            transaction
        });

        if (!employe) {
            await transaction.rollback();
            throw createHttpError(404, "L'employé demandé n'existe pas.");
        }

        let poste = null;

        if (posteId !== null) {
            poste = await Poste.findOne({
                where: { id: posteId },
                transaction
            });

            if (!poste) {
                await transaction.rollback();
                throw createHttpError(404, "Le poste demandé n'existe pas.");
            }

            if (poste.archived) {
                await transaction.rollback();
                throw createHttpError(400, "Impossible d'assigner un poste archivé.");
            }
        }

        await employe.update({
            posteId: poste ? poste.id : null
        }, { transaction });

        await transaction.commit();

        return res.status(200).json({
            status: 200,
            message: poste
                ? "Le poste a été assigné à l'employé avec succès."
                : "Le poste de l'employé a été retiré avec succès.",
            data: {
                employeId: employe.id,
                posteId: employe.posteId
            },
            path: `/api/poste/employe/${id}`,
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

/**
 * Réactiver un poste de travail par son identifiant.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function reactivatePoste(req, res, next) {
    const id = req.params.id;
    try {
        const aPoste = await Poste.findOne({
            where: {
                id: id
            }
        });

        if (aPoste) {
            aPoste.archived = false;

            await aPoste.save();
        }

        res.status(200).json({});
    }
    catch (err) {
        next(err);
    }
}

