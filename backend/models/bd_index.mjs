import { Task } from "./task.mjs";
import TaskPoste from "./task_poste.mjs"
import { TaskImage } from "./task_image.mjs";
import Compte from "./compte.mjs";
import Poste from "./poste.mjs";

Task.belongsToMany(Poste, {
    through: TaskPoste,
    foreignKey: "taskId",
    otherKey: "posteId",
    as: "postes",
    onDelete: "CASCADE"
});

Poste.belongsToMany(Task, {
    through: TaskPoste,
    foreignKey: "posteId",
    otherKey: "taskId",
    as: "tasks",
    onDelete: "CASCADE"
});

Compte.belongsTo(Poste, {
    foreignKey: "posteId",
    as: "poste"
});

Poste.hasMany(Compte, {
    foreignKey: "posteId",
    as: "employes"
});

Task.hasMany(TaskImage, {
  foreignKey: "taskId",
  as: "images",
  onDelete: "CASCADE"
});

TaskImage.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task"
});

export {
  Task,
  TaskImage,
  Poste,
  Compte
};