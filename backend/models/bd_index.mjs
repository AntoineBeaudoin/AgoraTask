// Relation between Task and TaskImage
import { Task } from "./task.mjs";
import TaskPoste from "./task_poste.mjs"
import { TaskImage } from "./task_image.mjs";
import { occurrence_de_tache } from "./occurrence_de_tache.mjs";
import { sous_tache } from "./sous_taches.mjs";
import Poste from "./poste.mjs";
import Compte from "./compte.mjs";
import { sous_taches_AFaire } from "./SousTachesAFaire.mjs";
import { tachesAFaire } from "./tachesAFaire.mjs";

Task.hasMany(TaskImage, {
  foreignKey: "taskId",
  as: "images",
  onDelete: "CASCADE",
});
TaskImage.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

Task.hasMany(occurrence_de_tache, {
  foreignKey: "tacheId",
  as: "occurences",
  onDelete: "CASCADE",
});
occurrence_de_tache.belongsTo(Task, {
  foreignKey: "tacheId",
  as: "task",
});


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


Poste.hasOne(Compte, {
  foreignKey: "posteId",
  as: "employes",
  onDelete: "SET NULL",
});
Compte.belongsTo(Poste, {
  foreignKey: "posteId",
  as: "poste",
});
// Relation between poste and tache
Poste.belongsToMany(Task, {
  through: TaskPoste,
  foreignKey: "posteId",
  otherKey: "tacheId",
  as: "tasks",
});
Task.belongsToMany(Poste, {
  through: TaskPoste,
  foreignKey: "tacheId",
  otherKey: "posteId",
  as: "postes",
});
// Relation between employe and tache

Compte.belongsToMany(Task, {
  through: { model: tachesAFaire, unique: false },
  foreignKey: "compteId",
  otherKey: "tacheId",
  as: "taches",
});
Task.belongsToMany(Compte, {
  through: { model: tachesAFaire, unique: false },
  foreignKey: "tacheId",
  otherKey: "compteId",
  as: "comptes",
});
// relation between tacheafaire and sous_tache

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

//Relation entre tacheAFaire et occurrence_de_tache
tachesAFaire.belongsTo(occurrence_de_tache, {
  foreignKey: "occurrence_de_tacheId",
  as: "occurrence_de_tache",
});
occurrence_de_tache.hasMany(tachesAFaire, {
  foreignKey: "occurrence_de_tacheId",
  as: "tachesAFaire",
});
export {
  Task,
  TaskImage,
  Compte,
  Poste,
  TaskPoste,
  occurrence_de_tache,
  sous_tache,
  sous_taches_AFaire,
  tachesAFaire
};
