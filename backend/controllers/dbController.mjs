import bcrypt from "bcrypt";
import { Task, TaskImage, Poste, Compte } from '../models/bd_index.mjs';
import TaskPoste from "../models/task_poste.mjs";
import bd from "../models/bd.mjs";


/**
 * Remplit la base de données avec des données de test.
 * Tout le seedage est exécuté dans une transaction : si une seule étape
 * échoue, rien n'est écrit dans la BD.
 *
 * @async
 * @param {*} req La requête envoyée par le frontend.
 * @param {*} res La réponse à retourner au backend.
 * @returns {*} Cette fonction ne retourne rien.
 */
const seedDatabase = async (req, res) => {
    const transaction = await bd.transaction();

    try {
        await TaskPoste.destroy({ where: {}, transaction });
        await Compte.destroy({ where: {}, transaction });
        await TaskImage.destroy({ where: {}, transaction });
        await Task.destroy({ where: {}, transaction });
        await Poste.destroy({ where: {}, transaction });

        const hashedPassword = await bcrypt.hash("Test1234!", 12);

        const posteAntoine = await Poste.create({
            nom: "Préposé aux installations",
            description: "Responsable de la préparation, du rangement et de l'entretien des installations.",
        }, { transaction });

        const posteColin = await Poste.create({
            nom: "Administrateur principal",
            description: "Administration générale du système AgoraTask.",
        }, { transaction });

        const posteJulien = await Poste.create({
            nom: "Administrateur secondaire",
            description: "Administration et gestion des utilisateurs du système.",
        }, { transaction });

        const posteMoussa = await Poste.create({
            nom: "Coordonnateur des opérations",
            description: "Coordination des tâches et supervision des activités.",
        }, { transaction });

        await Compte.create(
            {
                prenom: "Antoine",
                nom: "Beaudoin",
                courriel: "antoinebeaudoin@icloud.com",
                motDePasse: hashedPassword,
                role: "personnel_de_terrain",
                posteId: posteAntoine.id
            }, { transaction });

        await Compte.create(
            {
                prenom: "Colin",
                nom: "Giguère",
                courriel: "admin@admin.com",
                motDePasse: hashedPassword,
                role: "administrateur",
                posteId: posteColin.id
            }, { transaction });

        await Compte.create(
            {
                prenom: "Julien",
                nom: "Morel",
                courriel: "rebcoana@gmail.com",
                motDePasse: hashedPassword,
                role: "administrateur",
                posteId: posteJulien.id
            }, { transaction });

        await Compte.create(
            {
                prenom: "Moussa",
                nom: "Dembélé",
                courriel: "coordo@coordo.com",
                motDePasse: hashedPassword,
                role: "coordonnateur",
                posteId: posteMoussa.id
            }, { transaction });

        await Task.create({
            title: "Préparer la salle polyvalente",
            room: "Salle polyvalente",
            description: "Installer les tables et les chaises nécessaires pour les activités de la journée.",
            startTime: "08:30:00",
            endTime: "09:00:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        }, { transaction });

        await Task.create({
            title: "Nettoyer les vestiaires",
            room: "Vestiaires",
            description: "Nettoyer les planchers, vider les poubelles et vérifier l'état général des vestiaires.",
            startTime: "12:00:00",
            endTime: "12:30:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        }, { transaction });

        await Task.create({
            title: "Ranger le matériel sportif",
            room: "Gymnase",
            description: "Ramasser et ranger les ballons, cônes et autres équipements sportifs après les activités.",
            startTime: "16:00:00",
            endTime: "16:30:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        }, { transaction });

        await Task.create({
            title: "Nettoyage complet du gymnase",
            room: "Gymnase",
            description: "Balayer et laver le plancher du gymnase et nettoyer les surfaces fréquemment touchées.",
            startTime: "17:00:00",
            endTime: "18:00:00",
            recurring: true,
            frequency: "weekly",
            automaticAssignment: false
        }, { transaction });

        await Task.create({
            title: "Nettoyer les salles après les activités",
            room: "Salles d'activités",
            description: "Ramasser les déchets, replacer le mobilier et nettoyer les surfaces utilisées pendant les activités.",
            startTime: "17:30:00",
            endTime: "18:30:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        }, { transaction });

        await Task.create({
            title: "Vider les poubelles",
            room: "Centre de loisirs",
            description: "Vider les poubelles des différentes salles et remplacer les sacs.",
            startTime: "18:30:00",
            endTime: "19:00:00",
            recurring: true,
            frequency: "daily",
            automaticAssignment: true
        }, { transaction });

        await transaction.commit();

        res.status(200).json({
            message:
                "La base de données a été intialisée avec succès.",
            details: {
                postesCrees: 4,
                comptesCrees: 4,
                tachesCreees: 6
            }
        });
    }
    catch (e) {
        await transaction.rollback();
        res
            .status(500)
            .json({ error: "Internal Server Error", message: e.message });
    }
}

export { seedDatabase };
