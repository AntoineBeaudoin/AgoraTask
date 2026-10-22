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

    const antoine = await Compte.create({
      prenom: "Antoine",
      nom: "Beaudoin",
      courriel: "antoinebeaudoin@icloud.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
      posteId: posteAntoine.id,
    });

    await Compte.create({
      prenom: "Colin",
      nom: "Giguère",
      courriel: "admin@admin.com",
      motDePasse: hashedPassword,
      role: "administrateur",
      IsArchived: false,
      posteId: posteColin.id,
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
      prenom: "Bob",
      nom: "Marley",
      courriel: "bmarley@gmail.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
    });

     await Compte.create({
      prenom: "Michael",
      nom: "Jackson",
      courriel: "mjackson@test.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
    });

    await Compte.create({
      prenom: "Raphael",
      nom: "Pouliot",
      courriel: "rpouliot@agoratask.com",
      motDePasse: hashedPassword,
      role: "personnel_de_terrain",
      IsArchived: false,
    });

    const moussa = await Compte.create({
      prenom: "Moussa",
      nom: "Dembélé",
      courriel: "coordo@coordo.com",
      motDePasse: hashedPassword,
      role: "coordonnateur",
      IsArchived: false,
      posteId: posteMoussa.id,
    });

    const preparerSalle = await Task.create({
      title: "Préparer la salle polyvalente",
      room: "Salle polyvalente",
      description:
        "Installer les tables et les chaises nécessaires pour les activités.",
      recurring: true,
      automaticAssignment: true,
      archived: false,
    });

    const nettoyerVestiaires = await Task.create({
      title: "Nettoyer les vestiaires",
      room: "Vestiaires",
      description:
        "Nettoyer les planchers, vider les poubelles et vérifier l'état général.",
      recurring: true,
      automaticAssignment: true,
      archived: false,
    });

    const rangerMateriel = await Task.create({
      title: "Ranger le matériel sportif",
      room: "Gymnase",
      description:
        "Ramasser et ranger les ballons, cônes et autres équipements sportifs.",
      recurring: true,
      automaticAssignment: true,
      archived: false,
    });

    const nettoyerGymnase = await Task.create({
      title: "Nettoyage complet du gymnase",
      room: "Gymnase",
      description:
        "Balayer et laver le plancher du gymnase et nettoyer les surfaces.",
      recurring: true,
      automaticAssignment: false,
      archived: false,
    });

    const nettoyerSalles = await Task.create({
      title: "Nettoyer les salles après les activités",
      room: "Salles d'activités",
      description:
        "Ramasser les déchets, replacer le mobilier et nettoyer les surfaces.",
      recurring: true,
      automaticAssignment: true,
      archived: false,
    });

    const viderPoubelles = await Task.create({
      title: "Vider les poubelles",
      room: "Centre de loisirs",
      description:
        "Vider les poubelles des différentes salles et remplacer les sacs.",
      recurring: true,
      automaticAssignment: true,
      archived: false,
    });

    const jours = [
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ];

    for (const journee of jours) {
      await occurrence_de_tache.create({
        heureDebut: "08:30:00",
        heureFin: "09:00:00",
        journee,
        isRequired: true,
        tacheId: preparerSalle.id,
        priorite: 3,
      });

      await occurrence_de_tache.create({
        heureDebut: "12:00:00",
        heureFin: "12:30:00",
        journee,
        isRequired: true,
        tacheId: nettoyerVestiaires.id,
        priorite: 3,
      });

      await occurrence_de_tache.create({
        heureDebut: "16:00:00",
        heureFin: "16:30:00",
        journee,
        isRequired: true,
        tacheId: rangerMateriel.id,
        priorite: 2,
      });

      await occurrence_de_tache.create({
        heureDebut: "17:30:00",
        heureFin: "18:30:00",
        journee,
        isRequired: true,
        tacheId: nettoyerSalles.id,
        priorite: 4,
      });

      await occurrence_de_tache.create({
        heureDebut: "18:30:00",
        heureFin: "19:00:00",
        journee,
        isRequired: true,
        tacheId: viderPoubelles.id,
        priorite: 4,
      });
    }

    await occurrence_de_tache.create({
      heureDebut: "17:00:00",
      heureFin: "18:00:00",
      journee: "vendredi",
      isRequired: true,
      tacheId: nettoyerGymnase.id,
      priorite: 5,
    });

    const installerTables = await sous_tache.create({
      tacheId: preparerSalle.id,
      titre: "Installer les tables",
      description: "Placer les tables selon la configuration prévue.",
    });

    const installerChaises = await sous_tache.create({
      tacheId: preparerSalle.id,
      titre: "Installer les chaises",
      description: "Installer les chaises autour des tables.",
    });

    const verifierSalle = await sous_tache.create({
      tacheId: preparerSalle.id,
      titre: "Vérifier la disposition",
      description:
        "Vérifier que la salle correspond à la configuration demandée.",
    });

    const laverVestiaires = await sous_tache.create({
      tacheId: nettoyerVestiaires.id,
      titre: "Nettoyer les planchers",
      description: "Balayer et laver les planchers des vestiaires.",
    });

    const poubellesVestiaires = await sous_tache.create({
      tacheId: nettoyerVestiaires.id,
      titre: "Vider les poubelles",
      description: "Vider les poubelles et remplacer les sacs.",
    });

    const verifierVestiaires = await sous_tache.create({
      tacheId: nettoyerVestiaires.id,
      titre: "Vérifier les vestiaires",
      description: "Vérifier l'état général des vestiaires après le nettoyage.",
    });

    const ramasserMateriel = await sous_tache.create({
      tacheId: rangerMateriel.id,
      titre: "Ramasser le matériel",
      description: "Rassembler le matériel sportif utilisé.",
    });

    const rangerEquipements = await sous_tache.create({
      tacheId: rangerMateriel.id,
      titre: "Ranger les équipements",
      description: "Ranger les équipements à leurs emplacements respectifs.",
    });

    const balayerGymnase = await sous_tache.create({
      tacheId: nettoyerGymnase.id,
      titre: "Balayer le gymnase",
      description: "Balayer complètement le plancher du gymnase.",
    });

    const laverGymnase = await sous_tache.create({
      tacheId: nettoyerGymnase.id,
      titre: "Laver le gymnase",
      description: "Laver le plancher du gymnase.",
    });

    const nettoyerSurfacesGymnase = await sous_tache.create({
      tacheId: nettoyerGymnase.id,
      titre: "Nettoyer les surfaces",
      description: "Nettoyer les surfaces et équipements accessibles.",
    });

    const ramasserDechets = await sous_tache.create({
      tacheId: nettoyerSalles.id,
      titre: "Ramasser les déchets",
      description: "Ramasser les déchets laissés après les activités.",
    });

    const replacerMobilier = await sous_tache.create({
      tacheId: nettoyerSalles.id,
      titre: "Replacer le mobilier",
      description: "Remettre les tables et les chaises à leur emplacement.",
    });

    const nettoyerSurfacesSalles = await sous_tache.create({
      tacheId: nettoyerSalles.id,
      titre: "Nettoyer les surfaces",
      description: "Nettoyer les surfaces utilisées pendant les activités.",
    });

    const viderSacs = await sous_tache.create({
      tacheId: viderPoubelles.id,
      titre: "Vider les poubelles",
      description: "Vider toutes les poubelles du secteur.",
    });

    const remplacerSacs = await sous_tache.create({
      tacheId: viderPoubelles.id,
      titre: "Remplacer les sacs",
      description: "Installer de nouveaux sacs dans les poubelles.",
    });

    await TaskPoste.create({
      posteId: posteAntoine.id,
      tacheId: preparerSalle.id,
    });

    await TaskPoste.create({
      posteId: posteAntoine.id,
      tacheId: nettoyerVestiaires.id,
    });

    await TaskPoste.create({
      posteId: posteAntoine.id,
      tacheId: rangerMateriel.id,
    });

    await TaskPoste.create({
      posteId: posteAntoine.id,
      tacheId: nettoyerSalles.id,
    });

    await TaskPoste.create({
      posteId: posteAntoine.id,
      tacheId: viderPoubelles.id,
    });

    await TaskPoste.create({
      posteId: posteMoussa.id,
      tacheId: nettoyerGymnase.id,
    });

    const assignationSalle = await tachesAFaire.create({
      tacheId: preparerSalle.id,
      compteId: antoine.id,
      commentaire: "Préparer la salle avant le début des activités.",
      isCompleted: false,
    });

    const assignationVestiaires = await tachesAFaire.create({
      tacheId: nettoyerVestiaires.id,
      compteId: antoine.id,
      commentaire:
        "Il ne reste presque plus de savon pour la plancher, il faudrait en acheter",
      isCompleted: true,
    });

    const assignationPoubelles = await tachesAFaire.create({
      tacheId: viderPoubelles.id,
      compteId: antoine.id,
      commentaire:
        "Il ne reste presque plus de savon pour la plancher, il faudrait en acheter",
      isCompleted: false,
    });

    const assignationGymnase = await tachesAFaire.create({
      tacheId: nettoyerGymnase.id,
      compteId: moussa.id,
      commentaire:
        "Il ne reste presque plus de savon pour la plancher, il faudrait en acheter",
      isCompleted: false,
    });

    await sous_taches_AFaire.create({
      sousTacheId: installerTables.id,
      tachesAFaireId: assignationSalle.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: installerChaises.id,
      tachesAFaireId: assignationSalle.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: verifierSalle.id,
      tachesAFaireId: assignationSalle.id,
      commentaire: "Disposition finale à vérifier.",
      isCompleted: false,
    });

    await sous_taches_AFaire.create({
      sousTacheId: laverVestiaires.id,
      tachesAFaireId: assignationVestiaires.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: poubellesVestiaires.id,
      tachesAFaireId: assignationVestiaires.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: verifierVestiaires.id,
      tachesAFaireId: assignationVestiaires.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: viderSacs.id,
      tachesAFaireId: assignationPoubelles.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: remplacerSacs.id,
      tachesAFaireId: assignationPoubelles.id,
      commentaire: "Certains sacs restent à remplacer.",
      isCompleted: false,
    });

    await sous_taches_AFaire.create({
      sousTacheId: balayerGymnase.id,
      tachesAFaireId: assignationGymnase.id,
      commentaire: null,
      isCompleted: true,
    });

    await sous_taches_AFaire.create({
      sousTacheId: laverGymnase.id,
      tachesAFaireId: assignationGymnase.id,
      commentaire: null,
      isCompleted: false,
    });

    await sous_taches_AFaire.create({
      sousTacheId: nettoyerSurfacesGymnase.id,
      tachesAFaireId: assignationGymnase.id,
      commentaire: null,
      isCompleted: false,
    });

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

