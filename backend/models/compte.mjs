import { DataTypes } from "sequelize";
import { bd } from "./bd.mjs";

const Compte = bd.define("Compte", {
   id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
    allowNull: false 
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
        msg: "Veuillez entrer une addresse de courriel valide."
      }
    }
  }, 
  motDePasse: {
    type: DataTypes.STRING(255), 
    allowNull: false,
    validate: {
      motdePasseValide(value){
        const mdpRegex = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z\d]).{8,}$/;
        if (!mdpRegex.test(value)){
          throw new Error("Le mot de passe doit contenir au moins 8 caractères, dont une lettre minuscule et majuscule, un nombre et un caractère spécial.");
        }
      }
    }
  },
  role: {
    type: DataTypes.ENUM(
      "administrateur",
      "coordonnateur",
      "personnel_de_terrain",
      "Role_En_Attente",
    ),
    allowNull: false,
    defaultValue: "Role_En_Attente"
  },
  approuve: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  }
}
);

export default Compte;
export { Compte };