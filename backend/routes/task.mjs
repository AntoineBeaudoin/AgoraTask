import express from "express";
import * as taskController from "../controllers/taskController.mjs";

const router = express.Router();

router.post("/add", taskController.createTask);
router.delete("/:id", taskController.deleteTask);

export default router;