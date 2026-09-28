import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const Task = bd.define("Task", {
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false 
  }, 
   title: { 
    type: DataTypes.STRING(100), 
    allowNull: false,
  },
   local: { 
    type: DataTypes.STRING(100), 
    allowNull: false,
  },
  description: { 
    type: DataTypes.TEXT(255), 
    allowNull: true, 
  }, 
  startTime: {
    type: DataTypes.TIME(50), 
    allowNull: false,
  }, 
  endTime: {
    type: DataTypes.TIME(50), 
    allowNull: false,
  },
  recurring: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  frequency: {
    type: DataTypes.ENUM(
      "daily",
      "bi_weekly",
      "tri_weekly",
      "weekly",
      "two_week",
      "monthly",
      "other"
    ),
    defaultValue: "daily"
  },
  automaticAssignment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}
);

export default Task;
export { Task };