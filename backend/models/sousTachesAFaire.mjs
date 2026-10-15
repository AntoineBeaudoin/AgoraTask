import { DataTypes } from "sequelize";
import bd from "./bd.mjs";
const sous_taches_AFaire = bd.define("SousTachesAFaire", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  sousTacheId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  tachesAFaireId: {
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
export { sous_taches_AFaire };
