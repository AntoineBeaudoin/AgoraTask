import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

export const ComptePoste = bd.define("ComptePoste", {
    compteId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: "Comptes",
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    },
    posteId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: {
            model: "Postes",
            key: "id"
        },
        onDelete: "CASCADE",
        onUpdate: "CASCADE"
    }
}, {
    tableName: "ComptePostes",
    timestamps: false
});

export default ComptePoste;