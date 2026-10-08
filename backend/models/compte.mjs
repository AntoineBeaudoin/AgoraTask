import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const Compte = bd.define("Compte", {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  prenom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  courriel: {
    type: DataTypes.STRING(255),
    allowNull: false,
    unique: true,
    validate: {
      isEmail: {
        msg: "Veuillez entrer une addresse de courriel valide.",
      },
    },
  },
  motDePasse: {
    type: DataTypes.STRING(255),
    allowNull: false,
  },
  role: {
    type: DataTypes.ENUM(
      "administrateur",
      "coordonnateur",
      "personnel_de_terrain",
    ),
    allowNull: false,
    defaultValue: "personnel_de_terrain",
  },
  IsArchived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
});

export default Compte;