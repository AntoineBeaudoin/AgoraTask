import express from "express";
import * as adminController from "../controllers/adminController.mjs";

const router = express.Router();

router.get("/AllUsers", adminController.getAllUsers);
router.patch("/Edit_Rule", adminController.editRule);
router.patch("/Edit_Approval", adminController.editApproval);
router.delete("/Archive_User", adminController.ArchiveUser);
export default router;
