import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const task_priority = bd.define("task_priority", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  task_priority: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  weigth: {
    type: DataTypes.INTEGER,
    defaultValue: 0,
    validate: {
      min: 0,
    }
  }
}, {
  tableName: "task_priorities",
});

export { task_priority };
