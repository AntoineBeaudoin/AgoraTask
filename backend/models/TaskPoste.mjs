import { DataTypes } from "sequelize";
import bd from "./bd.mjs";
const TaskPoste = bd.define("TaskPoste", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tacheId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  posteId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
});
export { TaskPoste };
