import {Sequelize} from "sequelize";
import express from "express";
import dotenv from "dotenv";

dotenv.config();

const bd = new Sequelize(process.env.DATABASE_URL);

export {bd}
export default bd;