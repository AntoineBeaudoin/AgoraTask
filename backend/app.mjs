import express from "express";
import dotenv from "dotenv";
// import authRoutes from "./routes/auth.mjs";
// import bdRoutes from "./routes/bd.mjs";
import cors from "cors";
// import bd from "./models/bd.mjs";
import { get404, getErrors } from "./controllers/errorController.mjs";
import pg from "pg";


dotenv.config();

const app = express();

app.get("/", (req, res) => {
    res.json({
        message: "Agora API disponible",
        pgLoaded: !!pg
    });
});

// app.use(cors());
// app.use(express.json());
// app.use("/api/account", authRoutes);
// app.use("/bd", bdRoutes);

// app.get("/", (req, res) => {
//     res.status(200).json({
//         message: "Agora API disponible"
//     });
// });

app.use("/", get404);

app.use(getErrors);

// Test pour valider que l'api est bien fonctionnel -AB
// bd.authenticate()
//     .then(() => {
//         console.log("Connected to PostgreSQL");

//         // mettre force à true pour réinitialiser la structure de la bd.
//         return bd.sync({ force: false });
//     })
//     .then(async () => {

//         console.log("Test accounts created");

//     })
//     .catch(error => {
//         console.error("Database connection failed:", error);
//     });

export default app;