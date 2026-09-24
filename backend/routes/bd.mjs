import express from "express";
import * as dbController from "../controllers/dbController.mjs";

const router = express.Router();

router.post("/seed", dbController.seedDatabase);

export default router;