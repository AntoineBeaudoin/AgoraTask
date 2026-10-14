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
  room: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  schedulingType: {
    type: DataTypes.ENUM("flexible", "scheduled"), //Flexible n'ont pas d'horaire fixe 
    allowNull: false,                              //Scheduled ont au moins un horaire fixe
    defaultValue: "flexible",
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
    allowNull: false,
    defaultValue: false
  }
}
);

export default Task;
export { Task };