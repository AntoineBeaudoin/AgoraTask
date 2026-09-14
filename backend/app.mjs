import express from "express";
import {bd} from "./models/bd.mjs";
import sequelize from "sequelize";
import dotenv from "dotenv";

dotenv.config();

const app = express();

app.use(express.json());

const port = process.env.PORT || 3000;

/* definir une route: app.use("/users", userRoutes); */
bd.authenticate()
    .then(() => {
        console.log("Connected to PostgreSQL");

        return bd.sync();
    })
    .then(() => {
        app.listen(port, () => {
            console.log("Server running on port " + port);
        });
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });