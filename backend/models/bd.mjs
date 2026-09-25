import {Sequelize} from "sequelize";
import dotenv from "dotenv";
import { Task } from "./Task.mjs";
import { TaskImage } from "./TaskImage.mjs";

dotenv.config();

const bd = new Sequelize(process.env.DATABASE_URL);

Task.hasMany(TaskImage, {
  foreignKey: "taskId",
  as: "images",
  onDelete: "CASCADE"
});

TaskImage.belongsTo(Task, {
  foreignKey: "taskId",
  as: "task"
});

export {bd}
export default bd;