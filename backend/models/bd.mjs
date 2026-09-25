import { Sequelize } from "sequelize";
import pg from "pg";

const bd = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    dialectModule: "pg",
    logging: false
});

export default bd;