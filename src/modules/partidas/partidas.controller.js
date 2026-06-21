import {
  getAllPartidas,
  getPartidaById,
  createPartida,
  updatePartida,
  deletePartida,
} from "./partidas.service.js";

const listPartidas = async (req, res, next) => {
  try {
    const { jugador_id, desde, hasta } = req.query;
    const partidas = await getAllPartidas({
      jugador_id: jugador_id ? Number(jugador_id) : undefined,
      desde,
      hasta,
    });
    res.status(200).json({ status: "ok", data: partidas });
  } catch (error) {
    next(error);
  }
};

const getPartida = async (req, res, next) => {
  try {
    const partida = await getPartidaById(Number(req.params.id));
    res.status(200).json({ status: "ok", data: partida });
  } catch (error) {
    next(error);
  }
};

const createPartidaHandler = async (req, res, next) => {
  try {
    const partida = await createPartida(req.body);
    res.status(201).json({ status: "ok", data: partida });
  } catch (error) {
    next(error);
  }
};

const updatePartidaHandler = async (req, res, next) => {
  try {
    const partida = await updatePartida(Number(req.params.id), req.body);
    res.status(200).json({ status: "ok", data: partida });
  } catch (error) {
    next(error);
  }
};

const deletePartidaHandler = async (req, res, next) => {
  try {
    await deletePartida(Number(req.params.id));
    res.status(200).json({ status: "ok", message: "Partida eliminada correctamente" });
  } catch (error) {
    next(error);
  }
};

export {
  listPartidas,
  getPartida,
  createPartidaHandler,
  updatePartidaHandler,
  deletePartidaHandler,
};
