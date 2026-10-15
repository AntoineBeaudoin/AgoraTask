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
export { TaskImage };
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
export { Task, occurence_de_tache };
