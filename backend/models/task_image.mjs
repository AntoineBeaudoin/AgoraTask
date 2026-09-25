import { DataTypes } from "sequelize";
import { bd } from "./bd.mjs";

const TaskImage = bd.define("TaskImage", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false
  },

  taskId: {
    type: DataTypes.INTEGER,
    allowNull: false
  },

  filename: {
    type: DataTypes.STRING(255),
    allowNull: false
  },

  path: {
    type: DataTypes.STRING(500),
    allowNull: false
  },

  mimeType: {
    type: DataTypes.STRING(100),
    allowNull: false
  }
});

export default TaskImage;
export { TaskImage };