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
import { occurence_de_tache } from "./occurence_de_tache.mjs";
Task.hasMany(occurence_de_tache, {
  foreignKey: "tacheId",
  as: "occurences",
  onDelete: "CASCADE",
});
occurence_de_tache.belongsTo(Task, {
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
import { Compte } from "./compte.mjs";

poste.hasOne(Compte, {
  foreignKey: "posteId",
  as: "compte",
  onDelete: "SET NULL",
});
Compte.belongsTo(poste, {
  foreignKey: "posteId",
  as: "poste",
});
