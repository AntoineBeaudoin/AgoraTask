import { Sequelize } from "sequelize";

const bd = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false
});

export default bd;