import express from "express";
import {
  listPlayers,
  getPlayer,
  createPlayerHandler,
  updatePlayerHandler,
  deletePlayerHandler,
  getHistorialHandler,
} from "./players.controller.js";

const router = express.Router();

router.get("/jugadores", listPlayers);
router.get("/jugadores/:id", getPlayer);
router.get("/jugadores/:id/historial", getHistorialHandler);
router.post("/jugadores", createPlayerHandler);
router.put("/jugadores/:id", updatePlayerHandler);
router.delete("/jugadores/:id", deletePlayerHandler);

export default router;
