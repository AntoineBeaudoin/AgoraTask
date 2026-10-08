import { Task } from "./task.mjs";
import { TaskImage } from "./task_image.mjs";
import Poste from "./poste.mjs";

// Task.belongsToMany(Poste, {
//     through: TaskPoste,
//     foreignKey: "taskId",
//     otherKey: "posteId",
//     as: "postes",
//     onDelete: "CASCADE"
// });

// Poste.belongsToMany(Task, {
//     through: TaskPoste,
//     foreignKey: "posteId",
//     otherKey: "taskId",
//     as: "tasks",
//     onDelete: "CASCADE"
// });

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
  Poste
};