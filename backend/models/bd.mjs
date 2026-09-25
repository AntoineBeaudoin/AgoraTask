import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const bd = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: false
});

export { bd }
export default bd;