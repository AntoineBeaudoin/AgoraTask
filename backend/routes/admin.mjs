import express from "express";
import * as adminController from "../controllers/adminController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";
import { isAdmin } from "../Middleware/IsAdmin.mjs";

const router = express.Router();

router.get("/AllUsers", isConnected, isAdmin, adminController.getAllUsers);
router.patch("/Edit_Rule", isConnected, isAdmin, adminController.editRule);
router.patch(
  "/Edit_Approval",
  isConnected,
  isAdmin,
  adminController.editApproval,
);
router.delete(
  "/Archive_User",
  isConnected,
  isAdmin,
  adminController.ArchiveUser,
);
export default router;
