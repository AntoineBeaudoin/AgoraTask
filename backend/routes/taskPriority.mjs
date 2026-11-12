import express from "express";
import * as taskPriorityController from "../controllers/taskPriorityController.mjs";

const router = express.Router();

router.get("/list", taskPriorityController.getAllTaskPriorities);
router.post("/add", taskPriorityController.createTaskPriority);
router.put("/:id", taskPriorityController.replaceTaskPriority);
router.delete("/:id", taskPriorityController.deleteTaskPriority);

export default router;
