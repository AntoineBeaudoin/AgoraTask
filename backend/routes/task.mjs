import express from "express";
import multer from "multer";
import * as taskController from "../controllers/taskController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 10,
    fileSize: 10485760,
  },
});

router.get("/list", taskController.getAllTasks);
router.get("/mine", isConnected, taskController.getMyTasks);
router.get("/occurences/:id", isConnected, taskController.getTaskOccurences);
router.patch("/progress", isConnected, taskController.saveProgress);
router.post("/add", upload.any(), taskController.createTask);
router.put("/:id", upload.any(), taskController.replaceTask);
router.post("/:id/duplicate", taskController.duplicateTask);
router.delete("/:id", taskController.deleteTask);

export default router;
