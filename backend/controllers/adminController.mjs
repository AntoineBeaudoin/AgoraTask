import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();
export async function getAllUsers(req, res, next) {
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
        return res.status(400).json({
          status: 400,
          message: "Le paramètre archived doit être true ou false.",
        });
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
        return res.status(400).json({
          status: 400,
          message: "Rôle invalide.",
        });
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

// export async function editApproval(req, res, next) {
//   try {
//     const { userId, newApprovalStatus } = req.body;
//     const user = await Compte.findByPk(userId);
//     if (!user || user.IsArchived) {
//       return res.status(404).json({
//         status: 404,
//         message: "Utilisateur non trouvé",
//         data: null,
//         error: null,
//       });
//     }
//     await user.update({ approuve: newApprovalStatus });
//     res.status(200).json({
//       status: 200,
//       message: "Statut d'approbation de l'utilisateur mis à jour avec succès",
//       data: {
//         user: user,
//       },
//       error: null,
//     });
//   } catch (error) {
//     next(error);
//   }
// }

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
