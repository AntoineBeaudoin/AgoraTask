import express from "express";
import multer from "multer";
import * as taskController from "../controllers/taskController.mjs";

const router = express.Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        files: 5,
        fileSize: 5242880
    }
});

router.get("/list", taskController.getAllTasks);
router.post("/add",  upload.array("images", 5), taskController.createTask);
router.delete("/:id", taskController.deleteTask);

export default router;