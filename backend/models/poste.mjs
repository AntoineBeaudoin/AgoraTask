import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const Poste = bd.define("Poste", {
 id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false,
  },
  nom: {
    type: DataTypes.STRING(100),
    allowNull: false,
  },
  description: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  archived: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}
);

export default Poste;

