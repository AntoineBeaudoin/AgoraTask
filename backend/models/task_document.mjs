import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const TaskDocument = bd.define("TaskDocument", {
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
  filename: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  path: {
    type: DataTypes.STRING(1000),
    allowNull: false,
  },
  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false,
    defaultValue: "application/pdf",
  },
});

export default TaskDocument;
export { TaskDocument };
