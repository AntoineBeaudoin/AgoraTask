import express from "express";
import dotenv from "dotenv";
import {bd} from "./models/bd.mjs";
import authRoutes from "./routes/auth.mjs";
import { get404, getErrors } from "./controllers/errorController.mjs";


dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);

app.use("/", get404);

app.use(getErrors);

const port = process.env.PORT || 3000;

/* definir une route: app.use("/users", userRoutes); */
bd.authenticate()
    .then(() => {
        console.log("Connected to PostgreSQL");

         return bd.sync({ force: true });
    })
    .then(() => {
        app.listen(port, () => {
            console.log("Server running on port " + port);
        });
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });