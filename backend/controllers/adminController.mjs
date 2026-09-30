import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
export async function getAllUsersWithFilter(req, res, next) {
  try {
    const { archived, role } = req.query;

    const whereCondition = {};

    // Filtre archived seulement s'il est fourni
    if (archived !== undefined) {
      if (archived === "true") {
        whereCondition.IsArchived = true;
      } else if (archived === "false") {
        whereCondition.IsArchived = false;
      } else {
        let error = new Error();
        error.statusCode = 400;
        error.message =
          "Paramètre 'archived' invalide. Utilisez 'true' ou 'false'.";
        next(error);
      }
    }

    // Filtre role seulement s'il est fourni
    if (role !== undefined) {
      const rolesValides = [
        "administrateur",
        "coordonnateur",
        "personnel_de_terrain",
      ];

      if (!rolesValides.includes(role)) {
        let error = new Error();
        error.statusCode = 400;
        error.message = "Rôle invalide.";
        next(error);
      }

      whereCondition.role = role;
    }

    const users = await Compte.findAll({
      where: whereCondition,
      attributes: {
        exclude: ["motDePasse"],
      },
    });

    res.status(200).json({
      status: 200,
      message: "Liste des utilisateurs récupérée avec succès",
      data: {
        users,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
export async function editRule(req, res, next) {
  try {
    const { userId, newRole } = req.body;
    const user = await Compte.findByPk(userId);
    if (!user || user.IsArchived) {
      let error = new Error("Utilisateur introuvable ou archivé.");
      error.statusCode = 404;
      return next(error);
    }
    if (
      newRole == "administrateur" ||
      newRole == "coordonnateur" ||
      newRole == "personnel_de_terrain"
    ) {
      await user.update({ role: newRole });
      res.status(200).json({
        status: 200,
        message: "Rôle de l'utilisateur mis à jour avec succès",
        data: {
          user: user,
        },
        error: null,
      });
    } else {
      let error = new Error("Rôle invalide. Veuillez choisir un rôle valide.");
      error.statusCode = 400;
      next(error);
    }
  } catch (error) {
    next(error);
  }
}

export async function EditUserIsArchived(req, res, next) {
  try {
    const { userId, IsArchived } = req.body;
    const user = await Compte.findByPk(userId);
    if (!user) {
      let error = new Error("Utilisateur introuvable.");
      error.statusCode = 404;
      return next(error);
    }
    await user.update({ IsArchived: IsArchived });
    res.status(200).json({
      status: 200,
      message: "Statut d'archivage de l'utilisateur mis à jour avec succès",
      data: {
        user: user,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}
