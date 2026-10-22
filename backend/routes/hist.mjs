import express from "express";
import * as historiqueController from "../controllers/historiqueController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";

const router = express.Router();

router.get("/", isConnected, historiqueController.getEmployeEnService);
router.get("/:compteId", isConnected, historiqueController.getEmployeTaches);
export default router;
