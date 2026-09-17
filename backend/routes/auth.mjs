import express from "express";
import * as authController from "../controllers/authController.mjs";

const router = express.Router();

router.post("/register", authController.createUser);

export default router;