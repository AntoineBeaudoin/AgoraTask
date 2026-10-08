import { Task, Poste } from '../models/bd_index.mjs';
import dotenv from "dotenv";

dotenv.config();

/**
 * Créé un poste avec un nom et des tâches associés à celui-ci.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au backend.
 * @param {*} next Le prochain middleware à appeler, utilisé en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function createPoste(req, res, next) {
  const { nom, prenom, courriel, mdp, role } = req.body;
  try {
    let hashedPassword = await bcrypt.hash(mdp, 15);
    let user = Compte.build({
      prenom: prenom,
      nom: nom,
      courriel: courriel,
      motDePasse: hashedPassword,
      role: role,
    });

    await user.save();

    const userResponse = user.get({ plain: true });
    delete userResponse.motDePasse;
    delete userResponse.role;
    delete userResponse.approuve;

    res.location(`/api/account/${user.id}`);
    res.status(201).json({
      status: 201,
      message: "Utilisateur créé",
      data: {
        user: userResponse,
      },
      path: `/api/account/register`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Retourne toutes les postes qui ne sont pas archivés, ainsi que chacune des urls des images qui lui sont associés.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middlware à appeler, en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function getAllPostes(req, res, next) {
    try {
        let postes = await Poste.findAll({
            where: {
                archived: false
            },
            include: { model: Task, as: 'tasks' }
        });

        res.status(200).json(
            {
                status: 200,
                message: "Postes récupérés avec succès.",
                data: postes,
                path: `/api/poste/list`,
                timestamp: new Date().toISOString()
            }
        )
    } catch (err) {
        next(err);
    }
}

