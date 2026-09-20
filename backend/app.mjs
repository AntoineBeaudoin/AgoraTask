import express from "express";
import dotenv from "dotenv";
import {bd} from "./models/bd.mjs";
import authRoutes from "./routes/auth.mjs";
import { get404, getErrors } from "./controllers/errorController.mjs";
import { createUser } from "./controllers/authController.mjs";
import Compte from "./models/compte.mjs";
import cors from "cors";


dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());
app.use("/api/account", authRoutes);
/*app.get("/test-create-user", async (req, res, next) => {
  req.body = {
    prenom: "Moussa",
    nom: "Dembele",
    courriel: "moussa.test@gmail.com",
    mdp: "Test1234!",
    role: "administrateur"
  };

  await createUser(req, res, next);
 
  console.log("JE SUIS LAAAAAA Request body:", req.body);  
});
app.get("/test-create-u2", async (req, res, next) => {
  req.body = {
    prenom: "Julien",
    nom: "Morel",
    courriel: "rebcoana@gmail.com",
    mdp: "Test1234!",
    role: "coordonnateur"
  };

  await createUser(req, res, next);
 
  console.log("JE SUIS LAAAAAA Request body:", req.body);
});
app.get("/test-create-u3", async (req, res, next) => {

  req.body = {
    prenom: "Antoine",
    nom: "Beaudoin",
    courriel: "beauanto@icloud.com",
    mdp: "Test1234!",
    role: "personnel_de_terrain"
  };

  await createUser(req, res, next);
 
  console.log("JE SUIS LAAAAAA Request body:", req.body);
});
*/

app.use("/", get404);

app.use(getErrors);

const port = process.env.PORT || 3000;

/* definir une route: app.use("/users", userRoutes); */
bd.authenticate()
    .then(() => {
        console.log("Connected to PostgreSQL");

         //return bd.sync({ force: true });
    })
    .then(async () => {

    console.log("Test accounts created");
        
        app.listen(port, async() => {
            console.log("Server running on port " + port);

             try {
                await fetch(`http://localhost:${port}/test-create-user`);
                await fetch(`http://localhost:${port}/test-create-u2`);
                await fetch(`http://localhost:${port}/test-create-u3`);

                console.log("Test requests completed");
            } catch (error) {
                console.error("Test requests failed:", error);
            }
        });
    })
    .catch(error => {
        console.error("Database connection failed:", error);
    });