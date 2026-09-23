import { DataTypes } from "sequelize";
import { bd } from "./bd.mjs";

const Task = bd.define("Task", {
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false 
  }, 
   titre: { 
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
    type: DataTypes.(50), 
    allowNull: false,
  }, 
  endTime: {
    type: DataTypes.(50), 
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
    allowNull: false,
    defaultValue: "daily"
  },
  automaticAssignment: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
  images: { 
    type: DataTypes.TEXT(1048), 
    allowNull: true, 
  }
}
);

export default Compte;
export { Compte };