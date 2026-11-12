import express from "express";
import * as posteController from "../controllers/posteController.mjs";
import isConnected from "../Middleware/IsConnected.mjs";
import hasWritePosteRights from "../Middleware/hasWritePosteRights.mjs";

const router = express.Router();

router.get("/list", isConnected, posteController.getPostes);
router.get("/employe/:id", isConnected, posteController.getEmployeePosteId);
router.put("/:id", isConnected, hasWritePosteRights, posteController.updatePoste);
router.patch("/employe/:id", isConnected, hasWritePosteRights, posteController.assignPosteToEmployee);
router.post("/add", isConnected, hasWritePosteRights, posteController.createPoste);
router.delete("/:id", isConnected, hasWritePosteRights, posteController.deletePoste);
router.patch("/:id/reactivate", isConnected, hasWritePosteRights, posteController.reactivatePoste);

export default router;