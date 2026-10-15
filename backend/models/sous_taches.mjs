import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const sous_tache = bd.define("sous_tache", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  tacheId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  titre: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.TEXT,
    allowNull: true,
  },
});

export { sous_tache };
