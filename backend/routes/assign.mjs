import express from "express";
import { Op } from "sequelize";
import bd from "../models/bd.mjs";
import * as models from "../models/bd_index.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";
import { creerAssignService } from "../Middleware/assignUtils.mjs";
import { creerAssignController } from "../controllers/assignController.mjs";

const router = express.Router();
const service = creerAssignService({ models, bd, Op });
const controller = creerAssignController(service);

router.use(isConnected);
router.get("/", controller.listerJournee);
router.get("/options", controller.listerChoix);
router.post("/automatic", controller.assignerAutomatiquement);
router.post("/manual", controller.assignerManuellement);
router.post("/occurrences", controller.creerOccurrence);
router.patch("/tasks/:workDayTaskId/occurrence", controller.changerOccurrence);

export default router;
