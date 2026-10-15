import { DataTypes } from "sequelize";
import bd from "./bd.mjs";
const lien_tache_employe = bd.define("LienTacheEmploye", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  tacheId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  employeId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  commentaire: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
  isCompleted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  },
});
export { lien_tache_employe };
