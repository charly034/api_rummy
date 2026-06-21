import express from "express";
import healthRoutes from "../modules/health/health.routes.js";
import playersRoutes from "../modules/players/players.routes.js";
import partidasRoutes from "../modules/partidas/partidas.routes.js";

const router = express.Router();

// Aqui se registran todos los modulos de la API.
router.use("/", healthRoutes);
router.use("/", playersRoutes);
router.use("/", partidasRoutes);

export default router;
