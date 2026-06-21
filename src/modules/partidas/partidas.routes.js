import express from "express";
import {
  listPartidas,
  getPartida,
  createPartidaHandler,
  updatePartidaHandler,
  deletePartidaHandler,
  getTablaGeneralHandler,
} from "./partidas.controller.js";

const router = express.Router();

router.get("/tabla-general", getTablaGeneralHandler);
router.get("/partidas", listPartidas);
router.get("/partidas/:id", getPartida);
router.post("/partidas", createPartidaHandler);
router.put("/partidas/:id", updatePartidaHandler);
router.delete("/partidas/:id", deletePartidaHandler);

export default router;
