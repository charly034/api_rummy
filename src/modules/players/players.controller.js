import {
  getAllPlayers,
  getPlayerById,
  createPlayer,
  updatePlayer,
  deletePlayer,
} from "./players.service.js";
import { getHistorialJugador } from "../partidas/partidas.service.js";

const listPlayers = async (req, res, next) => {
  try {
    const { search, activo } = req.query;
    const activoFilter =
      activo === "true" ? true : activo === "false" ? false : undefined;

    const players = await getAllPlayers({ search, activo: activoFilter });
    res.status(200).json({ status: "ok", data: players });
  } catch (error) {
    next(error);
  }
};

const getPlayer = async (req, res, next) => {
  try {
    const player = await getPlayerById(Number(req.params.id));
    res.status(200).json({ status: "ok", data: player });
  } catch (error) {
    next(error);
  }
};

const createPlayerHandler = async (req, res, next) => {
  try {
    const player = await createPlayer(req.body);
    res.status(201).json({ status: "ok", data: player });
  } catch (error) {
    next(error);
  }
};

const updatePlayerHandler = async (req, res, next) => {
  try {
    const player = await updatePlayer(Number(req.params.id), req.body);
    res.status(200).json({ status: "ok", data: player });
  } catch (error) {
    next(error);
  }
};

const deletePlayerHandler = async (req, res, next) => {
  try {
    await deletePlayer(Number(req.params.id));
    res.status(200).json({ status: "ok", message: "Jugador eliminado correctamente" });
  } catch (error) {
    next(error);
  }
};

const getHistorialHandler = async (req, res, next) => {
  try {
    const historial = await getHistorialJugador(Number(req.params.id));
    res.status(200).json({ status: "ok", data: historial });
  } catch (error) {
    next(error);
  }
};

export {
  listPlayers,
  getPlayer,
  createPlayerHandler,
  updatePlayerHandler,
  deletePlayerHandler,
  getHistorialHandler,
};
