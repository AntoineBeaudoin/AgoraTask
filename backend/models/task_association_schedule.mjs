import Task from "./task.mjs";
import TaskSchedule from "./task_schedule.mjs";

Task.hasMany(TaskSchedule, {
  foreignKey: "taskId",
  as: "schedules",
  onDelete: "CASCADE",
});

TaskSchedule.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task",
});

export { Task, TaskSchedule };