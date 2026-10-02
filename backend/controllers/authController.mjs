import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

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
