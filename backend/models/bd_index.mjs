// Relation between Task and TaskImage
import { Task } from "./task.mjs";
import TaskPoste from "./task_poste.mjs";
import { TaskImage } from "./task_image.mjs";
import { occurrence_de_tache } from "./occurrence_de_tache.mjs";
import { sous_tache } from "./sous_taches.mjs";
import Poste from "./poste.mjs";
import Compte from "./compte.mjs";
import { task_priority } from "./task_priority.mjs";
import { work_day } from "./work_day.mjs";
import { work_day_task } from "./work_day_task.mjs";
import { work_day_sub_task } from "./work_day_sub_task.mjs";

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
  as: "occurrences",
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

Poste.hasMany(Compte, {
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

task_priority.hasMany(occurrence_de_tache, {
  foreignKey: "taskPriorityId",
  as: "occurrences",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

occurrence_de_tache.belongsTo(task_priority, {
  foreignKey: "taskPriorityId",
  as: "priority",
  onDelete: "RESTRICT",
  onUpdate: "CASCADE",
});

//Relation between compte and workday
Compte.hasMany(work_day, {
  foreignKey: "accountId",
  as: "workDays",
  onDelete: "CASCADE",
});
work_day.belongsTo(Compte, {
  foreignKey: "accountId",
  as: "account",
});

//Relation between workday and task/subtask
work_day.hasMany(work_day_task, {
  foreignKey: "workDayId",
  as: "tasks",
  onDelete: "CASCADE",
});
work_day_task.belongsTo(work_day, {
  foreignKey: "workDayId",
  as: "workDay",
});

work_day_task.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});
Task.hasMany(work_day_task, {
  foreignKey: "taskId",
  as: "workDayTasks",
});

work_day_task.belongsTo(occurrence_de_tache, {
  foreignKey: "occurrenceId",
  as: "occurrence",
});
occurrence_de_tache.hasMany(work_day_task, {
  foreignKey: "occurrenceId",
  as: "workDayTasks",
});

work_day_task.hasMany(work_day_sub_task, {
  foreignKey: "workDayTaskId",
  as: "subTasks",
  onDelete: "CASCADE",
});
work_day_sub_task.belongsTo(work_day_task, {
  foreignKey: "workDayTaskId",
  as: "workDayTask",
});

work_day_sub_task.belongsTo(sous_tache, {
  foreignKey: "subTaskId",
  as: "subTask",
  onDelete: "RESTRICT",
});
sous_tache.hasMany(work_day_sub_task, {
  foreignKey: "subTaskId",
  as: "workDaySubTasks",
  onDelete: "RESTRICT",
});

export {
  Task,
  TaskImage,
  Compte,
  Poste,
  TaskPoste,
  occurrence_de_tache,
  sous_tache,
  task_priority,
  work_day,
  work_day_task,
  work_day_sub_task,
};
