import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export async function createUser(req, res, next){
    const {nom,prenom,courriel,mdp} = req.body;
    try{
        let hashedPassword = await bcrypt.hash(mdp, 15);
        let user = Compte.build({
            prenom: prenom,
            nom: nom,
            courriel: courriel,
            motDePasse: hashedPassword,
            approuve: false
        });

        await user.save();

        const userResponse = user.toObject();
        delete userResponse.motDePasse;
        delete userResponse.role;
        delete userResponse.approuve;

        res.location(`/api/account/${user.id}`);
        res.status(201).json({
            status: 201,
            message: "Utilisateur créé",
            data: {
                user: userResponse
            },
            path: `/api/account/register`,
            timestamp: new Date().toIsoString()
        })
    }
    catch(err){
        next(err);
    }   
}