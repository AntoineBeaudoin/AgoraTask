import express from "express";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.mjs";
import taskRoutes from "./routes/task.mjs";
import bdRoutes from "./routes/bd.mjs";
import cors from "cors";
import bd  from "./models/bd.mjs";
import { get404, getErrors } from "./controllers/errorController.mjs";
import adminRoutes from "./routes/admin.mjs";

dotenv.config();

const app = express();

app.get("/", (req, res) => {
    res.json({
        message: "Agora API disponible"
    });
});

const allowedOrigins = process.env.FRONTEND_ORIGINS
    .split(",")
    .map(origin => origin.trim())
    .filter(Boolean);

app.use(cors({
    origin: allowedOrigins,
    credentials: true
}));

app.use(express.json());

app.use("/api/account", authRoutes);
app.use("/bd", bdRoutes);
app.use("/api/users", adminRoutes);
app.use("/api/task", taskRoutes);

app.get("/", (req, res) => {
    res.status(200).json({
        message: "Agora API disponible"
    });
});

app.use("/", get404);

app.use(getErrors);

const PORT = process.env.PORT || 5000;

bd.authenticate()
    .then(() => {
        console.log("Connected to PostgreSQL");

        // mettre force à true pour réinitialiser la structure de la BD.
        return bd.sync({ force: false });
    })
    .then(async () => {
        console.log("Test accounts created");

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });

export default app;
