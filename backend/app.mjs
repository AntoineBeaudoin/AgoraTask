import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.mjs";
import taskRoutes from "./routes/task.mjs";
import bdRoutes from "./routes/bd.mjs";
import cors from "cors";
import {bd} from "./models/bd.mjs";
import { get404, getErrors } from "./controllers/errorController.mjs";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/account", authRoutes);
app.use("/bd", bdRoutes);
app.use("/task", taskRoutes);


app.use("/", get404);

app.use(getErrors);

const port = process.env.PORT || 3000;

bd.authenticate()
    .then(() => {
        console.log("Connected to PostgreSQL");

        // mettre force à true pour réinitialiser la structure de la bd.
         return bd.sync({ force: false });
    })
    .then(async () => {

    console.log("Test accounts created");
        
        app.listen(port, async() => {
            console.log("Server running on port " + port);
        });
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });

export default app;