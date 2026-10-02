import Compte from "../models/compte.mjs"
import bcrypt from "bcrypt";
import { Task } from '../models/bd_index.mjs';


/**
 * Remplit la base de données avec des données de test.
 *
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au backend.
 * @returns {*} Cette fonction ne retourne rien.
 */
const seedDatabase = async (req, res) => {
    try {
        await Compte.destroy({ where: {} });
        await Task.destroy({ where: {} });
        const hashedPassword = await bcrypt.hash("Test1234!", 15);

        await Compte.create(
            {
                prenom: "Antoine",
                nom: "Beaudoin",
                courriel: "antoinebeaudoin@icloud.com",
                motDePasse: hashedPassword,
                role: "personnel_de_terrain"
            });

        await Compte.create(
            {
                prenom: "Colin",
                nom: "Giguère",
                courriel: "admin@admin.com",
                motDePasse: hashedPassword,
                role: "administrateur"
            });

        await Compte.create(
            {
                prenom: "Julien",
                nom: "Morel",
                courriel: "rebcoana@gmail.com",
                motDePasse: hashedPassword,
                role: "administrateur"
            });

        await Compte.create(
            {
                prenom: "Moussa",
                nom: "Dembélé",
                courriel: "coordo@coordo.com",
                motDePasse: hashedPassword,
                role: "coordonnateur"
            });

        await Task.create({
            title: "Préparer la salle polyvalente",
            room: "Salle polyvalente",
            description: "Installer les tables et les chaises nécessaires pour les activités de la journée.",
            startTime: "08:30:00",
            endTime: "09:00:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        });

        await Task.create({
            title: "Nettoyer les vestiaires",
            room: "Vestiaires",
            description: "Nettoyer les planchers, vider les poubelles et vérifier l'état général des vestiaires.",
            startTime: "12:00:00",
            endTime: "12:30:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        });

        await Task.create({
            title: "Ranger le matériel sportif",
            room: "Gymnase",
            description: "Ramasser et ranger les ballons, cônes et autres équipements sportifs après les activités.",
            startTime: "16:00:00",
            endTime: "16:30:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        });

        await Task.create({
            title: "Nettoyage complet du gymnase",
            room: "Gymnase",
            description: "Balayer et laver le plancher du gymnase et nettoyer les surfaces fréquemment touchées.",
            startTime: "17:00:00",
            endTime: "18:00:00",
            recurring: true,
            frequency: "weekly",
            automaticAssignment: false
        });

        await Task.create({
            title: "Nettoyer les salles après les activités",
            room: "Salles d'activités",
            description: "Ramasser les déchets, replacer le mobilier et nettoyer les surfaces utilisées pendant les activités.",
            startTime: "17:30:00",
            endTime: "18:30:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        });

        await Task.create({
            title: "Vider les poubelles",
            room: "Centre de loisirs",
            description: "Vider les poubelles des différentes salles et remplacer les sacs.",
            startTime: "18:30:00",
            endTime: "19:00:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        });

        res.status(200).json({
            message:
                "La base de données a été intialisée avec succès.",
        });
    }
    catch (e) {
        res
            .status(500)
            .json({ error: "Internal Server Error", message: e.message });
    }
}

export { seedDatabase };