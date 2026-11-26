// Relation between Task and TaskImage
import bd from "./bd.mjs";
import { Task } from "./task.mjs";
import TaskPoste from "./task_poste.mjs";
import { TaskImage } from "./task_image.mjs";
import { TaskDocument } from "./task_document.mjs";
import { TaskLink } from "./task_link.mjs";
import { occurrence_de_tache } from "./occurrence_de_tache.mjs";
import { sous_tache } from "./sous_taches.mjs";
import Poste from "./poste.mjs";
import Compte from "./compte.mjs";
import { task_priority } from "./task_priority.mjs";
import { work_day } from "./work_day.mjs";
import { work_day_task } from "./work_day_task.mjs";
import { work_day_sub_task } from "./work_day_sub_task.mjs";
import { work_week } from "./work_week.mjs";

Task.hasMany(TaskImage, {
  foreignKey: "taskId",
  as: "images",
  onDelete: "CASCADE",
});
TaskImage.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

Task.hasMany(TaskDocument, {
  foreignKey: "taskId",
  as: "documents",
  onDelete: "CASCADE",
});
TaskDocument.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

Task.hasMany(TaskLink, {
  foreignKey: "taskId",
  as: "externalLinks",
  onDelete: "CASCADE",
});
TaskLink.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

task_priority.hasMany(Task, {
  foreignKey: "taskPriorityId",
  as: "tasks",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
});
Task.belongsTo(task_priority, {
  foreignKey: "taskPriorityId",
  as: "priority",
  onDelete: "SET NULL",
  onUpdate: "CASCADE",
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

// Relation between compte and workweek
Compte.hasMany(work_week, {
  foreignKey: "accountId",
  as: "workWeeks",
  onDelete: "CASCADE",
});

work_week.belongsTo(Compte, {
  foreignKey: "accountId",
  as: "account",
});

// Relation between workweek and workday
work_week.hasMany(work_day, {
  foreignKey: "workWeekId",
  as: "workDays",
  onDelete: "CASCADE",
});

work_day.belongsTo(work_week, {
  foreignKey: "workWeekId",
  as: "workWeek",
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

let schemaEnsuredPromise = null;
const originalAuthenticate = bd.authenticate.bind(bd);

async function ensureTaskSchema() {
  await bd.query(
    'ALTER TABLE IF EXISTS "Tasks" ADD COLUMN IF NOT EXISTS "taskPriorityId" INTEGER REFERENCES "task_priorities" ("id") ON UPDATE CASCADE ON DELETE SET NULL;',
  );
  await TaskDocument.sync();
  await TaskLink.sync();
}

bd.authenticate = async function (...args) {
  const result = await originalAuthenticate(...args);
  if (!schemaEnsuredPromise) {
    schemaEnsuredPromise = ensureTaskSchema().catch(() => {
      schemaEnsuredPromise = null;
    });
  }
  await schemaEnsuredPromise;
  return result;
};

export {
  Task,
  TaskImage,
  TaskDocument,
  TaskLink,
  Compte,
  Poste,
  TaskPoste,
  occurrence_de_tache,
  sous_tache,
  task_priority,
  work_day,
  work_day_task,
  work_day_sub_task,
  work_week
};
