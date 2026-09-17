import Compte from "../models/compte.mjs";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import bcrypt from "bcrypt";

dotenv.config();

export async function createUser(req, res, next){
    const {nom,prenom,nomUtilisateur,courriel,mdp} = req.body;
    try{
        let hashedPassword = await bcrypt.hash(mdp, 15);
        let unUtilisateur = new
    }
}