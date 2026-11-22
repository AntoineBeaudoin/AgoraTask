import express from "express";
import { isConnected } from "../Middleware/IsConnected.mjs";

import { controller } from "../controllers/assignController.mjs";

const router = express.Router();

router.use(isConnected);
router.get("/", controller.listerJournee);
router.get("/options", controller.listerChoix);
router.post("/automatic", controller.assignerAutomatiquement);
router.post("/manual", controller.assignerManuellement);
router.post("/occurrences", controller.creerOccurrence);
router.patch("/tasks/:workDayTaskId/occurrence", controller.changerOccurrence);

export default router;
