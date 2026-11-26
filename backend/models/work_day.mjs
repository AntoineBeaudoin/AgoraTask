import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const work_day = bd.define(
  "work_day",
  {
    id: {
      type: DataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true,
    },
    accountId: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    comment: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    isSubmitted: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    },
    workWeekId: {
      type: DataTypes.INTEGER,
      allowNull: false,
  },
  },
  { indexes: [{ unique: true, fields: ["accountId", "date"] }] },
);

export { work_day };
export default work_day;
