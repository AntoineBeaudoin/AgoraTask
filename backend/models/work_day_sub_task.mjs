import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const work_day_sub_task = bd.define(
  "work_day_sub_task",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    workDayTaskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    subTaskId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isCompleted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
  },
  { indexes: [{ unique: true, fields: ["workDayTaskId", "subTaskId"] }] },
);

export { work_day_sub_task };
export default work_day_sub_task;
