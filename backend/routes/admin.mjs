import express from "express";
import * as adminController from "../controllers/adminController.mjs";
import { isConnected } from "../Middleware/IsConnected.mjs";
import { isAdmin } from "../Middleware/IsAdmin.mjs";

const router = express.Router();

router.get("/", isConnected, isAdmin, adminController.getAllUsers);
router.patch("/Edit_Rule", isConnected, isAdmin, adminController.editRule);
router.patch(
  "/Archive_User",
  isConnected,
  isAdmin,
  adminController.EditUserIsArchived,
);
export default router;
