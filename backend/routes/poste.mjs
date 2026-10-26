import express from "express";
import * as posteController from "../controllers/posteController.mjs";
import isConnected from "../Middleware/IsConnected.mjs";
import hasWritePosteRights from "../Middleware/hasWritePosteRights.mjs";

const router = express.Router();

router.get("/list", isConnected, posteController.getPostes);
router.put("/:id", isConnected, hasWritePosteRights, posteController.updatePoste);
router.put('/:id/employes', isConnected, hasWritePosteRights, posteController.assignPosteToEmployees);
router.post("/add", isConnected, hasWritePosteRights, posteController.createPoste);
router.delete("/:id", isConnected, hasWritePosteRights, posteController.deletePoste);
router.patch("/:id/reactivate", isConnected, hasWritePosteRights, posteController.reactivatePoste);

export default router;