import Compte from "../models/compte.mjs"
import bcrypt from "bcrypt";

const seedDatabase = async (req, res) => {
    try {
        await Compte.destroy({
            where: {
                IsArchived: false,
            }
        });
        await Compte.destroy({
            where: {
                IsArchived: true,
            }
        });

        const hashedPassword = await bcrypt.hash("Test1234!", 15);

        const employe = await Compte.create(
            {
                prenom: "Antoine",
                nom: "Beaudoin",
                courriel: "antoinebeaudoin@icloud.com",
                motDePasse: hashedPassword,
                role: "personnel_de_terrain"
            });

        const vraiAdmin = await Compte.create(
            {
                prenom: "Colin",
                nom: "Giguère",
                courriel: "admin@admin.com",
                motDePasse: hashedPassword,
                role: "administrateur"
            });

        const admin = await Compte.create(
            {
                prenom: "Julien",
                nom: "Morel",
                courriel: "rebcoana@gmail.com",
                motDePasse: hashedPassword,
                role: "administrateur"
            });

        const coordo = await Compte.create(
            {
                prenom: "Moussa",
                nom: "Dembélé",
                courriel: "coordo@coordo.com",
                motDePasse: hashedPassword,
                role: "coordonnateur"
            });

        await admin.save();
        await coordo.save();
        await vraiAdmin.save();
        await employe.save();
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

console.log("utilisateurs tests créées.");

export { seedDatabase };