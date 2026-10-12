import { DataTypes } from "sequelize";
import bd  from "./bd.mjs";

export const TaskPoste = bd.define("TaskPoste", {
    taskId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "Tasks", key: "id" }
    },
    posteId: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        references: { model: "Postes", key: "id" }
    }
}, {
    timestamps: false
});

export default TaskPoste;