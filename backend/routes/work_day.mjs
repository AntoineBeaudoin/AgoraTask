import express from "express";
import * as workDayController from "../controllers/workDayController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";

const router = express.Router();

router.get("/mine", isConnected, workDayController.getMyDay);
router.patch("/submit/:id", isConnected, workDayController.saveDay);
router.patch("/:id", isConnected, workDayController.saveDay);

export default router;
