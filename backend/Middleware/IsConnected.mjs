import jwt from "jsonwebtoken";
import Compte from "../models/compte.mjs";

export const isConnected = async (req, res, next) => {
  try {
    const authHeader = req.get("Authorization");

    // Aucun token
    if (!authHeader) {
      const error = new Error("Token d'authentification manquant.");
      error.statusCode = 401;
      return next(error);
    }

    // On exige : Authorization: Bearer TOKEN
    const [type, token] = authHeader.split(" ");

    if (type !== "Bearer" || !token) {
      const error = new Error("Format du token invalide.");
      error.statusCode = 401;
      return next(error);
    }

    // Vérification cryptographique du JWT
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);

    // On vérifie que le compte existe toujours
    const compte = await Compte.findByPk(decodedToken.id);

    if (!compte) {
      const error = new Error("Compte introuvable.");
      error.statusCode = 401;
      return next(error);
    }

    // Compte archivé
    if (compte.IsArchived) {
      const error = new Error("Ce compte est archivé.");
      error.statusCode = 403;
      return next(error);
    }

    // // Compte pas encore approuvé
    // if (!compte.approuve) {
    //   const error = new Error("Ce compte n'est pas encore approuvé.");
    //   error.statusCode = 403;
    //   return next(error);
    // }

    req.user = {
      id: compte.id,
      prenom: compte.prenom,
      nom: compte.nom,
      courriel: compte.courriel,
      role: compte.role,
    };

    next();
  } catch (error) {
    if (
      error.name === "JsonWebTokenError" ||
      error.name === "TokenExpiredError"
    ) {
      error.statusCode = 401;
    }

    next(error);
  }
};

export default isConnected;
