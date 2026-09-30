import express from "express";
import * as adminController from "../controllers/adminController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";
import { isAdmin } from "../Middleware/IsAdmin.mjs";

const router = express.Router();

router.get("/", isConnected, isAdmin, adminController.getAllUsersWithFilter);
router.patch("/Edit_Role", isConnected, isAdmin, adminController.editRole);
router.patch(
  "/Archive_User",
  isConnected,
  isAdmin,
  adminController.EditUserIsArchived,
);
export default router;
