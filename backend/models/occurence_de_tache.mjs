import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const occurence_de_tache = bd.define("occurence_de_tache", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: false,
  },
  journee: {
    type: DataTypes.ENUM(
      "lundi",
      "mardi",
      "mercredi",
      "jeudi",
      "vendredi",
      "samedi",
      "dimanche",
    ),
    allowNull: false,
  },
  IsRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tacheId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  Priorite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
});

export default occurence_de_tache;
