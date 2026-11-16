import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const Task = bd.define("Task", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  title: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  room: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  automaticAssignment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  taskPriorityId: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: "task_priorities",
      key: "id",
    },
    onUpdate: "CASCADE",
    onDelete: "SET NULL",
  },
});

export { Task };
