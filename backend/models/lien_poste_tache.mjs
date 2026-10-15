import { DataTypes } from "sequelize";
import bd from "./bd.mjs";
const lien_poste_tache = bd.define("LienPosteTache", {
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
export { lien_poste_tache };
