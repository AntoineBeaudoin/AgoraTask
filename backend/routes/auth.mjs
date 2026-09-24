import express from "express";
import * as authController from "../controllers/authController.mjs";

const router = express.Router();

router.post("/register", authController.createUser);
router.post("/login", authController.loginUser);

export default router;