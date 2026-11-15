import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const TaskLink = bd.define("TaskLink", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(255),
    allowNull: true,
  },
  url: {
    type: DataTypes.STRING(1000),
    allowNull: false,
  },
});

export default TaskLink;
export { TaskLink };
