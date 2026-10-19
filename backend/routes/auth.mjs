import express from "express";
import * as authController from "../controllers/authController.mjs";

const router = express.Router();

router.get("/employes", authController.getAllEmployees);
router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);
router.patch("/password", authController.changePassword);

export default router;