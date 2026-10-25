import { Task, Poste, Compte } from '../models/bd_index.mjs';
import bd from "../models/bd.mjs";
import dotenv from "dotenv";
import { Op } from 'sequelize';
import { emptyString } from '../utils/checks.mjs';

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
        return res.status(400).json({
            status: 400,
            message: "Le poste spécifié doit contenir un nom et une description."
        })
    }

    const aSimilarPoste = await Poste.findOne({
        where: {
            nom: nom,
            description: description
        }
    });

    if (aSimilarPoste) {
        return res.status(409).json({
            status: 409,
            message: "Un poste avec un nom et une description identique existe déjà."
        })
    }

    if (!nom || !nom.trim()) {
        return res.status(400).json({
            status: 400,
            message: "Le nom du poste est requis."
        });
    }

    if (!Array.isArray(tasks)) {
        return res.status(400).json({
            status: 400,
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

    if ( !id || emptyString(nom) || emptyString(description)){
        return res.status(400).json({
            status: 400,
            message: "Le poste spécifié doit contenir un nom et une description."
        })
    }

    const aSimilarPoste = await Poste.findOne({
        where: {
            id: { [Op.ne]: id },
            nom: nom,
            description: description
        }
    });

    if (aSimilarPoste) {
        return res.status(409).json({
            status: 409,
            message: "Un poste avec un nom et une description identique existe déjà."
        })
    }

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
 * Retourne les postes selon leur statut d'archivage, ainsi que les tâches associées.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
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
 * Assigne un poste de travail à des employés.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, en cas d'erreur.
 * @returns {unknown} Retourne le statut de la requête en JSON.
 */
export async function assignPosteToEmployees(req, res, next) {
    const { id } = req.params;
    const { comptes } = req.body;

    if (!Array.isArray(comptes)) {
        return res.status(400).json({
            status: 400,
            message: "Les employés doivent être fournis sous forme de tableau d'identifiants."
        });
    }
    const comptesIds = [...new Set(comptes)];
    if (comptesIds.some(compteId =>
        !Number.isInteger(Number(compteId)) ||
        Number(compteId) <= 0
    )) {
        return res.status(400).json({
            status: 400,
            message: "Un ou plusieurs identifiants d'employés sont invalides."
        });
    }
    const transaction = await bd.transaction();
    try {
        const poste = await Poste.findByPk(id, { transaction });
        if (!poste) {
            await transaction.rollback();

            return res.status(404).json({
                status: 404,
                message: "Le poste est introuvable."
            });
        }

        const employes = await Compte.findAll({
            where: {
                id: comptesIds.map(Number)
            },
            transaction
        });

        if (employes.length !== comptesIds.length) {
            await transaction.rollback();

            return res.status(404).json({
                status: 404,
                message: "Un ou plusieurs employés sont introuvables."
            });
        }

        await Compte.update(
            { posteId: null },
            {
                where: { posteId: poste.id },
                transaction
            }
        );

        if (comptesIds.length > 0) {
            await Compte.update(
                { posteId: poste.id },
                {
                    where: {
                        id: comptesIds.map(Number)
                    },
                    transaction
                }
            );
        }
        await transaction.commit();
        const posteMisAJour = await Poste.findByPk(poste.id, {
            include: [{
                model: Compte,
                as: "employes",
                attributes: ["id", "prenom", "nom", "courriel"]
            }]
        });

        return res.status(200).json({
            status: 200,
            message: "Les employés ont été assignés au poste avec succès.",
            data: posteMisAJour,
            path: `/api/poste/${id}/employes`,
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

