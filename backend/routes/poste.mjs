import express from "express";
import * as posteController from "../controllers/posteController.mjs";

const router = express.Router();

router.get("/list", posteController.getAllPostes);
router.put("/:id", posteController.updatePoste);
router.post("/add", posteController.createPoste);
router.delete("/:id", posteController.deletePoste);

export default router;