import { Sequelize } from "sequelize";
import dotenv from "dotenv";

dotenv.config();

console.log("Loading bd.mjs...");
console.log("DATABASE_URL exists:", !!process.env.DATABASE_URL);

if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing from the environment");
}

const bd = new Sequelize(process.env.DATABASE_URL, {
    dialect: "postgres",
    logging: console.log
});

export { bd }
export default bd;