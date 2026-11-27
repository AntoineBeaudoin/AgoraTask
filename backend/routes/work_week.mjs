import express from "express";
import * as workWeekController from "../controllers/workWeekController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";
import hasWritePosteRights from "../Middleware/hasWritePosteRights.mjs";

const router = express.Router();

router.get("/mine", isConnected, workWeekController.getMyWeek);
router.post("/add", isConnected, hasWritePosteRights, workWeekController.createWorkWeek);
router.put("/:id", isConnected, hasWritePosteRights, workWeekController.updateWorkWeek);

export default router;