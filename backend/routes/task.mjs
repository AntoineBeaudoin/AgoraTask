import express from "express";
import * as taskController from "../controllers/taskController.mjs";

const router = express.Router();

router.get("/list", taskController.getAllTasks);
router.post("/add", taskController.createTask);
router.delete("/:id", taskController.deleteTask);

export default router;