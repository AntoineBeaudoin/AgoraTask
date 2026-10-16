// Relation between Task and TaskImage
import { Task } from "./task.mjs";
import { TaskImage } from "./task_image.mjs";
Task.hasMany(TaskImage, {
  foreignKey: "taskId",
  as: "images",
  onDelete: "CASCADE",
});
TaskImage.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});
// Relation between Task and occurence_de_tache
import { occurrence_de_tache } from "./occurrence_de_tache.mjs";
Task.hasMany(occurrence_de_tache, {
  foreignKey: "tacheId",
  as: "occurences",
  onDelete: "CASCADE",
});
occurrence_de_tache.belongsTo(Task, {
  foreignKey: "tacheId",
  as: "task",
});
// Relation between Task and sous_tache
import { sous_tache } from "./sous_taches.mjs";
Task.hasMany(sous_tache, {
  foreignKey: "tacheId",
  as: "sous_taches",
  onDelete: "CASCADE",
});
sous_tache.belongsTo(Task, {
  foreignKey: "tacheId",
  as: "task",
});
// Relation between poste and compte
import { poste } from "./poste.mjs";
import Compte from "./compte.mjs";

poste.hasOne(Compte, {
  foreignKey: "posteId",
  as: "compte",
  onDelete: "SET NULL",
});
Compte.belongsTo(poste, {
  foreignKey: "posteId",
  as: "poste",
});
// Relation between poste and tache
import { TaskPoste } from "./TaskPoste.mjs";
poste.belongsToMany(Task, {
  through: TaskPoste,
  foreignKey: "posteId",
  otherKey: "tacheId",
  as: "taches",
});
Task.belongsToMany(poste, {
  through: TaskPoste,
  foreignKey: "tacheId",
  otherKey: "posteId",
  as: "postes",
});
// Relation between employe and tache
import { tachesAFaire } from "./tachesAFaire.mjs";
Compte.belongsToMany(Task, {
  through: tachesAFaire,
  foreignKey: "compteId ",
  otherKey: "tacheId",
  as: "taches",
});
Task.belongsToMany(Compte, {
  through: tachesAFaire,
  foreignKey: "tacheId",
  otherKey: "compteId ",
  as: "comptes",
});
// relation between tacheafaire and sous_tache
import { sous_taches_AFaire } from "./SousTachesAFaire.mjs";
tachesAFaire.belongsToMany(sous_tache, {
  through: sous_taches_AFaire,
  foreignKey: "tachesAFaireId",
  otherKey: "sousTacheId",
  as: "sous_taches",
});
sous_tache.belongsToMany(tachesAFaire, {
  through: sous_taches_AFaire,
  foreignKey: "sousTacheId",
  otherKey: "tachesAFaireId",
  as: "tachesAFaires",
});

export {
  Task,
  TaskImage,
  occurrence_de_tache,
  sous_tache,
  poste,
  Compte,
  TaskPoste,
  tachesAFaire,
  sous_taches_AFaire,
};
