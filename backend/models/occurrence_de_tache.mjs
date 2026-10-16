import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const occurrence_de_tache = bd.define("occurence_de_tache", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  heureDebut: {
    type: DataTypes.TIME,
    allowNull: true,
  },
  heureFin: {
    type: DataTypes.TIME,
    allowNull: true,
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
  isRequired: {
    type: DataTypes.BOOLEAN,
    defaultValue: true,
  },
  tacheId: {
    type: DataTypes.INTEGER,
    allowNull: false,
  },
  priorite: {
    type: DataTypes.INTEGER,
    allowNull: false,
    validate: {
      min: 1,
      max: 5,
    },
  },
});

export { occurrence_de_tache };
