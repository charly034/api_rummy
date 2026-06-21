import express from "express";
import { getDatabaseHealth, getHealth } from "./health.controller.js";

const router = express.Router();

// Las rutas delegan en el controlador para no mezclar responsabilidades.
router.get("/health", getHealth);
router.get("/health/db", getDatabaseHealth);

export default router;
