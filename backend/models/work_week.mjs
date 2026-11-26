import { DataTypes } from "sequelize";
import bd from "./bd.mjs";

const work_week = bd.define(
  "work_week",
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
    beginningDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    endDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    indexes: [
      {
        unique: true,
        fields: ["accountId", "beginningDate"],
      },
    ],
  },
);

export { work_week };
export default work_week;