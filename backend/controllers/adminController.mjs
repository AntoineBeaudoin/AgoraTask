import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
export async function getAllUsers(req, res, next) {
  try {
    const users = await Compte.findAll({
      attributes: { exclude: ["motDePasse"] },
    });
    res.status(200).json({
      status: 200,
      message: "Liste des utilisateurs récupérée avec succès",
      data: {
        users: users,
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
      return res.status(404).json({
        status: 404,
        message: "Utilisateur non trouvé",
        data: null,
        error: null,
      });
    }
    if (
      newRole == "administrateur" ||
      newRole == "coordonnateur" ||
      newRole == "utilisateur"
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
      res.status(400).json({
        status: 400,
        message: "Rôle invalide. Veuillez choisir un rôle valide.",
        data: null,
        error: null,
      });
    }
  } catch (error) {
    next(error);
  }
}

export async function editApproval(req, res, next) {
  try {
    const { userId, newApprovalStatus } = req.body;
    const user = await Compte.findByPk(userId);
    if (!user || user.IsArchived) {
      return res.status(404).json({
        status: 404,
        message: "Utilisateur non trouvé",
        data: null,
        error: null,
      });
    }
    await user.update({ approuve: newApprovalStatus });
    res.status(200).json({
      status: 200,
      message: "Statut d'approbation de l'utilisateur mis à jour avec succès",
      data: {
        user: user,
      },
      error: null,
    });
  } catch (error) {
    next(error);
  }
}

export async function EditUserIsArchived(req, res, next) {
  try {
    const { userId, IsArchived } = req.body;
    const user = await Compte.findByPk(userId);
    if (!user) {
      return res.status(404).json({
        status: 404,
        message: "Utilisateur non trouvé",
        data: null,
        error: null,
      });
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
