import express from "express";
import * as posteController from "../controllers/posteController.mjs";

const router = express.Router();

router.get("/list", posteController.getPostes);
router.put("/:id", posteController.updatePoste);
router.put('/:id/employes',posteController.assignPosteToEmployees);
router.post("/add", posteController.createPoste);
router.delete("/:id", posteController.deletePoste);
router.patch("/reactivate/:id", posteController.reactivatePoste);

export default router;