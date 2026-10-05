import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";
import {validatePassword} from "../utils/utils.mjs";

dotenv.config();


/**
 * Créé un utilisateur avec un nom, un prénom, un courriel, un mot de passe qui sera hashé, 
 * ainsi qu'un rôle. 
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au backend.
 * @param {*} next Le prochain middleware à appeler, utilisé en cas d'erreur.
 * @returns {*} Cette fonction ne retourne rien.
 */
export async function createUser(req, res, next) {
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
 * Authentifie un utilisateur et génère un jeton JWT que le client peut utiliser 
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à appeler, utilisé en cas d'erreur.
 * @returns {unknown} Retourne le prochain résultat au middleware, en cas d'erreur.
 */
export async function loginUser(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await Compte.findOne({ where: { courriel: email } });

    if (!user) {
      let error = new Error("Courriel ou mot de passe invalide.");
      error.statusCode = 401;
      return next(error);
    }

    const isEqual = await bcrypt.compare(password, user.motDePasse);

    if (!isEqual) {
      let error = new Error("Courriel ou mot de passe invalide.");
      error.statusCode = 401;
      return next(error);
    }
    if (user.IsArchived) {
      let error = new Error("Ce compte est archivé.");
      error.statusCode = 403;
      return next(error);
    }

    const userResponse = user.get({ plain: true });

    delete userResponse.motDePasse;

    const token = jwt.sign(
      {
        email: user.courriel,
        id: user.id,
        role: user.role,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    res.status(200).json({
      status: 200,
      message: "Utilisateur authentifié avec succès",
      data: {
        user: userResponse,
        token: token,
      },
      path: `/api/account/login`,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    next(err);
  }
}

/**
 * Change le mot de passe d'un compte utilisateur dans la base de données.
 *
 * @export
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au frontend.
 * @param {*} next Le prochain middleware à exécuter, s'il y a une erreur.
 * @returns {unknown} Cette fonction retourne une erreur, si nécessaire.
 */
export async function changePassword(req, res, next) {
    const { currentPassword, newPassword, id } = req.body;

    try {
        if (!currentPassword || !newPassword) {
            const error = new Error(
                "Le nouveau et l'ancien mot de passe sont requis."
            );
            error.statusCode = 400;
            throw error;
        }

        if (!validatePassword(newPassword)) {
            const error = new Error(
                "Le mot de passe doit contenir 8 caractères, dont au moins 1 majuscule, minuscule, caractère spécial et chiffre."
            );
            error.statusCode = 422;
            throw error;
        }

        const user = await Compte.findOne({
            where: { id }
        });

        if (!user) {
            const error = new Error("Compte introuvable.");
            error.statusCode = 404;
            throw error;
        }

        const isCurrentPasswordValid = await bcrypt.compare(
            currentPassword,
            user.motDePasse
        );

        if (!isCurrentPasswordValid) {
            const error = new Error("L'ancien mot de passe est invalide.");
            error.statusCode = 401;
            throw error;
        }

        const isSamePassword = await bcrypt.compare(
            newPassword,
            user.motDePasse
        );

        if (isSamePassword) {
            const error = new Error(
                "Le nouveau mot de passe doit être différent de l'ancien mot de passe."
            );
            error.statusCode = 422;
            throw error;
        }

        user.motDePasse = await bcrypt.hash(newPassword, 15);

        await user.save();

        res.status(200).json({
            status: 200,
            message: "Mot de passe du profil mis à jour avec succès.",
            path: "/api/account/password",
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        next(err);
    }
}
