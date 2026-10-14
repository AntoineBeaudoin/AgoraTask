import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const TaskSchedule = bd.define("TaskSchedule", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
    },
    taskId: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    dayOfWeek: {
        type: DataTypes.INTEGER,
        allowNull: true,
        validate: { // 0 = Dimanche, 1 = Lundi, ... 6 = Samedi
            min: 0,
            max: 6,
        },
    },
    priority: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 5,
        validate: {
            min: 0,
            max: 9,
        },
    },
    dueDate: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    startTime: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    endTime: {
        type: DataTypes.TIME,
        allowNull: true,
    },
    recurrence: {
        type: DataTypes.ENUM(
            "once",
            "weekly",
            "biweekly",
            "other"
        ),
        allowNull: false,
        defaultValue: "weekly",
    },
    effectiveFrom: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
    effectiveUntil: {
        type: DataTypes.DATEONLY,
        allowNull: true,
    },
});

export default TaskSchedule;
export { TaskSchedule };