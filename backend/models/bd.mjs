import { Sequelize } from "sequelize";
import pg from "pg";
import dotenv from "dotenv";

dotenv.config();

const databaseUrl =
  process.env.NODE_ENV === 'test'
    ? process.env.DATABASE_URL_TEST
    : process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error(
    `Missing database connection string for NODE_ENV=${process.env.NODE_ENV}`
  );
}

const bd = new Sequelize(databaseUrl, {
    dialect: "postgres",
    dialectModule: pg,
    logging: false
});

export default bd;