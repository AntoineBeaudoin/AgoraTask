import express from "express";
import dotenv from "dotenv";
import { bd } from "./models/bd.mjs";
import authRoutes from "./routes/auth.mjs";
import { get404, getErrors } from "./controllers/errorController.mjs";
import { createUser } from "./controllers/authController.mjs";
import Compte from "./models/compte.mjs";

dotenv.config();

const app = express();

app.use(express.json());
app.use("/api/account", authRoutes);
// app.get("/test-create-user", async (req, res, next) => {
//   req.body = {
//     prenom: "Moussa",
//     nom: "Dembele",
//     courriel: "moussa.test@gmail.com",
//     mdp: "Test1234!",
//   };

//   console.log("JE SUIS LAAAAAA Request body:", req.body);

//   await createUser(req, res, next);
// });

app.use("/", get404);

app.use(getErrors);

const port = process.env.PORT || 3000;

/* definir une route: app.use("/users", userRoutes); */
bd.authenticate()
  .then(() => {
    console.log("Connected to PostgreSQL");

    return bd.sync({ force: true });
  })
  .then(async () => {
    await Compte.create({
      prenom: "Admin",
      nom: "Test",
      courriel: "admin@test.com",
      motDePasse: "Admin123!",
      role: "administrateur",
      approuve: true,
    });

    await Compte.create({
      prenom: "Coordo",
      nom: "Test",
      courriel: "coordo@test.com",
      motDePasse: "Coordo123!",
      role: "coordonnateur",
      approuve: true,
    });

    await Compte.create({
      prenom: "Personnel",
      nom: "Test",
      courriel: "personnel@test.com",
      motDePasse: "Personnel123!",
      role: "personnel_de_terrain",
      approuve: true,
    });

    console.log("Test accounts created");

    app.listen(port, () => {
      console.log("Server running on port " + port);
    });
  })
  .catch((error) => {
    console.error("Database connection failed:", error);
  });
