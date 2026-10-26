import express from "express";
import multer from "multer";
import * as taskController from "../controllers/taskController.mjs";
import { isConnected } from "../middleware/isConnected.mjs";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 5,
    fileSize: 5242880,
  },
});
router.get("/list", taskController.getAllTasks);
router.get("/mine", isConnected, taskController.getMyTasks);
router.patch("/progress", isConnected, taskController.saveProgress);
router.post("/add", upload.array("images", 5), taskController.createTask);
router.put("/:id", upload.array("images", 5), taskController.replaceTask);
router.post("/:id/duplicate", taskController.duplicateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
