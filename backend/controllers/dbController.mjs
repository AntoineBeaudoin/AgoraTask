import bcrypt from "bcrypt";
import {
  Compte,
  Task,
  TaskImage,
  Poste,
  occurrence_de_tache,
  sous_tache,
  TaskPoste,
  tachesAFaire,
  sous_taches_AFaire,
} from "../models/bd_index.mjs";
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
  try {
    await sous_taches_AFaire.destroy({ where: {} });
    await tachesAFaire.destroy({ where: {} });
    await TaskPoste.destroy({ where: {} });
    await occurrence_de_tache.destroy({ where: {} });
    await sous_tache.destroy({ where: {} });
    await TaskImage.destroy({ where: {} });
    await Compte.destroy({ where: {} });
    await Task.destroy({ where: {} });
    await Poste.destroy({ where: {} });

    const hashedPassword = await bcrypt.hash("Test1234!", 15);

    const posteEntretien = await Poste.create({
      nom: "Entretien",
      description: "Entretien ménager et maintenance du centre.",
    });

    const posteAppariteur = await Poste.create({
      nom: "Appariteur",
      description: "Surveillance et gestion des salles/locaux.",
    });

    const posteCoordination = await Poste.create({
      nom: "Coordination",
      description: "Coordination des opérations.",
    });

    const posteAdministration = await Poste.create({
      nom: "Administration",
      description: "Administration du système.",
    });

    const posteAntoine = await Poste.create({
      nom: "Préposé aux installations",
      description:
        "Responsable de la préparation, du rangement et de l'entretien des installations.",
    });

    const posteColin = await Poste.create({
      nom: "Administrateur principal",
      description: "Administration générale du système AgoraTask.",
    });

    const posteJulien = await Poste.create({
      nom: "Administrateur secondaire",
      description: "Administration et gestion des utilisateurs du système.",
    });

    const posteMoussa = await Poste.create({
      nom: "Coordonnateur des opérations",
      description: "Coordination des tâches et supervision des activités.",
    });

    await Compte.create({
      prenom: "Antoine",
      nom: "Beaudoin",
      courriel: "antoinebeaudoin@icloud.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAntoine.id,
    });

    await Compte.create({
      prenom: "Julien",
      nom: "Morel",
      courriel: "rebcoana@gmail.com",
      motDePasse: hashedPassword,
      role: "administrateur",
      IsArchived: false,
      posteId: posteJulien.id,
    });

    await Compte.create({
      prenom: "Moussa",
      nom: "Dembélé",
      courriel: "coordo@coordo.com",
      motDePasse: hashedPassword,
      role: "coordonnateur",
      IsArchived: false,
      posteId: posteMoussa.id,
    });

    const comptes = {};
    
    comptes["Romain"] = await Compte.create({
      prenom: "Romain",
      nom: "Bredy",
      courriel: "romain@agoratask.com",
      motDePasse: hashedPassword,
      role: "coordonnateur",
      IsArchived: false,
      posteId: posteCoordination.id,
    });

    comptes["Clara"] = await Compte.create({
      prenom: "Clara",
      nom: "Côté",
      courriel: "clara@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    comptes["Naomi"] = await Compte.create({
      prenom: "Naomi",
      nom: "Tremblay",
      courriel: "naomi@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAppariteur.id,
    });

    comptes["Zoé"] = await Compte.create({
      prenom: "Zoé",
      nom: "Fortin",
      courriel: "zoe@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAppariteur.id,
    });

    comptes["Mathieu"] = await Compte.create({
      prenom: "Mathieu",
      nom: "Gagné",
      courriel: "mathieu@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAppariteur.id,
    });

    comptes["Brahim"] = await Compte.create({
      prenom: "Brahim",
      nom: "Bouchard",
      courriel: "brahim@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAppariteur.id,
    });

    comptes["Sheng Ming"] = await Compte.create({
      prenom: "Sheng",
      nom: "Ming",
      courriel: "shengming@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAppariteur.id,
    });

    comptes["Colin"] = await Compte.create({
      prenom: "Colin",
      nom: "Giguère",
      courriel: "admin@admin.com",
      motDePasse: hashedPassword,
      role: "administrateur",
      IsArchived: false,
      posteId: posteColin.id,
    });

    comptes["Philipe"] = await Compte.create({
      prenom: "Philipe",
      nom: "Lavoie",
      courriel: "philipe@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    comptes["Shelby"] = await Compte.create({
      prenom: "Shelby",
      nom: "Côté",
      courriel: "shelby@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    comptes["Audrée"] = await Compte.create({
      prenom: "Audrée",
      nom: "Morin",
      courriel: "audree@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    comptes["Léon"] = await Compte.create({
      prenom: "Léon",
      nom: "Simard",
      courriel: "leon@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAppariteur.id,
    });

    comptes["Mónica"] = await Compte.create({
      prenom: "Mónica",
      nom: "Desrosiers",
      courriel: "monica@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    comptes["Stéphanie"] = await Compte.create({
      prenom: "Stéphanie",
      nom: "Lachance",
      courriel: "stephanie@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    comptes["Sébastien"] = await Compte.create({
      prenom: "Sébastien",
      nom: "Roy",
      courriel: "sebastien@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteEntretien.id,
    });

    const tachePiscine = await Task.create({
      title: "Entretien de la piscine",
      room: "Mini-piscine / Piscine",
      description: "Back wash et entretien des zones de piscine et vestiaires.",
      recurring: true,
      automaticAssignment: false,
      archived: false,
    });

    const tacheBoxe = await Task.create({
      title: "Nettoyage de la salle de boxe",
      room: "Salle de boxe",
      description: "Nettoyage des bandages et entretien de la salle de boxe.",
      recurring: true,
      automaticAssignment: false,
      archived: false,
    });

    const tacheAppariteur = await Task.create({
      title: "Tâches d'appariteur",
      room: "Centre",
      description: "Ouverture, fermeture, surveillance et préparation des salles selon l'horaire.",
      recurring: true,
      automaticAssignment: false,
      archived: false,
    });

    const tacheEntretienGeneral = await Task.create({
      title: "Entretien ménager général",
      room: "Centre",
      description: "Balayer, laver, vider les poubelles selon les grilles d'entretien.",
      recurring: true,
      automaticAssignment: false,
      archived: false,
    });

    const tacheESJM = await Task.create({
      title: "Entretien ESJM",
      room: "ESJM",
      description: "Entretien des locaux ESJM selon les grilles.",
      recurring: true,
      automaticAssignment: false,
      archived: false,
    });

    await TaskPoste.create({ posteId: posteEntretien.id, tacheId: tachePiscine.id });
    await TaskPoste.create({ posteId: posteEntretien.id, tacheId: tacheBoxe.id });
    await TaskPoste.create({ posteId: posteEntretien.id, tacheId: tacheEntretienGeneral.id });
    await TaskPoste.create({ posteId: posteEntretien.id, tacheId: tacheESJM.id });
    await TaskPoste.create({ posteId: posteAppariteur.id, tacheId: tacheAppariteur.id });
    await TaskPoste.create({ posteId: posteCoordination.id, tacheId: tacheAppariteur.id });

    const jours = ["lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi", "dimanche"];
    let idOccurrence = {};

    for (const journee of jours) {
      let occ = await occurrence_de_tache.create({
        heureDebut: "19:00:00",
        heureFin: "20:00:00",
        journee,
        isRequired: true,
        tacheId: tachePiscine.id,
        priorite: 3,
      });
      if (!idOccurrence.tachePiscine_id) idOccurrence.tachePiscine_id = occ.id;

      occ = await occurrence_de_tache.create({
        heureDebut: "17:00:00",
        heureFin: "18:00:00",
        journee,
        isRequired: true,
        tacheId: tacheEntretienGeneral.id,
        priorite: 3,
      });
      if (!idOccurrence.tacheEntretienGeneral_id) idOccurrence.tacheEntretienGeneral_id = occ.id;

      occ = await occurrence_de_tache.create({
        heureDebut: "06:15:00",
        heureFin: "22:00:00",
        journee,
        isRequired: true,
        tacheId: tacheAppariteur.id,
        priorite: 4,
      });
      if (!idOccurrence.tacheAppariteur_id) idOccurrence.tacheAppariteur_id = occ.id;

      occ = await occurrence_de_tache.create({
        heureDebut: "16:00:00",
        heureFin: "18:00:00",
        journee,
        isRequired: true,
        tacheId: tacheESJM.id,
        priorite: 3,
      });
      if (!idOccurrence.tacheESJM_id) idOccurrence.tacheESJM_id = occ.id;
    }

    let occBoxe = await occurrence_de_tache.create({
      heureDebut: "17:00:00",
      heureFin: "18:00:00",
      journee: "mercredi",
      isRequired: true,
      tacheId: tacheBoxe.id,
      priorite: 3,
    });
    idOccurrence.tacheBoxe_id = occBoxe.id;

    const st1 = await sous_tache.create({
      tacheId: tachePiscine.id,
      titre: "Back wash",
      description: "Effectuer le back wash selon la procédure.",
    });
    const st2 = await sous_tache.create({
      tacheId: tachePiscine.id,
      titre: "Nettoyer les vestiaires",
      description: "Nettoyer les vestiaires de la piscine.",
    });
    const st3 = await sous_tache.create({
      tacheId: tacheBoxe.id,
      titre: "Nettoyer les bandages",
      description: "Nettoyer/ranger les bandages selon la procédure.",
    });
    const st4 = await sous_tache.create({
      tacheId: tacheEntretienGeneral.id,
      titre: "Balayer le plancher",
      description: "Balayer les planchers des locaux assignés.",
    });
    const st5 = await sous_tache.create({
      tacheId: tacheEntretienGeneral.id,
      titre: "Laver le plancher",
      description: "Laver les planchers.",
    });
    const st6 = await sous_tache.create({
      tacheId: tacheEntretienGeneral.id,
      titre: "Vider les poubelles",
      description: "Vider et remplacer les sacs.",
    });

    if (comptes["Romain"]) {
      const ta = await tachesAFaire.create({
        tacheId: tachePiscine.id,
        compteId: comptes["Romain"].id,
        occurrence_de_tacheId: idOccurrence.tachePiscine_id,
        commentaire: "Entretien piscine selon grille.",
        isCompleted: false,
      });
      await sous_taches_AFaire.create({ sousTacheId: st1.id, tachesAFaireId: ta.id, commentaire: null, isCompleted: false });
      await sous_taches_AFaire.create({ sousTacheId: st2.id, tachesAFaireId: ta.id, commentaire: null, isCompleted: false });
    }

    if (comptes["Clara"]) {
      const ta = await tachesAFaire.create({
        tacheId: tacheBoxe.id,
        compteId: comptes["Clara"].id,
        occurrence_de_tacheId: idOccurrence.tacheBoxe_id,
        commentaire: "Nettoyage des bandages.",
        isCompleted: false,
      });
      await sous_taches_AFaire.create({ sousTacheId: st3.id, tachesAFaireId: ta.id, commentaire: null, isCompleted: false });
    }

    if (comptes["Zoé"]) {
      const ta = await tachesAFaire.create({
        tacheId: tacheEntretienGeneral.id,
        compteId: comptes["Zoé"].id,
        occurrence_de_tacheId: idOccurrence.tacheEntretienGeneral_id,
        commentaire: "Entretien selon grille.",
        isCompleted: false,
      });
      await sous_taches_AFaire.create({ sousTacheId: st4.id, tachesAFaireId: ta.id, commentaire: null, isCompleted: false });
      await sous_taches_AFaire.create({ sousTacheId: st5.id, tachesAFaireId: ta.id, commentaire: null, isCompleted: false });
    }

    if (comptes["Mathieu"]) {
      await tachesAFaire.create({
        tacheId: tacheAppariteur.id,
        compteId: comptes["Mathieu"].id,
        occurrence_de_tacheId: idOccurrence.tacheAppariteur_id,
        commentaire: "Tâches d'appariteur selon tableau.",
        isCompleted: false,
      });
    }

    if (comptes["Naomi"]) {
      await tachesAFaire.create({
        tacheId: tacheAppariteur.id,
        compteId: comptes["Naomi"].id,
        occurrence_de_tacheId: idOccurrence.tacheAppariteur_id,
        commentaire: "Tâches d'appariteur selon tableau.",
        isCompleted: false,
      });
    }

    if (comptes["Brahim"]) {
      await tachesAFaire.create({
        tacheId: tacheAppariteur.id,
        compteId: comptes["Brahim"].id,
        occurrence_de_tacheId: idOccurrence.tacheAppariteur_id,
        commentaire: "Tâches d'appariteur selon tableau.",
        isCompleted: false,
      });
    }

    if (comptes["Sheng"]) {
      await tachesAFaire.create({
        tacheId: tacheAppariteur.id,
        compteId: comptes["Sheng"].id,
        occurrence_de_tacheId: idOccurrence.tacheAppariteur_id,
        commentaire: "Tâches d'appariteur selon tableau.",
        isCompleted: false,
      });
    }

    if (comptes["Mónica"]) {
      await tachesAFaire.create({
        tacheId: tacheESJM.id,
        compteId: comptes["Mónica"].id,
        occurrence_de_tacheId: idOccurrence.tacheESJM_id,
        commentaire: "Entretien ESJM selon grille.",
        isCompleted: false,
      });
    }

    if (comptes["Léon"]) {
      await tachesAFaire.create({
        tacheId: tacheESJM.id,
        compteId: comptes["Léon"].id,
        occurrence_de_tacheId: idOccurrence.tacheESJM_id,
        commentaire: "Entretien ESJM selon grille.",
        isCompleted: false,
      });
    }

    res.status(200).json({
      message: "La base de données a été initialisée avec succès.",
    });
  } catch (e) {
    res
      .status(500)
      .json({ error: "Internal Server Error", message: e.message });
  }
};

export { seedDatabase };
