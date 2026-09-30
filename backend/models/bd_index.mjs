import { Task } from "./task.mjs";
import { TaskImage } from "./task_image.mjs";

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
  TaskImage
};