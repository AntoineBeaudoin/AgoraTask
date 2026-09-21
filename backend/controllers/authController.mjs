import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export async function createUser(req, res, next) {
  const { nom, prenom, courriel, mdp } = req.body;
  try {
    let hashedPassword = await bcrypt.hash(mdp, 15);
    let user = Compte.build({
      prenom: prenom,
      nom: nom,
      courriel: courriel,
      motDePasse: hashedPassword,
      approuve: false,
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

export async function loginUser(req, res, next) {
  const { email, password } = req.body;
  try {
    const user = await Compte.findOne({ where: { courriel: email } });

    if (!user) {
      const error = new Error(`Courriel ou mot de passe invalide.`);
      error.statusCode = 401;
      throw error;
    }

    const isEqual = await bcrypt.compare(password, user.motDePasse);

    if (!isEqual) {
      const error = new Error(`Courriel ou mot de passe invalide.`);
      error.statusCode = 401;
      throw error;
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
